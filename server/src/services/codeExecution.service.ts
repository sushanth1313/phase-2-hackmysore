import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { ITestCase, IParameter } from '../models/CodingChallenge';
import { ITestCaseResult, TestCaseFailureReason } from '../models/CodingSubmission';

const MAX_OUTPUT_BYTES = 64 * 1024; // 64KB cap to prevent DoS
const DEFAULT_TIMEOUT_MS = 5000;

export function deepJsonEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;
  
  if (typeof a === 'number' && typeof b === 'number') {
    return Math.abs(a - b) < 1e-6;
  }

  if (typeof a !== 'object') return false;

  if (Array.isArray(a) !== Array.isArray(b)) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepJsonEqual(a[i], b[i])) return false;
    }
    return true;
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;

  for (const k of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, k)) return false;
    if (!deepJsonEqual(a[k], b[k])) return false;
  }

  return true;
}

function capOutput(str: string): string {
  if (!str) return '';
  if (str.length <= MAX_OUTPUT_BYTES) return str;
  return str.slice(0, MAX_OUTPUT_BYTES) + '\n... [output truncated at 64KB]';
}

function toJavaLiteral(val: any, paramType?: string): string {
  if (val === null || val === undefined) return 'null';
  if (typeof val === 'string') return `"${val.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'number') {
    if (paramType === 'long') return `${val}L`;
    if (paramType === 'double') return `${val}.0`;
    if (paramType === 'float') return `${val}f`;
    return `${val}`;
  }
  if (Array.isArray(val)) {
    if (paramType && paramType.includes('int[]')) {
      const items = val.map(v => toJavaLiteral(v, 'int')).join(', ');
      return `new int[]{${items}}`;
    }
    if (paramType && paramType.includes('String[]')) {
      const items = val.map(v => toJavaLiteral(v, 'String')).join(', ');
      return `new String[]{${items}}`;
    }
    if (paramType && paramType.includes('double[]')) {
      const items = val.map(v => toJavaLiteral(v, 'double')).join(', ');
      return `new double[]{${items}}`;
    }
    if (paramType && paramType.includes('boolean[]')) {
      const items = val.map(v => toJavaLiteral(v, 'boolean')).join(', ');
      return `new boolean[]{${items}}`;
    }
    if (paramType && paramType.includes('int[][]')) {
      const items = val.map(row => `new int[]{${row.join(', ')}}`).join(', ');
      return `new int[][]{${items}}`;
    }
    // Default to int array if elements are numbers
    if (val.length === 0 || typeof val[0] === 'number') {
      return `new int[]{${val.join(', ')}}`;
    }
    if (typeof val[0] === 'string') {
      return `new String[]{${val.map(s => `"${s}"`).join(', ')}}`;
    }
  }
  return String(val);
}

function toCppLiteral(val: any, paramType?: string): string {
  if (val === null || val === undefined) {
    return 'nullptr';
  }
  if (typeof val === 'string') {
    const escaped = val
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
    return `string("${escaped}")`;
  }
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'number') {
    if (paramType === 'long' || paramType === 'long long') return `${val}LL`;
    if (paramType === 'double') return `${val}.0`;
    if (paramType === 'float') return `${val}f`;
    return `${val}`;
  }
  if (Array.isArray(val)) {
    if (paramType && paramType.includes('TreeNode')) {
      const items = val.map(item => item === null || item === undefined ? 'string("null")' : `string("${item}")`).join(', ');
      return `buildTree(vector<string>{${items}})`;
    }
    // 2D Array
    if (val.length > 0 && Array.isArray(val[0])) {
      if (typeof val[0][0] === 'string') {
        const rows = val.map((row: any[]) => {
          const items = row.map(s => `string("${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}")`).join(', ');
          return `vector<string>{${items}}`;
        }).join(', ');
        return `vector<vector<string>>{${rows}}`;
      }
      const rows = val.map((row: any[]) => `vector<int>{${row.join(', ')}}`).join(', ');
      return `vector<vector<int>>{${rows}}`;
    }
    // Empty array
    if (val.length === 0) {
      if (paramType && paramType.includes('string')) return 'vector<string>{}';
      if (paramType && paramType.includes('vector<vector<int>>')) return 'vector<vector<int>>{}';
      return 'vector<int>{}';
    }
    // 1D array of strings
    if (typeof val[0] === 'string') {
      const items = val.map(s => `string("${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}")`).join(', ');
      return `vector<string>{${items}}`;
    }
    // 1D array of numbers
    if (typeof val[0] === 'number') {
      return `vector<int>{${val.join(', ')}}`;
    }
    // 1D array of booleans
    if (typeof val[0] === 'boolean') {
      return `vector<bool>{${val.map(b => b ? 'true' : 'false').join(', ')}}`;
    }
  }
  return String(val);
}

interface RunProcessOptions {
  cmd: string;
  args: string[];
  cwd: string;
  input?: string;
  timeoutMs?: number;
}

interface ProcessResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  timedOut: boolean;
  durationMs: number;
}

function runIsolatedProcess(options: RunProcessOptions): Promise<ProcessResult> {
  return new Promise((resolve) => {
    const { cmd, args, cwd, input, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
    const startTime = Date.now();
    let timedOut = false;
    let stdoutData = '';
    let stderrData = '';

    const extraPaths = process.platform === 'win32'
      ? ';C:\\MinGW\\bin;C:\\Program Files\\Git\\usr\\bin'
      : ':/usr/bin:/usr/local/bin';

    // Isolated minimal environment - sensitive credentials stripped
    const safeEnv = {
      PATH: (process.env.PATH || '') + extraPaths,
      TEMP: process.env.TEMP || os.tmpdir(),
      TMP: process.env.TMP || os.tmpdir(),
      SYSTEMROOT: process.env.SYSTEMROOT || '',
      HOMEPATH: process.env.HOMEPATH || '',
      USERPROFILE: process.env.USERPROFILE || '',
      JAVA_HOME: process.env.JAVA_HOME || ''
    };

    const child = spawn(cmd, args, {
      cwd,
      env: safeEnv,
      shell: false
    });

    const timer = setTimeout(() => {
      timedOut = true;
      try {
        if (process.platform === 'win32') {
          spawn('taskkill', ['/pid', String(child.pid), '/f', '/t']);
        } else {
          child.kill('SIGKILL');
        }
      } catch {
        // ignore
      }
    }, timeoutMs);

    if (input && child.stdin) {
      child.stdin.write(input);
      child.stdin.end();
    }

    child.stdout?.on('data', (chunk) => {
      if (stdoutData.length < MAX_OUTPUT_BYTES) {
        stdoutData += chunk.toString();
      }
    });

    child.stderr?.on('data', (chunk) => {
      if (stderrData.length < MAX_OUTPUT_BYTES) {
        stderrData += chunk.toString();
      }
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      resolve({
        stdout: stdoutData,
        stderr: stderrData + `\nProcess launch error: ${err.message}`,
        exitCode: 1,
        timedOut: false,
        durationMs: Date.now() - startTime
      });
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({
        stdout: stdoutData,
        stderr: stderrData,
        exitCode: code ?? (timedOut ? 124 : 0),
        timedOut,
        durationMs: Date.now() - startTime
      });
    });
  });
}

export interface ExecuteSubmissionParams {
  code: string;
  language: 'java' | 'python' | 'javascript' | 'cpp';
  functionName: string;
  parameters: IParameter[];
  returnType: string;
  testCases: ITestCase[];
  timeoutMs?: number;
}

export async function executeTestCases(params: ExecuteSubmissionParams): Promise<ITestCaseResult[]> {
  const { code, language, functionName, parameters, returnType, testCases, timeoutMs = DEFAULT_TIMEOUT_MS } = params;

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'proofhire_sandbox_'));

  try {
    if (language === 'javascript') {
      return await executeJavaScript({ tempDir, code, functionName, testCases, timeoutMs });
    } else if (language === 'python') {
      return await executePython({ tempDir, code, functionName, testCases, timeoutMs });
    } else if (language === 'java') {
      return await executeJava({ tempDir, code, functionName, parameters, returnType, testCases, timeoutMs });
    } else if (language === 'cpp') {
      return await executeCpp({ tempDir, code, functionName, parameters, returnType, testCases, timeoutMs });
    } else {
      throw new Error(`Unsupported language: ${language}`);
    }
  } finally {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  }
}

// ─── JAVASCRIPT EXECUTION ───────────────────────────────────────────────────

async function executeJavaScript(opts: {
  tempDir: string;
  code: string;
  functionName: string;
  testCases: ITestCase[];
  timeoutMs: number;
}): Promise<ITestCaseResult[]> {
  const { tempDir, code, functionName, testCases, timeoutMs } = opts;
  const filePath = path.join(tempDir, 'solution.js');

  const harness = `
// --- ProofHire Test Harness (Adapted from CoderScreen GPL-3.0) ---
const fs = require('fs');
const input = fs.readFileSync(0, 'utf8');
try {
  const args = JSON.parse(input);
  const result = ${functionName}(...args);
  process.stdout.write('__RESULT__' + JSON.stringify(result) + '__END__');
} catch (err) {
  process.stderr.write(String(err && err.stack ? err.stack : err));
  process.exit(1);
}
`;

  await fs.writeFile(filePath, `${code}\n\n${harness}`, 'utf8');

  const results: ITestCaseResult[] = [];

  for (const tc of testCases) {
    const inputJson = JSON.stringify(tc.args || []);
    const proc = await runIsolatedProcess({
      cmd: 'node',
      args: [filePath],
      cwd: tempDir,
      input: inputJson,
      timeoutMs
    });

    results.push(parseOutputAndEvaluate(tc, proc));
  }

  return results;
}

// ─── PYTHON EXECUTION ────────────────────────────────────────────────────────

async function executePython(opts: {
  tempDir: string;
  code: string;
  functionName: string;
  testCases: ITestCase[];
  timeoutMs: number;
}): Promise<ITestCaseResult[]> {
  const { tempDir, code, functionName, testCases, timeoutMs } = opts;
  const filePath = path.join(tempDir, 'solution.py');

  const harness = `

# --- ProofHire Test Harness (Adapted from CoderScreen GPL-3.0) ---
import json, sys

try:
    __raw_in = sys.stdin.read()
    __args = json.loads(__raw_in) if __raw_in.strip() else []
    __res = ${functionName}(*__args)
    sys.stdout.write('__RESULT__' + json.dumps(__res) + '__END__')
except Exception as __e:
    import traceback
    sys.stderr.write(traceback.format_exc())
    sys.exit(1)
`;

  await fs.writeFile(filePath, `${code}\n\n${harness}`, 'utf8');

  const results: ITestCaseResult[] = [];

  for (const tc of testCases) {
    const inputJson = JSON.stringify(tc.args || []);
    const proc = await runIsolatedProcess({
      cmd: 'python',
      args: [filePath],
      cwd: tempDir,
      input: inputJson,
      timeoutMs
    });

    results.push(parseOutputAndEvaluate(tc, proc));
  }

  return results;
}

// ─── JAVA EXECUTION ──────────────────────────────────────────────────────────

async function executeJava(opts: {
  tempDir: string;
  code: string;
  functionName: string;
  parameters: IParameter[];
  returnType: string;
  testCases: ITestCase[];
  timeoutMs: number;
}): Promise<ITestCaseResult[]> {
  const { tempDir, code, functionName, parameters, testCases, timeoutMs } = opts;

  // Candidate code is written to Solution.java
  const solutionPath = path.join(tempDir, 'Solution.java');
  await fs.writeFile(solutionPath, code, 'utf8');

  // Verify Solution.java compiles first
  const compileCheck = await runIsolatedProcess({
    cmd: 'javac',
    args: ['Solution.java'],
    cwd: tempDir,
    timeoutMs: 10000
  });

  if (compileCheck.exitCode !== 0) {
    return testCases.map(tc => ({
      testCaseId: tc._id ? String(tc._id) : undefined,
      label: tc.label,
      args: tc.args,
      expectedReturn: tc.expectedReturn,
      actualOutput: '',
      stderr: capOutput(compileCheck.stderr || 'Compilation error'),
      exitCode: compileCheck.exitCode,
      passed: false,
      failureReason: 'compile',
      executionTimeMs: compileCheck.durationMs
    }));
  }

  const results: ITestCaseResult[] = [];

  // Run each testcase via generated Driver
  for (let idx = 0; idx < testCases.length; idx++) {
    const tc = testCases[idx];
    const driverClass = `Driver_${idx}`;
    const driverPath = path.join(tempDir, `${driverClass}.java`);

    const callArgs = (tc.args || []).map((arg, pIdx) => {
      const paramType = parameters[pIdx]?.type;
      return toJavaLiteral(arg, paramType);
    }).join(', ');

    const driverContent = `
import java.util.*;

public class ${driverClass} {
    public static void main(String[] args) {
        try {
            Solution sol = new Solution();
            Object res = sol.${functionName}(${callArgs});
            System.out.print("__RESULT__" + toJson(res) + "__END__");
        } catch (Throwable t) {
            t.printStackTrace(System.err);
            System.exit(1);
        }
    }

    private static String toJson(Object obj) {
        if (obj == null) return "null";
        if (obj instanceof String) {
            String s = (String) obj;
            char q = (char) 34;
            char b = (char) 92;
            s = s.replace(String.valueOf(b), "" + b + b).replace(String.valueOf(q), "" + b + q);
            return "" + q + s + q;
        }
        if (obj instanceof Number || obj instanceof Boolean) return obj.toString();
        if (obj instanceof int[]) {
            int[] arr = (int[]) obj;
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < arr.length; i++) {
                if (i > 0) sb.append(", ");
                sb.append(arr[i]);
            }
            sb.append("]");
            return sb.toString();
        }
        if (obj instanceof long[]) {
            long[] arr = (long[]) obj;
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < arr.length; i++) {
                if (i > 0) sb.append(", ");
                sb.append(arr[i]);
            }
            sb.append("]");
            return sb.toString();
        }
        if (obj instanceof double[]) {
            double[] arr = (double[]) obj;
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < arr.length; i++) {
                if (i > 0) sb.append(", ");
                sb.append(arr[i]);
            }
            sb.append("]");
            return sb.toString();
        }
        if (obj instanceof String[]) {
            String[] arr = (String[]) obj;
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < arr.length; i++) {
                if (i > 0) sb.append(", ");
                sb.append(toJson(arr[i]));
            }
            sb.append("]");
            return sb.toString();
        }
        if (obj instanceof boolean[]) {
            boolean[] arr = (boolean[]) obj;
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < arr.length; i++) {
                if (i > 0) sb.append(", ");
                sb.append(arr[i]);
            }
            sb.append("]");
            return sb.toString();
        }
        if (obj instanceof List) {
            List<?> list = (List<?>) obj;
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < list.size(); i++) {
                if (i > 0) sb.append(", ");
                sb.append(toJson(list.get(i)));
            }
            sb.append("]");
            return sb.toString();
        }
        return String.valueOf(obj);
    }
}
`;
    await fs.writeFile(driverPath, driverContent, 'utf8');

    // Compile Driver
    const driverCompile = await runIsolatedProcess({
      cmd: 'javac',
      args: ['-cp', '.', `${driverClass}.java`],
      cwd: tempDir,
      timeoutMs: 10000
    });

    if (driverCompile.exitCode !== 0) {
      results.push({
        testCaseId: tc._id ? String(tc._id) : undefined,
        label: tc.label,
        args: tc.args,
        expectedReturn: tc.expectedReturn,
        actualOutput: '',
        stderr: capOutput(driverCompile.stderr || 'Driver compilation error'),
        exitCode: driverCompile.exitCode,
        passed: false,
        failureReason: 'compile',
        executionTimeMs: driverCompile.durationMs
      });
      continue;
    }

    // Run Driver
    const proc = await runIsolatedProcess({
      cmd: 'java',
      args: ['-Xmx256m', '-cp', '.', driverClass],
      cwd: tempDir,
      timeoutMs
    });

    results.push(parseOutputAndEvaluate(tc, proc));
  }

  return results;
}

// ─── C++ EXECUTION ──────────────────────────────────────────────────────────

async function executeCpp(opts: {
  tempDir: string;
  code: string;
  functionName: string;
  parameters: IParameter[];
  returnType: string;
  testCases: ITestCase[];
  timeoutMs: number;
}): Promise<ITestCaseResult[]> {
  const { tempDir, code, functionName, parameters, testCases, timeoutMs } = opts;

  // Protect against candidate code having a duplicate main()
  const sanitizedCode = code
    .replace(/\bint\s+main\s*\(/g, 'int __candidate_main_unused(')
    .replace(/\bvoid\s+main\s*\(/g, 'void __candidate_main_unused(');

  const hasSolutionClass = sanitizedCode.includes('class Solution');

  const testCasesCode = testCases.map((tc, idx) => {
    const argDeclarations = (tc.args || []).map((arg, pIdx) => {
      const paramType = parameters[pIdx]?.type;
      return `        auto arg_${idx}_${pIdx} = ${toCppLiteral(arg, paramType)};`;
    }).join('\n');
    const callArgs = (tc.args || []).map((_, pIdx) => `arg_${idx}_${pIdx}`).join(', ');
    const caller = hasSolutionClass
      ? `sol.${functionName}(${callArgs})`
      : `${functionName}(${callArgs})`;
    return `    if (testIdx == ${idx}) {
${argDeclarations}
        auto res = ${caller};
        cout << "__RESULT__" << toJson(res) << "__END__" << endl;
        return 0;
    }`;
  }).join('\n');

  const driverContent = `
#include <iostream>
#include <vector>
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <map>
#include <set>
#include <queue>
#include <stack>
#include <deque>
#include <algorithm>
#include <cmath>
#include <numeric>
#include <sstream>
#include <cstdlib>
#include <climits>

using namespace std;

#ifndef TREENODE_DEF
#define TREENODE_DEF
struct TreeNode {
    int val;
    TreeNode *left;
    TreeNode *right;
    TreeNode() : val(0), left(nullptr), right(nullptr) {}
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
    TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
};
#endif

#ifndef LISTNODE_DEF
#define LISTNODE_DEF
struct ListNode {
    int val;
    ListNode *next;
    ListNode() : val(0), next(nullptr) {}
    ListNode(int x) : val(x), next(nullptr) {}
    ListNode(int x, ListNode *next) : val(x), next(next) {}
};
#endif

static inline TreeNode* buildTree(const vector<string>& nodes) {
    if (nodes.empty() || nodes[0] == "null") return nullptr;
    TreeNode* root = new TreeNode(stoi(nodes[0]));
    queue<TreeNode*> q;
    q.push(root);
    size_t i = 1;
    while (!q.empty() && i < nodes.size()) {
        TreeNode* curr = q.front();
        q.pop();
        if (i < nodes.size() && nodes[i] != "null") {
            curr->left = new TreeNode(stoi(nodes[i]));
            q.push(curr->left);
        }
        i++;
        if (i < nodes.size() && nodes[i] != "null") {
            curr->right = new TreeNode(stoi(nodes[i]));
            q.push(curr->right);
        }
        i++;
    }
    return root;
}

static inline string toJson(int val) { return to_string(val); }
static inline string toJson(long long val) { return to_string(val); }
static inline string toJson(double val) {
    ostringstream oss;
    oss << val;
    return oss.str();
}
static inline string toJson(bool val) { return val ? "true" : "false"; }
static inline string toJson(const string& s) {
    string res = "";
    res += (char)34;
    for (size_t i = 0; i < s.length(); ++i) {
        char c = s[i];
        if (c == (char)34) { res += (char)92; res += (char)34; }
        else if (c == (char)92) { res += (char)92; res += (char)92; }
        else if (c == '\\n') { res += (char)92; res += 'n'; }
        else if (c == '\\r') { res += (char)92; res += 'r'; }
        else if (c == '\\t') { res += (char)92; res += 't'; }
        else { res += c; }
    }
    res += (char)34;
    return res;
}

template<typename T>
static inline string toJson(const vector<T>& vec) {
    string res = "[";
    for (size_t i = 0; i < vec.size(); ++i) {
        if (i > 0) res += ", ";
        res += toJson(vec[i]);
    }
    res += "]";
    return res;
}

// --- Candidate Code ---
${sanitizedCode}
// --- End Candidate Code ---

int main(int argc, char* argv[]) {
    if (argc < 2) return 1;
    int testIdx = atoi(argv[1]);
    try {
        ${hasSolutionClass ? 'Solution sol;' : ''}
${testCasesCode}
    } catch (const exception& e) {
        cerr << "Runtime Exception: " << e.what() << endl;
        return 1;
    } catch (...) {
        cerr << "Unknown Runtime Error" << endl;
        return 1;
    }
    return 1;
}
`;

  const driverPath = path.join(tempDir, 'driver.cpp');
  await fs.writeFile(driverPath, driverContent, 'utf8');

  const exeName = process.platform === 'win32' ? 'runner.exe' : 'runner';
  const compileCheck = await runIsolatedProcess({
    cmd: 'g++',
    args: ['-O2', '-std=c++14', 'driver.cpp', '-o', exeName],
    cwd: tempDir,
    timeoutMs: 15000
  });

  if (compileCheck.exitCode !== 0) {
    return testCases.map(tc => ({
      testCaseId: tc._id ? String(tc._id) : undefined,
      label: tc.label,
      args: tc.args,
      expectedReturn: tc.expectedReturn,
      actualOutput: '',
      stderr: capOutput(compileCheck.stderr || 'Compilation error'),
      exitCode: compileCheck.exitCode,
      passed: false,
      failureReason: 'compile',
      executionTimeMs: compileCheck.durationMs
    }));
  }

  const results: ITestCaseResult[] = [];
  const runnerExecutable = path.join(tempDir, exeName);

  for (let idx = 0; idx < testCases.length; idx++) {
    const tc = testCases[idx];
    const proc = await runIsolatedProcess({
      cmd: runnerExecutable,
      args: [String(idx)],
      cwd: tempDir,
      timeoutMs
    });
    results.push(parseOutputAndEvaluate(tc, proc));
  }

  return results;
}

// ─── OUTPUT PARSER & EVALUATOR ───────────────────────────────────────────────

function parseOutputAndEvaluate(tc: ITestCase, proc: ProcessResult): ITestCaseResult {
  const { stdout, stderr, exitCode, timedOut, durationMs } = proc;

  if (timedOut) {
    return {
      testCaseId: tc._id ? String(tc._id) : undefined,
      label: tc.label,
      args: tc.args,
      expectedReturn: tc.expectedReturn,
      actualOutput: '',
      stderr: 'Execution timed out (Time Limit Exceeded)',
      exitCode,
      passed: false,
      failureReason: 'timeout',
      executionTimeMs: durationMs
    };
  }

  if (exitCode !== 0) {
    return {
      testCaseId: tc._id ? String(tc._id) : undefined,
      label: tc.label,
      args: tc.args,
      expectedReturn: tc.expectedReturn,
      actualOutput: capOutput(stdout),
      stderr: capOutput(stderr || 'Runtime error encountered'),
      exitCode,
      passed: false,
      failureReason: 'crash',
      executionTimeMs: durationMs
    };
  }

  // Extract __RESULT__ ... __END__
  const match = stdout.match(/__RESULT__([\s\S]*?)__END__/);
  if (!match) {
    return {
      testCaseId: tc._id ? String(tc._id) : undefined,
      label: tc.label,
      args: tc.args,
      expectedReturn: tc.expectedReturn,
      actualOutput: capOutput(stdout),
      stderr: capOutput(stderr || 'Could not parse function return value'),
      exitCode: 1,
      passed: false,
      failureReason: 'crash',
      executionTimeMs: durationMs
    };
  }

  const rawJson = match[1].trim();
  let actualValue: any;
  try {
    actualValue = JSON.parse(rawJson);
  } catch (err: any) {
    return {
      testCaseId: tc._id ? String(tc._id) : undefined,
      label: tc.label,
      args: tc.args,
      expectedReturn: tc.expectedReturn,
      actualOutput: capOutput(rawJson),
      stderr: `Invalid JSON return value: ${err.message}`,
      exitCode: 1,
      passed: false,
      failureReason: 'crash',
      executionTimeMs: durationMs
    };
  }

  const isMatched = deepJsonEqual(actualValue, tc.expectedReturn);

  return {
    testCaseId: tc._id ? String(tc._id) : undefined,
    label: tc.label,
    args: tc.args,
    expectedReturn: tc.expectedReturn,
    actualOutput: JSON.stringify(actualValue),
    stderr: capOutput(stderr),
    exitCode: 0,
    passed: isMatched,
    failureReason: isMatched ? 'passed' : 'wrong_output',
    executionTimeMs: durationMs
  };
}
