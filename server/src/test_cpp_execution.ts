import { executeTestCases } from './services/codeExecution.service';

async function run() {
  console.log('1. Testing Valid C++ Solution (Two Sum)...');
  const validRes = await executeTestCases({
    code: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> m;
        for (int i = 0; i < nums.size(); ++i) {
            if (m.count(target - nums[i])) {
                return {m[target - nums[i]], i};
            }
            m[nums[i]] = i;
        }
        return {};
    }
};`,
    language: 'cpp',
    functionName: 'twoSum',
    parameters: [{ name: 'nums', type: 'number[]' }, { name: 'target', type: 'number' }],
    returnType: 'number[]',
    testCases: [
      { label: 'Example 1', args: [[2, 7, 11, 15], 9], expectedReturn: [0, 1] },
      { label: 'Example 2', args: [[3, 2, 4], 6], expectedReturn: [1, 2] }
    ]
  });
  console.log('Valid C++ Passed:', validRes.every(r => r.passed), validRes);

  console.log('2. Testing Wrong Answer C++...');
  const wrongRes = await executeTestCases({
    code: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        return {999, 999};
    }
};`,
    language: 'cpp',
    functionName: 'twoSum',
    parameters: [{ name: 'nums', type: 'number[]' }, { name: 'target', type: 'number' }],
    returnType: 'number[]',
    testCases: [
      { label: 'Example 1', args: [[2, 7, 11, 15], 9], expectedReturn: [0, 1] }
    ]
  });
  console.log('Wrong C++ Passed:', wrongRes[0].passed, 'Reason:', wrongRes[0].failureReason, 'Actual:', wrongRes[0].actualOutput);

  console.log('3. Testing Compilation Error C++...');
  const compileErrorRes = await executeTestCases({
    code: `#include <bits/stdc++.h>
using namespace std;
int main() {
    this_is_invalid;
}`,
    language: 'cpp',
    functionName: 'twoSum',
    parameters: [{ name: 'nums', type: 'number[]' }, { name: 'target', type: 'number' }],
    returnType: 'number[]',
    testCases: [
      { label: 'Example 1', args: [[2, 7, 11, 15], 9], expectedReturn: [0, 1] }
    ]
  });
  console.log('Compilation Error Detected:', !compileErrorRes[0].passed, 'Reason:', compileErrorRes[0].failureReason, 'Stderr:', compileErrorRes[0].stderr);
}

run().catch(console.error);
