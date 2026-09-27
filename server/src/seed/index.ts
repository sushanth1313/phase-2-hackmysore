import { seedChallenges } from './challenges.seed';
import { seedProjectChallenges } from './projectChallenges.seed';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/proofhire';

(async () => {
  console.log('\n=== ProofHire Database Seed ===\n');
  try {
    const coding = await seedChallenges(MONGO_URI);
    console.log(`Coding challenges: ${coding}`);
  } catch (e: any) {
    console.error('Coding challenges seed error:', e.message);
  }

  try {
    const projects = await seedProjectChallenges(MONGO_URI);
    console.log(`Project challenges: ${projects}`);
  } catch (e: any) {
    console.error('Project challenges seed error:', e.message);
  }

  console.log('\n=== Seed Complete ===\n');
  process.exit(0);
})();
