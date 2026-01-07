const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const count = await prisma.studentsMaster.count();
        console.log(`TOTAL STUDENTS IN DB: ${count}`);

        if (count > 0) {
            const sample = await prisma.studentsMaster.findFirst();
            console.log('Sample data:', sample);
        }
    } catch (err) {
        console.error('Error checking DB:', err.message);
    } finally {
        await prisma.$disconnect();
    }
}

check();
