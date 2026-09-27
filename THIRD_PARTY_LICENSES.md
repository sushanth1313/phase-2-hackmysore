# Third-Party Licenses & Attributions

## CoderScreen

- **Project**: CoderScreen
- **Repository**: [https://github.com/CoderScreen/coderscreen](https://github.com/CoderScreen/coderscreen)
- **License**: GNU General Public License v3.0 (GPL-3.0)
- **Copyright**: (c) CoderScreen Contributors

### Components & Concepts Adapted/Reused in ProofHire:
1. **Language Harness Architecture**:
   - Adapted language-specific harness generation concepts (`python.ts`, `javascript.ts`) for reading input arguments from standard input, executing candidate functions, and serializing outputs to JSON.
   - Extended harness design to Java (`Solution` / `Driver` harness) for static compilation and evaluation.
2. **Evaluation & Result Schema**:
   - Adapted test case result categorization (`passed`, `compile`, `timeout`, `crash`, `wrong_output`) and deep JSON equivalence verification from `AssessmentCodeRun.service.ts` and `testCaseResult.db.ts`.
3. **Editor & Test Runner UI Paradigms**:
   - Adapted CodeMirror 6 multi-language setup, split-pane layout, test case input/output tabs, execution timers, and submission history components from `CodeEditor.tsx`, `CodeEditorPanel.tsx`, and `TestResultsPanel.tsx`.
4. **Integration Location in ProofHire**:
   - Backend Execution Engine: `server/src/services/codeExecution.service.ts`
   - Technical Practice Controller & Routes: `server/src/controllers/technicalPractice.controller.ts`, `server/src/routes/technicalPractice.routes.ts`
   - Frontend Technical Practice Experience: `frontend/src/pages/student/TechnicalPractice.tsx`, `frontend/src/components/practice/CodeEditor.tsx`

All modified and integrated components comply with GPL-3.0 licensing requirements.
