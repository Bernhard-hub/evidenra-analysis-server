/**
 * ═══════════════════════════════════════════════════════════
 * 🎯 ADVANCED FITNESS EVALUATION SYSTEM
 * ═══════════════════════════════════════════════════════════
 *
 * Intelligente, multi-dimensionale Fitness-Berechnung die ECHTE
 * Qualität misst, nicht nur simple Metriken.
 */

export class AdvancedFitness {
  constructor() {
    this.weights = {
      // Core Metrics (60%)
      successRate: 0.25,      // 25%: Funktioniert es überhaupt?
      quality: 0.20,          // 20%: Inhaltliche Qualität
      efficiency: 0.15,       // 15%: Cost + Token Efficiency

      // Advanced Metrics (40%)
      consistency: 0.15,      // 15%: Konsistente Ergebnisse?
      userSatisfaction: 0.10, // 10%: Implizites User-Feedback
      innovation: 0.10,       // 10%: Entdeckt neue Strategien?
      stability: 0.05         //  5%: Keine Crashes/Errors
    };

    // Thresholds für verschiedene Quality-Levels
    this.qualityThresholds = {
      excellent: 0.85,
      good: 0.70,
      acceptable: 0.55,
      poor: 0.40
    };
  }

  /**
   * 🎯 Hauptfunktion: Berechne Fitness mit allen Faktoren
   */
  calculateFitness(gene, recentResults = []) {
    const metrics = this.gatherMetrics(gene, recentResults);

    const fitness = (
      this.evaluateSuccessRate(metrics) * this.weights.successRate +
      this.evaluateQuality(metrics) * this.weights.quality +
      this.evaluateEfficiency(metrics) * this.weights.efficiency +
      this.evaluateConsistency(metrics) * this.weights.consistency +
      this.evaluateUserSatisfaction(metrics) * this.weights.userSatisfaction +
      this.evaluateInnovation(metrics) * this.weights.innovation +
      this.evaluateStability(metrics) * this.weights.stability
    );

    return {
      fitness: Math.max(0, Math.min(1, fitness)),
      breakdown: {
        successRate: this.evaluateSuccessRate(metrics),
        quality: this.evaluateQuality(metrics),
        efficiency: this.evaluateEfficiency(metrics),
        consistency: this.evaluateConsistency(metrics),
        userSatisfaction: this.evaluateUserSatisfaction(metrics),
        innovation: this.evaluateInnovation(metrics),
        stability: this.evaluateStability(metrics)
      },
      metrics: metrics
    };
  }

  /**
   * Sammle alle verfügbaren Metriken
   */
  gatherMetrics(gene, recentResults) {
    const totalTries = gene.successCount + gene.failureCount;

    return {
      // Basic Stats
      successRate: totalTries > 0 ? gene.successCount / totalTries : 0.5,
      totalCalls: totalTries,
      age: gene.age,
      generation: gene.generation,
      mutations: gene.mutations,

      // Cost & Token Efficiency
      avgTokens: gene.avgTokens || 0,
      avgCost: gene.avgCost || 0,
      avgResponseTime: gene.avgResponseTime || 0,

      // Quality Metrics
      avgQuality: gene.avgQuality || 0.5,
      avgWordCount: gene.avgWordCount || 0,
      avgCitationAccuracy: gene.avgCitationAccuracy || 0,

      // Consistency (variance in results)
      recentResults: recentResults.slice(-10), // Last 10 results

      // Innovation (how different from baseline)
      innovationScore: this.calculateInnovation(gene),

      // Stability
      errorCount: gene.errorCount || 0,
      crashCount: gene.crashCount || 0
    };
  }

  /**
   * 1. Success Rate Evaluation
   * Nicht linear - 90% ist viel besser als 80%
   */
  evaluateSuccessRate(metrics) {
    const rate = metrics.successRate;

    // Exponential curve: kleine Unterschiede bei hohen Werten zählen mehr
    if (rate >= 0.95) return 1.0;
    if (rate >= 0.90) return 0.95;
    if (rate >= 0.85) return 0.85;
    if (rate >= 0.80) return 0.70;
    if (rate >= 0.70) return 0.50;
    if (rate >= 0.60) return 0.30;
    return rate * 0.5; // Below 60% is bad
  }

  /**
   * 2. Quality Evaluation
   * Multi-dimensional: Word Count, Citations, Coherence
   */
  evaluateQuality(metrics) {
    let score = 0;

    // Base quality score
    score += metrics.avgQuality * 0.4;

    // Word count quality (target-dependent)
    const wordCountScore = this.evaluateWordCount(metrics.avgWordCount, metrics.category);
    score += wordCountScore * 0.3;

    // Citation accuracy (if applicable)
    if (metrics.avgCitationAccuracy > 0) {
      score += metrics.avgCitationAccuracy * 0.3;
    } else {
      score += 0.15; // Neutral if not applicable
    }

    return Math.min(score, 1.0);
  }

  /**
   * Word Count Evaluation (context-aware)
   */
  evaluateWordCount(wordCount, category) {
    if (!wordCount) return 0.5;

    const targets = {
      'scientific_article_section': { ideal: 2000, min: 1500, max: 2500 },
      'omniscience_query': { ideal: 800, min: 500, max: 1200 },
      'report_generation': { ideal: 3000, min: 2000, max: 4000 },
      'basis_report': { ideal: 1500, min: 1200, max: 1800 }
    };

    const target = targets[category] || { ideal: 1500, min: 1000, max: 2000 };

    if (wordCount >= target.min && wordCount <= target.max) {
      // Within range: score based on proximity to ideal
      const distance = Math.abs(wordCount - target.ideal);
      const range = target.max - target.min;
      return 1.0 - (distance / range) * 0.3;
    } else if (wordCount < target.min) {
      // Too short
      return (wordCount / target.min) * 0.7;
    } else {
      // Too long (penalty for verbosity)
      const excess = wordCount - target.max;
      return Math.max(0.5, 1.0 - (excess / target.ideal) * 0.5);
    }
  }

  /**
   * 3. Efficiency Evaluation
   * Balanciert Cost vs Token Usage
   */
  evaluateEfficiency(metrics) {
    let score = 0;

    // Token Efficiency (lower is better for same quality)
    const tokenScore = this.evaluateTokenEfficiency(metrics.avgTokens);
    score += tokenScore * 0.6;

    // Cost Efficiency
    const costScore = this.evaluateCostEfficiency(metrics.avgCost);
    score += costScore * 0.4;

    return score;
  }

  evaluateTokenEfficiency(avgTokens) {
    if (!avgTokens) return 0.5;

    // Optimal ranges per category (will be learned over time)
    if (avgTokens < 500) return 1.0;
    if (avgTokens < 1000) return 0.9;
    if (avgTokens < 2000) return 0.8;
    if (avgTokens < 4000) return 0.6;
    if (avgTokens < 6000) return 0.4;
    return 0.2;
  }

  evaluateCostEfficiency(avgCost) {
    if (!avgCost) return 0.5;

    // Cost thresholds ($ per call)
    if (avgCost < 0.01) return 1.0;
    if (avgCost < 0.05) return 0.9;
    if (avgCost < 0.10) return 0.8;
    if (avgCost < 0.25) return 0.6;
    if (avgCost < 0.50) return 0.4;
    return 0.2;
  }

  /**
   * 4. Consistency Evaluation
   * Variance in results - lower is better
   */
  evaluateConsistency(metrics) {
    if (!metrics.recentResults || metrics.recentResults.length < 3) {
      return 0.5; // Not enough data
    }

    const results = metrics.recentResults;

    // Calculate variance in quality scores
    const qualities = results.map(r => r.quality || 0.5);
    const mean = qualities.reduce((a, b) => a + b, 0) / qualities.length;
    const variance = qualities.reduce((sum, q) => sum + Math.pow(q - mean, 2), 0) / qualities.length;
    const stdDev = Math.sqrt(variance);

    // Low variance = high consistency
    if (stdDev < 0.05) return 1.0;
    if (stdDev < 0.10) return 0.9;
    if (stdDev < 0.15) return 0.8;
    if (stdDev < 0.20) return 0.6;
    return Math.max(0.3, 1.0 - stdDev * 2);
  }

  /**
   * 5. User Satisfaction (implicit feedback)
   * Basiert auf Nutzungsverhalten
   */
  evaluateUserSatisfaction(metrics) {
    let score = 0.5; // Neutral start

    // If gene is used frequently, it's probably good
    if (metrics.age > 50) {
      score += 0.2; // Survived many generations
    } else if (metrics.age > 20) {
      score += 0.1;
    }

    // Low error/crash rate = good
    const errorRate = metrics.totalCalls > 0 ?
      (metrics.errorCount + metrics.crashCount) / metrics.totalCalls : 0;

    if (errorRate < 0.01) score += 0.3;
    else if (errorRate < 0.05) score += 0.2;
    else if (errorRate < 0.10) score += 0.1;
    else score -= 0.2; // High error rate is bad

    return Math.max(0, Math.min(1, score));
  }

  /**
   * 6. Innovation Score
   * Wie "anders" ist dieses Gen?
   */
  evaluateInnovation(metrics) {
    // Innovation basiert auf Mutations-Count und Generation
    const innovationFromMutations = Math.min(metrics.mutations / 10, 0.5);
    const innovationFromGeneration = Math.min(metrics.generation / 20, 0.3);

    // Aber: Nur wenn es auch funktioniert!
    const successModifier = metrics.successRate;

    return (innovationFromMutations + innovationFromGeneration) * successModifier;
  }

  calculateInnovation(gene) {
    // Measure how different this gene's DNA is from baseline
    const uniqueTraits = new Set(Object.values(gene.dna)).size;
    return Math.min(uniqueTraits / 5, 1.0);
  }

  /**
   * 7. Stability Evaluation
   * Crashes und Errors sind sehr schlecht
   */
  evaluateStability(metrics) {
    const totalCalls = metrics.totalCalls || 1;
    const errorRate = (metrics.errorCount + metrics.crashCount * 2) / totalCalls;

    if (errorRate === 0) return 1.0;
    if (errorRate < 0.01) return 0.95;
    if (errorRate < 0.05) return 0.80;
    if (errorRate < 0.10) return 0.60;
    return Math.max(0.2, 1.0 - errorRate * 5);
  }

  /**
   * Adaptive Weights - lernt über Zeit welche Metriken wichtig sind
   */
  adaptWeights(globalStats) {
    // Wenn Cost ein großes Problem ist, erhöhe efficiency weight
    if (globalStats.avgCost > 0.50) {
      this.weights.efficiency = Math.min(0.25, this.weights.efficiency + 0.05);
      this.weights.quality = Math.max(0.15, this.weights.quality - 0.05);
    }

    // Wenn Success Rate niedrig ist, fokussiere darauf
    if (globalStats.avgSuccessRate < 0.80) {
      this.weights.successRate = Math.min(0.35, this.weights.successRate + 0.05);
      this.weights.innovation = Math.max(0.05, this.weights.innovation - 0.05);
    }

    // Wenn Qualität schwankt, fokussiere Consistency
    if (globalStats.qualityVariance > 0.20) {
      this.weights.consistency = Math.min(0.25, this.weights.consistency + 0.05);
      this.weights.quality = Math.max(0.15, this.weights.quality - 0.05);
    }
  }

  /**
   * Quality-Level Classification
   */
  getQualityLevel(fitness) {
    if (fitness >= this.qualityThresholds.excellent) return 'excellent';
    if (fitness >= this.qualityThresholds.good) return 'good';
    if (fitness >= this.qualityThresholds.acceptable) return 'acceptable';
    if (fitness >= this.qualityThresholds.poor) return 'poor';
    return 'critical';
  }

  /**
   * Generate detailed fitness report
   */
  generateReport(gene, recentResults) {
    const evaluation = this.calculateFitness(gene, recentResults);

    return {
      geneId: gene.id,
      category: gene.category,
      fitness: evaluation.fitness,
      level: this.getQualityLevel(evaluation.fitness),
      breakdown: evaluation.breakdown,
      metrics: evaluation.metrics,
      recommendations: this.generateRecommendations(evaluation),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate actionable recommendations
   */
  generateRecommendations(evaluation) {
    const recommendations = [];
    const breakdown = evaluation.breakdown;

    if (breakdown.successRate < 0.7) {
      recommendations.push({
        priority: 'high',
        metric: 'successRate',
        issue: 'Low success rate',
        suggestion: 'Consider mutating this gene or replacing with more successful variant'
      });
    }

    if (breakdown.efficiency < 0.5) {
      recommendations.push({
        priority: 'medium',
        metric: 'efficiency',
        issue: 'High cost/token usage',
        suggestion: 'Try shorter, more focused prompts'
      });
    }

    if (breakdown.consistency < 0.6) {
      recommendations.push({
        priority: 'medium',
        metric: 'consistency',
        issue: 'Inconsistent results',
        suggestion: 'Add more structure to prompt template'
      });
    }

    if (breakdown.quality < 0.6) {
      recommendations.push({
        priority: 'high',
        metric: 'quality',
        issue: 'Low output quality',
        suggestion: 'Refine DNA traits for better content generation'
      });
    }

    return recommendations;
  }
}

export default AdvancedFitness;
