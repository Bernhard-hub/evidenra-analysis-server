/**
 * EVIDENRA Analyse Server
 *
 * Geschützte Analyse-Logik für:
 * - Genesis Engine (Prompt Evolution)
 * - AKIH Scoring
 * - 7 Personas System
 * - Methodologie-Engines (Mayring, Grounded Theory, etc.)
 *
 * WICHTIG: Dieser Code läuft NUR auf dem Server - nicht im Client sichtbar!
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { validateSupabaseJWT } from './auth/supabase-jwt-validator.js';
import { analyzeRoutes } from './api/routes.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'https://evidenra.app',
    'https://basic.evidenra.com',
    'https://pro.evidenra.com',
    'https://ultimate.evidenra.com',
    // Lokale Entwicklung
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Health Check (öffentlich)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Auth Middleware für geschützte Routes
app.use('/api', validateSupabaseJWT);

// Geschützte API Routes
app.use('/api', analyzeRoutes);

// Error Handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║         EVIDENRA Analyse Server                   ║
╠═══════════════════════════════════════════════════╣
║  Status:  RUNNING                                 ║
║  Port:    ${PORT}                                      ║
║  Mode:    ${process.env.NODE_ENV || 'development'}                             ║
╚═══════════════════════════════════════════════════╝
  `);
});

export default app;
