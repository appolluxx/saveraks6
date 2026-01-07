import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

// --- Flow A: Student Registration ---
export const registerStudent = async (req: Request, res: Response): Promise<void> => {
    const { studentId, phone, password } = req.body;

    try {
        // 1. Validate against Students Master
        const studentRecord = await prisma.studentsMaster.findUnique({
            where: { studentId }
        });

        if (!studentRecord) {
            res.status(403).json({ error: "Access Denied: Student ID not found in school records." });
            return;
        }

        if (studentRecord.isRegistered) {
            res.status(400).json({ error: "Identity Conflict: This ID is already registered." });
            return;
        }

        // 2. Check for Phone uniqueness in User table
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { phone },
                    { studentId } // Double safety
                ]
            }
        });

        if (existingUser) {
            res.status(400).json({ error: "Phone number or Student ID already in use." });
            return;
        }

        // 3. Hash Password
        const passwordHash = await bcrypt.hash(password, 12);

        // 4. Create User & Update Students Master (Atomic Transaction)
        const result = await prisma.$transaction(async (tx: any) => {
            // สร้าง User ใหม่ โดยดึงชื่อจาก StudentsMaster
            const newUser = await tx.user.create({
                data: {
                    role: 'STUDENT' as any,
                    phone,
                    passwordHash,
                    studentId: studentRecord.studentId,
                    firstName: studentRecord.firstName,
                    lastName: studentRecord.lastName,
                    fullName: `${studentRecord.prefix ? studentRecord.prefix + ' ' : ''}${studentRecord.firstName} ${studentRecord.lastName}`,
                    classRoom: studentRecord.classRoom,
                    status: 'active' as any
                }
            });

            // อัปเดตว่าลงทะเบียนแล้ว
            await tx.studentsMaster.update({
                where: { studentId },
                data: {
                    isRegistered: true,
                    registeredAt: new Date()
                }
            });

            return newUser;
        });

        // สร้าง Token
        const token = jwt.sign({ userId: result.id, role: result.role }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            message: "Student registration successful.",
            token,
            user: {
                id: result.id,
                role: result.role,
                name: result.fullName,
                studentId: result.studentId,
                classRoom: result.classRoom
            }
        });

    } catch (error) {
        console.error("Register Student Error:", error);
        res.status(500).json({ error: "Registration failed." });
    }
};

// --- Flow B: Staff Registration ---
export const registerStaff = async (req: Request, res: Response): Promise<void> => {
    const { email, phone, password, firstName, lastName, position } = req.body;

    try {
        // 1. Check Uniqueness (Email & Phone)
        const existing = await prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { phone }
                ]
            }
        });

        if (existing) {
            res.status(400).json({ error: "Email or Phone already registered." });
            return;
        }

        // 2. Hash Password
        const passwordHash = await bcrypt.hash(password, 12);

        // 3. Create Staff User
        const newUser = await prisma.user.create({
            data: {
                role: 'STAFF' as any,
                email,
                phone,
                passwordHash,
                firstName,
                lastName,
                fullName: `${firstName} ${lastName}`,
                // ตรงนี้สำคัญ: Cast ค่า position ให้เป็น Enum StaffPosition
                staffPosition: position as any,
                status: 'active' as any
            }
        });

        const token = jwt.sign({ userId: newUser.id, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            message: "Staff registration successful.",
            token,
            user: {
                id: newUser.id,
                role: newUser.role,
                name: newUser.fullName,
                email: newUser.email,
                position: newUser.staffPosition
            }
        });

    } catch (error) {
        console.error("Register Staff Error:", error);
        res.status(500).json({ error: "Staff user creation failed." });
    }
};

// --- Unified Login ---
export const login = async (req: Request, res: Response): Promise<void> => {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
        res.status(400).json({ error: "Identifier and password are required." });
        return;
    }

    try {
        // 1. Resolve User by Student ID, Email, or Phone
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { studentId: identifier }, // Student
                    { email: identifier },     // Staff
                    { phone: identifier }      // Both
                ]
            }
        });

        if (!user) {
            res.status(401).json({ error: "Account not registered. Please register first." });
            return;
        }

        // 2. Verify Password
        const validPassword = await bcrypt.compare(password, user.passwordHash);
        if (!validPassword) {
            res.status(401).json({ error: "Invalid credentials." });
            return;
        }

        if (user.status === 'suspended') {
            res.status(403).json({ error: "Account suspended." });
            return;
        }

        // 3. Generate Token
        const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            message: "Login successful.",
            token,
            user: {
                id: user.id,
                name: user.fullName,
                role: user.role,
                studentId: user.studentId,
                email: user.email
            }
        });

    } catch (error: any) {
        console.error("Login Error:", error);

        // Demo fallback when database is not available
        if (error instanceof Error && (error.message.includes('connect') || error.message.includes('ECONNREFUSED'))) {
            console.log("Database unavailable, using demo fallback");

            // Check for demo credentials
            if ((identifier === '12345' || identifier === 'student@saveraks.school.th') && password === 'password123') {
                const token = jwt.sign({ userId: 'demo-student', role: 'STUDENT' }, JWT_SECRET, { expiresIn: '7d' });

                res.json({
                    message: "Login successful (Demo Mode).",
                    token,
                    user: {
                        id: 'demo-student',
                        name: 'Demo Student',
                        role: 'STUDENT',
                        studentId: '12345',
                        email: 'student@saveraks.school.th'
                    }
                });
                return;
            }

            if ((identifier === 'admin@saveraks.school.th') && password === 'password123') {
                const token = jwt.sign({ userId: 'demo-admin', role: 'ADMIN' }, JWT_SECRET, { expiresIn: '7d' });

                res.json({
                    message: "Login successful (Demo Mode).",
                    token,
                    user: {
                        id: 'demo-admin',
                        name: 'Admin SaveRaks',
                        role: 'ADMIN',
                        studentId: null,
                        email: 'admin@saveraks.school.th'
                    }
                });
                return;
            }
        }

        res.status(500).json({ error: "Login failed." });
    }
};

// --- Utility: Verification Endpoint (Returns student info) ---
export const verifyStudent = async (req: Request, res: Response): Promise<void> => {
    console.log("VERIFY-STUDENT CONTROLLER HIT!");
    const { studentId } = req.body;
    try {
        const studentRecord = await prisma.studentsMaster.findUnique({ where: { studentId } });

        if (!studentRecord) {
            console.log("RESPONSE STATUS: 404 - Student not found");
            res.status(404).json({ success: false, error: "Student ID not found." });
            return;
        }

        if (studentRecord.isRegistered) {
            console.log("RESPONSE STATUS: 400 - Already registered");
            res.status(400).json({ success: false, error: "Already registered." });
            return;
        }

        // Return student information for frontend display
        console.log("RESPONSE STATUS: 200 - Success");
        res.json({
            success: true,
            message: "Valid Student ID.",
            student: {
                fullName: `${studentRecord.prefix ? studentRecord.prefix + ' ' : ''}${studentRecord.firstName} ${studentRecord.lastName}`,
                firstName: studentRecord.firstName,
                lastName: studentRecord.lastName,
                classRoom: `${studentRecord.grade}/${studentRecord.room}`,
                grade: studentRecord.grade,
                room: studentRecord.room
            }
        });
    } catch (e) {
        console.error("Verification error:", e);
        console.log("RESPONSE STATUS: 500 - Server error");
        res.status(500).json({ success: false, error: "Verification failed." });
    }
};