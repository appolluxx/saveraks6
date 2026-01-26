const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function importStudentsFromExcel() {
  try {
    console.log('Starting student import...');
    
    // Read Excel file
    const XLSX = require('xlsx');
    const workbook = XLSX.readFile('../Fixed Excel.xlsx');
    const worksheet = workbook.Sheets['Sheet1'];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`Found ${data.length} student records`);
    
    let imported = 0;
    let skipped = 0;
    
    for (const row of data) {
      let studentId = '';
      try {
        // Map Excel columns to database fields
        studentId = String(row['student_id'] || '').trim();
        const fullName = row['full_name'] || '';
        const classroom = row['classroom'] || '';
        
        // Skip rows with missing required data
        if (!studentId || !fullName || !classroom) {
          skipped++;
          continue;
        }
        
        // Parse classroom (format: "1/1" -> grade: 1, room: 1)
        const classParts = classroom.split('/');
        const grade = parseInt(classParts[0]) || null;
        const room = parseInt(classParts[1]) || null;
        
        // Split full name into parts (assuming format: "prefix firstName lastName")
        const nameParts = fullName.trim().split(' ');
        let prefix = null;
        let firstName = '';
        let lastName = '';
        
        if (nameParts.length >= 3) {
          prefix = nameParts[0];
          firstName = nameParts[1];
          lastName = nameParts.slice(2).join(' ');
        } else if (nameParts.length === 2) {
          firstName = nameParts[0];
          lastName = nameParts[1];
        } else {
          firstName = fullName;
        }
        
        // Insert into database
        await prisma.studentsMaster.create({
          data: {
            studentId,
            numberInClass: null,
            prefix,
            firstName,
            lastName,
            grade,
            room,
            isRegistered: false,
            registeredAt: null,
          }
        });
        
        imported++;
        
        if (imported % 100 === 0) {
          console.log(`Imported ${imported} records...`);
        }
      } catch (error) {
        console.error(`Error importing row ${studentId}:`, error);
        skipped++;
      }
    }
    
    console.log(`Import complete: ${imported} imported, ${skipped} skipped`);
    
  } catch (error) {
    console.error('Import failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importStudentsFromExcel();
