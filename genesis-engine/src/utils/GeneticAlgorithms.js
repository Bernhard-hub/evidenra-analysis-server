/**
 * ═══════════════════════════════════════════════════════════
 * 🧬 GENETIC ALGORITHMS
 * Utilities für genetische Operationen
 * ═══════════════════════════════════════════════════════════
 */

export class GeneticAlgorithms {
  constructor() {
    this.mutationStrategies = [
      'insertion',
      'deletion',
      'substitution',
      'swap',
      'inversion'
    ];
  }

  // ═══════════════════════════════════════════════════════════
  // 🔀 STRING CROSSOVER
  // ═══════════════════════════════════════════════════════════

  combineStrings(str1, str2, crossoverPoint = null) {
    // Wenn einer der Strings leer ist
    if (!str1) return str2;
    if (!str2) return str1;

    // Wähle Crossover-Punkt
    const point = crossoverPoint !== null
      ? crossoverPoint
      : Math.floor(Math.random() * Math.min(str1.length, str2.length));

    // Verschiedene Crossover-Strategien
    const strategy = Math.random();

    if (strategy < 0.4) {
      // Single-Point Crossover
      return str1.substring(0, point) + str2.substring(point);
    } else if (strategy < 0.7) {
      // Two-Point Crossover
      const point2 = Math.floor(Math.random() * Math.max(str1.length, str2.length));
      const start = Math.min(point, point2);
      const end = Math.max(point, point2);
      return str1.substring(0, start) + str2.substring(start, end) + str1.substring(end);
    } else {
      // Word-Level Crossover (intelligenter)
      return this.wordLevelCrossover(str1, str2);
    }
  }

  wordLevelCrossover(str1, str2) {
    const words1 = str1.split(' ');
    const words2 = str2.split(' ');
    const result = [];

    const maxLength = Math.max(words1.length, words2.length);

    for (let i = 0; i < maxLength; i++) {
      if (Math.random() < 0.5) {
        if (words1[i]) result.push(words1[i]);
      } else {
        if (words2[i]) result.push(words2[i]);
      }
    }

    return result.join(' ');
  }

  // ═══════════════════════════════════════════════════════════
  // ⚡ STRING MUTATION
  // ═══════════════════════════════════════════════════════════

  mutateString(str, mutationRate = 0.1) {
    if (!str || str.length === 0) return str;

    const strategy = this.mutationStrategies[
      Math.floor(Math.random() * this.mutationStrategies.length)
    ];

    switch (strategy) {
      case 'insertion':
        return this.insertionMutation(str);
      case 'deletion':
        return this.deletionMutation(str);
      case 'substitution':
        return this.substitutionMutation(str);
      case 'swap':
        return this.swapMutation(str);
      case 'inversion':
        return this.inversionMutation(str);
      default:
        return str;
    }
  }

  insertionMutation(str) {
    const words = str.split(' ');
    const insertWords = [
      'deeply', 'carefully', 'systematically', 'thoroughly',
      'innovative', 'critical', 'comprehensive', 'detailed'
    ];
    const insertPos = Math.floor(Math.random() * words.length);
    const insertWord = insertWords[Math.floor(Math.random() * insertWords.length)];
    words.splice(insertPos, 0, insertWord);
    return words.join(' ');
  }

  deletionMutation(str) {
    const words = str.split(' ');
    if (words.length <= 3) return str; // Don't delete if too short
    const deletePos = Math.floor(Math.random() * words.length);
    words.splice(deletePos, 1);
    return words.join(' ');
  }

  substitutionMutation(str) {
    const words = str.split(' ');
    const synonyms = {
      'analyze': ['examine', 'investigate', 'study', 'explore'],
      'identify': ['recognize', 'detect', 'find', 'discover'],
      'understand': ['comprehend', 'grasp', 'interpret', 'realize'],
      'explore': ['investigate', 'examine', 'probe', 'discover'],
      'patterns': ['trends', 'themes', 'motifs', 'structures']
    };

    for (let i = 0; i < words.length; i++) {
      const word = words[i].toLowerCase();
      if (synonyms[word] && Math.random() < 0.3) {
        const alternatives = synonyms[word];
        words[i] = alternatives[Math.floor(Math.random() * alternatives.length)];
      }
    }

    return words.join(' ');
  }

  swapMutation(str) {
    const words = str.split(' ');
    if (words.length < 2) return str;
    
    const pos1 = Math.floor(Math.random() * words.length);
    let pos2 = Math.floor(Math.random() * words.length);
    while (pos2 === pos1) {
      pos2 = Math.floor(Math.random() * words.length);
    }

    [words[pos1], words[pos2]] = [words[pos2], words[pos1]];
    return words.join(' ');
  }

  inversionMutation(str) {
    const words = str.split(' ');
    if (words.length < 3) return str;

    const start = Math.floor(Math.random() * (words.length - 2));
    const end = start + 2 + Math.floor(Math.random() * (words.length - start - 2));

    const inverted = words.slice(start, end).reverse();
    return [
      ...words.slice(0, start),
      ...inverted,
      ...words.slice(end)
    ].join(' ');
  }

  // ═══════════════════════════════════════════════════════════
  // 🎯 SELECTION ALGORITHMS
  // ═══════════════════════════════════════════════════════════

  tournamentSelection(population, tournamentSize = 3) {
    const tournament = [];
    
    for (let i = 0; i < tournamentSize; i++) {
      const randomIndex = Math.floor(Math.random() * population.length);
      tournament.push(population[randomIndex]);
    }

    return tournament.reduce((best, current) =>
      current.fitness > best.fitness ? current : best
    );
  }

  rouletteWheelSelection(population) {
    const totalFitness = population.reduce((sum, ind) => sum + ind.fitness, 0);
    let random = Math.random() * totalFitness;

    for (const individual of population) {
      random -= individual.fitness;
      if (random <= 0) {
        return individual;
      }
    }

    return population[population.length - 1];
  }

  rankSelection(population, selectionPressure = 2) {
    const sorted = [...population].sort((a, b) => b.fitness - a.fitness);
    const n = sorted.length;
    
    // Calculate rank-based probabilities
    const probabilities = sorted.map((_, index) => {
      const rank = index + 1;
      return (2 - selectionPressure) / n + (2 * rank * (selectionPressure - 1)) / (n * (n - 1));
    });

    // Roulette wheel with rank probabilities
    const totalProb = probabilities.reduce((sum, p) => sum + p, 0);
    let random = Math.random() * totalProb;

    for (let i = 0; i < sorted.length; i++) {
      random -= probabilities[i];
      if (random <= 0) {
        return sorted[i];
      }
    }

    return sorted[sorted.length - 1];
  }

  // ═══════════════════════════════════════════════════════════
  // 📊 FITNESS CALCULATION
  // ═══════════════════════════════════════════════════════════

  calculateFitnessMetrics(individual) {
    const metrics = {
      successRate: 0,
      consistency: 0,
      longevity: 0,
      innovation: 0,
      overall: 0
    };

    // Success Rate
    const totalAttempts = (individual.successCount || 0) + (individual.failureCount || 0);
    if (totalAttempts > 0) {
      metrics.successRate = individual.successCount / totalAttempts;
    } else {
      metrics.successRate = 0.5; // Neutral for untested
    }

    // Consistency (inverse of variance in performance)
    if (individual.performanceHistory && individual.performanceHistory.length > 1) {
      const mean = individual.performanceHistory.reduce((a, b) => a + b, 0) / individual.performanceHistory.length;
      const variance = individual.performanceHistory.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / individual.performanceHistory.length;
      metrics.consistency = Math.max(0, 1 - variance);
    } else {
      metrics.consistency = 0.5;
    }

    // Longevity (how long has it survived)
    metrics.longevity = Math.min(1, individual.generation / 100);

    // Innovation (how unique/novel)
    metrics.innovation = individual.noveltyFactor || 0.5;

    // Overall fitness (weighted average)
    metrics.overall = (
      metrics.successRate * 0.4 +
      metrics.consistency * 0.2 +
      metrics.longevity * 0.2 +
      metrics.innovation * 0.2
    );

    return metrics;
  }

  // ═══════════════════════════════════════════════════════════
  // 🌟 DIVERSITY MAINTENANCE
  // ═══════════════════════════════════════════════════════════

  calculateDiversity(population) {
    if (population.length < 2) return 0;

    let totalDistance = 0;
    let comparisons = 0;

    for (let i = 0; i < population.length; i++) {
      for (let j = i + 1; j < population.length; j++) {
        totalDistance += this.calculateGeneticDistance(population[i], population[j]);
        comparisons++;
      }
    }

    return comparisons > 0 ? totalDistance / comparisons : 0;
  }

  calculateGeneticDistance(gene1, gene2) {
    let distance = 0;

    // Compare content (if strings)
    if (gene1.content && gene2.content) {
      distance += this.levenshteinDistance(gene1.content, gene2.content) / Math.max(gene1.content.length, gene2.content.length);
    }

    // Compare traits
    if (gene1.traits && gene2.traits) {
      const traitKeys = new Set([...Object.keys(gene1.traits), ...Object.keys(gene2.traits)]);
      let traitDistance = 0;
      traitKeys.forEach(key => {
        const val1 = gene1.traits[key] || 0;
        const val2 = gene2.traits[key] || 0;
        traitDistance += Math.abs(val1 - val2);
      });
      distance += traitDistance / traitKeys.size;
    }

    // Compare categories
    if (gene1.category && gene2.category && gene1.category !== gene2.category) {
      distance += 0.5;
    }

    return distance / 3; // Normalize
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  // ═══════════════════════════════════════════════════════════
  // 🎲 UTILITY FUNCTIONS
  // ═══════════════════════════════════════════════════════════

  randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  weightedRandomChoice(items, weights) {
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < items.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return items[i];
      }
    }

    return items[items.length - 1];
  }

  shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}
