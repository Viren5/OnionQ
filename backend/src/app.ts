import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { config } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import healthRouter from './routes/health';
import authRouter from './routes/auth';
import usersRouter from './routes/users';
import inspectionsRouter from './routes/inspections';
import analysisRouter from './routes/analysis';
//import gradingRouter from './routes/grading';
import verificationRouter from './routes/verification';
import reportsRouter from './routes/reports';

const app = express();

// ─── Security Headers ─────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// ─── CORS ─────────────────────────────────────────────────
app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── Static Uploads ───────────────────────────────────────
app.use('/uploads', express.static(path.resolve(config.uploadDir)));

// ─── Request Parsing ─────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Request Logging ─────────────────────────────────────
if (config.env !== 'test') {
  app.use(morgan(config.env === 'production' ? 'combined' : 'dev'));
}

// ─── API Routes ───────────────────────────────────────────
const API_PREFIX = '/api/v1';

app.use(`${API_PREFIX}/health`, healthRouter);
app.use(`${API_PREFIX}/auth`, authRouter);
app.use(`${API_PREFIX}/users`, usersRouter);
app.use(`${API_PREFIX}/inspections`, inspectionsRouter);
app.use(`${API_PREFIX}/analysis`, analysisRouter);
//app.use(`${API_PREFIX}/grading`, gradingRouter);
app.use(`${API_PREFIX}/verification`, verificationRouter);
app.use(`${API_PREFIX}/reports`, reportsRouter);

// ─── 404 Handler ──────────────────────────────────────────
app.use(notFoundHandler);

// ─── Global Error Handler ─────────────────────────────────
app.use(errorHandler);

export default app;
