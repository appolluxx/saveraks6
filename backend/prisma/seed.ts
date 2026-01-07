import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Students Master Data...');

    const students = [
        {
            studentId: '12345',
            numberInClass: 1,
            prefix: 'ด.ช.',
            firstName: 'สมชาย',
            lastName: 'ใจดี',
            grade: 4,
            room: 1,
        },
        {
            studentId: '53580',
            numberInClass: 1,
            prefix: 'ด.ช.',
            firstName: 'จิตภูผา',
            lastName: 'อุ้ยจาด',
            grade: 1,
            room: 1,
        },
        {
            studentId: '53591',
            numberInClass: 2,
            prefix: 'ด.ช.',
            firstName: 'ชเนศ',
            lastName: 'เดชสุวรรณ์',
            grade: 1,
            room: 1,
        },
        {
            studentId: '53602',
            numberInClass: 3,
            prefix: 'ด.ช.',
            firstName: 'ชินภัทร',
            lastName: 'สันติสุขบำรุง',
            grade: 1,
            room: 1,
        },
        {
            studentId: '53612',
            numberInClass: 4,
            prefix: 'ด.ช.',
            firstName: 'ฐิติศักดิ์',
            lastName: 'ประทุมเลิศ',
            grade: 1,
            room: 1,
        },
        {
            studentId: '53615',
            numberInClass: 5,
            prefix: 'ด.ช.',
            firstName: 'ณฐกร',
            lastName: 'นิยมญาติ',
            grade: 1,
            room: 1,
        }
    ];

    for (const student of students) {
        await prisma.studentsMaster.upsert({
            where: { studentId: student.studentId },
            update: {},
            create: {
                ...student,
                isRegistered: false,
            },
        });
    }

    console.log('Seeding completed successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
