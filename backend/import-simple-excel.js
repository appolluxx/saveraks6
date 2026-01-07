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
      try {
        // Map simplified Excel columns to database fields
        const studentId = String(row['Student_id'] || '').trim();
        const fullName = row['full_name'] || '';
        
        // Parse full name into first and last name
        let firstName, lastName;
        if (fullName.includes(' ')) {
          const nameParts = fullName.split(' ');
          firstName = nameParts[0] || '';
          lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
        } else {
          // For Thai names without spaces, use full name as first name
          firstName = fullName;
          lastName = '';
        }
        
        // Parse classroom (e.g., "1/1" -> grade=1, room=1)
        const classroom = String(row['classroom'] || '').trim();
        const classParts = classroom.split('/');
        const grade = classParts[0] ? parseInt(classParts[0]) : null;
        const room = classParts[1] ? parseInt(classParts[1]) : null;
        
        // Skip rows with missing required data
        if (!studentId || !firstName || !grade || !room) {
          console.log(`Skipping row - missing data: ${JSON.stringify(row)}`);
          skipped++;
          continue;
        }
        
        // Insert into database
        await prisma.studentsMaster.create({
          data: {
            studentId,
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
