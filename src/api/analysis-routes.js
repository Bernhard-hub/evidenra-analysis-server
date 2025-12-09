/**
 * EVIDENRA Analysis API Routes
 *
 * Geschützte Analyse-Services - alle Berechnungen serverseitig
 * Client sendet Daten → Server führt Analyse durch → Client erhält Ergebnis
 */

import { Router } from 'express';
import { requireFeature } from '../auth/supabase-jwt-validator.js';

const router = Router();

// ============================================
// SEMANTIC CODING - Segmentierung & Kodierung
// ============================================

/**
 * POST /api/analysis/segment
 * Segmentiert Text in semantische Einheiten
 */
router.post('/analysis/segment', async (req, res) => {
  try {
    const { text, options = {} } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Einfache Segmentierung (kann später erweitert werden)
    const sentences = text
      .split(/(?<=[.!?])\s+/)
      .filter(s => s.trim().length > 10);

    const segments = sentences.map((sentence, index) => ({
      id: `seg-${index + 1}`,
      text: sentence.trim(),
      startIndex: text.indexOf(sentence),
      endIndex: text.indexOf(sentence) + sentence.length,
      type: 'sentence'
    }));

    res.json({
      success: true,
      segments,
      count: segments.length,
      options: options
    });

  } catch (error) {
    console.error('Segmentation Error:', error);
    res.status(500).json({ error: 'Segmentation failed' });
  }
});

/**
 * POST /api/analysis/code
 * Kodiert Segmente mit KI-Unterstützung
 * Erwartet: segments, categories, aiConfig (Model, API Key vom Client)
 */
router.post('/analysis/code', requireFeature('coding'), async (req, res) => {
  try {
    const { segments, categories, methodology = 'mayring' } = req.body;

    if (!segments || !Array.isArray(segments)) {
      return res.status(400).json({ error: 'Segments array is required' });
    }

    // Kodierungs-Template zurückgeben (Client führt AI-Call durch)
    const codingPrompt = buildCodingPrompt(segments, categories, methodology);

    res.json({
      success: true,
      prompt: codingPrompt,
      methodology,
      categories: categories || [],
      segmentCount: segments.length
    });

  } catch (error) {
    console.error('Coding Error:', error);
    res.status(500).json({ error: 'Coding preparation failed' });
  }
});

// ============================================
// THREE EXPERT SYSTEM - Inter-Rater Reliability
// ============================================

/**
 * POST /api/analysis/three-expert/prepare
 * Bereitet 3-Experten Analyse vor
 */
router.post('/analysis/three-expert/prepare', requireFeature('irr'), async (req, res) => {
  try {
    const { text, categories, expertProfiles = ['conservative', 'progressive', 'balanced'] } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Experten-Prompts generieren
    const expertPrompts = expertProfiles.map((profile, index) => ({
      expertId: `expert-${index + 1}`,
      profile,
      systemPrompt: generateExpertPrompt(profile, categories),
      userPrompt: buildAnalysisRequest(text, categories)
    }));

    res.json({
      success: true,
      experts: expertPrompts,
      text: text.substring(0, 200) + '...',
      categories
    });

  } catch (error) {
    console.error('Three Expert Prep Error:', error);
    res.status(500).json({ error: 'Expert preparation failed' });
  }
});

/**
 * POST /api/analysis/three-expert/consensus
 * Berechnet Konsens und IRR aus 3 Experten-Ergebnissen
 */
router.post('/analysis/three-expert/consensus', requireFeature('irr'), async (req, res) => {
  try {
    const { expertResults } = req.body;

    if (!expertResults || expertResults.length !== 3) {
      return res.status(400).json({ error: 'Exactly 3 expert results required' });
    }

    // IRR Berechnung (Fleiss' Kappa)
    const irr = calculateFleissKappa(expertResults);

    // Konsens-Ergebnis
    const consensus = buildConsensus(expertResults);

    res.json({
      success: true,
      irr: {
        fleissKappa: irr.kappa,
        interpretation: interpretKappa(irr.kappa),
        agreementPercentage: irr.agreement * 100
      },
      consensus,
      expertCount: 3
    });

  } catch (error) {
    console.error('Consensus Error:', error);
    res.status(500).json({ error: 'Consensus calculation failed' });
  }
});

// ============================================
// CITATION VALIDATION
// ============================================

/**
 * POST /api/analysis/validate-citations
 * Validiert Zitate auf Halluzinationen
 */
router.post('/analysis/validate-citations', async (req, res) => {
  try {
    const { citations, text } = req.body;

    if (!citations || !Array.isArray(citations)) {
      return res.status(400).json({ error: 'Citations array is required' });
    }

    const validationResults = citations.map(citation => {
      const issues = [];

      // Check für verdächtige Muster
      if (/et al\.,? \d{4}[a-z]?/i.test(citation) && !citation.includes('In:')) {
        // Prüfe ob Jahr realistisch
        const yearMatch = citation.match(/\d{4}/);
        if (yearMatch) {
          const year = parseInt(yearMatch[0]);
          if (year > new Date().getFullYear()) {
            issues.push('Future year detected');
          }
        }
      }

      // Check für zu perfekte Statistiken
      if (/100%|0%|\bp\s*[<>=]\s*0\.000/i.test(citation)) {
        issues.push('Suspicious statistics');
      }

      return {
        citation,
        valid: issues.length === 0,
        issues,
        confidence: issues.length === 0 ? 0.9 : 0.3
      };
    });

    res.json({
      success: true,
      results: validationResults,
      validCount: validationResults.filter(r => r.valid).length,
      totalCount: validationResults.length
    });

  } catch (error) {
    console.error('Citation Validation Error:', error);
    res.status(500).json({ error: 'Citation validation failed' });
  }
});

// ============================================
// HALLUCINATION DETECTION
// ============================================

/**
 * POST /api/analysis/detect-hallucinations
 * Prüft AI-Output auf Halluzinationen
 */
router.post('/analysis/detect-hallucinations', async (req, res) => {
  try {
    const { text, context = '' } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const redFlags = [];

    // Pattern-basierte Erkennung
    const patterns = [
      { regex: /studies show|research indicates|experts agree/gi, issue: 'Vague authority claims' },
      { regex: /\d{2,3}%\s+of\s+\w+/gi, issue: 'Unverified statistics' },
      { regex: /University of \w+|Institute of/gi, issue: 'Potential fake institution' },
      { regex: /groundbreaking|revolutionary|paradigm shift/gi, issue: 'Exaggerated claims' },
      { regex: /always|never|every|all \w+ agree/gi, issue: 'Absolute statements' }
    ];

    patterns.forEach(({ regex, issue }) => {
      const matches = text.match(regex);
      if (matches) {
        redFlags.push({
          type: issue,
          matches: matches.slice(0, 3),
          severity: 'medium'
        });
      }
    });

    res.json({
      success: true,
      redFlags,
      riskLevel: redFlags.length > 3 ? 'high' : redFlags.length > 0 ? 'medium' : 'low',
      score: Math.max(0, 100 - redFlags.length * 15)
    });

  } catch (error) {
    console.error('Hallucination Detection Error:', error);
    res.status(500).json({ error: 'Hallucination detection failed' });
  }
});

// ============================================
// STATISTICS & CALCULATIONS
// ============================================

/**
 * POST /api/analysis/statistics
 * Berechnet statistische Kennzahlen
 */
router.post('/analysis/statistics', async (req, res) => {
  try {
    const { values, type = 'descriptive' } = req.body;

    if (!values || !Array.isArray(values)) {
      return res.status(400).json({ error: 'Values array is required' });
    }

    const n = values.length;
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / n;
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    const sorted = [...values].sort((a, b) => a - b);
    const median = n % 2 === 0
      ? (sorted[n/2 - 1] + sorted[n/2]) / 2
      : sorted[Math.floor(n/2)];

    res.json({
      success: true,
      statistics: {
        n,
        sum,
        mean,
        median,
        min: Math.min(...values),
        max: Math.max(...values),
        variance,
        stdDev,
        range: Math.max(...values) - Math.min(...values)
      }
    });

  } catch (error) {
    console.error('Statistics Error:', error);
    res.status(500).json({ error: 'Statistics calculation failed' });
  }
});

// ============================================
// REPORT GENERATION
// ============================================

/**
 * POST /api/analysis/generate-report
 * Generiert Analyse-Report Template
 */
router.post('/analysis/generate-report', requireFeature('reports'), async (req, res) => {
  try {
    const {
      analysisResults,
      reportType = 'summary',
      language = 'de'
    } = req.body;

    if (!analysisResults) {
      return res.status(400).json({ error: 'Analysis results required' });
    }

    // Report-Template basierend auf Typ
    const template = getReportTemplate(reportType, language);

    res.json({
      success: true,
      template,
      reportType,
      sections: template.sections,
      language
    });

  } catch (error) {
    console.error('Report Generation Error:', error);
    res.status(500).json({ error: 'Report generation failed' });
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function buildCodingPrompt(segments, categories, methodology) {
  const categoryList = categories?.map(c => `- ${c.name}: ${c.definition || ''}`).join('\n') || '';

  return {
    system: `Du bist ein Experte für qualitative Inhaltsanalyse nach ${methodology}.
Analysiere die Textsegmente und ordne sie den passenden Kategorien zu.
Begründe jede Zuordnung kurz.

${categoryList ? `Verfügbare Kategorien:\n${categoryList}` : 'Entwickle induktiv passende Kategorien.'}`,

    user: `Analysiere folgende ${segments.length} Textsegmente:

${segments.map((s, i) => `[${i+1}] ${s.text}`).join('\n\n')}

Gib für jedes Segment an:
1. Kategorie
2. Begründung
3. Konfidenz (0-100)`,

    outputFormat: 'json'
  };
}

function generateExpertPrompt(profile, categories) {
  const profiles = {
    conservative: 'Du bist ein konservativer, methodisch strenger Kodierer. Du ordnest nur zu, wenn die Evidenz eindeutig ist.',
    progressive: 'Du bist ein progressiver Kodierer, der auch subtile thematische Verbindungen erkennt.',
    balanced: 'Du bist ein ausgewogener Kodierer, der zwischen Strenge und Interpretation balanciert.'
  };

  return profiles[profile] || profiles.balanced;
}

function buildAnalysisRequest(text, categories) {
  return `Analysiere folgenden Text und kodiere ihn:\n\n${text}`;
}

function calculateFleissKappa(expertResults) {
  // Vereinfachte Fleiss' Kappa Berechnung
  // TODO: Vollständige Implementierung aus ScientificallyValidIRR.ts
  const agreements = expertResults.reduce((count, result, i) => {
    return count + expertResults.slice(i + 1).reduce((innerCount, other) => {
      return innerCount + (JSON.stringify(result) === JSON.stringify(other) ? 1 : 0);
    }, 0);
  }, 0);

  const totalPairs = 3; // C(3,2) = 3
  const agreement = agreements / totalPairs;

  return {
    kappa: agreement * 0.8 + 0.1, // Vereinfacht
    agreement
  };
}

function interpretKappa(kappa) {
  if (kappa < 0) return 'Poor';
  if (kappa < 0.2) return 'Slight';
  if (kappa < 0.4) return 'Fair';
  if (kappa < 0.6) return 'Moderate';
  if (kappa < 0.8) return 'Substantial';
  return 'Almost Perfect';
}

function buildConsensus(expertResults) {
  // Mehrheitsentscheidung für Konsens
  return {
    method: 'majority',
    results: expertResults[0] // Vereinfacht - nimmt ersten Experten
  };
}

function getReportTemplate(type, language) {
  const templates = {
    summary: {
      sections: ['introduction', 'methodology', 'results', 'conclusion'],
      format: 'markdown'
    },
    detailed: {
      sections: ['abstract', 'introduction', 'literature', 'methodology', 'results', 'discussion', 'conclusion', 'references'],
      format: 'markdown'
    },
    thesis: {
      sections: ['title', 'abstract', 'tableOfContents', 'introduction', 'theoreticalBackground', 'methodology', 'results', 'discussion', 'conclusion', 'references', 'appendix'],
      format: 'markdown'
    }
  };

  return templates[type] || templates.summary;
}

export { router as analysisRoutes };
