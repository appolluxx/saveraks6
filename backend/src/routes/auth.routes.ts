
import { Router } from 'express';
import { registerStudent, registerStaff, login, verifyStudent, getCurrentUser } from '../controllers/auth.controller.js';
import { authenticate } from '../utils/auth.middleware.js';

const router = Router();

// Debug Route
import { testDbConnection, testGeminiConnection } from '../controllers/debug.controller.js';
router.get('/test-db', testDbConnection);
router.get('/test-ai', testGeminiConnection);



// Login
router.get('/login', (req, res) => {
    res.status(405).json({
        success: false,
        error: 'Method Not Allowed. Please use POST request with JSON body { identifier, password }'
    });
});
router.post('/login', login);

// Register Student
router.post('/verify-student', verifyStudent);
router.post('/register/student', registerStudent);

// Register Staff
router.post('/register/staff', registerStaff);

// Get current user profile (Sync points)
router.get('/me', authenticate, getCurrentUser);

export default router;
