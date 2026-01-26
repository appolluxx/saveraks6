import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

console.log('DATABASE_URL:', process.env.DATABASE_URL);

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Attempting to connect to database...');
    await prisma.$connect();
    console.log('Successfully connected to the database.');
    
    try {
        const count = await prisma.studentsMaster.count();
        console.log(`Found ${count} students.`);
    } catch (countError) {
        console.warn('Connected, but failed to count students:', countError.message);
    }

  } catch (e) {
    console.error('Connection failed:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
