
import { Router } from 'express';
import { registerStudent, registerStaff, login, verifyStudent } from '../controllers/auth.controller';

console.log("AUTH ROUTES FILE LOADED");

const router = Router();

// Login
router.post('/login', login);

// Register Student
router.post('/verify-student', verifyStudent);
console.log("ROUTE REGISTERED: POST /verify-student");
router.post('/register/student', registerStudent);

// Register Staff
router.post('/register/staff', registerStaff);

export default router;
