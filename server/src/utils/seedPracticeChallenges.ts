import mongoose from 'mongoose';
import CodingChallenge from '../models/CodingChallenge';
import Challenge from '../models/Challenge';
import Job from '../models/Job';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import { CHALLENGES } from '../seed/challenges.seed';
import { PROJECT_CHALLENGES } from '../seed/projectChallenges.seed';

const DEMO_USERS = [
  { firstName: 'Demo', lastName: 'Candidate', email: 'student@demo.com', role: 'CANDIDATE', track: 'TECHNICAL' },
  { firstName: 'Demo', lastName: 'Recruiter', email: 'recruiter@demo.com', role: 'RECRUITER' },
  { firstName: 'Demo', lastName: 'Admin', email: 'admin@demo.com', role: 'ADMIN' },
];

export const seedPracticeChallenges = async () => {
  // 1. Seed Demo Accounts
  let recruiterUser: any = null;
  for (const u of DEMO_USERS) {
    let user = await User.findOne({ email: u.email });
    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('demo123', salt);
      user = await User.create({ ...u, password: hashedPassword });
    }
    if (u.role === 'RECRUITER') {
      recruiterUser = user;
    }
  }

  // 2. Seed Coding Practice Challenges
  const codingCount = await CodingChallenge.countDocuments();
  if (codingCount < 15) {
    await CodingChallenge.deleteMany({});
    await CodingChallenge.insertMany(CHALLENGES);
    console.log(`[Seed] Seeded ${CHALLENGES.length} Coding Challenges into MongoDB.`);
  }

  // 3. Seed Engineering Project Challenges
  const projectChallengeCount = await Challenge.countDocuments();
  if (projectChallengeCount < 5) {
    const enriched = PROJECT_CHALLENGES.map((c: any) => ({
      ...c,
      track: 'TECHNICAL',
      company: c.company || 'ProofHire Systems Lab',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      skills: c.skillsTargeted || c.skills || ['Backend', 'System Design'],
      status: 'PUBLISHED'
    }));
    await Challenge.deleteMany({});
    await Challenge.insertMany(enriched);
    console.log(`[Seed] Seeded ${enriched.length} Technical Engineering Challenges into MongoDB.`);
  }

  // 4. Seed Real Companies & Published Jobs
  const jobCount = await Job.countDocuments();
  if (jobCount < 4 && recruiterUser) {
    const jobsToSeed = [
      {
        recruiter: recruiterUser._id,
        title: 'Senior Backend Engineer (Distributed Systems)',
        company: 'Stripe',
        companyLogo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=60',
        industry: 'Fintech & Infrastructure',
        companySize: '1,000 - 5,000 employees',
        department: 'Core Ledger & Settlement',
        description: 'Design and operate mission-critical payment ledger pipelines with 99.999% availability. Handle distributed transaction consensus, idempotent idempotency key systems, and high-throughput PostgreSQL/Redis architectures.',
        location: 'San Francisco, CA / Remote',
        locationType: 'REMOTE',
        workMode: 'Remote',
        type: 'FULL_TIME',
        seniority: 'SENIOR',
        requiredSkills: ['Node.js', 'TypeScript', 'PostgreSQL', 'Redis', 'Distributed Systems'],
        preferredSkills: ['Kafka', 'Docker', 'Kubernetes'],
        requirements: [
          '5+ years experience building highly concurrent distributed systems',
          'Deep knowledge of relational databases, ACID transactions, and data modeling',
          'Proven track record writing verifiable, resilient, and well-tested services'
        ],
        deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE'
      },
      {
        recruiter: recruiterUser._id,
        title: 'Full Stack Engineer (Edge & Cloud Platforms)',
        company: 'Vercel',
        companyLogo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=60',
        industry: 'Developer Tools & Cloud',
        companySize: '500 - 1,000 employees',
        department: 'Platform Core',
        description: 'Empower millions of developers by building responsive edge web interfaces and scalable backend serverless worker runtimes using React, TypeScript, and modern Node.js/Rust microservices.',
        location: 'New York, NY / Remote',
        locationType: 'HYBRID',
        workMode: 'Hybrid',
        type: 'FULL_TIME',
        seniority: 'MID',
        requiredSkills: ['React', 'TypeScript', 'Node.js', 'Next.js', 'REST API'],
        preferredSkills: ['GraphQL', 'TailwindCSS', 'Testing'],
        requirements: [
          '3+ years full-stack product development experience',
          'High proficiency with React component architecture, state management, and Vite/Next tooling',
          'Experience building robust RESTful endpoints with input validation'
        ],
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE'
      },
      {
        recruiter: recruiterUser._id,
        title: 'Site Reliability & Infrastructure Engineer',
        company: 'Datadog',
        companyLogo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=60',
        industry: 'Cloud Monitoring & Security',
        companySize: '2,500 - 5,000 employees',
        department: 'Observability Infra',
        description: 'Build observability pipelines processing billions of metric events per second. Implement automated failover, cluster autoscaling, and telemetry ingestion services.',
        location: 'Austin, TX / Remote',
        locationType: 'REMOTE',
        workMode: 'Remote',
        type: 'FULL_TIME',
        seniority: 'LEAD',
        requiredSkills: ['Python', 'Docker', 'Kubernetes', 'Linux', 'Distributed Systems'],
        preferredSkills: ['Go', 'AWS', 'Terraform'],
        requirements: [
          'Strong systems programming experience in Python or Go',
          'Deep expertise in Linux internals, container runtimes, and networking',
          'Commitment to infrastructure-as-code and automated canary deployments'
        ],
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE'
      },
      {
        recruiter: recruiterUser._id,
        title: 'Frontend Systems Architect',
        company: 'Figma',
        companyLogo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=60',
        industry: 'Collaborative Software',
        companySize: '1,000 - 2,500 employees',
        department: 'Canvas Rendering & WebGL',
        description: 'Design the next generation of collaborative canvas tools. Optimize client-side memory layout, real-time multiplayer synchronization, and WebAssembly interaction.',
        location: 'San Francisco, CA / Remote',
        locationType: 'REMOTE',
        workMode: 'Remote',
        type: 'FULL_TIME',
        seniority: 'STAFF',
        requiredSkills: ['JavaScript', 'TypeScript', 'React', 'HTML', 'CSS'],
        preferredSkills: ['WebGL', 'WebAssembly', 'Performance Optimization'],
        requirements: [
          'Extensive experience profiling frontend performance and minimizing rendering jank',
          'Proven mastery of modern JavaScript/TypeScript and asynchronous DOM patterns'
        ],
        deadline: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE'
      }
    ];

    await Job.deleteMany({});
    await Job.insertMany(jobsToSeed);
    console.log(`[Seed] Seeded ${jobsToSeed.length} Active Published Jobs into MongoDB.`);
  }
};
