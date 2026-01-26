
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';
import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Students Master Data...');

    // Read from Excel file
    const excelPath = path.join(__dirname, '../student.xlsx');

    let students: any[] = [];

    if (fs.existsSync(excelPath)) {
        console.log(`Reading students from ${excelPath}...`);
        const workbook = XLSX.readFile(excelPath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Map Excel columns to Database Schema
        // Headers: เลขปจต., เลขที่, คำนำหน้า, ชื่อ, นามสกุล, ชั้น, ห้อง
        students = jsonData.map((row: any) => ({
            studentId: String(row['เลขปจต.'] || row['เลขประจำตัว'] || row['รหัสนักเรียน'] || ''),
            numberInClass: Number(row['เลขที่'] || 0),
            prefix: String(row['คำนำหน้า'] || ''),
            firstName: String(row['ชื่อ'] || ''),
            lastName: String(row['นามสกุล'] || ''),
            grade: Number(row['ชั้น'] || row['ระดับชั้น'] || 1),
            room: Number(row['ห้อง'] || 1),
        })).filter(s => s.studentId && s.firstName); // Filter out empty rows

        console.log(`Found ${students.length} students in Excel file.`);
    } else {
        console.warn("⚠️ student.xlsx not found in backend folder! Using fallback data.");
        // Fallback data
        students = [
            {
                studentId: '12345',
                numberInClass: 1,
                prefix: 'ด.ช.',
                firstName: 'สมชาย',
                lastName: 'ใจดี',
                grade: 4,
                room: 1,
            }
        ];
    }

    for (const student of students) {
        // Validation: Ensure required fields exist
        if (!student.studentId) continue;

        try {
            await prisma.studentsMaster.upsert({
                where: { studentId: student.studentId },
                update: {
                    firstName: student.firstName,
                    lastName: student.lastName,
                    grade: student.grade,
                    room: student.room
                },
                create: {
                    studentId: student.studentId,
                    numberInClass: student.numberInClass || 0,
                    prefix: student.prefix || '',
                    firstName: student.firstName || 'Unknown',
                    lastName: student.lastName || 'Unknown',
                    grade: student.grade || 1,
                    room: student.room || 1,
                    isRegistered: false,
                },
            });
        } catch (error) {
            console.error(`Failed to upsert student ${student.studentId}:`, error);
        }
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
