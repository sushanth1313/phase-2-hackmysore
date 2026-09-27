import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Challenge from '../models/Challenge';
import { PracticeQuestion } from '../models/PracticeQuestion';

dotenv.config();

const CHALLENGES = [
  {
    title: 'High-Throughput In-Memory Key-Value Store',
    description: 'Implement an in-memory key-value cache supporting LRU eviction, concurrent read-write locks, and atomic snapshot serialization under 50k QPS. Your implementation must handle concurrent readers with minimal write contention.',
    type: 'CODING',
    difficulty: 'HARD',
    domain: 'Systems & Concurrency',
    estimatedTime: '3-4 hrs',
    skillsTargeted: ['Concurrency', 'Data Structures', 'Memory Management'],
    evaluationCriteria: ['LRU correctness', 'Thread safety', 'Throughput under load', 'Memory bounds'],
    tags: ['Go / Rust / C++', 'Concurrency', 'LRU Cache'],
    status: 'PUBLISHED'
  },
  {
    title: 'Distributed Event Log & Message Broker',
    description: 'Build a simplified Kafka-like append-only commit log with consumer group offset tracking and partitioned replay guarantees. Support at-least-once delivery with configurable retention.',
    type: 'BACKEND_API',
    difficulty: 'EXPERT',
    domain: 'Distributed Systems',
    estimatedTime: '5-6 hrs',
    skillsTargeted: ['Distributed Systems', 'Kafka', 'Fault Tolerance'],
    evaluationCriteria: ['Partition correctness', 'Consumer group isolation', 'Replay accuracy', 'Failure recovery'],
    tags: ['Distributed Log', 'Partitioning', 'Fault Tolerance'],
    status: 'PUBLISHED'
  },
  {
    title: 'Token-Bucket Distributed Rate Limiter',
    description: 'Design and benchmark a distributed sliding-window token-bucket rate limiter with Redis synchronization and fallback local buffers. Support per-user and per-endpoint rate limiting.',
    type: 'BACKEND_API',
    difficulty: 'MEDIUM',
    domain: 'API & Infrastructure',
    estimatedTime: '2-3 hrs',
    skillsTargeted: ['Rate Limiting', 'Redis', 'Resilience Patterns'],
    evaluationCriteria: ['Accuracy under burst', 'Redis sync correctness', 'Fallback behavior', 'API design'],
    tags: ['Rate Limiting', 'Redis', 'Resilience'],
    status: 'PUBLISHED'
  },
  {
    title: 'REST API with JWT Auth, RBAC & Audit Logging',
    description: 'Implement a secure REST API featuring JWT-based authentication, role-based access control, request validation, and structured audit logging. Include refresh token rotation and token revocation.',
    type: 'BACKEND_API',
    difficulty: 'MEDIUM',
    domain: 'API & Security',
    estimatedTime: '2-3 hrs',
    skillsTargeted: ['JWT', 'Security', 'RBAC', 'REST'],
    evaluationCriteria: ['Token security', 'Role enforcement', 'Audit completeness', 'Input validation'],
    tags: ['Authentication', 'Security', 'REST API'],
    status: 'PUBLISHED'
  },
  {
    title: 'Database Query Optimizer — N+1 & Indexing',
    description: 'Given a poorly performing Node.js + PostgreSQL application with N+1 query patterns, fix the queries using proper JOINs, add appropriate indexes, and demonstrate the performance improvement with benchmarks.',
    type: 'DEBUGGING',
    difficulty: 'MEDIUM',
    domain: 'Database Engineering',
    estimatedTime: '1-2 hrs',
    skillsTargeted: ['PostgreSQL', 'Query Optimization', 'Indexing'],
    evaluationCriteria: ['N+1 elimination', 'Index design', 'Query plan analysis', 'Benchmark results'],
    tags: ['PostgreSQL', 'Performance', 'Indexing'],
    status: 'PUBLISHED'
  },
  {
    title: 'Design a URL Shortener at Scale',
    description: 'Design a URL shortening service handling 100M URLs and 10B redirects/month. Produce an architecture document covering storage, caching, CDN, collision handling, and analytics.',
    type: 'SYSTEM_DESIGN',
    difficulty: 'HARD',
    domain: 'System Architecture',
    estimatedTime: '3-4 hrs',
    skillsTargeted: ['System Design', 'Distributed Systems', 'Caching'],
    evaluationCriteria: ['Scalability reasoning', 'Storage calculations', 'Cache strategy', 'Tradeoff discussion'],
    tags: ['System Design', 'Distributed', 'Caching'],
    status: 'PUBLISHED'
  },
  {
    title: 'Real-Time Notification System Design',
    description: 'Design and partially implement a real-time notification system supporting WebSockets, SSE, and push notifications. Handle millions of concurrent connections with backpressure and reconnection.',
    type: 'FULL_STACK',
    difficulty: 'HARD',
    domain: 'Real-Time Systems',
    estimatedTime: '4-5 hrs',
    skillsTargeted: ['WebSockets', 'SSE', 'Real-time Systems'],
    evaluationCriteria: ['Connection management', 'Backpressure handling', 'Delivery guarantees', 'Scalability'],
    tags: ['WebSockets', 'Real-Time', 'Notification'],
    status: 'PUBLISHED'
  },
  {
    title: 'Fix a Race Condition in Payment Processing',
    description: 'A payment service has a race condition causing double charges under concurrent load. Identify the race condition, fix it using appropriate locking or optimistic concurrency, and write tests to prove the fix.',
    type: 'DEBUGGING',
    difficulty: 'EXPERT',
    domain: 'Concurrency & Correctness',
    estimatedTime: '3-4 hrs',
    skillsTargeted: ['Concurrency', 'Database Transactions', 'Testing'],
    evaluationCriteria: ['Race condition identified', 'Fix correctness', 'Test coverage', 'Performance impact'],
    tags: ['Race Condition', 'Concurrency', 'Testing'],
    status: 'PUBLISHED'
  }
];

const PRACTICE_QUESTIONS = [
  {
    title: 'Implement a Trie Data Structure',
    description: 'Design and implement a Trie data structure that supports insert, search, and startsWith operations. Your implementation should be efficient in both time and space.',
    difficulty: 'MEDIUM',
    category: 'DSA',
    skills: ['Data Structures', 'String Algorithms'],
    constraints: ['All inputs consist of lowercase English letters', 'At most 30,000 calls to insert, search, and startsWith'],
    examples: [
      { input: 'insert("apple"), search("apple")', output: 'true', explanation: 'apple was inserted' },
      { input: 'search("app")', output: 'false', explanation: 'app was not inserted' }
    ],
    starterCode: {
      javascript: `class TrieNode {\n  // your code here\n}\n\nclass Trie {\n  constructor() {\n    // your code here\n  }\n  insert(word) {\n    // your code here\n  }\n  search(word) {\n    // your code here\n  }\n  startsWith(prefix) {\n    // your code here\n  }\n}`,
      python: `class TrieNode:\n    # your code here\n    pass\n\nclass Trie:\n    def __init__(self):\n        # your code here\n        pass\n    def insert(self, word: str) -> None:\n        pass\n    def search(self, word: str) -> bool:\n        pass\n    def startsWith(self, prefix: str) -> bool:\n        pass`
    },
    status: 'ACTIVE'
  },
  {
    title: 'Debug a Failing Express Middleware',
    description: 'The following Express middleware chain is not correctly passing errors to the error handler. Identify the bug and fix it. The middleware should capture all errors from async route handlers.',
    difficulty: 'MEDIUM',
    category: 'DEBUGGING',
    skills: ['Node.js', 'Express', 'Async/Await', 'Error Handling'],
    constraints: ['Do not change the route handler signature', 'Must support both sync and async errors'],
    examples: [
      { input: 'GET /users throws an async error', output: 'Error handler receives the error', explanation: 'asyncWrapper should catch promise rejections' }
    ],
    starterCode: {
      javascript: `// Bug: async errors not being caught\nconst asyncWrapper = (fn) => {\n  return (req, res, next) => {\n    fn(req, res, next);\n  };\n};\n\napp.get('/users', asyncWrapper(async (req, res) => {\n  const users = await User.findAll(); // may throw\n  res.json(users);\n}));\n\n// Error handler never receives async errors\napp.use((err, req, res, next) => {\n  res.status(500).json({ error: err.message });\n});`
    },
    status: 'ACTIVE'
  },
  {
    title: 'Design a Caching Layer for a REST API',
    description: 'Add an efficient Redis caching layer to a REST API endpoint that fetches user data from a database. Implement cache invalidation on updates and handle cache stampede prevention.',
    difficulty: 'HARD',
    category: 'BACKEND',
    skills: ['Redis', 'Caching', 'Node.js', 'Cache Invalidation'],
    constraints: ['TTL should be 5 minutes for user data', 'Use cache-aside pattern', 'Prevent thundering herd on cache miss'],
    examples: [
      { input: 'GET /users/123 (first call)', output: 'Fetches from DB, caches result', explanation: 'Cache miss path' },
      { input: 'GET /users/123 (second call)', output: 'Returns cached data, no DB query', explanation: 'Cache hit path' }
    ],
    starterCode: {
      javascript: `const redis = require('redis');\nconst client = redis.createClient();\n\n// Implement caching middleware\nasync function getCachedUser(req, res, next) {\n  // your code here\n}\n\n// Implement cache invalidation\nasync function invalidateUserCache(userId) {\n  // your code here\n}\n\napp.get('/users/:id', getCachedUser, async (req, res) => {\n  const user = await User.findById(req.params.id);\n  res.json(user);\n});`
    },
    status: 'ACTIVE'
  },
  {
    title: 'Fix N+1 Query in a GraphQL Resolver',
    description: 'A GraphQL API is making N+1 database queries when fetching posts with their authors. Implement DataLoader to batch and cache the author queries.',
    difficulty: 'HARD',
    category: 'BACKEND',
    skills: ['GraphQL', 'DataLoader', 'Database Optimization'],
    constraints: ['Must use DataLoader pattern', 'Batch queries must be deduplicated', 'Cache must be request-scoped'],
    examples: [
      { input: 'Query 10 posts with authors', output: '2 DB queries (posts + batched authors)', explanation: 'DataLoader batches all author lookups' }
    ],
    status: 'ACTIVE'
  },
  {
    title: 'Implement Pagination with Cursor-Based Navigation',
    description: 'Implement efficient cursor-based pagination for a large dataset API endpoint. The cursor should encode position without exposing raw IDs, and support both forward and backward navigation.',
    difficulty: 'MEDIUM',
    category: 'BACKEND',
    skills: ['API Design', 'Pagination', 'Database'],
    constraints: ['Cursor must be opaque to clients', 'Support page size 1-100', 'Must be stable under data insertion'],
    status: 'ACTIVE'
  },
  {
    title: 'Design a Database Schema for a Multi-Tenant SaaS',
    description: 'Design a PostgreSQL schema for a multi-tenant SaaS application. Choose between shared-schema, separate-schema, and separate-database approaches. Justify your choice and implement row-level security.',
    difficulty: 'HARD',
    category: 'DATABASE',
    skills: ['PostgreSQL', 'Multi-tenancy', 'Schema Design', 'Row-Level Security'],
    status: 'ACTIVE'
  },
  {
    title: 'Implement JWT Authentication Middleware',
    description: 'Build a complete JWT authentication middleware for Express that handles token verification, refresh token rotation, and token blacklisting on logout.',
    difficulty: 'MEDIUM',
    category: 'BACKEND',
    skills: ['JWT', 'Authentication', 'Security', 'Node.js'],
    status: 'ACTIVE'
  },
  {
    title: 'Design a Real-World Notification System',
    description: 'Design and implement the data model and delivery logic for a notification system that supports email, in-app, and push notifications with user preferences, delivery tracking, and retry logic.',
    difficulty: 'HARD',
    category: 'SYSTEM_DESIGN',
    skills: ['System Design', 'Message Queues', 'Database Design'],
    status: 'ACTIVE'
  }
];

async function seed() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/proofhire';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Seed Challenges (only if none exist)
    const existingChallenges = await Challenge.countDocuments();
    if (existingChallenges === 0) {
      await Challenge.insertMany(CHALLENGES);
      console.log(`✅ Seeded ${CHALLENGES.length} challenges`);
    } else {
      console.log(`ℹ️  ${existingChallenges} challenges already exist, skipping`);
    }

    // Seed Practice Questions (only if none exist)
    const existingQuestions = await PracticeQuestion.countDocuments();
    if (existingQuestions === 0) {
      await PracticeQuestion.insertMany(PRACTICE_QUESTIONS);
      console.log(`✅ Seeded ${PRACTICE_QUESTIONS.length} practice questions`);
    } else {
      console.log(`ℹ️  ${existingQuestions} practice questions already exist, skipping`);
    }

    console.log('✅ Seed complete');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
