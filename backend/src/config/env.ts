import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'] as const;

function validateEnv(): void {
  const missing: string[] = [];

  for (const key of requiredEnvVars) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    console.error(
      `[Config] Missing required environment variables: ${missing.join(', ')}\n` +
        `Copy backend/.env.example to backend/.env and fill in the required values.`
    );
    process.exit(1);
  }
}

export const config = {
  env: process.env["NODE_ENV"] ?? "development",
  port: parseInt(process.env["PORT"] ?? "3001", 10),
  mongodbUri: process.env["MONGODB_URI"] as string,
  jwtSecret: process.env["JWT_SECRET"] as string,
  jwtExpiresIn: process.env["JWT_EXPIRES_IN"] ?? "7d",
  frontendUrl: process.env["FRONTEND_URL"] ?? "http://localhost:5173",
  aiServiceUrl: process.env["AI_SERVICE_URL"] ?? "http://localhost:8000",
  storageType: (process.env["STORAGE_TYPE"] ?? "local") as "local" | "cloud",
  uploadDir: process.env["UPLOAD_DIR"] ?? "./uploads",
  logLevel: process.env["LOG_LEVEL"] ?? "info",
} as const;

export { validateEnv };
