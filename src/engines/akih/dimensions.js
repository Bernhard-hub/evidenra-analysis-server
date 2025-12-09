/**
 * AKIH Dimensions - GESCHÜTZT
 *
 * Die 10 Dimensionen des AKIH-Scores
 */

export const AKIH_DIMENSIONS = {
  // D1-D3: Coding Quality (40%)
  D1_PRECISION: {
    name: 'Precision',
    weight: 0.15,
    description: 'Korrektheit der Kodierungen',
    calculate: (data) => {
      if (!data.codings?.length) return 0;
      const withCategory = data.codings.filter(c => c.category).length;
      return withCategory / data.codings.length;
    }
  },

  D2_RECALL: {
    name: 'Recall',
    weight: 0.15,
    description: 'Vollständigkeit der Analyse',
    calculate: (data) => {
      if (!data.totalSegments) return 0;
      return Math.min(data.codings?.length / data.totalSegments, 1);
    }
  },

  D3_CONSISTENCY: {
    name: 'Consistency',
    weight: 0.10,
    description: 'Konsistenz der Kodierungen',
    calculate: (data) => {
      if (!data.codings?.length) return 0.5;
      // Prüfe ob ähnliche Texte gleich kodiert wurden
      const categoryUsage = {};
      data.codings.forEach(c => {
        const cat = c.category || 'none';
        categoryUsage[cat] = (categoryUsage[cat] || 0) + 1;
      });
      const categories = Object.values(categoryUsage);
      if (categories.length === 0) return 0.5;
      const avg = data.codings.length / categories.length;
      const variance = categories.reduce((s, c) => s + Math.pow(c - avg, 2), 0) / categories.length;
      return Math.max(0.3, 1 - variance / (avg * avg));
    }
  },

  // D4-D5: Theoretical Saturation (35%)
  D4_SATURATION: {
    name: 'Saturation',
    weight: 0.20,
    description: 'Theoretische Sättigung',
    calculate: (data) => {
      if (!data.categories?.length) return 0;
      // Sättigung = keine neuen Kategorien in letzten Kodierungen
      const recentCodings = data.codings?.slice(-10) || [];
      const allCategories = new Set(data.codings?.map(c => c.category));
      const recentCategories = new Set(recentCodings.map(c => c.category));
      const newCategories = [...recentCategories].filter(c => !allCategories.has(c));
      return 1 - (newCategories.length / Math.max(recentCategories.size, 1));
    }
  },

  D5_COVERAGE: {
    name: 'Coverage',
    weight: 0.15,
    description: 'Dokumentabdeckung',
    calculate: (data) => {
      if (!data.documents?.length) return 0;
      const docsWithCodings = new Set(data.codings?.map(c => c.documentId));
      return docsWithCodings.size / data.documents.length;
    }
  },

  // D6-D8: Methodological Rigor (25%)
  D6_INTEGRATION: {
    name: 'Integration',
    weight: 0.10,
    description: 'Kategorien-Integration',
    calculate: (data) => {
      if (!data.categories?.length) return 0;
      // Prüfe ob Kategorien miteinander verknüpft sind
      const withRelations = data.categories.filter(c => c.relations?.length > 0);
      return withRelations.length / data.categories.length;
    }
  },

  D7_TRACEABILITY: {
    name: 'Traceability',
    weight: 0.08,
    description: 'Nachvollziehbarkeit',
    calculate: (data) => {
      if (!data.codings?.length) return 0;
      const withReasoning = data.codings.filter(c => c.reasoning || c.memo);
      return withReasoning.length / data.codings.length;
    }
  },

  D8_REFLEXIVITY: {
    name: 'Reflexivity',
    weight: 0.07,
    description: 'Reflexivität',
    calculate: (data) => {
      // Prüfe ob Memos vorhanden sind
      const memoCount = data.memos?.length || 0;
      const idealMemos = Math.ceil(data.codings?.length / 10);
      return Math.min(memoCount / Math.max(idealMemos, 1), 1);
    }
  }
};

/**
 * Berechnet AKIH Score aus allen Dimensionen
 */
export function calculateFullAKIHScore(data) {
  const dimensions = {};
  let totalWeight = 0;
  let weightedSum = 0;

  for (const [key, dim] of Object.entries(AKIH_DIMENSIONS)) {
    const value = dim.calculate(data);
    dimensions[key] = {
      name: dim.name,
      value: Math.round(value * 100) / 100,
      weight: dim.weight,
      description: dim.description
    };
    weightedSum += value * dim.weight;
    totalWeight += dim.weight;
  }

  const overallScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

  return {
    overall: Math.round(overallScore * 100) / 100,
    dimensions,
    level: getScoreLevel(overallScore),
    timestamp: new Date().toISOString()
  };
}

function getScoreLevel(score) {
  if (score >= 0.9) return { level: 'excellent', label: 'Exzellent', color: '#10b981' };
  if (score >= 0.75) return { level: 'good', label: 'Gut', color: '#3b82f6' };
  if (score >= 0.6) return { level: 'acceptable', label: 'Akzeptabel', color: '#f59e0b' };
  if (score >= 0.4) return { level: 'needs-improvement', label: 'Verbesserungswürdig', color: '#f97316' };
  return { level: 'insufficient', label: 'Unzureichend', color: '#ef4444' };
}

export default { AKIH_DIMENSIONS, calculateFullAKIHScore };
