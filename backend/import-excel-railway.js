const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const path = require('path');
require('dotenv').config();

const prisma = new PrismaClient();

async function importStudents() {
    try {
        const filePath = path.join(__dirname, '../student.xlsx');
        console.log(`Reading file: ${filePath}`);

        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        console.log(`Found ${data.length} records in Excel.`);

        // Get existing student IDs to avoid duplicates
        const existingStudents = await prisma.studentsMaster.findMany({
            select: { studentId: true }
        });
        const existingIds = new Set(existingStudents.map(s => s.studentId));
        console.log(`Found ${existingIds.size} existing students in DB.`);

        const newStudents = [];
        const updateStudents = [];

        for (const row of data) {
            const studentId = String(row['เลขปจต.'] || '').trim();
            const firstName = String(row['ชื่อ'] || '').trim();
            const lastName = String(row['นามสกุล'] || '').trim();

            if (!studentId || !firstName) continue;

            const studentData = {
                studentId,
                numberInClass: parseInt(row['เลขที่']) || null,
                prefix: row['คำนำหน้า'] || null,
                firstName,
                lastName,
                grade: parseInt(row['ชั้น']) || 0,
                room: parseInt(row['ห้อง']) || 0,
            };

            if (existingIds.has(studentId)) {
                updateStudents.push(studentData);
            } else {
                newStudents.push({ ...studentData, isRegistered: false });
            }
        }

        console.log(`Preparing to create ${newStudents.length} new records and update ${updateStudents.length} existing records.`);

        // Bulk create new ones
        if (newStudents.length > 0) {
            console.log('Inserting new students in batches...');
            for (let i = 0; i < newStudents.length; i += 100) {
                const batch = newStudents.slice(i, i + 100);
                await prisma.studentsMaster.createMany({
                    data: batch,
                    skipDuplicates: true
                });
                console.log(`Inserted batch ${i / 100 + 1}...`);
            }
        }

        // Updates still have to be somewhat sequential or handled differently, 
        // but usually, we care more about the initial import.
        // For simplicity and speed, let's skip bulk updates for now unless necessary.

        console.log(`\nImport Summary:`);
        console.log(`- New students added: ${newStudents.length}`);
        console.log(`- Existing students (skipped update for speed): ${updateStudents.length}`);

    } catch (error) {
        console.error('Critical Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

importStudents();
