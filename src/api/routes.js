/**
 * API Routes für EVIDENRA Analyse Server
 *
 * GESCHÜTZTE PROMPTS & LOGIK
 *
 * Der Server liefert nur die geschützten Prompts/Algorithmen.
 * Die App führt die KI-Aufrufe selbst durch (lokal oder Cloud mit User's Key).
 *
 * Architektur:
 * 1. App → Server: "Gib mir Mayring-Prompt"
 * 2. Server → App: Geschützter System-Prompt + User-Prompt Template
 * 3. App → Claude/Ollama: Führt Analyse mit eigenem Key durch
 * 4. App → Server: Ergebnisse zur AKIH-Bewertung senden
 */

import { Router } from 'express';
import { requireFeature } from '../auth/supabase-jwt-validator.js';

// Geschützte Prompts (NICHT im Client sichtbar!)
import { MAYRING_SYSTEM_PROMPT, MAYRING_USER_PROMPT_TEMPLATE } from '../engines/methodologies/mayring.js';
import { GROUNDED_THEORY_PROMPTS } from '../engines/methodologies/grounded-theory.js';
import { calculateAKIHScore, AKIH_DIMENSIONS } from '../engines/akih/scoring.js';
import { GENESIS_CONFIG } from '../engines/genesis/genetic-algorithm.js';
import { PERSONA_PROMPTS } from '../engines/personas/index.js';

const router = Router();

// ============================================
// PROMPT ENDPOINTS - Liefern geschützte Prompts
// ============================================

/**
 * GET /api/prompts/methodology/:name
 * Gibt geschützten Methodologie-Prompt zurück
 */
router.get('/prompts/methodology/:name', (req, res) => {
  const { name } = req.params;
  const { approach, categories } = req.query;

  try {
    let prompts;

    switch (name) {
      case 'mayring':
        prompts = {
          systemPrompt: MAYRING_SYSTEM_PROMPT,
          userPromptTemplate: MAYRING_USER_PROMPT_TEMPLATE,
          approach: approach || 'structuring',
          outputFormat: {
            type: 'json',
            schema: {
              codings: [{ text: 'string', category: 'string', reasoning: 'string' }],
              categories: [{ name: 'string', definition: 'string', anchorExample: 'string' }]
            }
          }
        };
        break;

      case 'grounded-theory':
        prompts = GROUNDED_THEORY_PROMPTS;
        break;

      case 'thematic':
        prompts = {
          systemPrompt: MAYRING_SYSTEM_PROMPT, // Ähnlich zu Mayring
          userPromptTemplate: MAYRING_USER_PROMPT_TEMPLATE,
          approach: 'thematic'
        };
        break;

      default:
        return res.status(404).json({
          error: 'Unknown Methodology',
          message: `Methodology '${name}' not found`,
          available: ['mayring', 'grounded-theory', 'thematic']
        });
    }

    res.json({
      success: true,
      methodology: name,
      prompts,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Prompt Retrieval Error:', error);
    res.status(500).json({ error: 'Failed to retrieve prompts' });
  }
});

/**
 * GET /api/prompts/personas
 * Gibt verfügbare Persona-Prompts zurück (basierend auf Subscription)
 */
router.get('/prompts/personas', (req, res) => {
  try {
    const allowedPersonas = req.user?.features?.personas || ['orthodox'];

    // Filtere Personas basierend auf Subscription
    const availablePersonas = {};

    if (allowedPersonas === 'all') {
      Object.assign(availablePersonas, PERSONA_PROMPTS);
    } else {
      for (const key of allowedPersonas) {
        if (PERSONA_PROMPTS[key]) {
          availablePersonas[key] = PERSONA_PROMPTS[key];
        }
      }
    }

    res.json({
      success: true,
      personas: availablePersonas,
      available: Object.keys(availablePersonas),
      subscription: req.user?.subscription || 'free'
    });

  } catch (error) {
    console.error('Persona Prompts Error:', error);
    res.status(500).json({ error: 'Failed to retrieve persona prompts' });
  }
});

/**
 * GET /api/prompts/genesis
 * Gibt Genesis Engine Konfiguration zurück (nur Pro/Ultimate)
 */
router.get('/prompts/genesis', requireFeature('genesis'), (req, res) => {
  try {
    res.json({
      success: true,
      config: GENESIS_CONFIG,
      mutationOperators: GENESIS_CONFIG.mutationOperators,
      fitnessMetrics: GENESIS_CONFIG.fitnessMetrics
    });

  } catch (error) {
    console.error('Genesis Config Error:', error);
    res.status(500).json({ error: 'Failed to retrieve Genesis config' });
  }
});

// ============================================
// SCORING ENDPOINTS - Verarbeiten Ergebnisse
// ============================================

/**
 * POST /api/score/akih
 * Berechnet AKIH Score aus Client-Ergebnissen
 * Client sendet Codings, Server berechnet Score
 */
router.post('/score/akih', requireFeature('akih'), async (req, res) => {
  try {
    const { codings, text, methodology, categories } = req.body;

    if (!codings || !Array.isArray(codings)) {
      return res.status(400).json({
        error: 'Invalid Input',
        message: 'Codings array is required'
      });
    }

    // AKIH Score Berechnung (serverseitig - Algorithmus geschützt)
    const score = calculateAKIHScore({
      codings,
      text,
      methodology,
      categories
    });

    res.json({
      success: true,
      score: score.overall,
      level: score.level,
      dimensions: score.dimensions,
      recommendations: score.recommendations,
      details: score.details
    });

  } catch (error) {
    console.error('AKIH Scoring Error:', error);
    res.status(500).json({ error: 'Scoring calculation failed' });
  }
});

/**
 * GET /api/score/akih/dimensions
 * Gibt AKIH Dimensionen und Gewichtungen zurück
 */
router.get('/score/akih/dimensions', requireFeature('akih'), (req, res) => {
  res.json({
    success: true,
    dimensions: AKIH_DIMENSIONS,
    levels: {
      novice: { min: 0, max: 39, description: 'Anfänger-Niveau' },
      developing: { min: 40, max: 59, description: 'Entwicklungs-Niveau' },
      proficient: { min: 60, max: 79, description: 'Kompetenz-Niveau' },
      expert: { min: 80, max: 100, description: 'Experten-Niveau' }
    }
  });
});

// ============================================
// FEATURE INFO ENDPOINTS
// ============================================

/**
 * GET /api/features
 * Gibt verfügbare Features basierend auf Subscription zurück
 */
router.get('/features', (req, res) => {
  res.json({
    success: true,
    subscription: req.user?.subscription || 'free',
    features: req.user?.features || {
      maxDocuments: 3,
      maxAnalysesPerDay: 5,
      personas: ['orthodox'],
      methodologies: ['basic'],
      genesis: false,
      akih: false
    }
  });
});

/**
 * GET /api/personas/list
 * Gibt Liste aller Personas mit Beschreibungen zurück
 */
router.get('/personas/list', (req, res) => {
  const allowedPersonas = req.user?.features?.personas || ['orthodox'];

  const personaList = Object.entries(PERSONA_PROMPTS).map(([key, persona]) => ({
    key,
    name: persona.name,
    description: persona.description,
    available: allowedPersonas === 'all' || allowedPersonas.includes(key)
  }));

  res.json({
    success: true,
    personas: personaList,
    subscription: req.user?.subscription || 'free'
  });
});

export { router as analyzeRoutes };
