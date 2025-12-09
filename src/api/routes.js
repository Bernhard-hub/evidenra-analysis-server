/**
 * API Routes für EVIDENRA Analyse Server
 *
 * Alle geschützten Analyse-Endpoints
 */

import { Router } from 'express';
import { requireFeature } from '../auth/supabase-jwt-validator.js';

// Engine Imports (GESCHÜTZT - nicht im Client sichtbar!)
import { analyzeWithMayring } from '../engines/methodologies/mayring.js';
import { analyzeWithGroundedTheory } from '../engines/methodologies/grounded-theory.js';
import { calculateAKIHScore } from '../engines/akih/scoring.js';
import { evolvePrompt } from '../engines/genesis/genetic-algorithm.js';
import { analyzeWithPersonas } from '../engines/personas/index.js';

const router = Router();

/**
 * POST /api/analyze
 * Hauptanalyse-Endpoint
 */
router.post('/analyze', async (req, res) => {
  try {
    const { text, methodology, personas, options } = req.body;

    if (!text || text.length < 10) {
      return res.status(400).json({
        error: 'Invalid Input',
        message: 'Text must be at least 10 characters'
      });
    }

    // Methodologie-Analyse
    let analysisResult;
    switch (methodology) {
      case 'mayring':
        analysisResult = await analyzeWithMayring(text, options);
        break;
      case 'grounded-theory':
        analysisResult = await analyzeWithGroundedTheory(text, options);
        break;
      default:
        analysisResult = await analyzeWithMayring(text, options);
    }

    // Persona-Analyse (falls angefordert)
    let personaInsights = null;
    if (personas && personas.length > 0) {
      personaInsights = await analyzeWithPersonas(text, personas);
    }

    // AKIH Score berechnen (falls Feature verfügbar)
    let akihScore = null;
    if (req.user.features.akih) {
      akihScore = await calculateAKIHScore(analysisResult, text);
    }

    res.json({
      success: true,
      codings: analysisResult.codings,
      categories: analysisResult.categories,
      akihScore,
      personaInsights,
      methodology,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Analysis Error:', error);
    res.status(500).json({
      error: 'Analysis Failed',
      message: 'Unable to complete analysis'
    });
  }
});

/**
 * POST /api/score
 * AKIH Score Berechnung
 */
router.post('/score', requireFeature('akih'), async (req, res) => {
  try {
    const { codings, text, methodology } = req.body;

    const score = await calculateAKIHScore({ codings }, text, methodology);

    res.json({
      success: true,
      score,
      dimensions: score.dimensions,
      recommendations: score.recommendations
    });

  } catch (error) {
    console.error('Scoring Error:', error);
    res.status(500).json({
      error: 'Scoring Failed'
    });
  }
});

/**
 * POST /api/generate-categories
 * Automatische Kategorien-Generierung
 */
router.post('/generate-categories', async (req, res) => {
  try {
    const { codings, methodology, existingCategories } = req.body;

    // Kategorie-Generierung basierend auf Methodologie
    const categories = await generateCategories(codings, {
      methodology,
      existing: existingCategories
    });

    res.json({
      success: true,
      categories,
      suggestions: categories.suggestions
    });

  } catch (error) {
    console.error('Category Generation Error:', error);
    res.status(500).json({
      error: 'Category Generation Failed'
    });
  }
});

/**
 * POST /api/genesis/evolve
 * Genesis Engine - Prompt Evolution
 */
router.post('/genesis/evolve', requireFeature('genesis'), async (req, res) => {
  try {
    const { prompt, fitness, generations, populationSize } = req.body;

    const evolved = await evolvePrompt({
      basePrompt: prompt,
      fitnessFunction: fitness,
      generations: generations || 10,
      populationSize: populationSize || 20
    });

    res.json({
      success: true,
      evolvedPrompt: evolved.best,
      fitness: evolved.fitness,
      generations: evolved.generationsRun,
      improvements: evolved.improvements
    });

  } catch (error) {
    console.error('Genesis Evolution Error:', error);
    res.status(500).json({
      error: 'Evolution Failed'
    });
  }
});

/**
 * POST /api/personas/analyze
 * Multi-Persona Analyse
 */
router.post('/personas/analyze', async (req, res) => {
  try {
    const { text, personas } = req.body;

    // Prüfe ob User Zugriff auf angeforderte Personas hat
    const allowedPersonas = req.user.features.personas;
    const requestedPersonas = personas.filter(p =>
      allowedPersonas === 'all' || allowedPersonas.includes(p)
    );

    if (requestedPersonas.length === 0) {
      return res.status(403).json({
        error: 'No Personas Available',
        message: 'Upgrade your subscription for more personas'
      });
    }

    const insights = await analyzeWithPersonas(text, requestedPersonas);

    res.json({
      success: true,
      insights,
      personasUsed: requestedPersonas
    });

  } catch (error) {
    console.error('Persona Analysis Error:', error);
    res.status(500).json({
      error: 'Persona Analysis Failed'
    });
  }
});

// Hilfsfunktion für Kategorie-Generierung
async function generateCategories(codings, options) {
  // TODO: Implementierung der KI-gestützten Kategorien-Generierung
  return {
    categories: [],
    suggestions: []
  };
}

export { router as analyzeRoutes };
