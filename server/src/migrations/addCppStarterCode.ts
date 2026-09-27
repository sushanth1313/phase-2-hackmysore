import mongoose from 'mongoose';
import CodingChallenge from '../models/CodingChallenge';

// C++ starter code templates for common problem patterns
const CPP_STARTERS: Record<string, string> = {
  twoSum: `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Use unordered_map for O(n) solution\n        \n    }\n};`,
  maxSubArray: `class Solution {\npublic:\n    int maxSubArray(vector<int>& nums) {\n        // Kadane's algorithm\n        \n    }\n};`,
  productExceptSelf: `class Solution {\npublic:\n    vector<int> productExceptSelf(vector<int>& nums) {\n        // Prefix product then suffix product\n        \n    }\n};`,
  isAnagram: `class Solution {\npublic:\n    bool isAnagram(string s, string t) {\n        // Frequency count with unordered_map\n        \n    }\n};`,
  lengthOfLongestSubstring: `class Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        // Sliding window with unordered_set\n        \n    }\n};`,
  containsDuplicate: `class Solution {\npublic:\n    bool containsDuplicate(vector<int>& nums) {\n        // Use unordered_set\n        \n    }\n};`,
  topKFrequent: `class Solution {\npublic:\n    vector<int> topKFrequent(vector<int>& nums, int k) {\n        // Bucket sort or heap approach\n        \n    }\n};`,
  isPalindrome: `class Solution {\npublic:\n    bool isPalindrome(string s) {\n        // Two-pointer approach after filtering alphanumeric\n        \n    }\n};`,
  threeSum: `class Solution {\npublic:\n    vector<vector<int>> threeSum(vector<int>& nums) {\n        // Sort + two pointers\n        \n    }\n};`,
  trap: `class Solution {\npublic:\n    int trap(vector<int>& height) {\n        // Two-pointer approach\n        \n    }\n};`,
  maxProfit: `class Solution {\npublic:\n    int maxProfit(vector<int>& prices) {\n        // Track minimum price seen so far\n        \n    }\n};`,
  isValid: `class Solution {\npublic:\n    bool isValid(string s) {\n        // Use a stack for bracket matching\n        \n    }\n};`,
  search: `class Solution {\npublic:\n    int search(vector<int>& nums, int target) {\n        // Binary search\n        \n    }\n};`,
  searchRotated: `class Solution {\npublic:\n    int searchRotated(vector<int>& nums, int target) {\n        // Modified binary search\n        \n    }\n};`,
  reverseList: `class Solution {\npublic:\n    vector<int> reverseList(vector<int>& head) {\n        // Reverse in-place\n        \n    }\n};`,
  subsets: `class Solution {\npublic:\n    vector<vector<int>> subsets(vector<int>& nums) {\n        // Backtracking or bit manipulation\n        \n    }\n};`,
  combinationSum: `class Solution {\npublic:\n    vector<vector<int>> combinationSum(vector<int>& candidates, int target) {\n        // Backtracking\n        \n    }\n};`,
  climbStairs: `class Solution {\npublic:\n    int climbStairs(int n) {\n        // DP: ways[i] = ways[i-1] + ways[i-2]\n        \n    }\n};`,
  coinChange: `class Solution {\npublic:\n    int coinChange(vector<int>& coins, int amount) {\n        // DP bottom-up\n        \n    }\n};`,
  lengthOfLIS: `class Solution {\npublic:\n    int lengthOfLIS(vector<int>& nums) {\n        // DP or patience sorting (binary search)\n        \n    }\n};`,
  longestCommonSubsequence: `class Solution {\npublic:\n    int longestCommonSubsequence(string text1, string text2) {\n        // 2D DP table\n        \n    }\n};`,
  canJump: `class Solution {\npublic:\n    bool canJump(vector<int>& nums) {\n        // Greedy: track max reachable index\n        \n    }\n};`,
  maxDepth: `class Solution {\npublic:\n    int maxDepth(TreeNode* root) {\n        // Recursive DFS: 1 + max(left, right)\n        \n    }\n};`,
  isValidBST: `class Solution {\npublic:\n    bool isValidBST(TreeNode* root) {\n        // Pass min/max bounds recursively\n        return validate(root, LLONG_MIN, LLONG_MAX);\n    }\nprivate:\n    bool validate(TreeNode* node, long long min, long long max) {\n        \n    }\n};`,
  numIslands: `class Solution {\npublic:\n    int numIslands(vector<vector<char>>& grid) {\n        // BFS/DFS flood fill\n        \n    }\n};`,
  canFinish: `class Solution {\npublic:\n    bool canFinish(int numCourses, vector<vector<int>>& prerequisites) {\n        // Topological sort / cycle detection\n        \n    }\n};`,
  maxSlidingWindow: `class Solution {\npublic:\n    vector<int> maxSlidingWindow(vector<int>& nums, int k) {\n        // Monotonic deque\n        \n    }\n};`,
  mergeIntervals: `class Solution {\npublic:\n    vector<vector<int>> mergeIntervals(vector<vector<int>>& intervals) {\n        // Sort then merge overlapping\n        \n    }\n};`,
  sortColors: `class Solution {\npublic:\n    vector<int> sortColors(vector<int>& nums) {\n        // Dutch National Flag: three-way partition\n        \n    }\n};`,
  isPowerOfTwo: `class Solution {\npublic:\n    bool isPowerOfTwo(int n) {\n        // Bit manipulation: n > 0 && (n & (n-1)) == 0\n        \n    }\n};`,
  minDistance: `class Solution {\npublic:\n    int minDistance(string word1, string word2) {\n        // 2D DP for edit distance\n        \n    }\n};`,
  minWindow: `class Solution {\npublic:\n    string minWindow(string s, string t) {\n        // Sliding window with two frequency maps\n        \n    }\n};`,
};

async function addCppStarterCode() {
  await mongoose.connect('mongodb://127.0.0.1:27017/proofhire');
  
  const challenges = await CodingChallenge.find({ status: 'ACTIVE' });
  console.log(`Found ${challenges.length} active challenges to update`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const ch of challenges) {
    const fn = ch.functionName;
    const cppCode = CPP_STARTERS[fn];
    
    // Get current starterCode map
    const currentStarterCode = ch.starterCode as any;
    const currentCpp = currentStarterCode instanceof Map 
      ? currentStarterCode.get('cpp')
      : currentStarterCode?.cpp;

    if (currentCpp) {
      console.log(`  SKIP: "${ch.title}" already has C++ starter code`);
      skippedCount++;
    } else {
      if (cppCode) {
        // Add cpp to allowedLanguages if not present
        if (!ch.allowedLanguages.includes('cpp')) {
          ch.allowedLanguages.push('cpp');
        }
        
        // Update starterCode map
        if (currentStarterCode instanceof Map) {
          currentStarterCode.set('cpp', cppCode);
        } else {
          ch.set('starterCode', { ...currentStarterCode, cpp: cppCode });
        }
        
        await ch.save();
        console.log(`  UPDATED: "${ch.title}" (${fn}) - added C++ starter code`);
        updatedCount++;
      } else {
        // Generate a generic C++ template based on return type
        const params = ch.parameters.map(p => {
          if (p.type.includes('[][]')) return `vector<vector<int>>& ${p.name}`;
          if (p.type.includes('number[]')) return `vector<int>& ${p.name}`;
          if (p.type.includes('string[]')) return `vector<string>& ${p.name}`;
          if (p.type.includes('string')) return `string ${p.name}`;
          if (p.type.includes('number')) return `int ${p.name}`;
          if (p.type.includes('boolean')) return `bool ${p.name}`;
          return `auto& ${p.name}`;
        }).join(', ');

        let retType = 'int';
        if (ch.returnType.includes('number[][]')) retType = 'vector<vector<int>>';
        else if (ch.returnType.includes('number[]')) retType = 'vector<int>';
        else if (ch.returnType.includes('string[]')) retType = 'vector<string>';
        else if (ch.returnType.includes('string')) retType = 'string';
        else if (ch.returnType.includes('boolean')) retType = 'bool';
        else if (ch.returnType.includes('number')) retType = 'int';

        const genericCpp = `class Solution {\npublic:\n    ${retType} ${fn}(${params}) {\n        // Your solution here\n        \n    }\n};`;
        
        if (!ch.allowedLanguages.includes('cpp')) {
          ch.allowedLanguages.push('cpp');
        }
        if (currentStarterCode instanceof Map) {
          currentStarterCode.set('cpp', genericCpp);
        } else {
          ch.set('starterCode', { ...currentStarterCode, cpp: genericCpp });
        }
        await ch.save();
        console.log(`  UPDATED (generic): "${ch.title}" (${fn})`);
        updatedCount++;
      }
    }
  }

  console.log(`\nDone: ${updatedCount} updated, ${skippedCount} already had C++`);
  await mongoose.disconnect();
}

addCppStarterCode().catch(console.error);
