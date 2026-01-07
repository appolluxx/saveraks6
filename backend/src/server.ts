import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';
import logger from './utils/logger.js';
import authRoutes from './routes/auth.routes.js';
import actionRoutes from './routes/actions.routes.js';


config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);

        const allowedOrigins = [
            'http://localhost:5173',
            'http://localhost:80',
            process.env.FRONTEND_URL,
            process.env.CORS_ORIGIN
        ].filter(Boolean);

        // Allow if origin is in allowed list, matches vercel, or if CORS_ORIGIN is *
        if (
            allowedOrigins.includes(origin) ||
            origin.endsWith('.vercel.app') ||
            process.env.CORS_ORIGIN === '*'
        ) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

const limiter = rateLimit({
    windowMs: 900000,
    max: 100,
    message: { success: false, error: 'Too many requests' }
});
app.use(limiter);
app.use(express.json({ limit: '10mb' }));

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
    });
    next();
});



app.use('/api/auth', authRoutes);
app.use('/api/actions', actionRoutes);



app.listen(PORT, () => {
    logger.info(`🚀 SaveRaks 2.0 Backend running on port ${PORT}`);
});

export default app;
