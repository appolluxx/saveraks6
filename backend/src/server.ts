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
    origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:3000',
        'http://localhost:80',
        process.env.CORS_ORIGIN || ''
    ].filter(Boolean),
    credentials: true
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
