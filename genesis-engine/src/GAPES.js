/**
 * ═══════════════════════════════════════════════════════════
 * 🧬 GENESIS AUTONOMOUS PROMPT EVOLUTION SYSTEM (GAPES)
 * ═══════════════════════════════════════════════════════════
 *
 * REVOLUTIONÄRES FEATURE:
 * Genesis entwickelt EIGENE Prompts durch genetische Evolution!
 *
 * - Mutiert erfolgreiche Prompts
 * - Kombiniert beste Teile (Crossover)
 * - Erkennt Meta-Muster
 * - Selbst-optimierende Prompt-DNA
 */

import { AdvancedFitness } from './AdvancedFitness.js';

export class GAPES {
  constructor(genesisEngine) {
    this.genesis = genesisEngine;
    this.promptGenes = new Map(); // category -> PromptGene[]
    this.metaPatterns = new Map(); // Meta-Learning über Kategorien hinweg
    this.advancedFitness = new AdvancedFitness(); // 🎯 Advanced Fitness System
    this.recentResults = new Map(); // category -> recent results for fitness calculation

    // Initialize base prompt genes
    this.initializeBaseGenes();
  }

  /**
   * Initialize base prompt genes für verschiedene Kategorien
   */
  initializeBaseGenes() {
    const categories = [
      // TOP 10 High-Impact Features
      'omniscience_query',              // ✅ Already integrated
      'ultimate_report_section',        // #1: Highest cost savings
      'basis_report',                   // #2: Quick wins
      'citation_validation',            // #3: Quality improvement
      'akih_calculation',               // #4: Accuracy boost
      'scientific_article',             // #5: Enhanced articles
      'meta_intelligence',              // #6: Meta-learning
      'semantic_analysis',              // #7: Core infrastructure
      'methodology_documentation',      // #8: Report quality
      'coding_operation',               // #9: Efficiency gains

      // Additional categories
      'extended_report',
      'report_generation',              // Generic fallback
      'document_processing'
    ];

    categories.forEach(category => {
      this.promptGenes.set(category, this.createInitialGenes(category));
    });

    console.log(`🧬 GAPES: Initialized ${categories.length} categories with base genes`);
  }

  /**
   * Erstelle initiale Gene für eine Kategorie
   */
  createInitialGenes(category) {
    const baseTemplates = {
      omniscience_query: {
        scope: ['focused', 'broad', 'interdisciplinary', 'specialized'],
        sources: ['primary', 'comprehensive', 'meta-analytical', 'peer-reviewed'],
        synthesis: ['factual', 'analytical', 'integrative', 'critical']
      },
      ultimate_report_section: {
        style: ['formal', 'academic', 'precise', 'scholarly'],
        structure: ['APA-7', 'structured', 'hierarchical', 'logical'],
        tone: ['objective', 'analytical', 'evidence-based', 'balanced'],
        length: ['concise', 'comprehensive', 'detailed', 'thorough'],
        focus: ['data-driven', 'literature-integrated', 'methodological', 'theoretical']
      },
      basis_report: {
        depth: ['overview', 'standard', 'focused'],
        clarity: ['simple', 'clear', 'accessible'],
        structure: ['linear', 'organized', 'systematic']
      },
      citation_validation: {
        matching: ['exact', 'fuzzy', 'semantic', 'contextual'],
        threshold: ['strict', 'balanced', 'lenient', 'adaptive'],
        correction: ['auto-fix', 'suggest', 'flag-only', 'interactive']
      },
      akih_calculation: {
        approach: ['multi-dimensional', 'holistic', 'systematic', 'integrated'],
        evaluation: ['criterion-based', 'comparative', 'weighted', 'composite'],
        precision: ['exact', 'nuanced', 'contextual', 'calibrated']
      },
      scientific_article: {
        style: ['academic', 'professional', 'technical'],
        rigor: ['high', 'standard', 'appropriate'],
        citations: ['extensive', 'selective', 'strategic']
      },
      meta_intelligence: {
        learning: ['adaptive', 'progressive', 'recursive'],
        optimization: ['prompt-focused', 'strategy-focused', 'holistic'],
        insights: ['pattern-based', 'data-driven', 'emergent']
      },
      semantic_analysis: {
        depth: ['surface', 'moderate', 'deep'],
        method: ['statistical', 'neural', 'hybrid'],
        output: ['keywords', 'themes', 'comprehensive']
      },
      methodology_documentation: {
        detail: ['brief', 'standard', 'exhaustive'],
        formality: ['casual', 'professional', 'academic'],
        references: ['minimal', 'standard', 'extensive']
      },
      coding_operation: {
        confidence: ['conservative', 'balanced', 'aggressive'],
        consensus: ['strict', 'moderate', 'flexible'],
        reasoning: ['brief', 'detailed', 'comprehensive']
      },
      extended_report: {
        depth: ['moderate', 'deep', 'very-deep'],
        integration: ['basic', 'advanced', 'comprehensive'],
        analysis: ['standard', 'enhanced', 'expert-level']
      },
      report_generation: {
        depth: ['overview', 'standard', 'comprehensive'],
        integration: ['document-focused', 'cross-reference', 'synthesized'],
        visualization: ['minimal', 'balanced', 'extensive']
      }
    };

    const template = baseTemplates[category] || baseTemplates.report_generation;
    const genes = [];

    // Generate 10 initial genes per category
    for (let i = 0; i < 10; i++) {
      const gene = {
        id: `${category}_${Date.now()}_${i}`,
        category: category,
        dna: this.generateRandomDNA(template),
        fitness: 0.5, // Neutral start
        age: 0,
        successCount: 0,
        failureCount: 0,
        avgTokens: 0,
        avgCost: 0,
        avgQuality: 0,
        mutations: 0,
        generation: 0
      };
      genes.push(gene);
    }

    return genes;
  }

  /**
   * Generiere zufällige DNA aus Template
   */
  generateRandomDNA(template) {
    const dna = {};
    for (const [trait, options] of Object.entries(template)) {
      dna[trait] = options[Math.floor(Math.random() * options.length)];
    }
    return dna;
  }

  /**
   * 🎯 HAUPTFUNKTION: Hole optimierten Prompt für Task
   */
  getOptimizedPrompt(category, context = {}) {
    const genes = this.promptGenes.get(category);
    if (!genes || genes.length === 0) {
      console.warn(`No genes for category: ${category}`);
      return null;
    }

    // Wähle bestes Gen basierend auf Fitness
    const bestGene = this.selectBestGene(genes, context);

    // Generiere Prompt aus Gen-DNA
    const prompt = this.generatePromptFromDNA(bestGene, context);

    console.log(`🧬 GAPES: Using gene ${bestGene.id} (fitness: ${bestGene.fitness.toFixed(2)}) for ${category}`);

    return {
      prompt: prompt,
      geneId: bestGene.id,
      metadata: {
        fitness: bestGene.fitness,
        generation: bestGene.generation,
        mutations: bestGene.mutations
      }
    };
  }

  /**
   * Wähle bestes Gen (mit etwas Exploration)
   */
  selectBestGene(genes, context) {
    // 80% Exploitation, 20% Exploration
    if (Math.random() < 0.8) {
      // Wähle bestes Gen
      return genes.reduce((best, gene) =>
        gene.fitness > best.fitness ? gene : best
      );
    } else {
      // Zufälliges Gen für Exploration
      return genes[Math.floor(Math.random() * genes.length)];
    }
  }

  /**
   * Generiere Prompt aus Gen-DNA
   */
  generatePromptFromDNA(gene, context) {
    const dna = gene.dna;

    // Basis-Prompt-Templates pro Kategorie
    const templates = {
      scientific_article_section: `You are a ${dna.style || 'formal'} scientific writer.
Generate a ${dna.length || 'comprehensive'} article section with ${dna.structure || 'APA-7'} structure.
Maintain a ${dna.tone || 'objective'} tone and ${dna.focus || 'data-driven'} approach.
Ensure all citations are accurate and verifiable.`,

      omniscience_query: `You are a ${dna.scope || 'focused'} research assistant with access to ${dna.sources || 'comprehensive'} scientific databases.
Provide ${dna.synthesis || 'analytical'} insights based on peer-reviewed literature.
Be precise, evidence-based, and cite specific sources when possible.`,

      report_generation: `Generate a ${dna.depth || 'standard'} research report with ${dna.integration || 'cross-reference'} of sources.
Include ${dna.visualization || 'balanced'} data presentation.
Structure the report for academic/professional audiences.`,

      akih_calculation: `Perform a ${dna.approach || 'multi-dimensional'} quality assessment using ${dna.evaluation || 'criterion-based'} evaluation.
Apply ${dna.precision || 'nuanced'} scoring with clear justification for each dimension.`,

      citation_validation: `Validate citations using ${dna.matching || 'semantic'} matching with ${dna.threshold || 'balanced'} threshold.
Apply ${dna.correction || 'suggest'} strategy for discrepancies.`
    };

    let basePrompt = templates[gene.category] || templates.report_generation;

    // Add context-specific instructions
    if (context.targetWords) {
      basePrompt += `\n\nTarget length: approximately ${context.targetWords} words.`;
    }
    if (context.language) {
      basePrompt += `\n\nRespond in ${context.language === 'de' ? 'German' : 'English'}.`;
    }
    if (context.documents) {
      basePrompt += `\n\nBase your analysis on the provided ${context.documents} documents.`;
    }

    return basePrompt;
  }

  /**
   * 📊 Track Ergebnis und update Gen-Fitness
   */
  async trackResult(geneId, success, metrics = {}) {
    // Find gene
    let targetGene = null;
    let targetCategory = null;

    for (const [category, genes] of this.promptGenes.entries()) {
      const gene = genes.find(g => g.id === geneId);
      if (gene) {
        targetGene = gene;
        targetCategory = category;
        break;
      }
    }

    if (!targetGene) {
      console.warn(`Gene not found: ${geneId}`);
      return;
    }

    // Update statistics
    if (success) {
      targetGene.successCount++;
    } else {
      targetGene.failureCount++;
    }

    // Update metrics with running averages
    if (metrics.tokenCount) {
      targetGene.avgTokens = (targetGene.avgTokens * targetGene.age + metrics.tokenCount) / (targetGene.age + 1);
    }
    if (metrics.cost) {
      targetGene.avgCost = (targetGene.avgCost * targetGene.age + metrics.cost) / (targetGene.age + 1);
    }
    if (metrics.quality) {
      targetGene.avgQuality = (targetGene.avgQuality * targetGene.age + metrics.quality) / (targetGene.age + 1);
    }
    if (metrics.responseTime) {
      targetGene.avgResponseTime = (targetGene.avgResponseTime || 0) * targetGene.age + metrics.responseTime;
      targetGene.avgResponseTime /= (targetGene.age + 1);
    }
    if (metrics.wordCount) {
      targetGene.avgWordCount = (targetGene.avgWordCount || 0) * targetGene.age + metrics.wordCount;
      targetGene.avgWordCount /= (targetGene.age + 1);
    }
    if (metrics.citationAccuracy !== undefined) {
      targetGene.avgCitationAccuracy = (targetGene.avgCitationAccuracy || 0) * targetGene.age + metrics.citationAccuracy;
      targetGene.avgCitationAccuracy /= (targetGene.age + 1);
    }

    // Track errors
    if (metrics.error) {
      targetGene.errorCount = (targetGene.errorCount || 0) + 1;
    }
    if (metrics.crash) {
      targetGene.crashCount = (targetGene.crashCount || 0) + 1;
    }

    targetGene.age++;

    // Store result in recent results for this category
    if (!this.recentResults.has(targetCategory)) {
      this.recentResults.set(targetCategory, []);
    }
    const categoryResults = this.recentResults.get(targetCategory);
    categoryResults.push({
      geneId: geneId,
      success: success,
      quality: metrics.quality || 0.5,
      timestamp: Date.now(),
      metrics: metrics
    });

    // Keep only last 50 results per category
    if (categoryResults.length > 50) {
      this.recentResults.set(targetCategory, categoryResults.slice(-50));
    }

    // Recalculate fitness
    this.recalculateFitness(targetGene, metrics);

    // Trigger evolution if enough data
    if (targetGene.age % 10 === 0) {
      await this.evolveCategory(targetCategory);
    }

    console.log(`🧬 GAPES: Gene ${geneId} updated - fitness: ${targetGene.fitness.toFixed(3)}, age: ${targetGene.age}`);
  }

  /**
   * 🎯 Berechne Fitness mit AdvancedFitness System
   */
  recalculateFitness(gene, metrics) {
    const totalTries = gene.successCount + gene.failureCount;
    if (totalTries === 0) {
      gene.fitness = 0.5;
      return;
    }

    // Get recent results for this gene's category
    const categoryResults = this.recentResults.get(gene.category) || [];

    // Use AdvancedFitness for sophisticated evaluation
    const evaluation = this.advancedFitness.calculateFitness(gene, categoryResults);

    // Update gene with detailed fitness information
    gene.fitness = evaluation.fitness;
    gene.fitnessBreakdown = evaluation.breakdown;
    gene.qualityLevel = this.advancedFitness.getQualityLevel(evaluation.fitness);

    // Store evaluation metrics
    if (!gene.evaluationHistory) {
      gene.evaluationHistory = [];
    }
    gene.evaluationHistory.push({
      timestamp: Date.now(),
      fitness: evaluation.fitness,
      breakdown: evaluation.breakdown,
      metrics: metrics
    });

    // Keep only last 20 evaluations
    if (gene.evaluationHistory.length > 20) {
      gene.evaluationHistory = gene.evaluationHistory.slice(-20);
    }

    console.log(`🎯 AdvancedFitness: Gene ${gene.id} - Fitness: ${gene.fitness.toFixed(3)} (${gene.qualityLevel}) - Breakdown:`,
      Object.entries(evaluation.breakdown).map(([k, v]) => `${k}:${v.toFixed(2)}`).join(', ')
    );
  }

  /**
   * 🧬 EVOLUTION: Mutate, Crossover, Selection
   */
  async evolveCategory(category) {
    const genes = this.promptGenes.get(category);
    if (!genes || genes.length < 5) return;

    console.log(`🧬 GAPES: Evolving category ${category}...`);

    // 1. SELECTION: Remove worst performing genes
    genes.sort((a, b) => b.fitness - a.fitness);
    const survivors = genes.slice(0, Math.ceil(genes.length * 0.6)); // Top 60%

    // 2. CROSSOVER: Combine best genes
    const offspring = [];
    for (let i = 0; i < 3; i++) {
      const parent1 = survivors[Math.floor(Math.random() * survivors.length)];
      const parent2 = survivors[Math.floor(Math.random() * survivors.length)];

      const child = this.crossover(parent1, parent2, category);
      offspring.push(child);
    }

    // 3. MUTATION: Mutate some genes
    const mutants = [];
    for (let i = 0; i < 2; i++) {
      const original = survivors[Math.floor(Math.random() * survivors.length)];
      const mutant = this.mutate(original, category);
      mutants.push(mutant);
    }

    // 4. NEW GENERATION
    const newGeneration = [
      ...survivors,
      ...offspring,
      ...mutants
    ];

    // Keep population size stable (max 15 genes per category)
    newGeneration.sort((a, b) => b.fitness - a.fitness);
    const finalGenes = newGeneration.slice(0, 15);

    this.promptGenes.set(category, finalGenes);

    console.log(`🧬 GAPES: Evolution complete for ${category} - ${finalGenes.length} genes, avg fitness: ${(finalGenes.reduce((sum, g) => sum + g.fitness, 0) / finalGenes.length).toFixed(3)}`);
  }

  /**
   * Crossover: Kombiniere zwei Gene
   */
  crossover(parent1, parent2, category) {
    const childDNA = {};

    // Mix DNA from both parents
    const allTraits = new Set([
      ...Object.keys(parent1.dna),
      ...Object.keys(parent2.dna)
    ]);

    for (const trait of allTraits) {
      // 50/50 chance from each parent
      childDNA[trait] = Math.random() < 0.5 ?
        parent1.dna[trait] : parent2.dna[trait];
    }

    return {
      id: `${category}_${Date.now()}_cross`,
      category: category,
      dna: childDNA,
      fitness: (parent1.fitness + parent2.fitness) / 2, // Inherit average fitness
      age: 0,
      successCount: 0,
      failureCount: 0,
      avgTokens: (parent1.avgTokens + parent2.avgTokens) / 2,
      avgCost: (parent1.avgCost + parent2.avgCost) / 2,
      avgQuality: (parent1.avgQuality + parent2.avgQuality) / 2,
      mutations: 0,
      generation: Math.max(parent1.generation, parent2.generation) + 1
    };
  }

  /**
   * Mutation: Verändere Gen zufällig
   */
  mutate(original, category) {
    const mutatedDNA = { ...original.dna };

    // Mutate 1-2 random traits
    const traits = Object.keys(mutatedDNA);
    const numMutations = Math.random() < 0.5 ? 1 : 2;

    for (let i = 0; i < numMutations && traits.length > 0; i++) {
      const traitToMutate = traits[Math.floor(Math.random() * traits.length)];

      // Get possible values for this trait (hardcoded for now)
      const possibleValues = {
        style: ['formal', 'academic', 'precise', 'technical', 'professional'],
        tone: ['objective', 'analytical', 'evidence-based', 'critical', 'balanced'],
        length: ['concise', 'comprehensive', 'detailed', 'extensive'],
        approach: ['multi-dimensional', 'holistic', 'systematic', 'integrated'],
        scope: ['focused', 'broad', 'interdisciplinary', 'specialized']
      };

      const options = possibleValues[traitToMutate] || ['default'];
      mutatedDNA[traitToMutate] = options[Math.floor(Math.random() * options.length)];
    }

    return {
      id: `${category}_${Date.now()}_mut`,
      category: category,
      dna: mutatedDNA,
      fitness: original.fitness * 0.8, // Slightly lower fitness (needs to prove itself)
      age: 0,
      successCount: 0,
      failureCount: 0,
      avgTokens: original.avgTokens,
      avgCost: original.avgCost,
      avgQuality: original.avgQuality,
      mutations: original.mutations + numMutations,
      generation: original.generation + 1
    };
  }

  /**
   * 🧠 META-LEARNING: Erkenne Muster über Kategorien hinweg
   */
  learnMetaPatterns() {
    // Analyze all categories
    const patterns = {};

    for (const [category, genes] of this.promptGenes.entries()) {
      const bestGene = genes.reduce((best, gene) =>
        gene.fitness > best.fitness ? gene : best
      );

      // Extract successful traits
      for (const [trait, value] of Object.entries(bestGene.dna)) {
        if (!patterns[trait]) {
          patterns[trait] = {};
        }
        if (!patterns[trait][value]) {
          patterns[trait][value] = { count: 0, avgFitness: 0 };
        }
        patterns[trait][value].count++;
        patterns[trait][value].avgFitness =
          (patterns[trait][value].avgFitness * (patterns[trait][value].count - 1) + bestGene.fitness) /
          patterns[trait][value].count;
      }
    }

    this.metaPatterns = patterns;

    console.log('🧠 META-LEARNING: Patterns discovered:',
      Object.keys(patterns).map(trait => `${trait}: ${Object.keys(patterns[trait]).length} variants`).join(', ')
    );
  }

  /**
   * Export Gene-Pool für Backup
   */
  exportGenes() {
    const data = {
      timestamp: new Date().toISOString(),
      genes: {},
      metaPatterns: Object.fromEntries(this.metaPatterns)
    };

    for (const [category, genes] of this.promptGenes.entries()) {
      data.genes[category] = genes;
    }

    return data;
  }

  /**
   * Import Gene-Pool from Backup
   */
  importGenes(data) {
    if (data.genes) {
      for (const [category, genes] of Object.entries(data.genes)) {
        this.promptGenes.set(category, genes);
      }
    }
    if (data.metaPatterns) {
      this.metaPatterns = new Map(Object.entries(data.metaPatterns));
    }

    console.log('🧬 GAPES: Imported genes from backup');
  }

  /**
   * Get Statistics
   */
  getStats() {
    const stats = {
      totalGenes: 0,
      categoriesCount: this.promptGenes.size,
      avgFitness: 0,
      bestGenes: [],
      totalEvolutions: 0
    };

    let totalFitness = 0;
    let geneCount = 0;

    for (const [category, genes] of this.promptGenes.entries()) {
      stats.totalGenes += genes.length;

      const bestGene = genes.reduce((best, gene) =>
        gene.fitness > best.fitness ? gene : best
      );

      stats.bestGenes.push({
        category,
        geneId: bestGene.id,
        fitness: bestGene.fitness,
        generation: bestGene.generation,
        mutations: bestGene.mutations
      });

      genes.forEach(gene => {
        totalFitness += gene.fitness;
        geneCount++;
        stats.totalEvolutions += gene.generation;
      });
    }

    stats.avgFitness = geneCount > 0 ? totalFitness / geneCount : 0;

    return stats;
  }
}

export default GAPES;
