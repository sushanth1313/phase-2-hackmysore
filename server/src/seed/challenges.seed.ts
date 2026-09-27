import mongoose from 'mongoose';
import CodingChallenge from '../models/CodingChallenge';

function slug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export const CHALLENGES = [
  // ─── DSA: Arrays ─────────────────────────────────────
  {
    title: 'Two Sum',
    slug: 'two-sum',
    description: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers that add up to target. You may assume exactly one solution exists.',
    difficulty: 'EASY',
    category: 'DSA',
    functionName: 'twoSum',
    returnType: 'number[]',
    parameters: [{ name: 'nums', type: 'number[]' }, { name: 'target', type: 'number' }],
    starterCode: { javascript: `function twoSum(nums, target) {\n  // Use a hash map for O(n) solution\n}`, python: `def two_sum(nums, target):\n    # Use a dict for O(n) solution\n    pass`, java: `class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        return new int[]{};\n    }\n}` },
    testCases: [
      { label: 'Example 1', args: [[2,7,11,15], 9], expectedReturn: [0,1], isHidden: false },
      { label: 'Example 2', args: [[3,2,4], 6], expectedReturn: [1,2], isHidden: false },
      { label: 'Hidden 1', args: [[3,3], 6], expectedReturn: [0,1], isHidden: true },
      { label: 'Hidden 2', args: [[1,2,3,4,5], 9], expectedReturn: [3,4], isHidden: true }
    ],
    constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9', 'Exactly one valid answer'],
    hints: ['Try using a hash map to store visited numbers', 'For each num, check if target - num is in the map'],
    verifiedSubmissions: 0
  },
  {
    title: 'Maximum Subarray',
    slug: 'maximum-subarray',
    description: 'Given an integer array `nums`, find the subarray with the largest sum and return its sum. Use Kadane\'s algorithm.',
    difficulty: 'MEDIUM',
    category: 'DSA',
    functionName: 'maxSubArray',
    returnType: 'number',
    parameters: [{ name: 'nums', type: 'number[]' }],
    starterCode: { javascript: `function maxSubArray(nums) {\n  // Kadane's: track current and global max\n}`, python: `def max_sub_array(nums):\n    pass`, java: `class Solution {\n    public int maxSubArray(int[] nums) {\n        return 0;\n    }\n}` },
    testCases: [
      { label: 'Example 1', args: [[-2,1,-3,4,-1,2,1,-5,4]], expectedReturn: 6, isHidden: false },
      { label: 'Example 2', args: [[1]], expectedReturn: 1, isHidden: false },
      { label: 'Hidden 1', args: [[5,4,-1,7,8]], expectedReturn: 23, isHidden: true },
      { label: 'Hidden 2', args: [[-1,-2,-3]], expectedReturn: -1, isHidden: true }
    ],
    constraints: ['1 <= nums.length <= 10^5', '-10^4 <= nums[i] <= 10^4'],
    hints: ['Keep track of the current running sum', 'Reset to current element when running sum goes negative'],
    verifiedSubmissions: 0
  },
  {
    title: 'Product of Array Except Self',
    slug: 'product-except-self',
    description: 'Return an array where answer[i] equals the product of all elements except nums[i]. No division. O(n) time, O(1) extra space.',
    difficulty: 'MEDIUM',
    category: 'DSA',
    functionName: 'productExceptSelf',
    returnType: 'number[]',
    parameters: [{ name: 'nums', type: 'number[]' }],
    starterCode: { javascript: `function productExceptSelf(nums) {\n  // Prefix products from left, then multiply suffix from right\n}`, python: `def product_except_self(nums):\n    pass`, java: `class Solution {\n    public int[] productExceptSelf(int[] nums) {\n        return new int[]{};\n    }\n}` },
    testCases: [
      { label: 'Example 1', args: [[1,2,3,4]], expectedReturn: [24,12,8,6], isHidden: false },
      { label: 'Hidden 1', args: [[-1,1,0,-3,3]], expectedReturn: [0,0,9,0,0], isHidden: true }
    ],
    constraints: ['2 <= nums.length <= 10^5', 'Must run in O(n), O(1) extra space'],
    hints: ['Build a prefix product array', 'Then multiply by suffix products in a second pass'],
    verifiedSubmissions: 0
  },
  // ─── DSA: Strings ────────────────────────────────────
  {
    title: 'Valid Anagram',
    slug: 'valid-anagram',
    description: 'Return true if t is an anagram of s (same characters, same frequency).',
    difficulty: 'EASY',
    category: 'DSA',
    functionName: 'isAnagram',
    returnType: 'boolean',
    parameters: [{ name: 's', type: 'string' }, { name: 't', type: 'string' }],
    starterCode: { javascript: `function isAnagram(s, t) {\n  // frequency count with a map or sorted strings\n}`, python: `def is_anagram(s, t):\n    pass`, java: `class Solution {\n    public boolean isAnagram(String s, String t) {\n        return false;\n    }\n}` },
    testCases: [
      { label: 'Example 1', args: ['anagram', 'nagaram'], expectedReturn: true, isHidden: false },
      { label: 'Example 2', args: ['rat', 'car'], expectedReturn: false, isHidden: false },
      { label: 'Hidden 1', args: ['ab', 'a'], expectedReturn: false, isHidden: true }
    ],
    constraints: ['1 <= s.length, t.length <= 5*10^4', 'lowercase English letters only'],
    hints: ['Count character frequencies in both strings', 'Alternatively, sort both strings and compare'],
    verifiedSubmissions: 0
  },
  {
    title: 'Longest Substring Without Repeating Characters',
    slug: 'longest-substring-no-repeat',
    description: 'Find the length of the longest substring without repeating characters.',
    difficulty: 'MEDIUM',
    category: 'DSA',
    functionName: 'lengthOfLongestSubstring',
    returnType: 'number',
    parameters: [{ name: 's', type: 'string' }],
    starterCode: { javascript: `function lengthOfLongestSubstring(s) {\n  // Sliding window + set\n}`, python: `def length_of_longest_substring(s):\n    pass`, java: `class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        return 0;\n    }\n}` },
    testCases: [
      { label: 'Example 1', args: ['abcabcbb'], expectedReturn: 3, isHidden: false },
      { label: 'Example 2', args: ['bbbbb'], expectedReturn: 1, isHidden: false },
      { label: 'Hidden 1', args: ['pwwkew'], expectedReturn: 3, isHidden: true },
      { label: 'Hidden 2', args: [''], expectedReturn: 0, isHidden: true }
    ],
    constraints: ['0 <= s.length <= 5*10^4'],
    hints: ['Use a sliding window with a HashSet', 'Move left pointer when duplicate found'],
    verifiedSubmissions: 0
  },
  // ─── DSA: Hashing ─────────────────────────────────────
  {
    title: 'Contains Duplicate',
    slug: 'contains-duplicate',
    description: 'Return true if any value appears at least twice in nums.',
    difficulty: 'EASY',
    category: 'DSA',
    functionName: 'containsDuplicate',
    returnType: 'boolean',
    parameters: [{ name: 'nums', type: 'number[]' }],
    starterCode: { javascript: `function containsDuplicate(nums) {\n  // Use a Set\n}`, python: `def contains_duplicate(nums):\n    pass`, java: `class Solution {\n    public boolean containsDuplicate(int[] nums) {\n        return false;\n    }\n}` },
    testCases: [
      { label: 'Example 1', args: [[1,2,3,1]], expectedReturn: true, isHidden: false },
      { label: 'Example 2', args: [[1,2,3,4]], expectedReturn: false, isHidden: false },
      { label: 'Hidden 1', args: [[1,1,1,3,3,4,3,2,4,2]], expectedReturn: true, isHidden: true }
    ],
    constraints: ['1 <= nums.length <= 10^5'],
    hints: ['A Set stores only unique values'],
    verifiedSubmissions: 0
  },
  {
    title: 'Top K Frequent Elements',
    slug: 'top-k-frequent',
    description: 'Return the k most frequent elements. Bucket sort gives O(n).',
    difficulty: 'MEDIUM',
    category: 'DSA',
    functionName: 'topKFrequent',
    returnType: 'number[]',
    parameters: [{ name: 'nums', type: 'number[]' }, { name: 'k', type: 'number' }],
    starterCode: { javascript: `function topKFrequent(nums, k) {\n  // Frequency map + bucket sort\n}`, python: `def top_k_frequent(nums, k):\n    pass`, java: `class Solution {\n    public int[] topKFrequent(int[] nums, int k) {\n        return new int[]{};\n    }\n}` },
    testCases: [
      { label: 'Example 1', args: [[1,1,1,2,2,3], 2], expectedReturn: [1,2], isHidden: false },
      { label: 'Example 2', args: [[1], 1], expectedReturn: [1], isHidden: true }
    ],
    constraints: ['1 <= nums.length <= 10^5'],
    hints: ['Count frequencies first', 'Use bucket sort indexed by frequency for O(n)'],
    verifiedSubmissions: 0
  },
  // ─── DSA: Two Pointers ─────────────────────────────────
  {
    title: 'Valid Palindrome',
    slug: 'valid-palindrome',
    description: 'After removing non-alphanumeric characters and lowercasing, check if the string reads the same forward and backward.',
    difficulty: 'EASY',
    category: 'DSA',
    functionName: 'isPalindrome',
    returnType: 'boolean',
    parameters: [{ name: 's', type: 'string' }],
    starterCode: { javascript: `function isPalindrome(s) {\n  // Two pointers from ends toward center\n}`, python: `def is_palindrome(s):\n    pass`, java: `class Solution {\n    public boolean isPalindrome(String s) {\n        return false;\n    }\n}` },
    testCases: [
      { label: 'Example 1', args: ['A man, a plan, a canal: Panama'], expectedReturn: true, isHidden: false },
      { label: 'Example 2', args: ['race a car'], expectedReturn: false, isHidden: false },
      { label: 'Hidden 1', args: [' '], expectedReturn: true, isHidden: true }
    ],
    constraints: ['1 <= s.length <= 2*10^5'],
    hints: ['Use two pointers from both ends', 'Skip non-alphanumeric characters'],
    verifiedSubmissions: 0
  },
  {
    title: 'Three Sum',
    slug: 'three-sum',
    description: 'Find all unique triplets in the array that sum to zero. Sort first, then use two pointers.',
    difficulty: 'MEDIUM',
    category: 'ALGORITHMS',
    functionName: 'threeSum',
    returnType: 'number[][]',
    parameters: [{ name: 'nums', type: 'number[]' }],
    starterCode: { javascript: `function threeSum(nums) {\n  // Sort + fix one element, two-pointer for the rest\n}`, python: `def three_sum(nums):\n    pass`, java: `class Solution {\n    public List<List<Integer>> threeSum(int[] nums) {\n        return new ArrayList<>();\n    }\n}` },
    testCases: [
      { label: 'Example 1', args: [[-1,0,1,2,-1,-4]], expectedReturn: [[-1,-1,2],[-1,0,1]], isHidden: false },
      { label: 'Example 2', args: [[0,0,0]], expectedReturn: [[0,0,0]], isHidden: true }
    ],
    constraints: ['3 <= nums.length <= 3000', 'Must avoid duplicates'],
    hints: ['Sort the array first', 'Fix one number, use two pointers for the pair'],
    verifiedSubmissions: 0
  },
  {
    title: 'Trapping Rain Water',
    slug: 'trapping-rain-water',
    description: 'Compute how much water the elevation map can trap after raining. Two-pointer approach gives O(n) O(1).',
    difficulty: 'HARD',
    category: 'ALGORITHMS',
    functionName: 'trap',
    returnType: 'number',
    parameters: [{ name: 'height', type: 'number[]' }],
    starterCode: { javascript: `function trap(height) {\n  // Two pointers: track maxLeft and maxRight\n}`, python: `def trap(height):\n    pass`, java: `class Solution {\n    public int trap(int[] height) {\n        return 0;\n    }\n}` },
    testCases: [
      { label: 'Example 1', args: [[0,1,0,2,1,0,1,3,2,1,2,1]], expectedReturn: 6, isHidden: false },
      { label: 'Example 2', args: [[4,2,0,3,2,5]], expectedReturn: 9, isHidden: false }
    ],
    constraints: ['n == height.length', '0 <= height[i] <= 10^5'],
    hints: ['Water trapped at i = min(maxLeft, maxRight) - height[i]', 'Two-pointer avoids O(n) space'],
    verifiedSubmissions: 0
  },
  // ─── DSA: Sliding Window ──────────────────────────────
  {
    title: 'Best Time to Buy and Sell Stock',
    slug: 'best-time-buy-sell',
    description: 'Return the maximum profit by choosing one day to buy and a later day to sell. Return 0 if no profit possible.',
    difficulty: 'EASY',
    category: 'DSA',
    functionName: 'maxProfit',
    returnType: 'number',
    parameters: [{ name: 'prices', type: 'number[]' }],
    starterCode: { javascript: `function maxProfit(prices) {\n  // Track minimum price, update max profit\n}`, python: `def max_profit(prices):\n    pass`, java: `class Solution {\n    public int maxProfit(int[] prices) {\n        return 0;\n    }\n}` },
    testCases: [
      { label: 'Example 1', args: [[7,1,5,3,6,4]], expectedReturn: 5, isHidden: false },
      { label: 'Example 2', args: [[7,6,4,3,1]], expectedReturn: 0, isHidden: false },
      { label: 'Hidden 1', args: [[2,4,1]], expectedReturn: 2, isHidden: true }
    ],
    constraints: ['1 <= prices.length <= 10^5', '0 <= prices[i] <= 10^4'],
    hints: ['Track the minimum price seen so far', 'Profit = price[i] - minPrice'],
    verifiedSubmissions: 0
  },
  // ─── DSA: Stack ──────────────────────────────────────
  {
    title: 'Valid Parentheses',
    slug: 'valid-parentheses',
    description: 'Determine if a string of brackets is valid: brackets must be properly opened and closed.',
    difficulty: 'EASY',
    category: 'DSA',
    functionName: 'isValid',
    returnType: 'boolean',
    parameters: [{ name: 's', type: 'string' }],
    starterCode: { javascript: `function isValid(s) {\n  // Stack: push open brackets, pop on close\n}`, python: `def is_valid(s):\n    pass`, java: `class Solution {\n    public boolean isValid(String s) {\n        return false;\n    }\n}` },
    testCases: [
      { label: 'Example 1', args: ['()'], expectedReturn: true, isHidden: false },
      { label: 'Example 2', args: ['()[]{}'], expectedReturn: true, isHidden: false },
      { label: 'Example 3', args: ['(]'], expectedReturn: false, isHidden: false },
      { label: 'Hidden 1', args: ['{[]}'], expectedReturn: true, isHidden: true }
    ],
    constraints: ['1 <= s.length <= 10^4', 'Only brackets: ()[]{} '],
    hints: ['Use a stack', 'For each close bracket, check if top of stack matches'],
    verifiedSubmissions: 0
  },
  // ─── DSA: Binary Search ─────────────────────────────
  {
    title: 'Binary Search',
    slug: 'binary-search',
    description: 'Search for target in a sorted array of integers. Return index if found, -1 otherwise. Must be O(log n).',
    difficulty: 'EASY',
    category: 'ALGORITHMS',
    functionName: 'search',
    returnType: 'number',
    parameters: [{ name: 'nums', type: 'number[]' }, { name: 'target', type: 'number' }],
    starterCode: { javascript: `function search(nums, target) {\n  // Classic binary search: left, right, mid\n}`, python: `def search(nums, target):\n    pass`, java: `class Solution {\n    public int search(int[] nums, int target) {\n        return -1;\n    }\n}` },
    testCases: [
      { label: 'Example 1', args: [[-1,0,3,5,9,12], 9], expectedReturn: 4, isHidden: false },
      { label: 'Example 2', args: [[-1,0,3,5,9,12], 2], expectedReturn: -1, isHidden: false },
      { label: 'Hidden 1', args: [[5], 5], expectedReturn: 0, isHidden: true }
    ],
    constraints: ['1 <= nums.length <= 10^4', 'All values unique, sorted ascending'],
    hints: ['Maintain left and right pointers', 'mid = left + (right - left) / 2 to avoid overflow'],
    verifiedSubmissions: 0
  },
  {
    title: 'Search in Rotated Sorted Array',
    slug: 'search-rotated-array',
    description: 'Search target in a rotated sorted array in O(log n). Determine which half is sorted, then binary search.',
    difficulty: 'MEDIUM',
    category: 'ALGORITHMS',
    functionName: 'searchRotated',
    returnType: 'number',
    parameters: [{ name: 'nums', type: 'number[]' }, { name: 'target', type: 'number' }],
    starterCode: { javascript: `function searchRotated(nums, target) {\n  // Modified binary search: identify sorted half\n}`, python: `def search_rotated(nums, target):\n    pass`, java: `class Solution {\n    public int search(int[] nums, int target) {\n        return -1;\n    }\n}` },
    testCases: [
      { label: 'Example 1', args: [[4,5,6,7,0,1,2], 0], expectedReturn: 4, isHidden: false },
      { label: 'Example 2', args: [[4,5,6,7,0,1,2], 3], expectedReturn: -1, isHidden: false },
      { label: 'Hidden 1', args: [[3,1], 1], expectedReturn: 1, isHidden: true }
    ],
    constraints: ['All values unique', '1 <= nums.length <= 5000'],
    hints: ['At each step, one half is always sorted', 'Check if target is in the sorted half first'],
    verifiedSubmissions: 0
  },
  // ─── DSA: Linked Lists ───────────────────────────────
  {
    title: 'Reverse Linked List',
    slug: 'reverse-linked-list',
    description: 'Reverse a singly linked list in-place. Return the new head.',
    difficulty: 'EASY',
    category: 'DSA',
    functionName: 'reverseList',
    returnType: 'number[]',
    parameters: [{ name: 'head', type: 'number[]' }],
    starterCode: { javascript: `function reverseList(head) {\n  // Three pointers: prev, curr, next\n}`, python: `def reverse_list(head):\n    pass`, java: `class Solution {\n    public ListNode reverseList(ListNode head) {\n        return null;\n    }\n}` },
    testCases: [
      { label: 'Example 1', args: [[1,2,3,4,5]], expectedReturn: [5,4,3,2,1], isHidden: false },
      { label: 'Example 2', args: [[1,2]], expectedReturn: [2,1], isHidden: false },
      { label: 'Hidden 1', args: [[]], expectedReturn: [], isHidden: true }
    ],
    constraints: ['0 <= n <= 5000', '-5000 <= Node.val <= 5000'],
    hints: ['Use prev=null, curr=head', 'At each step: save next, point curr.next to prev, advance'],
    verifiedSubmissions: 0
  },
  // ─── ALGORITHMS: Backtracking ─────────────────────────
  {
    title: 'Subsets',
    slug: 'subsets',
    description: 'Return all possible subsets (the power set) of a distinct integer array.',
    difficulty: 'MEDIUM',
    category: 'ALGORITHMS',
    functionName: 'subsets',
    returnType: 'number[][]',
    parameters: [{ name: 'nums', type: 'number[]' }],
    starterCode: { javascript: `function subsets(nums) {\n  // Backtracking: include/exclude each element\n}`, python: `def subsets(nums):\n    pass`, java: `class Solution {\n    public List<List<Integer>> subsets(int[] nums) {\n        return new ArrayList<>();\n    }\n}` },
    testCases: [
      { label: 'Example 1', args: [[1,2,3]], expectedReturn: [[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]], isHidden: false },
      { label: 'Hidden 1', args: [[0]], expectedReturn: [[],[0]], isHidden: true }
    ],
    constraints: ['1 <= nums.length <= 10', 'All elements unique'],
    hints: ['For each element, choose to include it or not', 'DFS with start index'],
    verifiedSubmissions: 0
  },
  {
    title: 'Combination Sum',
    slug: 'combination-sum',
    description: 'Return all combinations of candidates that sum to target. Same number may be used unlimited times.',
    difficulty: 'MEDIUM',
    category: 'ALGORITHMS',
    functionName: 'combinationSum',
    returnType: 'number[][]',
    parameters: [{ name: 'candidates', type: 'number[]' }, { name: 'target', type: 'number' }],
    starterCode: { javascript: `function combinationSum(candidates, target) {\n  // Backtracking with pruning\n}`, python: `def combination_sum(candidates, target):\n    pass`, java: `class Solution {\n    public List<List<Integer>> combinationSum(int[] candidates, int target) {\n        return new ArrayList<>();\n    }\n}` },
    testCases: [
      { label: 'Example 1', args: [[2,3,6,7], 7], expectedReturn: [[2,2,3],[7]], isHidden: false },
      { label: 'Example 2', args: [[2,3,5], 8], expectedReturn: [[2,2,2,2],[2,3,3],[3,5]], isHidden: false }
    ],
    constraints: ['1 <= candidates.length <= 30', '1 <= target <= 40'],
    hints: ['Sort candidates for pruning', 'Reuse the same index (not index+1) to allow repeats'],
    verifiedSubmissions: 0
  },
  // ─── ALGORITHMS: Dynamic Programming ─────────────────
  {
    title: 'Climbing Stairs',
    slug: 'climbing-stairs',
    description: 'Count distinct ways to climb n stairs. Each step you can climb 1 or 2 stairs.',
    difficulty: 'EASY',
    category: 'ALGORITHMS',
    functionName: 'climbStairs',
    returnType: 'number',
    parameters: [{ name: 'n', type: 'number' }],
    starterCode: { javascript: `function climbStairs(n) {\n  // Fibonacci: dp[i] = dp[i-1] + dp[i-2]\n}`, python: `def climb_stairs(n):\n    pass`, java: `class Solution {\n    public int climbStairs(int n) {\n        return 0;\n    }\n}` },
    testCases: [
      { label: 'Example 1', args: [2], expectedReturn: 2, isHidden: false },
      { label: 'Example 2', args: [3], expectedReturn: 3, isHidden: false },
      { label: 'Hidden 1', args: [10], expectedReturn: 89, isHidden: true }
    ],
    constraints: ['1 <= n <= 45'],
    hints: ['It is Fibonacci', 'dp[1]=1, dp[2]=2, dp[n]=dp[n-1]+dp[n-2]'],
    verifiedSubmissions: 0
  },
  {
    title: 'Coin Change',
    slug: 'coin-change',
    description: 'Return the fewest coins to make up amount. Return -1 if not possible.',
    difficulty: 'MEDIUM',
    category: 'ALGORITHMS',
    functionName: 'coinChange',
    returnType: 'number',
    parameters: [{ name: 'coins', type: 'number[]' }, { name: 'amount', type: 'number' }],
    starterCode: { javascript: `function coinChange(coins, amount) {\n  // Bottom-up DP: dp[i] = min coins for amount i\n}`, python: `def coin_change(coins, amount):\n    pass`, java: `class Solution {\n    public int coinChange(int[] coins, int amount) {\n        return -1;\n    }\n}` },
    testCases: [
      { label: 'Example 1', args: [[1,5,11], 15], expectedReturn: 3, isHidden: false },
      { label: 'Example 2', args: [[2], 3], expectedReturn: -1, isHidden: false },
      { label: 'Hidden 1', args: [[1], 0], expectedReturn: 0, isHidden: true }
    ],
    constraints: ['1 <= coins.length <= 12', '0 <= amount <= 10^4'],
    hints: ['dp[0]=0, dp[i]=infinity initially', 'For each amount, try all coins'],
    verifiedSubmissions: 0
  },
  {
    title: 'Longest Increasing Subsequence',
    slug: 'longest-increasing-subsequence',
    description: 'Return the length of the longest strictly increasing subsequence. O(n log n) with patience sorting.',
    difficulty: 'MEDIUM',
    category: 'ALGORITHMS',
    functionName: 'lengthOfLIS',
    returnType: 'number',
    parameters: [{ name: 'nums', type: 'number[]' }],
    starterCode: { javascript: `function lengthOfLIS(nums) {\n  // O(n log n): maintain a tails array\n}`, python: `def length_of_lis(nums):\n    pass`, java: `class Solution {\n    public int lengthOfLIS(int[] nums) {\n        return 0;\n    }\n}` },
    testCases: [
      { label: 'Example 1', args: [[10,9,2,5,3,7,101,18]], expectedReturn: 4, isHidden: false },
      { label: 'Hidden 1', args: [[7,7,7,7,7]], expectedReturn: 1, isHidden: true }
    ],
    constraints: ['1 <= nums.length <= 2500'],
    hints: ['O(n²) DP: dp[i] = max(dp[j]+1) for all j<i where nums[j]<nums[i]', 'O(n log n): binary search on tails array'],
    verifiedSubmissions: 0
  },
  {
    title: 'Longest Common Subsequence',
    slug: 'longest-common-subsequence',
    description: 'Return the length of the longest common subsequence of two strings.',
    difficulty: 'MEDIUM',
    category: 'ALGORITHMS',
    functionName: 'longestCommonSubsequence',
    returnType: 'number',
    parameters: [{ name: 'text1', type: 'string' }, { name: 'text2', type: 'string' }],
    starterCode: { javascript: `function longestCommonSubsequence(text1, text2) {\n  // 2D DP table\n}`, python: `def longest_common_subsequence(text1, text2):\n    pass`, java: `class Solution {\n    public int longestCommonSubsequence(String text1, String text2) {\n        return 0;\n    }\n}` },
    testCases: [
      { label: 'Example 1', args: ['abcde', 'ace'], expectedReturn: 3, isHidden: false },
      { label: 'Hidden 1', args: ['abc', 'def'], expectedReturn: 0, isHidden: true }
    ],
    constraints: ['1 <= text1.length, text2.length <= 1000'],
    hints: ['dp[i][j] = LCS of text1[0..i] and text2[0..j]', 'If chars match: dp[i][j] = dp[i-1][j-1]+1, else max of skip'],
    verifiedSubmissions: 0
  },
  // ─── ALGORITHMS: Greedy ──────────────────────────────
  {
    title: 'Jump Game',
    slug: 'jump-game',
    description: 'Determine if you can reach the last index from index 0. Each element is your max jump length.',
    difficulty: 'MEDIUM',
    category: 'ALGORITHMS',
    functionName: 'canJump',
    returnType: 'boolean',
    parameters: [{ name: 'nums', type: 'number[]' }],
    starterCode: { javascript: `function canJump(nums) {\n  // Greedy: track max reachable index\n}`, python: `def can_jump(nums):\n    pass`, java: `class Solution {\n    public boolean canJump(int[] nums) {\n        return false;\n    }\n}` },
    testCases: [
      { label: 'Example 1', args: [[2,3,1,1,4]], expectedReturn: true, isHidden: false },
      { label: 'Example 2', args: [[3,2,1,0,4]], expectedReturn: false, isHidden: false },
      { label: 'Hidden 1', args: [[0]], expectedReturn: true, isHidden: true }
    ],
    constraints: ['1 <= nums.length <= 10^4', '0 <= nums[i] <= 10^5'],
    hints: ['Keep track of the furthest reachable index', 'If current index > maxReachable, return false'],
    verifiedSubmissions: 0
  },
  // ─── SYSTEMS: Trees ──────────────────────────────────
  {
    title: 'Maximum Depth of Binary Tree',
    slug: 'max-depth-binary-tree',
    description: 'Return the maximum depth (height) of a binary tree.',
    difficulty: 'EASY',
    category: 'SYSTEMS',
    functionName: 'maxDepth',
    returnType: 'number',
    parameters: [{ name: 'root', type: 'TreeNode | null' }],
    starterCode: { javascript: `function maxDepth(root) {\n  // Recursive DFS: 1 + max(left, right)\n}`, python: `def max_depth(root):\n    pass`, java: `class Solution {\n    public int maxDepth(TreeNode root) {\n        return 0;\n    }\n}` },
    testCases: [
      { label: 'Example 1', args: [[3,9,20,null,null,15,7]], expectedReturn: 3, isHidden: false },
      { label: 'Example 2', args: [[1,null,2]], expectedReturn: 2, isHidden: false }
    ],
    constraints: ['0 <= n <= 10^4'],
    hints: ['Base case: null node returns 0', '1 + max(maxDepth(left), maxDepth(right))'],
    verifiedSubmissions: 0
  },
  {
    title: 'Validate Binary Search Tree',
    slug: 'validate-bst',
    description: 'Determine if a binary tree is a valid BST. Left subtree < node < right subtree (strictly).',
    difficulty: 'MEDIUM',
    category: 'SYSTEMS',
    functionName: 'isValidBST',
    returnType: 'boolean',
    parameters: [{ name: 'root', type: 'TreeNode | null' }],
    starterCode: { javascript: `function isValidBST(root) {\n  // Pass min/max bounds to each recursive call\n}`, python: `def is_valid_bst(root):\n    pass`, java: `class Solution {\n    public boolean isValidBST(TreeNode root) {\n        return false;\n    }\n}` },
    testCases: [
      { label: 'Example 1', args: [[2,1,3]], expectedReturn: true, isHidden: false },
      { label: 'Example 2', args: [[5,1,4,null,null,3,6]], expectedReturn: false, isHidden: false }
    ],
    constraints: ['1 <= n <= 10^4'],
    hints: ['Recursively pass (min, max) valid range', 'For right child: min=node.val, for left child: max=node.val'],
    verifiedSubmissions: 0
  },
  // ─── SYSTEMS: Graphs ─────────────────────────────────
  {
    title: 'Number of Islands',
    slug: 'number-of-islands',
    description: 'Count distinct islands in a binary grid of 1s (land) and 0s (water) using DFS flood fill.',
    difficulty: 'MEDIUM',
    category: 'SYSTEMS',
    functionName: 'numIslands',
    returnType: 'number',
    parameters: [{ name: 'grid', type: 'string[][]' }],
    starterCode: { javascript: `function numIslands(grid) {\n  // DFS: mark visited cells, count components\n}`, python: `def num_islands(grid):\n    pass`, java: `class Solution {\n    public int numIslands(char[][] grid) {\n        return 0;\n    }\n}` },
    testCases: [
      { label: 'Example 1', args: [[['1','1','1','1','0'],['1','1','0','1','0'],['1','1','0','0','0'],['0','0','0','0','0']]], expectedReturn: 1, isHidden: false },
      { label: 'Example 2', args: [[['1','1','0','0','0'],['1','1','0','0','0'],['0','0','1','0','0'],['0','0','0','1','1']]], expectedReturn: 3, isHidden: false }
    ],
    constraints: ['1 <= m, n <= 300', 'grid[i][j] is 0 or 1'],
    hints: ['DFS from every unvisited 1', 'Mark cells as visited by setting to 0'],
    verifiedSubmissions: 0
  },
  {
    title: 'Course Schedule',
    slug: 'course-schedule',
    description: 'Determine if all courses can be finished given prerequisites. This is cycle detection in a directed graph.',
    difficulty: 'MEDIUM',
    category: 'SYSTEMS',
    functionName: 'canFinish',
    returnType: 'boolean',
    parameters: [{ name: 'numCourses', type: 'number' }, { name: 'prerequisites', type: 'number[][]' }],
    starterCode: { javascript: `function canFinish(numCourses, prerequisites) {\n  // Build adjacency list + DFS cycle detection\n}`, python: `def can_finish(numCourses, prerequisites):\n    pass`, java: `class Solution {\n    public boolean canFinish(int numCourses, int[][] prerequisites) {\n        return false;\n    }\n}` },
    testCases: [
      { label: 'Example 1', args: [2, [[1,0]]], expectedReturn: true, isHidden: false },
      { label: 'Example 2', args: [2, [[1,0],[0,1]]], expectedReturn: false, isHidden: false }
    ],
    constraints: ['1 <= numCourses <= 2000', '0 <= prerequisites.length <= 5000'],
    hints: ['Build adjacency list from prerequisites', 'DFS with 3 states: unvisited, in-progress, done'],
    verifiedSubmissions: 0
  },
  // ─── BACKEND: Concurrency ────────────────────────────
  {
    title: 'Sliding Window Maximum',
    slug: 'sliding-window-maximum',
    description: 'Return max value in each sliding window of size k. Use a monotonic deque for O(n).',
    difficulty: 'HARD',
    category: 'ALGORITHMS',
    functionName: 'maxSlidingWindow',
    returnType: 'number[]',
    parameters: [{ name: 'nums', type: 'number[]' }, { name: 'k', type: 'number' }],
    starterCode: { javascript: `function maxSlidingWindow(nums, k) {\n  // Monotonic deque: front = max of current window\n}`, python: `from collections import deque\ndef max_sliding_window(nums, k):\n    pass`, java: `class Solution {\n    public int[] maxSlidingWindow(int[] nums, int k) {\n        return new int[]{};\n    }\n}` },
    testCases: [
      { label: 'Example 1', args: [[1,3,-1,-3,5,3,6,7], 3], expectedReturn: [3,3,5,5,6,7], isHidden: false },
      { label: 'Hidden 1', args: [[1], 1], expectedReturn: [1], isHidden: true }
    ],
    constraints: ['1 <= nums.length <= 10^5', '1 <= k <= nums.length'],
    hints: ['Keep indices in deque, not values', 'Remove elements outside window, remove smaller elements from back'],
    verifiedSubmissions: 0
  },
  {
    title: 'Merge Intervals',
    slug: 'merge-intervals',
    description: 'Sort and merge all overlapping intervals.',
    difficulty: 'MEDIUM',
    category: 'ALGORITHMS',
    functionName: 'mergeIntervals',
    returnType: 'number[][]',
    parameters: [{ name: 'intervals', type: 'number[][]' }],
    starterCode: { javascript: `function mergeIntervals(intervals) {\n  // Sort by start, merge overlapping\n}`, python: `def merge_intervals(intervals):\n    pass`, java: `class Solution {\n    public int[][] merge(int[][] intervals) {\n        return new int[][]{};\n    }\n}` },
    testCases: [
      { label: 'Example 1', args: [[[1,3],[2,6],[8,10],[15,18]]], expectedReturn: [[1,6],[8,10],[15,18]], isHidden: false },
      { label: 'Example 2', args: [[[1,4],[4,5]]], expectedReturn: [[1,5]], isHidden: true }
    ],
    constraints: ['1 <= intervals.length <= 10^4'],
    hints: ['Sort by start time', 'If current start <= last merged end, extend'],
    verifiedSubmissions: 0
  },
  // ─── BACKEND: Sort Colors ────────────────────────────
  {
    title: 'Sort Colors (Dutch National Flag)',
    slug: 'sort-colors',
    description: 'Sort an array of 0s, 1s, 2s in-place in one pass. O(n) time, O(1) space.',
    difficulty: 'MEDIUM',
    category: 'ALGORITHMS',
    functionName: 'sortColors',
    returnType: 'number[]',
    parameters: [{ name: 'nums', type: 'number[]' }],
    starterCode: { javascript: `function sortColors(nums) {\n  // Three pointers: lo, mid, hi\n}`, python: `def sort_colors(nums):\n    pass`, java: `class Solution {\n    public void sortColors(int[] nums) {}\n}` },
    testCases: [
      { label: 'Example 1', args: [[2,0,2,1,1,0]], expectedReturn: [0,0,1,1,2,2], isHidden: false },
      { label: 'Hidden 1', args: [[2,0,1]], expectedReturn: [0,1,2], isHidden: true }
    ],
    constraints: ['nums[i] in {0,1,2}'],
    hints: ['lo tracks boundary for 0s, hi tracks boundary for 2s', 'Swap and advance pointers'],
    verifiedSubmissions: 0
  },
  {
    title: 'Power of Two',
    slug: 'power-of-two',
    description: 'Return true if n is a power of two. Use bit manipulation for O(1).',
    difficulty: 'EASY',
    category: 'ALGORITHMS',
    functionName: 'isPowerOfTwo',
    returnType: 'boolean',
    parameters: [{ name: 'n', type: 'number' }],
    starterCode: { javascript: `function isPowerOfTwo(n) {\n  // Bit trick: n & (n-1) === 0 for powers of 2\n}`, python: `def is_power_of_two(n):\n    pass`, java: `class Solution {\n    public boolean isPowerOfTwo(int n) {\n        return false;\n    }\n}` },
    testCases: [
      { label: 'Example 1', args: [1], expectedReturn: true, isHidden: false },
      { label: 'Example 2', args: [16], expectedReturn: true, isHidden: false },
      { label: 'Hidden 1', args: [3], expectedReturn: false, isHidden: true }
    ],
    constraints: ['-2^31 <= n <= 2^31 - 1'],
    hints: ['Power of 2 has exactly one bit set', 'n > 0 && (n & (n-1)) === 0'],
    verifiedSubmissions: 0
  },
  {
    title: 'Edit Distance',
    slug: 'edit-distance',
    description: 'Given two strings word1 and word2, return the minimum number of operations required to convert word1 to word2 (insert, delete, or replace a character).',
    difficulty: 'HARD',
    category: 'ALGORITHMS',
    functionName: 'minDistance',
    returnType: 'number',
    parameters: [{ name: 'word1', type: 'string' }, { name: 'word2', type: 'string' }],
    starterCode: { javascript: `function minDistance(word1, word2) {\n  // 2D Dynamic Programming: dp[i][j]\n}`, python: `def min_distance(word1, word2):\n    pass`, java: `class Solution {\n    public int minDistance(String word1, String word2) {\n        return 0;\n    }\n}` },
    testCases: [
      { label: 'Example 1', args: ['horse', 'ros'], expectedReturn: 3, isHidden: false },
      { label: 'Example 2', args: ['intention', 'execution'], expectedReturn: 5, isHidden: false },
      { label: 'Hidden 1', args: ['', 'a'], expectedReturn: 1, isHidden: true }
    ],
    constraints: ['0 <= word1.length, word2.length <= 500'],
    hints: ['If characters match, dp[i][j] = dp[i-1][j-1]', 'Otherwise 1 + min(insert, delete, replace)'],
    verifiedSubmissions: 0
  },
  {
    title: 'Minimum Window Substring',
    slug: 'minimum-window-substring',
    description: 'Given two strings s and t, return the minimum window substring of s such that every character in t (including duplicates) is included in the window.',
    difficulty: 'HARD',
    category: 'DSA',
    functionName: 'minWindow',
    returnType: 'string',
    parameters: [{ name: 's', type: 'string' }, { name: 't', type: 'string' }],
    starterCode: { javascript: `function minWindow(s, t) {\n  // Sliding window with two hash maps\n}`, python: `def min_window(s, t):\n    pass`, java: `class Solution {\n    public String minWindow(String s, String t) {\n        return "";\n    }\n}` },
    testCases: [
      { label: 'Example 1', args: ['ADOBECODEBANC', 'ABC'], expectedReturn: 'BANC', isHidden: false },
      { label: 'Example 2', args: ['a', 'a'], expectedReturn: 'a', isHidden: false },
      { label: 'Example 3', args: ['a', 'aa'], expectedReturn: '', isHidden: false }
    ],
    constraints: ['1 <= s.length, t.length <= 10^5'],
    hints: ['Expand right pointer until valid', 'Shrink left pointer while remaining valid'],
    verifiedSubmissions: 0
  }
];

export async function seedChallenges(mongoUri = 'mongodb://127.0.0.1:27017/proofhire') {
  await mongoose.connect(mongoUri);
  const existingCount = await CodingChallenge.countDocuments({ status: 'ACTIVE' });
  console.log(`Existing active challenges: ${existingCount}`);

  if (existingCount >= 30) {
    console.log('Sufficient challenges exist. Skipping seed.');
    await mongoose.disconnect();
    return existingCount;
  }

  await CodingChallenge.deleteMany({ status: 'ACTIVE' });
  const inserted = await CodingChallenge.insertMany(CHALLENGES);
  console.log(`Seeded ${inserted.length} challenges`);
  await mongoose.disconnect();
  return inserted.length;
}

if (require.main === module) {
  seedChallenges().catch(console.error);
}
