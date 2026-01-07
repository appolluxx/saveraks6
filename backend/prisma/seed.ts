import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Pre-Registered Students...');

    const students = [
        { studentId: '12345', firstName: 'Somchai', lastName: 'Jaidee', classRoom: 'M.4/1' },
        { studentId: '12346', firstName: 'Somying', lastName: 'Raklok', classRoom: 'M.4/2' },
        { studentId: '12347', firstName: 'Wichai', lastName: 'Khiao', classRoom: 'M.5/1' },
        { studentId: '12348', firstName: 'Manee', lastName: 'Meesuk', classRoom: 'M.5/2' },
        { studentId: '12349', firstName: 'Piti', lastName: 'Anurak', classRoom: 'M.6/1' },
        { studentId: '12350', firstName: 'New', lastName: 'Student', classRoom: 'M.1/1' }, // Test Student
    ];

    for (const student of students) {
        await prisma.preRegisteredStudent.upsert({
            where: { studentId: student.studentId },
            update: {},
            create: {
                studentId: student.studentId,
                firstName: student.firstName,
                lastName: student.lastName,
                classRoom: student.classRoom,
            },
        });
    }

    console.log('Seeding completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
