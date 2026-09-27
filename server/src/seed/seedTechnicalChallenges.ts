/**
 * seedTechnicalChallenges.ts — ProofHire Technical Challenge Seed Script
 *
 * Upserts 20 production-grade TECHNICAL challenges into MongoDB:
 * - 5 EASY
 * - 5 MEDIUM
 * - 5 HARD
 * - 5 EXPERT
 *
 * Uses unique slugs for idempotent upserting (no duplicates on repeated runs).
 * Marks legacy/non-conforming challenges as ARCHIVED so the Technical Portal
 * presents exactly the 20 canonical benchmarks.
 */
import mongoose from 'mongoose';
import Challenge from '../models/Challenge';

const future = (daysFromNow: number) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d;
};

export const TWENTY_TECHNICAL_CHALLENGES = [
  // ───────────────────────────────────────────────────────────────────────────
  // EASY CHALLENGES (5)
  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: 'two-sum-api',
    title: 'Two Sum API',
    description: `
Build a high-performance REST API that solves the classic Two Sum problem over dynamic streaming datasets.
The API must accept an array of integers and a target sum, returning the pair of 0-based indices whose values sum to the target.
Handle edge cases including negative numbers, duplicate values, large numbers exceeding 32-bit limits, and payloads containing up to 1,000,000 integers with sub-50ms latency.
Include OpenAPI/Swagger documentation, comprehensive unit tests, and input validation schemas.
    `.trim(),
    track: 'TECHNICAL',
    difficulty: 'EASY',
    category: 'Algorithms & Data Structures',
    domain: 'Algorithms',
    type: 'BACKEND_API',
    company: 'Stripe Core Systems',
    duration: '2-3 hours',
    estimatedTime: '2-3 hours',
    deadline: future(90),
    skills: ['Data Structures', 'REST APIs', 'Node.js', 'Input Validation', 'Unit Testing'],
    skillsTargeted: ['Hash Maps', 'Time Complexity O(n)', 'Express.js', 'Jest', 'OpenAPI'],
    technologies: ['Node.js', 'Express', 'TypeScript', 'Jest'],
    tags: ['algorithms', 'two-sum', 'rest-api', 'typescript', 'easy'],
    requirements: [
      'Implement POST /api/v1/two-sum with body { numbers: number[], target: number }',
      'Return 200 with { indices: [i, j] } in O(n) time complexity and O(n) space complexity',
      'Return 404 with error message if no matching pair exists',
      'Validate input schema with descriptive 400 Bad Request error messages',
      'Achieve 100% unit test coverage using Jest or Mocha'
    ],
    deliverables: [
      'GitHub repository with complete TypeScript source code',
      'Postman/Insomnia collection or curl examples in README',
      'Unit tests with coverage report'
    ],
    evaluationCriteria: [
      'O(n) time complexity verification using hash map lookup',
      'Graceful error handling for empty arrays and null inputs',
      'Clean idiomatic TypeScript and code structure'
    ],
    starterConstraints: 'Must use Node.js or Go. No third-party two-sum solver packages.',
    status: 'OPEN'
  },
  {
    slug: 'string-frequency-analyzer',
    title: 'String Frequency Analyzer',
    description: `
Design and implement a microservice that computes character, word, and n-gram frequency distributions from submitted text payloads.
The service must support Unicode character sets, handle multi-language tokens, ignore punctuation and stop words via configurable query parameters, and return top-K frequent elements efficiently using a Min-Heap or Frequency Map.
    `.trim(),
    track: 'TECHNICAL',
    difficulty: 'EASY',
    category: 'Text Processing',
    domain: 'Text Processing',
    type: 'BACKEND_API',
    company: 'Grammarly Core Engine',
    duration: '2-3 hours',
    estimatedTime: '2-3 hours',
    deadline: future(90),
    skills: ['String Algorithms', 'Min-Heap', 'Unicode Parsing', 'REST API', 'TypeScript'],
    skillsTargeted: ['Frequency Counting', 'Min-Heap Top-K', 'RegEx Tokenization', 'Clean Architecture'],
    technologies: ['Node.js', 'TypeScript', 'Express', 'Vitest'],
    tags: ['text-processing', 'frequency', 'min-heap', 'unicode', 'easy'],
    requirements: [
      'Implement POST /api/v1/analyze with body { text: string, topK?: number, ignoreCase?: boolean }',
      'Support character and word frequency breakdowns with relative percentages',
      'Filter out common English stop words when ?filterStopWords=true query param is passed',
      'Handle payload strings up to 5MB without memory leaks or event-loop blockage',
      'Include benchmark script proving execution time < 100ms for 100k words'
    ],
    deliverables: [
      'Source code in GitHub repository with modular tokenizers',
      'Unit test suite covering Unicode emojis, multilingual strings, and edge cases',
      'Benchmark results documented in README.md'
    ],
    evaluationCriteria: [
      'Correct Unicode tokenization (grapheme clusters)',
      'O(N log K) time complexity for Top-K retrieval',
      'Resilience against memory exhaustion on large inputs'
    ],
    starterConstraints: 'Must handle UTF-8 and multibyte characters correctly.',
    status: 'OPEN'
  },
  {
    slug: 'array-rotation-utility',
    title: 'Array Rotation Utility',
    description: `
Create a high-throughput array manipulation utility and API that performs left and right cyclical array rotations.
Support both in-place O(1) auxiliary space rotation algorithms (Block Swap / Reversal algorithm) and concurrent API calls.
The endpoint must support streaming large integer arrays up to 10 million elements, handling rotations where k > n via modulo arithmetic.
    `.trim(),
    track: 'TECHNICAL',
    difficulty: 'EASY',
    category: 'Algorithms & Data Structures',
    domain: 'Algorithms',
    type: 'CODING',
    company: 'Bloomberg Engineering',
    duration: '2-3 hours',
    estimatedTime: '2-3 hours',
    deadline: future(90),
    skills: ['Array Algorithms', 'In-Place Algorithms', 'C++', 'Node.js', 'Memory Management'],
    skillsTargeted: ['Cyclic Reversal', 'Modulo Arithmetic', 'Sub-millisecond Latency'],
    technologies: ['TypeScript', 'C++', 'Node.js', 'Jest'],
    tags: ['array', 'rotation', 'in-place', 'modulo', 'easy'],
    requirements: [
      'Implement in-place reversal algorithm with O(1) auxiliary memory',
      'Correctly handle negative k values (reverse direction)',
      'Support REST endpoint POST /api/v1/rotate with { array: number[], k: number, direction: "left" | "right" }',
      'Include performance benchmarks comparing standard slice/concat vs in-place reversal',
      'Provide comprehensive edge cases: empty array, single element, k = 0, k = length * 10'
    ],
    deliverables: [
      'GitHub repository with clear algorithm documentation',
      'Automated test suite with property-based testing (e.g. fast-check)',
      'README explaining mathematical proof of the reversal algorithm'
    ],
    evaluationCriteria: [
      'Memory efficiency verification: O(1) extra space in the core function',
      'Proper boundary checks and handling of very large rotation factors',
      'Code clarity and test coverage'
    ],
    starterConstraints: 'Must implement custom rotation algorithm; do not use external array libraries.',
    status: 'OPEN'
  },
  {
    slug: 'palindrome-service',
    title: 'Palindrome Service',
    description: `
Build a multi-criteria palindrome verification and longest palindromic substring service.
The service must support alphanumeric sanitization, case-insensitive evaluation, and return the longest palindromic substring using an O(n) Manacher's Algorithm or O(n^2) Expand Around Center approach.
Expose clear endpoints for single verification, batch processing, and sentence-level palindrome detection.
    `.trim(),
    track: 'TECHNICAL',
    difficulty: 'EASY',
    category: 'Algorithms & Data Structures',
    domain: 'Text Processing',
    type: 'BACKEND_API',
    company: 'Duolingo Tech',
    duration: '2-3 hours',
    estimatedTime: '2-3 hours',
    deadline: future(90),
    skills: ['Two Pointers', 'Dynamic Programming', 'String Manipulation', 'REST API'],
    skillsTargeted: ['Two-Pointer Verification', 'Longest Palindrome', 'RESTful Design'],
    technologies: ['Node.js', 'Express', 'TypeScript', 'Supertest'],
    tags: ['palindrome', 'strings', 'two-pointers', 'easy'],
    requirements: [
      'POST /api/v1/palindrome/check: returns { isPalindrome: boolean, sanitized: string, length: number }',
      'POST /api/v1/palindrome/longest: returns the longest palindromic substring and its span indices',
      'POST /api/v1/palindrome/batch: processes up to 1,000 strings concurrently in < 200ms',
      'Filter out non-alphanumeric characters while preserving UTF-8 integrity',
      'Automated tests covering symmetrical palindromes, single chars, and edge strings'
    ],
    deliverables: [
      'Full TypeScript codebase with Express router',
      'Test suite with 95%+ line coverage',
      'Swagger / OpenAPI spec definition'
    ],
    evaluationCriteria: [
      'Algorithm efficiency and correctness on asymmetric edge cases',
      'Clean separation between validation, algorithm core, and HTTP controller',
      'Proper HTTP status codes and error responses'
    ],
    starterConstraints: 'Must implement two-pointer check and longest palindromic substring search from scratch.',
    status: 'OPEN'
  },
  {
    slug: 'basic-rest-crud-api',
    title: 'Basic REST CRUD API',
    description: `
Create a production-ready RESTful CRUD API for an Asset & Inventory Tracking system.
Implement full resource lifecycle (Create, Read, Update, Delete) with MongoDB persistence, schema validation, pagination, field projection, and status filtering.
Follow REST best practices: correct HTTP status codes (200, 201, 204, 400, 404, 409), idempotent PUT operations, and atomic PATCH updates.
    `.trim(),
    track: 'TECHNICAL',
    difficulty: 'EASY',
    category: 'Backend Engineering',
    domain: 'Backend Systems',
    type: 'BACKEND_API',
    company: 'Atlassian Infrastructure',
    duration: '3-4 hours',
    estimatedTime: '3-4 hours',
    deadline: future(90),
    skills: ['Node.js', 'Express', 'MongoDB', 'Mongoose', 'REST API Best Practices'],
    skillsTargeted: ['Mongoose Schemas', 'CRUD Operations', 'Pagination & Filtering', 'Input Validation'],
    technologies: ['Node.js', 'Express', 'MongoDB', 'Mongoose', 'Joi / Zod'],
    tags: ['crud', 'rest-api', 'mongodb', 'mongoose', 'easy'],
    requirements: [
      'Implement endpoints: GET, POST, GET /:id, PUT /:id, PATCH /:id, DELETE /:id',
      'Support pagination via ?page=1&limit=20 and sorting via ?sort=-createdAt',
      'Enforce unique asset tracking codes with Mongoose indexes and 409 Conflict handling',
      'Validate payloads with Zod or Joi, returning structured validation error arrays',
      'Seed script to populate 50 sample inventory items'
    ],
    deliverables: [
      'GitHub repository with complete backend code and seed script',
      'Docker Compose file spinning up MongoDB and the API',
      'Postman collection or Thunder Client environment file'
    ],
    evaluationCriteria: [
      'Adherence to canonical RESTful status codes and verbs',
      'Robust schema validation and error responses',
      'Clean directory architecture (controllers, services, models, routes)'
    ],
    starterConstraints: 'Must use MongoDB / Mongoose with Node.js or Express.',
    status: 'OPEN'
  },
  // ───────────────────────────────────────────────────────────────────────────
  // MEDIUM CHALLENGES (5)
  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: 'lru-cache-service',
    title: 'LRU Cache Service',
    description: `
Implement a thread-safe, distributed-ready Least Recently Used (LRU) Cache service with O(1) time complexity for both get and put operations.
Combine a doubly linked list with a hash map to maintain eviction order without scanning.
Expose the cache over an HTTP and WebSocket interface supporting TTL-based expiration, cache stats (hits, misses, evictions), and configurable capacity.
    `.trim(),
    track: 'TECHNICAL',
    difficulty: 'MEDIUM',
    category: 'Systems & Data Structures',
    domain: 'Distributed Systems',
    type: 'BACKEND_API',
    company: 'Datadog Core Systems',
    duration: '4-6 hours',
    estimatedTime: '4-6 hours',
    deadline: future(90),
    skills: ['Data Structures', 'Doubly Linked List', 'Hash Map', 'TTL Eviction', 'Concurrency'],
    skillsTargeted: ['O(1) LRU Operations', 'TTL Background Sweeper', 'Cache Telemetry'],
    technologies: ['TypeScript', 'Node.js', 'Express', 'Jest'],
    tags: ['lru-cache', 'data-structures', 'caching', 'medium'],
    requirements: [
      'Implement custom DoublyLinkedList and HashMap data structure (do not use third-party LRU library)',
      'O(1) time complexity for get(key) and put(key, value, ttl?)',
      'Support optional Time-To-Live (TTL) with automatic lazy or eager eviction',
      'Endpoints: GET /cache/:key, POST /cache, DELETE /cache/:key, GET /cache/stats',
      'Concurrency protection ensuring state consistency under 500 concurrent requests'
    ],
    deliverables: [
      'GitHub repository with custom LRU data structure and HTTP server',
      'Benchmark report demonstrating O(1) performance up to 100,000 keys',
      'Full test suite verifying eviction order, TTL expiration, and edge conditions'
    ],
    evaluationCriteria: [
      'Strict adherence to O(1) get and put time complexity',
      'Memory management and prevention of memory leaks during high churn',
      'Accuracy of cache metrics (hit ratio, miss count, eviction count)'
    ],
    starterConstraints: 'No external LRU packages permitted. Must implement the underlying data structures.',
    status: 'OPEN'
  },
  {
    slug: 'rate-limiter-service',
    title: 'Rate Limiter Service',
    description: `
Design and implement a robust, multi-strategy API Rate Limiter middleware and standalone service.
Support the Token Bucket, Sliding Window Counter, and Leaky Bucket algorithms.
Store rate limit states in Redis with atomic operations (Lua scripts or MULTI/EXEC) to prevent race conditions in distributed deployments.
Include headers: X-RateLimit-Limit, X-RateLimit-Remaining, and Retry-After on 429 Too Many Requests responses.
    `.trim(),
    track: 'TECHNICAL',
    difficulty: 'MEDIUM',
    category: 'Infrastructure & Security',
    domain: 'Backend Infrastructure',
    type: 'BACKEND_API',
    company: 'Cloudflare Edge Systems',
    duration: '4-6 hours',
    estimatedTime: '4-6 hours',
    deadline: future(90),
    skills: ['Redis', 'Rate Limiting', 'Lua Scripting', 'Concurrency', 'HTTP Headers'],
    skillsTargeted: ['Sliding Window Counter', 'Token Bucket', 'Redis Atomic Scripts', 'HTTP 429'],
    technologies: ['Node.js', 'Redis', 'TypeScript', 'Docker'],
    tags: ['rate-limiter', 'redis', 'lua', 'security', 'medium'],
    requirements: [
      'Implement Sliding Window Log and Token Bucket rate limiting strategies',
      'Atomic Redis transactions via Redis Lua scripting to avoid race conditions',
      'Configurable rules per IP, API key, or authenticated user tier',
      'Accurate HTTP headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset',
      'Return 429 with Retry-After header in seconds when quota is exhausted'
    ],
    deliverables: [
      'GitHub repository with rate limiting middleware and runnable demo server',
      'Docker Compose setup running API and Redis instance',
      'Load test script (k6 or autocannon) demonstrating rate limiting behavior under burst traffic'
    ],
    evaluationCriteria: [
      'Zero race condition errors under parallel requests from the same client',
      'Accurate window slide calculations without boundary spikes',
      'Minimal latency overhead (< 5ms per check)'
    ],
    starterConstraints: 'Must use Redis for state storage. Pure in-memory maps not accepted.',
    status: 'OPEN'
  },
  {
    slug: 'authentication-api',
    title: 'Authentication API with RBAC & 2FA',
    description: `
Build a secure, enterprise-grade Authentication and Authorization service.
Implement JWT access tokens with short TTLs and cryptographically secure refresh token rotation stored in MongoDB/Redis.
Add Role-Based Access Control (RBAC) with hierarchical permissions, password hashing with Argon2 or bcrypt (work factor >= 12), account lockout after failed attempts, and TOTP-based Two-Factor Authentication (2FA).
    `.trim(),
    track: 'TECHNICAL',
    difficulty: 'MEDIUM',
    category: 'Security & Auth',
    domain: 'Security Engineering',
    type: 'BACKEND_API',
    company: 'Okta Identity Cloud',
    duration: '5-7 hours',
    estimatedTime: '5-7 hours',
    deadline: future(90),
    skills: ['Security', 'JWT', 'RBAC', 'Argon2/Bcrypt', 'TOTP 2FA', 'Refresh Tokens'],
    skillsTargeted: ['Token Rotation', 'Hierarchical Permissions', 'Brute Force Protection', 'OWASP Standards'],
    technologies: ['Node.js', 'TypeScript', 'MongoDB', 'Redis', 'speakeasy'],
    tags: ['auth', 'jwt', 'rbac', 'security', '2fa', 'medium'],
    requirements: [
      'Endpoints: /auth/register, /auth/login, /auth/refresh, /auth/logout, /auth/2fa/setup, /auth/2fa/verify',
      'Cryptographic refresh token rotation: old refresh tokens are invalidated upon reuse',
      'Role-based middleware: requireRole("ADMIN"), requirePermission("documents:write")',
      'Account lockout after 5 consecutive failed login attempts for 15 minutes',
      'Secure cookie storage option (httpOnly, secure, sameSite=strict)'
    ],
    deliverables: [
      'GitHub repository with complete authentication microservice',
      'Postman collection testing full auth lifecycle, token refresh, and RBAC guards',
      'Security audit checklist in README addressing OWASP Top 10 vulnerabilities'
    ],
    evaluationCriteria: [
      'Immunity to refresh token reuse and token hijacking vulnerabilities',
      'Proper secret management and constant-time string comparisons for tokens',
      'Comprehensive error masking (do not leak whether email or password was wrong)'
    ],
    starterConstraints: 'Must adhere strictly to OWASP Auth guidelines.',
    status: 'OPEN'
  },
  {
    slug: 'url-shortener-service',
    title: 'URL Shortener Service',
    description: `
Design and implement a scalable URL Shortening service capable of handling millions of redirects with low latency.
Generate short keys using Base62 encoding over a distributed unique ID generator (Snowflake or auto-incrementing sequence).
Support custom aliases, expiration timestamps, analytics collection (click count, referrer, geo-location, browser headers), and Redis caching for hot redirects.
    `.trim(),
    track: 'TECHNICAL',
    difficulty: 'MEDIUM',
    category: 'System Design & APIs',
    domain: 'Backend Systems',
    type: 'BACKEND_API',
    company: 'Bitly Core Systems',
    duration: '4-6 hours',
    estimatedTime: '4-6 hours',
    deadline: future(90),
    skills: ['System Design', 'Base62 Encoding', 'Redis Caching', 'Analytics', 'MongoDB'],
    skillsTargeted: ['Distributed ID Generation', 'HTTP 301 vs 302', 'Cache Invalidation', 'Click Telemetry'],
    technologies: ['Node.js', 'Express', 'MongoDB', 'Redis', 'Docker'],
    tags: ['url-shortener', 'base62', 'system-design', 'redis', 'medium'],
    requirements: [
      'Implement Base62 encoding utility converting 64-bit integer IDs into 7-character alphanumeric slugs',
      'POST /api/v1/shorten: accepts URL, optional custom alias, and TTL',
      'GET /:slug: redirects with HTTP 302 Found and records click analytics asynchronously',
      'GET /api/v1/analytics/:slug: returns click counts, hourly breakdowns, and top referrers',
      'Cache active short URL mappings in Redis with sub-10ms redirect latency'
    ],
    deliverables: [
      'GitHub repository with clean microservice code and Redis cache integration',
      'Docker Compose file running Node.js, MongoDB, and Redis',
      'README detailing scaling strategies for 10,000 writes/sec and 100,000 reads/sec'
    ],
    evaluationCriteria: [
      'Zero collision guarantee in Base62 generation logic',
      'Proper asynchronous handling of analytics writes so redirects are never blocked',
      'Correct HTTP redirect status code selection and cache headers'
    ],
    starterConstraints: 'Must implement custom Base62 encoder. No third-party nanoid or shortid libraries.',
    status: 'OPEN'
  },
  {
    slug: 'job-queue-system',
    title: 'Job Queue & Background Worker System',
    description: `
Build an asynchronous background job processing engine with priority queues, retries with exponential backoff, dead-letter queues (DLQ), and delayed job execution.
Support multiple worker threads or processes consuming from Redis or MongoDB with atomic lock acquisitions to guarantee at-most-once or at-least-once delivery semantics.
Provide an HTTP API for job dispatch and a monitoring dashboard endpoint.
    `.trim(),
    track: 'TECHNICAL',
    difficulty: 'MEDIUM',
    category: 'Distributed Systems',
    domain: 'Asynchronous Architecture',
    type: 'BACKEND_API',
    company: 'Shopify Core Platform',
    duration: '5-7 hours',
    estimatedTime: '5-7 hours',
    deadline: future(90),
    skills: ['Job Queues', 'Redis Streams/PubSub', 'Exponential Backoff', 'Concurrency', 'Workers'],
    skillsTargeted: ['Worker Concurrency', 'Dead Letter Queue', 'Distributed Locking', 'Idempotency'],
    technologies: ['Node.js', 'TypeScript', 'Redis', 'Docker'],
    tags: ['queue', 'background-worker', 'redis', 'concurrency', 'medium'],
    requirements: [
      'Producer API: POST /api/v1/jobs to enqueue tasks with priority (HIGH, MEDIUM, LOW) and delay',
      'Worker engine: continuously polls and executes jobs with configurable concurrency limits',
      'Retry mechanism: configurable retry count (default 3) with exponential backoff and jitter',
      'Dead Letter Queue: permanently failing jobs are moved to DLQ with stack trace and payload',
      'Provide GET /api/v1/jobs/stats showing active, waiting, completed, and failed counts'
    ],
    deliverables: [
      'GitHub repository with Producer service, Worker service, and shared queue library',
      'Simulation script spawning 500 heterogeneous jobs and verifying correct processing order',
      'Architecture design document explaining failure recovery and heartbeat monitoring'
    ],
    evaluationCriteria: [
      'Strict priority enforcement (HIGH priority jobs processed before LOW)',
      'Worker crash resiliency: jobs being processed by a killed worker are safely reclaimed',
      'Clean separation between queue storage, worker orchestration, and client API'
    ],
    starterConstraints: 'Do not use BullMQ or Celery. Implement the core queue protocol on top of Redis or MongoDB.',
    status: 'OPEN'
  },
  // ───────────────────────────────────────────────────────────────────────────
  // HARD CHALLENGES (5)
  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: 'distributed-task-scheduler',
    title: 'Distributed Task Scheduler',
    description: `
Architect and build a distributed cron and task scheduling platform that orchestrates millions of recurring and one-off tasks across a cluster of worker nodes.
Implement leader election using distributed consensus or Redis locks, prevent duplicate job execution via distributed fencing tokens, partition tasks evenly across workers, and handle dynamic worker node join and leave events without task drops.
    `.trim(),
    track: 'TECHNICAL',
    difficulty: 'HARD',
    category: 'Distributed Systems',
    domain: 'Infrastructure & Scheduling',
    type: 'SYSTEM_DESIGN',
    company: 'Uber Infrastructure Core',
    duration: '8-12 hours',
    estimatedTime: '8-12 hours',
    deadline: future(90),
    skills: ['Distributed Systems', 'Leader Election', 'Consensus', 'Cron Parsing', 'Fault Tolerance'],
    skillsTargeted: ['Distributed Locking with Fencing', 'Node Heartbeating', 'Task Partitioning', 'High Availability'],
    technologies: ['Go or Node.js/TypeScript', 'Redis / Zookeeper', 'Docker Compose'],
    tags: ['scheduler', 'distributed', 'leader-election', 'cron', 'hard'],
    requirements: [
      'Implement Distributed Leader Election with lease renewals (e.g. 5s TTL heartbeat)',
      'Parse standard 5-part cron expressions (minute, hour, dom, month, dow)',
      'Ensure exactly-once trigger semantics across a multi-node cluster using fencing tokens',
      'Automatic failover: when the active leader fails, a standby node acquires leadership within 3 seconds',
      'REST API for registering, pausing, resuming, and querying execution logs of scheduled tasks'
    ],
    deliverables: [
      'GitHub repository with complete clustering code and Docker Compose cluster setup (3 scheduler nodes)',
      'Chaos test script killing the leader node and asserting that no tasks are missed or duplicated',
      'Architecture specification diagram and failover timeline document'
    ],
    evaluationCriteria: [
      'Zero double-execution during network partition or leader crash simulation',
      'Accuracy of cron trigger timing within 500ms jitter window',
      'Robustness of distributed lock renewal and fencing mechanism'
    ],
    starterConstraints: 'Must demonstrate running cluster of at least 3 nodes with leader failover.',
    status: 'OPEN'
  },
  {
    slug: 'scalable-notification-service',
    title: 'Scalable Notification Service',
    description: `
Build a multi-channel notification platform (Email, SMS, Webhook, Push) capable of dispatching 100,000 notifications per minute with fan-out capabilities, template rendering, and rate-limiting per recipient.
Incorporate channel-specific provider failover (e.g., if Primary Email Provider fails, automatically route to Secondary), delivery status webhooks, user notification preference matrices, and deduplication buffers.
    `.trim(),
    track: 'TECHNICAL',
    difficulty: 'HARD',
    category: 'Backend & Messaging',
    domain: 'Messaging Platforms',
    type: 'BACKEND_API',
    company: 'Twilio Platform Engineering',
    duration: '8-10 hours',
    estimatedTime: '8-10 hours',
    deadline: future(90),
    skills: ['Message Brokers', 'Fan-out Architecture', 'Provider Failover', 'Idempotency', 'Kafka/RabbitMQ'],
    skillsTargeted: ['Message Fan-out', 'Idempotent Delivery', 'Circuit Breaker', 'Template Engine'],
    technologies: ['Node.js/TypeScript', 'RabbitMQ / Kafka', 'Redis', 'MongoDB', 'Docker'],
    tags: ['notifications', 'messaging', 'fan-out', 'rabbitmq', 'hard'],
    requirements: [
      'Support multichannel dispatch: Email, SMS, Push, and Webhooks',
      'User preference engine respecting quiet hours, opt-outs, and channel prioritization',
      'Circuit breaker pattern for third-party upstream providers with automatic fallback',
      'Deduplication engine discarding identical notification requests within a sliding 5-minute window',
      'Real-time delivery status tracking with webhook callbacks and event history log'
    ],
    deliverables: [
      'GitHub repository with Dispatcher service, Channel Adapters, and Event Consumer',
      'Docker Compose environment with RabbitMQ/Redis/MongoDB dependencies',
      'Stress test script verifying 1,000 msg/sec throughput with simulated provider latency'
    ],
    evaluationCriteria: [
      'Correct implementation of circuit breaker and fallback provider switching',
      'Deduplication accuracy under concurrent bursts',
      'Clean hexagonal architecture decoupling business rules from external notification SDKs'
    ],
    starterConstraints: 'Must include circuit breaker pattern and simulated provider failover.',
    status: 'OPEN'
  },
  {
    slug: 'realtime-collaboration-backend',
    title: 'Real-Time Collaboration Backend',
    description: `
Build a real-time collaborative document editing backend using Conflict-Free Replicated Data Types (CRDTs) or Operational Transformation (OT).
Support concurrent edits from multiple connected clients via WebSockets, maintaining causal consistency, intention preservation, and eventual convergence.
Include presence awareness (live cursor positions, active selection ranges), undo/redo history, and snapshot persistence to MongoDB or PostgreSQL.
    `.trim(),
    track: 'TECHNICAL',
    difficulty: 'HARD',
    category: 'Real-Time Systems',
    domain: 'Real-Time Collaboration',
    type: 'BACKEND_API',
    company: 'Figma Real-Time Core',
    duration: '8-12 hours',
    estimatedTime: '8-12 hours',
    deadline: future(90),
    skills: ['WebSockets', 'CRDT / OT', 'Concurrency', 'Eventual Consistency', 'Vector Clocks'],
    skillsTargeted: ['Logoot/Yjs/Automerge CRDT Concepts', 'WebSocket Multiplexing', 'Presence Protocol'],
    technologies: ['Node.js', 'TypeScript', 'WebSockets (ws)', 'Redis PubSub', 'MongoDB'],
    tags: ['real-time', 'crdt', 'operational-transformation', 'websockets', 'hard'],
    requirements: [
      'WebSocket server supporting multiple collaborative document rooms',
      'Conflict resolution mechanism (CRDT or Operational Transformation) ensuring convergence',
      'Presence system broadcasting client cursor coordinates, user names, and selections with throttle',
      'Periodic snapshotting to database with replayable transaction changelog',
      'Automatic reconnection and state synchronization for clients recovering from disconnections'
    ],
    deliverables: [
      'GitHub repository with collaborative WebSocket server and browser-based demo client',
      'Automated test suite simulating 10 concurrent clients submitting out-of-order edits',
      'Technical writeup explaining the chosen convergence mathematical model'
    ],
    evaluationCriteria: [
      '100% document convergence across all clients after concurrent chaotic keystrokes',
      'Graceful disconnection handling and presence cleanup without ghost cursors',
      'Latency and bandwidth efficiency of incremental delta messages'
    ],
    starterConstraints: 'Must verify document convergence under simulated network latency and packet reordering.',
    status: 'OPEN'
  },
  {
    slug: 'search-engine-api',
    title: 'Search Engine API with Inverted Index',
    description: `
Construct a full-text search engine API from scratch without using Elasticsearch or Lucene.
Implement an Inverted Index data structure supporting stemming (Porter Stemmer), stop-word removal, TF-IDF / BM25 document ranking, and boolean query parsing (AND, OR, NOT).
Add support for prefix auto-complete using a Trie, fuzzy search with Levenshtein distance, and document ingestion with real-time index updates.
    `.trim(),
    track: 'TECHNICAL',
    difficulty: 'HARD',
    category: 'Information Retrieval',
    domain: 'Search Systems',
    type: 'BACKEND_API',
    company: 'Elastic Engineering',
    duration: '8-10 hours',
    estimatedTime: '8-10 hours',
    deadline: future(90),
    skills: ['Information Retrieval', 'Inverted Index', 'BM25 Scoring', 'Trie Data Structure', 'Levenshtein'],
    skillsTargeted: ['Custom Inverted Index', 'BM25 Ranking', 'Porter Stemming', 'Boolean Query AST'],
    technologies: ['TypeScript or C++', 'Node.js', 'Express', 'Jest'],
    tags: ['search', 'inverted-index', 'bm25', 'trie', 'information-retrieval', 'hard'],
    requirements: [
      'Build in-memory or persisted Inverted Index with posting lists and term frequencies',
      'Rank query results using standard Okapi BM25 formula with configurable k1 and b parameters',
      'Parse complex search queries with boolean operators: e.g. "distributed AND (cache OR redis) NOT memcached"',
      'Trie-based prefix search endpoint returning top-5 autocompletions in < 5ms',
      'Fuzzy matching tolerating up to edit distance of 2 using Levenshtein Automaton or Dynamic Programming'
    ],
    deliverables: [
      'GitHub repository containing the full text indexing library and REST API',
      'Dataset ingestion script loading 10,000 Wikipedia or product articles',
      'Evaluation benchmark showing search latency and ranking precision'
    ],
    evaluationCriteria: [
      'Correctness of BM25 ranking order compared against reference implementations',
      'Query parser robustness on malformed boolean expressions',
      'Sub-20ms search response time over a 10,000 document corpus'
    ],
    starterConstraints: 'Do not use Elasticsearch, MeiliSearch, Algolia, or SQLite FTS. Build the inverted index from scratch.',
    status: 'OPEN'
  },
  {
    slug: 'event-processing-pipeline',
    title: 'High-Throughput Event Processing Pipeline',
    description: `
Build an event ingestion and stream processing pipeline capable of consuming, validating, enriching, and aggregating 50,000 financial ticker or IoT events per second.
Implement sliding and tumbling time-window aggregations (e.g., 1-minute VWAP, 5-minute anomaly detection), handle out-of-order events with watermarks, and write aggregated rollups to a time-series or document database.
    `.trim(),
    track: 'TECHNICAL',
    difficulty: 'HARD',
    category: 'Stream Processing',
    domain: 'Data Engineering',
    type: 'BACKEND_API',
    company: 'Coinbase Data Infrastructure',
    duration: '8-12 hours',
    estimatedTime: '8-12 hours',
    deadline: future(90),
    skills: ['Stream Processing', 'Kafka / Redis Streams', 'Time-Window Aggregations', 'Watermarking', 'High Throughput'],
    skillsTargeted: ['Tumbling/Sliding Windows', 'Late-Arriving Data Watermarks', 'Batch Persistence'],
    technologies: ['Node.js or Go', 'Redis Streams / Kafka', 'TimescaleDB / MongoDB', 'Docker'],
    tags: ['streaming', 'event-pipeline', 'time-series', 'kafka', 'hard'],
    requirements: [
      'Ingest event streams via high-speed HTTP or TCP socket with non-blocking backpressure handling',
      'Compute sliding window metrics (Average, P95, Max, Count) over configurable durations',
      'Support watermarks to process late-arriving events up to 30 seconds out of order',
      'Batch-write aggregated metrics to database every 1 second or 5,000 events to minimize I/O overhead',
      'Dead-letter handling for malformed or unparseable telemetry events'
    ],
    deliverables: [
      'GitHub repository with Stream Producer, Ingestion Engine, and Aggregation Consumer',
      'Docker Compose stack running the complete pipeline',
      'Benchmarking script proving 20,000+ events/sec ingestion on standard hardware'
    ],
    evaluationCriteria: [
      'Accuracy of time-windowed metrics in the presence of deliberate clock skew and late arrivals',
      'System stability under backpressure without memory bloat',
      'Efficiency of bulk database writes'
    ],
    starterConstraints: 'Must demonstrate stream processing with time windows and watermarks.',
    status: 'OPEN'
  },
  // ───────────────────────────────────────────────────────────────────────────
  // EXPERT CHALLENGES (5)
  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: 'distributed-rate-limiting-platform',
    title: 'Distributed Rate Limiting Platform',
    description: `
Engineer a carrier-grade, distributed rate-limiting platform deployed across multiple simulated geographic regions.
Implement a hybrid Local Token Bucket + Global Redis Synchronization algorithm that limits global API consumption without incurring cross-region network roundtrips on every request.
Provide high-availability fallback to local degraded mode when global datastores fail, cryptographic client signature verification, dynamic tenant quota management, and a Grafana/Prometheus metrics exporter.
    `.trim(),
    track: 'TECHNICAL',
    difficulty: 'EXPERT',
    category: 'Distributed Systems & Cloud Architecture',
    domain: 'Distributed Systems',
    type: 'SYSTEM_DESIGN',
    company: 'Stripe Global Infrastructure',
    duration: '12-16 hours',
    estimatedTime: '12-16 hours',
    deadline: future(90),
    skills: ['Global Systems', 'Consensus', 'Local-Global Synchronization', 'Prometheus', 'High Availability'],
    skillsTargeted: ['Two-Tier Rate Limiting', 'Degraded Mode Fallback', 'Redis Cluster Sync', 'Prometheus Exporters'],
    technologies: ['Go or TypeScript', 'Redis Cluster', 'Prometheus', 'Docker Swarm/Compose'],
    tags: ['distributed', 'rate-limiter', 'multi-region', 'expert', 'cloud-architecture'],
    requirements: [
      'Two-tier architecture: Local memory token bucket in edge node + asynchronous sync with central Redis cluster',
      'Local edge decisions take < 1ms; background synchronization batches token reconciliations',
      'Graceful degradation: if Redis becomes unreachable, edge nodes fall back to safe local quotas without downtime',
      'Dynamic tenant configuration API allowing updates to rate limits without restarting nodes',
      'Prometheus /metrics endpoint emitting rate_limit_allowed_total, rate_limit_rejected_total, and sync_lag_seconds'
    ],
    deliverables: [
      'Production-ready GitHub repository with Edge Gateway, Central Sync Coordinator, and Config Service',
      'Docker Compose simulating 3 Edge Nodes across two regions and a Redis Cluster',
      'High-throughput stress test (50,000 req/sec) demonstrating zero cross-region latency spikes'
    ],
    evaluationCriteria: [
      'Theoretical and practical accuracy of global limit enforcement under heavy burst traffic',
      'Resilience during simulated central Redis partition (chaos injection)',
      'Sub-millisecond P99 response time at the edge'
    ],
    starterConstraints: 'Must prove multi-node architecture with local-global synchronization.',
    status: 'OPEN'
  },
  {
    slug: 'fault-tolerant-job-scheduler',
    title: 'Fault-Tolerant Distributed Job Scheduler with Raft',
    description: `
Design and implement a resilient, fault-tolerant distributed job orchestrator utilizing a simplified Raft Consensus Algorithm for cluster membership, leader election, and replicated state machine logs.
Tasks must be scheduled with strict dependency Directed Acyclic Graph (DAG) resolution, automatic retry on worker failure, distributed task leases with heartbeats, and zero state loss across cluster crashes.
    `.trim(),
    track: 'TECHNICAL',
    difficulty: 'EXPERT',
    category: 'Consensus & Orchestration',
    domain: 'Distributed Consensus',
    type: 'SYSTEM_DESIGN',
    company: 'Google Cloud Engine Systems',
    duration: '14-20 hours',
    estimatedTime: '14-20 hours',
    deadline: future(90),
    skills: ['Raft Consensus', 'DAG Execution Engine', 'Replicated State Machine', 'Fault Tolerance', 'Distributed Systems'],
    skillsTargeted: ['Leader Election & Log Replication', 'Topological Sort DAG Execution', 'Heartbeat Leases'],
    technologies: ['Go or TypeScript/Node.js', 'gRPC / HTTP/2', 'SQLite / LevelDB', 'Docker'],
    tags: ['raft', 'consensus', 'job-scheduler', 'dag', 'fault-tolerant', 'expert'],
    requirements: [
      'Implement Raft Consensus (RequestVote, AppendEntries, Heartbeat timers, Log Compaction)',
      'DAG task execution engine: dependencies must complete successfully before dependent tasks start',
      'Worker node failure detection: tasks assigned to a dead worker are re-queued within heartbeat timeout',
      'Persist Raft logs and state machine snapshots to durable disk storage',
      'Web-based or CLI visualizer showing current cluster leader, nodes, and DAG execution stages'
    ],
    deliverables: [
      'Complete repository with Raft node implementation, DAG scheduler, and worker agent',
      'Automated integration test verifying quorum survival when 1 of 3 nodes is forcibly killed',
      'Comprehensive design paper detailing log replication, term handling, and split-brain prevention'
    ],
    evaluationCriteria: [
      'Strict adherence to Raft consensus rules without split-brain conditions',
      'Correct topological execution of complex multi-branch DAG workflows',
      'Crash recovery demonstration: kill cluster mid-DAG, restart nodes, and verify DAG resumes without data corruption'
    ],
    starterConstraints: 'Must implement core Raft state machine logic; no turnkey Raft wrappers (e.g. hashicorp/raft).',
    status: 'OPEN'
  },
  {
    slug: 'multi-tenant-saas-architecture',
    title: 'Multi-Tenant SaaS Architecture Platform',
    description: `
Architect a secure, horizontally scalable Multi-Tenant SaaS backend platform supporting dynamic tenant provisioning, hybrid data isolation (Database-per-Tenant and Shared-Database with Row-Level Security), tenant-specific connection pooling, domain-based tenant resolution, and tenant metering for billing.
Ensure zero cross-tenant data leakage through automated security assertion suites.
    `.trim(),
    track: 'TECHNICAL',
    difficulty: 'EXPERT',
    category: 'Enterprise Architecture',
    domain: 'Cloud Architecture',
    type: 'SYSTEM_DESIGN',
    company: 'Salesforce Platform Core',
    duration: '12-16 hours',
    estimatedTime: '12-16 hours',
    deadline: future(90),
    skills: ['Multi-Tenancy', 'Row-Level Security', 'Dynamic Connection Pooling', 'Security Isolation', 'MongoDB / PostgreSQL'],
    skillsTargeted: ['Tenant Isolation Strategies', 'Dynamic Mongoose/TypeORM Connections', 'Tenant-scoped Caching'],
    technologies: ['Node.js/TypeScript', 'PostgreSQL / MongoDB', 'Redis', 'Docker'],
    tags: ['multi-tenant', 'saas', 'row-level-security', 'connection-pooling', 'expert'],
    requirements: [
      'Tenant resolution middleware via custom subdomain (tenant.domain.com) or X-Tenant-ID header',
      'Hybrid isolation model: support Shared Schema with RLS and dedicated Database-per-tenant on demand',
      'Dynamic connection pooling: cache and recycle tenant DB connections without memory exhaustion',
      'Tenant resource metering: track API requests, storage consumption, and query execution time for invoicing',
      'Automated penetration tests demonstrating that Tenant A cannot query or mutate Tenant B records under any circumstance'
    ],
    deliverables: [
      'GitHub repository with complete Multi-Tenant framework and tenant administration portal API',
      'Automated cross-tenant leakage security test suite',
      'Architecture documentation outlining encryption-at-rest with tenant-specific KMS keys'
    ],
    evaluationCriteria: [
      'Zero cross-tenant data leak vulnerabilities in ORM/ODM query generation',
      'Efficient resource utilization of connection pools under 100 tenant contexts',
      'Clean tenant provisioning and decommissioning workflows'
    ],
    starterConstraints: 'Must prove isolation across at least 3 distinct tenants in automated test suite.',
    status: 'OPEN'
  },
  {
    slug: 'distributed-cache-system',
    title: 'Distributed In-Memory Cache System',
    description: `
Build a distributed, partition-tolerant in-memory key-value cache system implementing Consistent Hashing with virtual nodes.
Support master-replica replication, gossip-protocol failure detection or node discovery, concurrent read/write operations with read-repair, and an efficient memory storage engine with slab allocation or jemalloc-style arena allocators to prevent GC pauses.
    `.trim(),
    track: 'TECHNICAL',
    difficulty: 'EXPERT',
    category: 'Systems Programming & Distributed Storage',
    domain: 'Distributed Systems',
    type: 'SYSTEM_DESIGN',
    company: 'Redis Labs Systems Core',
    duration: '14-18 hours',
    estimatedTime: '14-18 hours',
    deadline: future(90),
    skills: ['Consistent Hashing', 'Virtual Nodes', 'Gossip Protocol', 'Memory Allocation', 'Distributed Storage'],
    skillsTargeted: ['Consistent Hash Ring with Virtual Nodes', 'Replication Factor N', 'Read Repair', 'TCP Binary Protocol'],
    technologies: ['C++ / Go / TypeScript', 'TCP Sockets', 'Docker'],
    tags: ['distributed-cache', 'consistent-hashing', 'gossip', 'replication', 'expert'],
    requirements: [
      'Consistent Hashing ring with 100+ virtual nodes per physical node for uniform key distribution',
      'Replication: each key is replicated across N nodes on the hash ring (configurable replication factor)',
      'Custom high-performance binary or RESP-compatible TCP protocol',
      'Node addition and removal handling: keys are rehashed and migrated with minimal data movement',
      'Eviction engine: LRU or LFU eviction when node memory threshold (e.g. 1GB) is reached'
    ],
    deliverables: [
      'GitHub repository with Cache Node daemon and Client SDK',
      'Docker Compose cluster consisting of 5 cache nodes',
      'Benchmark showing key distribution variance (< 5% skew across nodes) and throughput (> 30,000 ops/sec)'
    ],
    evaluationCriteria: [
      'Uniformity of key distribution across the consistent hashing ring',
      'Seamless dynamic node scaling without data loss',
      'High-throughput TCP server performance under pipelined queries'
    ],
    starterConstraints: 'Must implement custom consistent hash ring and cluster data migration logic.',
    status: 'OPEN'
  },
  {
    slug: 'high-scale-event-streaming-platform',
    title: 'High-Scale Event Streaming Platform',
    description: `
Build a distributed, persistent commit-log event streaming platform modeled after Apache Kafka.
Store immutable message segments on local disk with index files for O(1) offset lookups.
Implement producer batching with CRC32 checksums, consumer groups with distributed partition rebalancing, offset commits, and high-performance zero-copy network transfer using sendfile or optimized chunk streaming.
    `.trim(),
    track: 'TECHNICAL',
    difficulty: 'EXPERT',
    category: 'Streaming & Storage Engines',
    domain: 'Event Streaming Platforms',
    type: 'SYSTEM_DESIGN',
    company: 'Confluent Streaming Core',
    duration: '16-20 hours',
    estimatedTime: '16-20 hours',
    deadline: future(90),
    skills: ['Commit Log Storage', 'Zero-Copy I/O', 'Consumer Groups', 'Partition Rebalancing', 'High Scale'],
    skillsTargeted: ['Segmented Append-Only Log', 'Sparse Index Files', 'Consumer Group Protocol', 'CRC32 Checksum'],
    technologies: ['Go / C++ / TypeScript', 'File System I/O', 'TCP Sockets', 'Docker'],
    tags: ['event-streaming', 'kafka', 'commit-log', 'consumer-groups', 'expert'],
    requirements: [
      'Append-only segmented disk storage: split logs into configurable size chunks (e.g. 64MB) with sparse index',
      'O(1) message lookup by 64-bit integer offset using binary search over sparse index',
      'Consumer Groups: support multiple consumers reading from partitioned topics with automatic partition rebalancing',
      'Durability guarantees: configurable sync interval with fsync and message integrity verification via CRC32',
      'High-throughput benchmarks: achieve 100,000+ messages/sec sustained ingest on standard SSD'
    ],
    deliverables: [
      'GitHub repository with Broker server, Producer library, and Consumer Group coordinator',
      'Integration test demonstrating consumer rebalance when a consumer abruptly crashes',
      'Performance benchmark report detailing disk I/O metrics and memory consumption profile'
    ],
    evaluationCriteria: [
      'Correctness of segmented commit log implementation and offset seeking',
      'Zero message loss or duplicate consumption during consumer group rebalance',
      'Architectural maturity and low-level I/O optimization'
    ],
    starterConstraints: 'Must store messages in custom append-only disk files. Do not wrap external messaging brokers.',
    status: 'OPEN'
  }
];

export async function seedTechnicalChallenges() {
  console.log('--- Seeding ProofHire Canonical Technical Challenges ---');
  let upsertedCount = 0;

  for (const challengeData of TWENTY_TECHNICAL_CHALLENGES) {
    await Challenge.findOneAndUpdate(
      { slug: challengeData.slug },
      { $set: challengeData },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    upsertedCount++;
  }

  console.log(`Successfully upserted ${upsertedCount} canonical technical challenges.`);

  // Mark any legacy challenges that do NOT have one of our canonical slugs as ARCHIVED
  // so that only the canonical technical challenges appear in the candidate portal.
  const canonicalSlugs = TWENTY_TECHNICAL_CHALLENGES.map(c => c.slug);
  const archiveResult = await Challenge.updateMany(
    { 
      slug: { $nin: canonicalSlugs },
      track: 'TECHNICAL'
    },
    { $set: { status: 'ARCHIVED' } }
  );

  console.log(`Archived ${archiveResult.modifiedCount} legacy/non-canonical technical challenges.`);

  // Verify counts by difficulty
  const counts = await Challenge.aggregate([
    { $match: { track: 'TECHNICAL', status: 'OPEN' } },
    { $group: { _id: '$difficulty', count: { $sum: 1 } } }
  ]);

  console.log('Current Active Technical Challenges by Difficulty:');
  counts.forEach(c => console.log(`  ${c._id}: ${c.count}`));

  const total = await Challenge.countDocuments({ track: 'TECHNICAL', status: 'OPEN' });
  console.log(`Total Active Open Technical Challenges: ${total}`);

  return total;
}

// Standalone execution if run directly
if (require.main === module) {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/proofhire';
  mongoose.connect(mongoUri)
    .then(async () => {
      await seedTechnicalChallenges();
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed execution error:', err);
      process.exit(1);
    });
}
