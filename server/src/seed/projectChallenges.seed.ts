import mongoose from 'mongoose';
import Challenge from '../models/Challenge';

export const PROJECT_CHALLENGES = [
  // SYSTEM DESIGN
  {
    title: 'Design a URL Shortener',
    description: 'Design and implement a scalable URL shortening service (like bit.ly). Your solution must handle 1M+ URLs, implement a custom Base62 encoding scheme, design the database schema, document API endpoints, and include cache invalidation strategy. Provide a GitHub repository with working implementation.',
    type: 'SYSTEM_DESIGN',
    difficulty: 'MEDIUM',
    domain: 'System Design',
    estimatedTime: '6-8 hrs',
    skillsTargeted: ['System Design', 'Backend Architecture', 'Caching', 'Database Design'],
    evaluationCriteria: ['Scalability approach', 'API design', 'Database schema', 'Caching strategy', 'Code quality'],
    starterConstraints: 'Implement in any language. Must include: API spec, schema design, encoding algorithm, and a working demo.',
    tags: ['system-design', 'distributed-systems', 'backend', 'caching'],
    status: 'PUBLISHED',
    verifiedSubmissions: 47
  },
  {
    title: 'Build a Rate Limiter',
    description: 'Implement a production-grade rate limiter supporting token bucket, sliding window, and fixed window algorithms. Include Redis-backed distributed mode, HTTP middleware integration, per-route configuration, and unit tests with 80%+ coverage.',
    type: 'BACKEND_API',
    difficulty: 'HARD',
    domain: 'Backend Engineering',
    estimatedTime: '8-12 hrs',
    skillsTargeted: ['Redis', 'Distributed Systems', 'API Design', 'Node.js', 'Testing'],
    evaluationCriteria: ['Algorithm correctness', 'Redis integration', 'Edge case handling', 'Test coverage', 'Performance'],
    starterConstraints: 'Use Node.js + Redis. Expose via Express middleware. Must pass correctness tests under concurrent load.',
    tags: ['rate-limiting', 'redis', 'distributed', 'middleware'],
    status: 'PUBLISHED',
    verifiedSubmissions: 23
  },
  {
    title: 'Event-Driven Notification System',
    description: 'Design and build an event-driven notification microservice using a message queue (RabbitMQ or Kafka). Support email, in-app, and webhook delivery channels. Implement retry logic with exponential backoff, dead letter queues, and delivery confirmation tracking.',
    type: 'BACKEND_API',
    difficulty: 'EXPERT',
    domain: 'Backend Engineering',
    estimatedTime: '12-16 hrs',
    skillsTargeted: ['Message Queues', 'Microservices', 'Event-Driven Architecture', 'Reliability Patterns'],
    evaluationCriteria: ['Queue architecture', 'Retry logic', 'Delivery guarantees', 'Monitoring/observability', 'Code organization'],
    starterConstraints: 'Choose RabbitMQ or Kafka. Implement at least 2 delivery channels. Include Docker Compose setup.',
    tags: ['event-driven', 'rabbitmq', 'kafka', 'microservices', 'notifications'],
    status: 'PUBLISHED',
    verifiedSubmissions: 12
  },
  // BACKEND API
  {
    title: 'REST API with Auth + RBAC',
    description: 'Build a production-ready REST API for a task management system with JWT authentication, role-based access control (Admin/Manager/User), full CRUD operations, input validation, pagination, and comprehensive error handling.',
    type: 'BACKEND_API',
    difficulty: 'MEDIUM',
    domain: 'Backend Engineering',
    estimatedTime: '6-8 hrs',
    skillsTargeted: ['REST API', 'JWT', 'RBAC', 'Node.js', 'MongoDB', 'Validation'],
    evaluationCriteria: ['Auth implementation', 'RBAC correctness', 'Input validation', 'Error handling', 'Code structure'],
    starterConstraints: 'Use Node.js + Express + MongoDB. Provide Postman collection or OpenAPI spec.',
    tags: ['rest-api', 'auth', 'rbac', 'jwt', 'backend'],
    status: 'PUBLISHED',
    verifiedSubmissions: 89
  },
  {
    title: 'Real-Time Chat API',
    description: 'Build a real-time chat API using WebSockets with room management, message history, typing indicators, read receipts, and user presence. Must support concurrent users and persist messages in MongoDB.',
    type: 'BACKEND_API',
    difficulty: 'HARD',
    domain: 'Backend Engineering',
    estimatedTime: '8-10 hrs',
    skillsTargeted: ['WebSockets', 'Socket.io', 'Real-time Systems', 'MongoDB', 'Redis Pub/Sub'],
    evaluationCriteria: ['Real-time correctness', 'Scalability (Redis)', 'Message persistence', 'Connection handling', 'Code quality'],
    starterConstraints: 'Use Socket.io. Implement at least: rooms, history, typing indicators. Redis for horizontal scaling.',
    tags: ['websockets', 'real-time', 'chat', 'redis', 'socket.io'],
    status: 'PUBLISHED',
    verifiedSubmissions: 31
  },
  // FRONTEND
  {
    title: 'Accessible Data Table Component',
    description: 'Build a fully accessible, reusable data table component in React with: virtual scrolling for 10,000+ rows, column sorting, multi-filter, column resize, row selection, CSV export, and WCAG 2.1 AA compliance.',
    type: 'FRONTEND',
    difficulty: 'HARD',
    domain: 'Frontend Engineering',
    estimatedTime: '8-12 hrs',
    skillsTargeted: ['React', 'Accessibility', 'Performance', 'Virtual DOM', 'CSS'],
    evaluationCriteria: ['Accessibility score', 'Performance with large datasets', 'API design', 'Test coverage', 'UX quality'],
    starterConstraints: 'React + TypeScript. No external table libraries. Must pass axe-core accessibility audit.',
    tags: ['react', 'accessibility', 'performance', 'components', 'typescript'],
    status: 'PUBLISHED',
    verifiedSubmissions: 28
  },
  {
    title: 'Build a Kanban Board',
    description: 'Build a full-featured Kanban board with drag-and-drop, real-time updates (WebSocket sync), column management, card filtering, due date tracking, and local-first persistence using IndexedDB.',
    type: 'FRONTEND',
    difficulty: 'MEDIUM',
    domain: 'Frontend Engineering',
    estimatedTime: '6-8 hrs',
    skillsTargeted: ['React', 'DnD', 'WebSockets', 'State Management', 'IndexedDB'],
    evaluationCriteria: ['Drag-and-drop UX', 'Real-time sync', 'Offline capability', 'Performance', 'Code organization'],
    starterConstraints: 'React or Vue. Must work offline (IndexedDB). Real-time sync is a bonus.',
    tags: ['kanban', 'drag-drop', 'react', 'state-management', 'offline'],
    status: 'PUBLISHED',
    verifiedSubmissions: 52
  },
  // DATABASE
  {
    title: 'Database Query Optimization',
    description: 'Given a PostgreSQL database with 10M+ records across 5 tables (orders, products, users, reviews, inventory), optimize 8 slow queries. For each query: explain BEFORE/AFTER execution plans, add appropriate indexes, rewrite with CTEs where needed, and document the optimization rationale.',
    type: 'DATABASE',
    difficulty: 'HARD',
    domain: 'Database Engineering',
    estimatedTime: '6-8 hrs',
    skillsTargeted: ['PostgreSQL', 'Query Optimization', 'Indexing', 'Execution Plans', 'CTEs'],
    evaluationCriteria: ['Query improvement factor', 'Index strategy rationale', 'Plan analysis depth', 'Edge cases considered'],
    starterConstraints: 'PostgreSQL 14+. Provide before/after EXPLAIN ANALYZE output for each query. Document tradeoffs.',
    tags: ['sql', 'postgresql', 'optimization', 'indexing', 'performance'],
    status: 'PUBLISHED',
    verifiedSubmissions: 19
  },
  {
    title: 'Design a Multi-Tenant Database Schema',
    description: 'Design a PostgreSQL schema for a SaaS application supporting 10,000+ tenants. Compare row-level security (RLS) vs schema-per-tenant vs database-per-tenant approaches. Implement the best solution with full migration scripts, seed data, and performance benchmarks.',
    type: 'DATABASE',
    difficulty: 'EXPERT',
    domain: 'Database Engineering',
    estimatedTime: '10-14 hrs',
    skillsTargeted: ['Database Design', 'Multi-Tenancy', 'PostgreSQL RLS', 'Performance', 'Security'],
    evaluationCriteria: ['Architecture decision quality', 'RLS implementation', 'Query performance', 'Data isolation proof', 'Migration quality'],
    starterConstraints: 'PostgreSQL. Include benchmarks for at least 1,000 simulated tenants. Justify tradeoffs in README.',
    tags: ['multi-tenancy', 'postgresql', 'schema-design', 'rls', 'saas'],
    status: 'PUBLISHED',
    verifiedSubmissions: 7
  },
  // DEVOPS
  {
    title: 'CI/CD Pipeline for Microservices',
    description: 'Set up a complete CI/CD pipeline for a 3-service Node.js microservices application. Include: GitHub Actions workflows, Docker multi-stage builds, container registry push, Kubernetes manifests (Deployment + Service + Ingress), Helm chart, automated testing gate, and rollback strategy.',
    type: 'DEVOPS',
    difficulty: 'HARD',
    domain: 'DevOps & Infrastructure',
    estimatedTime: '8-12 hrs',
    skillsTargeted: ['Docker', 'Kubernetes', 'GitHub Actions', 'Helm', 'CI/CD'],
    evaluationCriteria: ['Pipeline completeness', 'Security (secret management)', 'Rollback mechanism', 'Helm chart quality', 'Documentation'],
    starterConstraints: 'Use minikube or Kind for local K8s. GitHub Actions for CI. Helm for deployments.',
    tags: ['cicd', 'kubernetes', 'docker', 'github-actions', 'helm', 'devops'],
    status: 'PUBLISHED',
    verifiedSubmissions: 15
  },
  // ML / AI
  {
    title: 'Build a Recommendation Engine',
    description: 'Implement a collaborative filtering recommendation engine for an e-commerce dataset. Compare user-based vs item-based filtering, implement matrix factorization (SVD), evaluate with RMSE/MAP@K metrics, and expose as a REST API endpoint.',
    type: 'ML',
    difficulty: 'HARD',
    domain: 'Machine Learning',
    estimatedTime: '10-14 hrs',
    skillsTargeted: ['Collaborative Filtering', 'Matrix Factorization', 'Python', 'scikit-learn', 'FastAPI'],
    evaluationCriteria: ['Algorithm correctness', 'Evaluation metrics', 'API design', 'Code quality', 'Explainability'],
    starterConstraints: 'Python + scikit-learn or surprise library. Use MovieLens or similar open dataset. FastAPI for serving.',
    tags: ['ml', 'recommendation', 'collaborative-filtering', 'python', 'fastapi'],
    status: 'PUBLISHED',
    verifiedSubmissions: 11
  },
  // FULL STACK
  {
    title: 'Full-Stack Job Board',
    description: 'Build a full-stack job board application with: employer dashboard (post/manage jobs), candidate search/filter/apply flow, admin panel, email notifications, resume upload, and deployment on a cloud platform. Include authentication and authorization for all 3 roles.',
    type: 'FULL_STACK',
    difficulty: 'EXPERT',
    domain: 'Full Stack Engineering',
    estimatedTime: '16-20 hrs',
    skillsTargeted: ['React', 'Node.js', 'PostgreSQL', 'Auth', 'Cloud Deployment', 'Email'],
    evaluationCriteria: ['Feature completeness', 'Code architecture', 'Security', 'UX quality', 'Deployment', 'Testing'],
    starterConstraints: 'Any stack. Must be deployed (Vercel/Render/Railway/Fly.io). Include live URL in submission.',
    tags: ['fullstack', 'react', 'node', 'auth', 'deployment', 'jobs'],
    status: 'PUBLISHED',
    verifiedSubmissions: 9
  },
  // DEBUGGING
  {
    title: 'Debug a Broken Node.js Service',
    description: 'You are given a GitHub repository containing a Node.js REST API with 7 intentional bugs ranging from race conditions, memory leaks, incorrect async handling, broken auth middleware, SQL injection vulnerability, and pagination off-by-one error. Find, fix, and document all bugs.',
    type: 'DEBUGGING',
    difficulty: 'MEDIUM',
    domain: 'Backend Engineering',
    estimatedTime: '4-6 hrs',
    skillsTargeted: ['Debugging', 'Node.js', 'Security', 'Async/Await', 'Memory Management'],
    evaluationCriteria: ['Bugs found and fixed', 'Fix quality', 'Security fix completeness', 'Documentation of findings'],
    starterConstraints: 'Fork the provided repository. Submit a PR with your fixes. Include a BUGS.md documenting each bug and your fix.',
    tags: ['debugging', 'node.js', 'security', 'async', 'memory-leak'],
    status: 'PUBLISHED',
    verifiedSubmissions: 38
  }
];

export async function seedProjectChallenges(mongoUri = 'mongodb://127.0.0.1:27017/proofhire') {
  await mongoose.connect(mongoUri);
  const existing = await Challenge.countDocuments({ status: 'PUBLISHED' });
  console.log(`Existing published challenges: ${existing}`);

  if (existing >= 10) {
    console.log('Sufficient project challenges exist. Skipping.');
    await mongoose.disconnect();
    return existing;
  }

  await Challenge.deleteMany({});
  const inserted = await Challenge.insertMany(PROJECT_CHALLENGES);
  console.log(`Seeded ${inserted.length} project challenges`);
  await mongoose.disconnect();
  return inserted.length;
}

if (require.main === module) {
  seedProjectChallenges().catch(console.error);
}
