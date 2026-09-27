import { app } from './app';
import { connectDB } from './config/db';
import { seedPracticeChallenges } from './utils/seedPracticeChallenges';

const PORT = process.env.PORT || 8080;

const startServer = async () => {
  await connectDB();
  await seedPracticeChallenges();
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
