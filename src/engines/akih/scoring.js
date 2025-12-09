/**
 * AKIH Scoring Engine - GESCHÜTZT
 *
 * Berechnet den AKIH-Score für qualitative Analysen
 * Dieser Code ist nur auf dem Server sichtbar!
 */

/**
 * Berechnet AKIH-Score basierend auf Analyse-Ergebnis
 */
export async function calculateAKIHScore(analysisResult, originalText, methodology = 'mayring') {
  const dimensions = {
    accuracy: calculateAccuracy(analysisResult, originalText),
    consistency: calculateConsistency(analysisResult),
    interpretiveDepth: calculateInterpretiveDepth(analysisResult),
    methodologicalRigor: calculateMethodologicalRigor(analysisResult, methodology),
    transparency: calculateTransparency(analysisResult)
  };

  // Gewichteter Gesamtscore
  const weights = {
    accuracy: 0.25,
    consistency: 0.20,
    interpretiveDepth: 0.25,
    methodologicalRigor: 0.20,
    transparency: 0.10
  };

  const overallScore = Object.entries(dimensions).reduce((sum, [key, value]) => {
    return sum + (value * weights[key]);
  }, 0);

  return {
    overall: Math.round(overallScore * 100) / 100,
    dimensions,
    level: getScoreLevel(overallScore),
    recommendations: generateRecommendations(dimensions)
  };
}

function calculateAccuracy(result, text) {
  // Genauigkeit: Wie gut decken die Codings den Text ab?
  if (!result.codings || result.codings.length === 0) return 0;

  const textLength = text.length;
  const codedTextLength = result.codings.reduce((sum, c) => sum + (c.text?.length || 0), 0);
  const coverage = Math.min(codedTextLength / textLength, 1);

  return coverage * 0.7 + 0.3; // Mindestens 30% für vorhandene Codings
}

function calculateConsistency(result) {
  // Konsistenz: Sind ähnliche Textstellen gleich codiert?
  if (!result.codings || result.codings.length < 2) return 0.5;

  // Prüfe Kategorie-Verwendung
  const categoryUsage = {};
  result.codings.forEach(c => {
    const cat = c.category || 'uncategorized';
    categoryUsage[cat] = (categoryUsage[cat] || 0) + 1;
  });

  const categories = Object.keys(categoryUsage);
  if (categories.length === 0) return 0.3;

  // Je gleichmäßiger die Verteilung, desto höher der Score
  const avgUsage = result.codings.length / categories.length;
  const variance = Object.values(categoryUsage).reduce((sum, count) => {
    return sum + Math.pow(count - avgUsage, 2);
  }, 0) / categories.length;

  return Math.max(0.3, 1 - (variance / (avgUsage * avgUsage)));
}

function calculateInterpretiveDepth(result) {
  // Interpretationstiefe: Wie tiefgehend sind die Analysen?
  if (!result.codings) return 0;

  let depth = 0;

  result.codings.forEach(coding => {
    // Hat Begründung?
    if (coding.reasoning) depth += 0.3;
    // Hat Memo?
    if (coding.memo) depth += 0.2;
    // Hat Sub-Kategorien?
    if (coding.subcategory) depth += 0.2;
    // Hat Verknüpfungen?
    if (coding.relations?.length > 0) depth += 0.3;
  });

  return Math.min(depth / result.codings.length, 1);
}

function calculateMethodologicalRigor(result, methodology) {
  // Methodologische Strenge: Werden methodische Standards eingehalten?
  let rigor = 0.5; // Basis

  if (result.categories?.length > 0) rigor += 0.1;
  if (result.categories?.length >= 3) rigor += 0.1;
  if (result.codings?.every(c => c.category)) rigor += 0.1;

  // Methodenspezifische Kriterien
  switch (methodology) {
    case 'mayring':
      if (result.categories?.some(c => c.definition)) rigor += 0.1;
      if (result.categories?.some(c => c.anchorExample)) rigor += 0.1;
      break;
    case 'grounded-theory':
      if (result.codings?.some(c => c.properties)) rigor += 0.1;
      if (result.codings?.some(c => c.dimensions)) rigor += 0.1;
      break;
  }

  return Math.min(rigor, 1);
}

function calculateTransparency(result) {
  // Transparenz: Ist der Analyseprozess nachvollziehbar?
  if (!result.codings) return 0;

  let transparency = 0;
  const total = result.codings.length;

  result.codings.forEach(coding => {
    if (coding.coder) transparency += 0.2;
    if (coding.timestamp) transparency += 0.2;
    if (coding.confidence) transparency += 0.3;
    if (coding.source) transparency += 0.3;
  });

  return Math.min(transparency / total, 1);
}

function getScoreLevel(score) {
  if (score >= 0.9) return 'excellent';
  if (score >= 0.75) return 'good';
  if (score >= 0.6) return 'acceptable';
  if (score >= 0.4) return 'needs-improvement';
  return 'insufficient';
}

function generateRecommendations(dimensions) {
  const recommendations = [];

  if (dimensions.accuracy < 0.6) {
    recommendations.push({
      dimension: 'accuracy',
      priority: 'high',
      message: 'Mehr Textstellen sollten kodiert werden um die Abdeckung zu verbessern'
    });
  }

  if (dimensions.consistency < 0.6) {
    recommendations.push({
      dimension: 'consistency',
      priority: 'high',
      message: 'Die Kategorieanwendung sollte konsistenter sein'
    });
  }

  if (dimensions.interpretiveDepth < 0.5) {
    recommendations.push({
      dimension: 'interpretiveDepth',
      priority: 'medium',
      message: 'Fügen Sie Memos und Begründungen zu den Kodierungen hinzu'
    });
  }

  if (dimensions.methodologicalRigor < 0.6) {
    recommendations.push({
      dimension: 'methodologicalRigor',
      priority: 'high',
      message: 'Definieren Sie Kategorien klarer mit Ankerbeispielen'
    });
  }

  if (dimensions.transparency < 0.5) {
    recommendations.push({
      dimension: 'transparency',
      priority: 'low',
      message: 'Dokumentieren Sie den Analyseprozess detaillierter'
    });
  }

  return recommendations;
}

export default { calculateAKIHScore };
