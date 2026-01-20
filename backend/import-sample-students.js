const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function importSampleStudents() {
  try {
    console.log('Starting sample student import...');
    
    // Sample students from the SQL file
    const sampleStudents = [
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
    
    let imported = 0;
    
    for (const student of sampleStudents) {
      try {
        // Check if student already exists
        const existing = await prisma.studentsMaster.findUnique({
          where: { studentId: student.studentId }
        });
        
        if (existing) {
          console.log(`Student ${student.studentId} already exists, skipping...`);
          continue;
        }
        
        // Insert into database
        await prisma.studentsMaster.create({
          data: {
            ...student,
            isRegistered: false,
            registeredAt: null,
          }
        });
        
        imported++;
        console.log(`Imported student: ${student.studentId} - ${student.firstName} ${student.lastName}`);
        
      } catch (error) {
        console.error(`Error importing student ${student.studentId}:`, error);
      }
    }
    
    console.log(`Import complete: ${imported} students imported`);
    
  } catch (error) {
    console.error('Import failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importSampleStudents();
