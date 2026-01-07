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

// Trust proxy for Railway/Vercel
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({
    origin: true,
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
    logger.info(`🌍 Environment: ${process.env.NODE_ENV}`);
    logger.info(`🔗 DB URL defined: ${!!process.env.DATABASE_URL}`);
    logger.info(`📡 CORS Origin: ${process.env.CORS_ORIGIN || 'Not defined (Defaulting to open)'}`);
});

export default app;
