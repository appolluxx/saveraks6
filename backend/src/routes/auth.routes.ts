
import { Router } from 'express';
import { registerStudent, registerStaff, login, verifyStudent, getCurrentUser } from '../controllers/auth.controller.js';
import { authenticate } from '../utils/auth.middleware.js';

const router = Router();

// Debug Route
import { testDbConnection } from '../controllers/debug.controller.js';
router.get('/test-db', testDbConnection);


// Login
router.post('/login', login);

// Register Student
router.post('/verify-student', verifyStudent);
router.post('/register/student', registerStudent);

// Register Staff
router.post('/register/staff', registerStaff);

// Get current user profile (Sync points)
router.get('/me', authenticate, getCurrentUser);

export default router;
