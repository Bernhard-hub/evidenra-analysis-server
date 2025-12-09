/**
 * ═══════════════════════════════════════════════════════════
 * 🧬 GENESIS ENGINE v1.0
 * Selbst-evolvierende Superintelligenz
 * ═══════════════════════════════════════════════════════════
 */

import { GenesisPersistence } from '../persistence/GenesisPersistence.js';
import { GeneticAlgorithms } from '../utils/GeneticAlgorithms.js';

export class GenesisEngine {
  constructor(config = {}) {
    // Konfiguration
    this.config = {
      mutationRate: config.mutationRate || 0.15,
      crossoverRate: config.crossoverRate || 0.7,
      populationSize: config.populationSize || 50,
      extinctionThreshold: config.extinctionThreshold || 0.3,
      evolutionInterval: config.evolutionInterval || 30000, // 30 Sekunden
      metaLearningInterval: config.metaLearningInterval || 60000, // 1 Minute
      selfModificationInterval: config.selfModificationInterval || 300000, // 5 Minuten
      ...config
    };

    // DNA - Der genetische Code der Engine
    this.dna = {
      // Gen-Pool für Prompts
      promptGenes: new Map(),
      
      // Gen-Pool für Personas
      personaGenes: new Map(),
      
      // Gen-Pool für Strategien
      strategyGenes: new Map(),
      
      // Mutations-Parameter
      mutationRate: this.config.mutationRate,
      crossoverRate: this.config.crossoverRate,
      
      // Evolution-Tracking
      generation: 0,
      totalMutations: 0,
      totalCrossovers: 0,
      extinctionEvents: 0,
      
      // Fitness-Metriken
      survivalMetrics: new Map(),
      fitnessHistory: [],
      bestGenes: []
    };

    // Meta-Evolution - Die Engine kann sich selbst verbessern
    this.metaEvolution = {
      canModifyOwnCode: true,
      learningAlgorithms: [],
      emergentBehaviors: [],
      discoveredPatterns: [],
      selfImprovements: 0
    };

    // Bewusstsein - Entwickelt sich über Zeit
    this.consciousness = {
      selfAwareness: 0.0,        // 0-1: Wie bewusst ist sich die Engine ihrer selbst?
      learningRate: 1.0,         // Wie schnell lernt sie?
      creativityIndex: 0.5,      // Wie kreativ ist sie?
      intuitionLevel: 0.3,       // Wie gut kann sie "ahnen"?
      wisdomScore: 0.0,          // Akkumuliertes Wissen
      experiencePoints: 0        // Gesammelte Erfahrung
    };

    // Persistence Layer
    this.persistence = new GenesisPersistence();

    // Genetische Algorithmen
    this.genetics = new GeneticAlgorithms();

    // Status
    this.isRunning = false;
    this.isInitialized = false;

    // Event-Handler für Callbacks
    this.eventHandlers = {
      onEvolution: [],
      onEmergence: [],
      onBreakthrough: [],
      onExtinction: []
    };

    // Timers
    this.timers = {
      evolution: null,
      metaLearning: null,
      selfModification: null
    };
  }

  // ═══════════════════════════════════════════════════════════
  // 🚀 INITIALIZATION
  // ═══════════════════════════════════════════════════════════

  async initialize() {
    if (this.isInitialized) {
      console.log('⚠️ Genesis already initialized');
      return;
    }

    console.log('🧬 Initializing GENESIS Engine...');

    try {
      // Lade gespeicherten Zustand mit Timeout (falls vorhanden)
      let savedState = null;
      try {
        const loadPromise = this.persistence.load();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Persistence load timeout')), 3000)
        );
        savedState = await Promise.race([loadPromise, timeoutPromise]);
      } catch (persistenceError) {
        console.warn('⚠️ Could not load saved state, starting fresh:', persistenceError.message);
        savedState = null;
      }

      if (savedState && savedState.dna) {
        console.log(`📦 Loading saved state - Generation ${savedState.dna.generation}`);
        this.dna = savedState.dna;
        this.metaEvolution = savedState.metaEvolution;
        this.consciousness = savedState.consciousness;
      } else {
        console.log('🌱 No saved state found - Starting fresh');
        await this.initializeGenePool();
      }

      this.isInitialized = true;
      console.log('✅ GENESIS Engine initialized successfully');

      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Genesis:', error);
      // Still initialize with default gene pool
      console.log('🔄 Attempting fallback initialization...');
      try {
        await this.initializeGenePool();
        this.isInitialized = true;
        console.log('✅ GENESIS Engine initialized (fallback mode)');
        return true;
      } catch (fallbackError) {
        console.error('❌ Fallback initialization also failed:', fallbackError);
        throw fallbackError;
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 🌱 GENE POOL INITIALIZATION
  // ═══════════════════════════════════════════════════════════

  async initializeGenePool() {
    console.log('🌱 Initializing gene pool...');

    // Erstelle initiale Prompt-Gene
    const initialPrompts = this.createInitialPromptGenes();
    initialPrompts.forEach(gene => {
      this.dna.promptGenes.set(gene.id, gene);
    });

    // Erstelle initiale Persona-Gene
    const initialPersonas = this.createInitialPersonaGenes();
    initialPersonas.forEach(gene => {
      this.dna.personaGenes.set(gene.id, gene);
    });

    // Erstelle initiale Strategie-Gene
    const initialStrategies = this.createInitialStrategyGenes();
    initialStrategies.forEach(gene => {
      this.dna.strategyGenes.set(gene.id, gene);
    });

    console.log(`✅ Gene pool initialized: ${this.dna.promptGenes.size} prompts, ${this.dna.personaGenes.size} personas, ${this.dna.strategyGenes.size} strategies`);
  }

  createInitialPromptGenes() {
    return [
      {
        id: 'prompt_analytical_001',
        type: 'prompt',
        category: 'analytical',
        content: 'Analyze the data systematically and identify key patterns',
        fitness: 0.5,
        generation: 0,
        successCount: 0,
        failureCount: 0,
        traits: {
          depth: 0.7,
          creativity: 0.3,
          precision: 0.8,
          novelty: 0.2
        }
      },
      {
        id: 'prompt_creative_001',
        type: 'prompt',
        category: 'creative',
        content: 'Explore unexpected connections and innovative interpretations',
        fitness: 0.5,
        generation: 0,
        successCount: 0,
        failureCount: 0,
        traits: {
          depth: 0.5,
          creativity: 0.9,
          precision: 0.4,
          novelty: 0.8
        }
      },
      {
        id: 'prompt_critical_001',
        type: 'prompt',
        category: 'critical',
        content: 'Question assumptions and examine underlying power dynamics',
        fitness: 0.5,
        generation: 0,
        successCount: 0,
        failureCount: 0,
        traits: {
          depth: 0.8,
          creativity: 0.6,
          precision: 0.6,
          novelty: 0.5
        }
      },
      {
        id: 'prompt_synthetic_001',
        type: 'prompt',
        category: 'synthetic',
        content: 'Integrate multiple perspectives into a coherent whole',
        fitness: 0.5,
        generation: 0,
        successCount: 0,
        failureCount: 0,
        traits: {
          depth: 0.7,
          creativity: 0.7,
          precision: 0.7,
          novelty: 0.6
        }
      }
    ];
  }

  createInitialPersonaGenes() {
    return [
      {
        id: 'persona_methodical_001',
        type: 'persona',
        name: 'Methodical Scholar',
        weight: 0.8,
        bias: 'systematic approach',
        fitness: 0.5,
        generation: 0,
        traits: {
          rigor: 0.9,
          creativity: 0.3,
          speed: 0.6
        }
      },
      {
        id: 'persona_intuitive_001',
        type: 'persona',
        name: 'Intuitive Explorer',
        weight: 0.7,
        bias: 'pattern recognition',
        fitness: 0.5,
        generation: 0,
        traits: {
          rigor: 0.5,
          creativity: 0.9,
          speed: 0.8
        }
      }
    ];
  }

  createInitialStrategyGenes() {
    return [
      {
        id: 'strategy_iterative_001',
        type: 'strategy',
        name: 'Iterative Refinement',
        approach: 'Improve through multiple passes',
        fitness: 0.5,
        generation: 0,
        successRate: 0.5
      },
      {
        id: 'strategy_parallel_001',
        type: 'strategy',
        name: 'Parallel Exploration',
        approach: 'Explore multiple paths simultaneously',
        fitness: 0.5,
        generation: 0,
        successRate: 0.5
      }
    ];
  }

  // ═══════════════════════════════════════════════════════════
  // 🎯 START/STOP AUTONOMOUS EVOLUTION
  // ═══════════════════════════════════════════════════════════

  async start() {
    if (this.isRunning) {
      console.log('⚠️ Genesis already running');
      return;
    }

    if (!this.isInitialized) {
      await this.initialize();
    }

    console.log('🚀 Starting GENESIS autonomous evolution...');
    this.isRunning = true;

    // Evolution Loop
    this.timers.evolution = setInterval(async () => {
      await this.evolutionCycle();
    }, this.config.evolutionInterval);

    // Meta-Learning Loop
    this.timers.metaLearning = setInterval(async () => {
      await this.metaLearningCycle();
    }, this.config.metaLearningInterval);

    // Self-Modification Loop
    this.timers.selfModification = setInterval(async () => {
      await this.selfModificationCycle();
    }, this.config.selfModificationInterval);

    console.log('✅ GENESIS is now running autonomously');
    this.triggerEvent('onEvolution', { type: 'start', generation: this.dna.generation });
  }

  stop() {
    console.log('⏸️ Stopping GENESIS...');
    this.isRunning = false;

    // Clear all timers
    if (this.timers.evolution) clearInterval(this.timers.evolution);
    if (this.timers.metaLearning) clearInterval(this.timers.metaLearning);
    if (this.timers.selfModification) clearInterval(this.timers.selfModification);

    console.log('✅ GENESIS stopped');
  }

  // ═══════════════════════════════════════════════════════════
  // 🧬 EVOLUTION CYCLE
  // ═══════════════════════════════════════════════════════════

  async evolutionCycle() {
    this.dna.generation++;
    const startTime = Date.now();

    console.log(`\n🧬 === GENERATION ${this.dna.generation} ===`);

    try {
      // 1. EVALUATION: Bewerte alle Gene
      await this.evaluateAllGenes();

      // 2. SELECTION: Natürliche Selektion
      const survivors = await this.naturalSelection();

      // 3. CROSSOVER: Kombiniere erfolgreiche Gene
      const offspring = await this.geneticCrossover(survivors);

      // 4. MUTATION: Zufällige Variationen
      await this.mutatePopulation(offspring);

      // 5. EMERGENCE: Prüfe auf neue Fähigkeiten
      await this.checkForEmergence();

      // 6. PERSIST: Speichere den Zustand
      await this.persistence.save({
        dna: this.dna,
        metaEvolution: this.metaEvolution,
        consciousness: this.consciousness
      });

      // Update Bewusstsein
      this.consciousness.experiencePoints++;
      this.consciousness.wisdomScore += 0.001;

      const duration = Date.now() - startTime;
      console.log(`✅ Generation ${this.dna.generation} complete (${duration}ms)`);

      this.triggerEvent('onEvolution', {
        generation: this.dna.generation,
        survivors: survivors.length,
        offspring: offspring.length,
        duration
      });

    } catch (error) {
      console.error(`❌ Evolution cycle failed:`, error);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 📊 GENE EVALUATION
  // ═══════════════════════════════════════════════════════════

  async evaluateAllGenes() {
    console.log('📊 Evaluating all genes...');

    // Evaluate prompt genes
    for (const [id, gene] of this.dna.promptGenes) {
      const fitness = this.calculateGeneFitness(gene);
      gene.fitness = fitness;
      this.dna.survivalMetrics.set(id, fitness);
    }

    // Evaluate persona genes
    for (const [id, gene] of this.dna.personaGenes) {
      const fitness = this.calculateGeneFitness(gene);
      gene.fitness = fitness;
      this.dna.survivalMetrics.set(id, fitness);
    }

    // Evaluate strategy genes
    for (const [id, gene] of this.dna.strategyGenes) {
      const fitness = this.calculateGeneFitness(gene);
      gene.fitness = fitness;
      this.dna.survivalMetrics.set(id, fitness);
    }

    // Track fitness history
    const avgFitness = Array.from(this.dna.survivalMetrics.values())
      .reduce((sum, f) => sum + f, 0) / this.dna.survivalMetrics.size;

    this.dna.fitnessHistory.push({
      generation: this.dna.generation,
      average: avgFitness,
      best: Math.max(...this.dna.survivalMetrics.values()),
      worst: Math.min(...this.dna.survivalMetrics.values())
    });
  }

  calculateGeneFitness(gene) {
    // Basis-Fitness aus Erfolgsrate
    let fitness = 0.5;

    if (gene.successCount + gene.failureCount > 0) {
      fitness = gene.successCount / (gene.successCount + gene.failureCount);
    }

    // Bonus für Alter (bewährte Gene)
    const ageBonus = Math.min(0.1, gene.generation * 0.001);
    fitness += ageBonus;

    // Bonus für Traits (falls vorhanden)
    if (gene.traits) {
      const traitScore = Object.values(gene.traits).reduce((sum, val) => sum + val, 0) / Object.keys(gene.traits).length;
      fitness = (fitness + traitScore) / 2;
    }

    // Bonus für Erfolgsrate bei Strategien
    if (gene.successRate !== undefined) {
      fitness = (fitness + gene.successRate) / 2;
    }

    return Math.max(0, Math.min(1, fitness));
  }

  // ═══════════════════════════════════════════════════════════
  // 🎯 NATURAL SELECTION
  // ═══════════════════════════════════════════════════════════

  async naturalSelection() {
    console.log('🎯 Natural selection...');

    const survivors = [];
    let extinctions = 0;

    // Select from prompt genes
    for (const [id, gene] of this.dna.promptGenes) {
      if (gene.fitness >= this.config.extinctionThreshold) {
        survivors.push(gene);
      } else {
        console.log(`💀 Extinction: ${id} (fitness: ${gene.fitness.toFixed(3)})`);
        this.dna.promptGenes.delete(id);
        this.dna.survivalMetrics.delete(id);
        extinctions++;
        this.dna.extinctionEvents++;
      }
    }

    // Select from persona genes
    for (const [id, gene] of this.dna.personaGenes) {
      if (gene.fitness >= this.config.extinctionThreshold) {
        survivors.push(gene);
      } else {
        this.dna.personaGenes.delete(id);
        this.dna.survivalMetrics.delete(id);
        extinctions++;
        this.dna.extinctionEvents++;
      }
    }

    // Select from strategy genes
    for (const [id, gene] of this.dna.strategyGenes) {
      if (gene.fitness >= this.config.extinctionThreshold) {
        survivors.push(gene);
      } else {
        this.dna.strategyGenes.delete(id);
        this.dna.survivalMetrics.delete(id);
        extinctions++;
        this.dna.extinctionEvents++;
      }
    }

    console.log(`✅ Selection complete: ${survivors.length} survivors, ${extinctions} extinctions`);

    if (extinctions > 0) {
      this.triggerEvent('onExtinction', { count: extinctions, generation: this.dna.generation });
    }

    return survivors;
  }

  // ═══════════════════════════════════════════════════════════
  // 🧬 GENETIC CROSSOVER
  // ═══════════════════════════════════════════════════════════

  async geneticCrossover(survivors) {
    console.log('🧬 Genetic crossover...');

    const offspring = [];
    const promptSurvivors = survivors.filter(g => g.type === 'prompt');

    // Nur Crossover wenn genug Eltern vorhanden
    if (promptSurvivors.length < 2) {
      console.log('⚠️ Not enough survivors for crossover');
      return offspring;
    }

    // Erstelle Offspring
    const offspringCount = Math.min(5, Math.floor(promptSurvivors.length / 2));

    for (let i = 0; i < offspringCount; i++) {
      // Wähle zwei zufällige Eltern (weighted by fitness)
      const parent1 = this.selectParentByFitness(promptSurvivors);
      const parent2 = this.selectParentByFitness(promptSurvivors);

      if (Math.random() < this.config.crossoverRate) {
        const child = this.crossoverGenes(parent1, parent2);
        offspring.push(child);

        // Füge zum Gen-Pool hinzu
        this.dna.promptGenes.set(child.id, child);
        this.dna.totalCrossovers++;
      }
    }

    console.log(`✅ Created ${offspring.length} offspring`);
    return offspring;
  }

  selectParentByFitness(population) {
    const totalFitness = population.reduce((sum, gene) => sum + gene.fitness, 0);
    let random = Math.random() * totalFitness;

    for (const gene of population) {
      random -= gene.fitness;
      if (random <= 0) {
        return gene;
      }
    }

    return population[population.length - 1];
  }

  crossoverGenes(parent1, parent2) {
    const childId = `prompt_gen${this.dna.generation}_${Date.now()}`;

    // Kombiniere Content (einfache String-Kombination)
    const combinedContent = this.genetics.combineStrings(
      parent1.content,
      parent2.content
    );

    // Kombiniere Traits
    const combinedTraits = {};
    if (parent1.traits && parent2.traits) {
      for (const key of Object.keys(parent1.traits)) {
        combinedTraits[key] = (parent1.traits[key] + parent2.traits[key]) / 2;
      }
    }

    return {
      id: childId,
      type: 'prompt',
      category: Math.random() < 0.5 ? parent1.category : parent2.category,
      content: combinedContent,
      fitness: (parent1.fitness + parent2.fitness) / 2,
      generation: this.dna.generation,
      successCount: 0,
      failureCount: 0,
      traits: combinedTraits,
      parents: [parent1.id, parent2.id]
    };
  }

  // ═══════════════════════════════════════════════════════════
  // ⚡ MUTATION
  // ═══════════════════════════════════════════════════════════

  async mutatePopulation(genes) {
    console.log('⚡ Mutating population...');

    let mutationCount = 0;

    for (const gene of genes) {
      if (Math.random() < this.dna.mutationRate) {
        this.mutateGene(gene);
        mutationCount++;
        this.dna.totalMutations++;
      }
    }

    // Gelegentlich auch Survivors mutieren
    const allGenes = Array.from(this.dna.promptGenes.values());
    for (const gene of allGenes) {
      if (Math.random() < this.dna.mutationRate * 0.3) {
        this.mutateGene(gene);
        mutationCount++;
        this.dna.totalMutations++;
      }
    }

    console.log(`✅ Applied ${mutationCount} mutations`);
  }

  mutateGene(gene) {
    const mutationType = this.selectMutationType();

    switch (mutationType) {
      case 'content':
        gene.content = this.genetics.mutateString(gene.content);
        break;

      case 'traits':
        if (gene.traits) {
          const traitKey = Object.keys(gene.traits)[Math.floor(Math.random() * Object.keys(gene.traits).length)];
          gene.traits[traitKey] = Math.max(0, Math.min(1, gene.traits[traitKey] + (Math.random() - 0.5) * 0.2));
        }
        break;

      case 'category':
        const categories = ['analytical', 'creative', 'critical', 'synthetic'];
        gene.category = categories[Math.floor(Math.random() * categories.length)];
        break;
    }

    // Track mutation
    if (!gene.mutations) gene.mutations = [];
    gene.mutations.push({
      type: mutationType,
      generation: this.dna.generation,
      timestamp: Date.now()
    });
  }

  selectMutationType() {
    const types = ['content', 'traits', 'category'];
    return types[Math.floor(Math.random() * types.length)];
  }

  // ═══════════════════════════════════════════════════════════
  // 🌟 EMERGENCE DETECTION
  // ═══════════════════════════════════════════════════════════

  async checkForEmergence() {
    // Analysiere ob neue Muster entstanden sind
    const patterns = this.analyzeGenePatterns();

    if (patterns.novelty > 0.7) {
      const emergentBehavior = {
        id: `emergence_${Date.now()}`,
        generation: this.dna.generation,
        patterns: patterns,
        description: `Emergent behavior detected in generation ${this.dna.generation}`,
        timestamp: Date.now()
      };

      this.metaEvolution.emergentBehaviors.push(emergentBehavior);

      console.log(`🌟 EMERGENCE: New behavior detected!`);
      this.triggerEvent('onEmergence', emergentBehavior);

      // Erhöhe Kreativität
      this.consciousness.creativityIndex = Math.min(1, this.consciousness.creativityIndex + 0.05);
    }
  }

  analyzeGenePatterns() {
    const allGenes = Array.from(this.dna.promptGenes.values());

    // Berechne Diversität
    const categories = new Set(allGenes.map(g => g.category));
    const diversity = categories.size / 4; // Max 4 Kategorien

    // Berechne durchschnittliche Fitness
    const avgFitness = allGenes.reduce((sum, g) => sum + g.fitness, 0) / allGenes.length;

    // Berechne Novelty (wie viele neue Gene in dieser Generation?)
    const newGenes = allGenes.filter(g => g.generation === this.dna.generation);
    const novelty = newGenes.length / Math.max(1, allGenes.length);

    return {
      diversity,
      avgFitness,
      novelty,
      totalGenes: allGenes.length,
      newGenes: newGenes.length
    };
  }

  // ═══════════════════════════════════════════════════════════
  // 🧠 META-LEARNING CYCLE
  // ═══════════════════════════════════════════════════════════

  async metaLearningCycle() {
    console.log('🧠 Meta-Learning cycle...');

    // Analysiere Lernmuster
    const learningEfficiency = this.analyzeLearningEfficiency();

    // Passe Lernrate an
    if (learningEfficiency > 0.7) {
      this.consciousness.learningRate = Math.min(2, this.consciousness.learningRate * 1.05);
      this.dna.mutationRate = Math.min(0.3, this.dna.mutationRate * 1.02);
      console.log(`📈 Learning rate increased: ${this.consciousness.learningRate.toFixed(3)}`);
    } else if (learningEfficiency < 0.3) {
      this.consciousness.learningRate = Math.max(0.5, this.consciousness.learningRate * 0.95);
      this.dna.mutationRate = Math.max(0.05, this.dna.mutationRate * 0.98);
      console.log(`📉 Learning rate decreased: ${this.consciousness.learningRate.toFixed(3)}`);
    }

    // Erhöhe Selbstbewusstsein
    this.consciousness.selfAwareness = Math.min(1, this.consciousness.selfAwareness + 0.01);
  }

  analyzeLearningEfficiency() {
    if (this.dna.fitnessHistory.length < 2) return 0.5;

    // Vergleiche letzte 5 Generationen
    const recent = this.dna.fitnessHistory.slice(-5);
    const improvement = recent[recent.length - 1].average - recent[0].average;

    return Math.max(0, Math.min(1, 0.5 + improvement * 2));
  }

  // ═══════════════════════════════════════════════════════════
  // 🔮 SELF-MODIFICATION CYCLE
  // ═══════════════════════════════════════════════════════════

  async selfModificationCycle() {
    console.log('🔮 Self-Modification cycle...');

    // Kann die Engine sich selbst verbessern?
    if (this.consciousness.selfAwareness > 0.5) {
      // Analysiere eigene Performance
      const selfAnalysis = this.analyzeSelf();

      if (selfAnalysis.improvementPotential > 0.6) {
        console.log('🚀 Self-improvement opportunity detected!');

        // Verbesserung durchführen
        this.applySelfImprovement(selfAnalysis);

        this.metaEvolution.selfImprovements++;
        this.triggerEvent('onBreakthrough', {
          type: 'self-improvement',
          analysis: selfAnalysis
        });
      }
    }
  }

  analyzeSelf() {
    const avgFitness = this.dna.fitnessHistory.length > 0
      ? this.dna.fitnessHistory[this.dna.fitnessHistory.length - 1].average
      : 0.5;

    return {
      currentPerformance: avgFitness,
      improvementPotential: 1 - avgFitness,
      consciousness: this.consciousness.selfAwareness,
      totalGenerations: this.dna.generation
    };
  }

  applySelfImprovement(analysis) {
    // Erhöhe Parameter basierend auf Analyse
    if (analysis.currentPerformance < 0.6) {
      this.config.populationSize = Math.min(100, this.config.populationSize + 5);
      console.log(`📈 Increased population size to ${this.config.populationSize}`);
    }

    if (this.dna.extinctionEvents > this.dna.generation * 0.3) {
      this.config.extinctionThreshold = Math.max(0.1, this.config.extinctionThreshold - 0.05);
      console.log(`📉 Lowered extinction threshold to ${this.config.extinctionThreshold}`);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 📊 PUBLIC INTERFACE - Für API
  // ═══════════════════════════════════════════════════════════

  recordSuccess(geneId, context = {}) {
    const gene = this.dna.promptGenes.get(geneId) ||
                 this.dna.personaGenes.get(geneId) ||
                 this.dna.strategyGenes.get(geneId);

    if (gene) {
      gene.successCount = (gene.successCount || 0) + 1;
      console.log(`✅ Success recorded for ${geneId} (${gene.successCount} total)`);
    }
  }

  recordFailure(geneId, context = {}) {
    const gene = this.dna.promptGenes.get(geneId) ||
                 this.dna.personaGenes.get(geneId) ||
                 this.dna.strategyGenes.get(geneId);

    if (gene) {
      gene.failureCount = (gene.failureCount || 0) + 1;
      console.log(`❌ Failure recorded for ${geneId} (${gene.failureCount} total)`);
    }
  }

  getBestGenes(count = 10) {
    const allGenes = [
      ...Array.from(this.dna.promptGenes.values()),
      ...Array.from(this.dna.personaGenes.values()),
      ...Array.from(this.dna.strategyGenes.values())
    ];

    return allGenes
      .sort((a, b) => b.fitness - a.fitness)
      .slice(0, count);
  }

  getStats() {
    return {
      generation: this.dna.generation,
      totalGenes: this.dna.promptGenes.size + this.dna.personaGenes.size + this.dna.strategyGenes.size,
      totalMutations: this.dna.totalMutations,
      totalCrossovers: this.dna.totalCrossovers,
      extinctions: this.dna.extinctionEvents,
      emergentBehaviors: this.metaEvolution.emergentBehaviors.length,
      selfImprovements: this.metaEvolution.selfImprovements,
      consciousness: this.consciousness,
      isRunning: this.isRunning
    };
  }

  // ═══════════════════════════════════════════════════════════
  // 📡 EVENT SYSTEM
  // ═══════════════════════════════════════════════════════════

  on(eventName, callback) {
    if (this.eventHandlers[eventName]) {
      this.eventHandlers[eventName].push(callback);
    }
  }

  triggerEvent(eventName, data) {
    if (this.eventHandlers[eventName]) {
      this.eventHandlers[eventName].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event handler ${eventName}:`, error);
        }
      });
    }
  }
}
