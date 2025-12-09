/**
 * ═══════════════════════════════════════════════════════════
 * 🔌 GENESIS INTEGRATION
 * Helper für Integration in bestehende App
 * ═══════════════════════════════════════════════════════════
 */

import { GenesisEngine } from './engine/GenesisEngine.js';

export class GenesisIntegration {
  constructor(config = {}) {
    this.genesis = new GenesisEngine(config);
    this.isInitialized = false;
  }

  /**
   * Initialisiere Genesis und starte automatisch
   */
  async initializeAndStart() {
    console.log('🧬 Initializing Genesis Integration...');
    
    try {
      await this.genesis.initialize();
      await this.genesis.start();
      
      this.isInitialized = true;
      console.log('✅ Genesis Integration ready');
      
      return this.genesis;
    } catch (error) {
      console.error('❌ Genesis Integration failed:', error);
      throw error;
    }
  }

  /**
   * Track success/failure für automatisches Lernen
   */
  trackResult(action, success, metadata = {}) {
    if (!this.isInitialized) {
      console.warn('⚠️ Genesis not initialized yet');
      return;
    }

    // Finde relevante Gene basierend auf Action
    const relevantGenes = this.findRelevantGenes(action, metadata);

    relevantGenes.forEach(gene => {
      if (success) {
        this.genesis.recordSuccess(gene.id, metadata);
      } else {
        this.genesis.recordFailure(gene.id, metadata);
      }
    });
  }

  /**
   * Hole beste Strategien für spezifische Aufgabe
   */
  getBestStrategy(taskType, count = 3) {
    if (!this.isInitialized) {
      return null;
    }

    const allGenes = this.genesis.getBestGenes(50);
    
    // Filtere nach Task-Type
    const relevant = allGenes.filter(gene => 
      gene.category === taskType || 
      (gene.traits && gene.traits[taskType] > 0.5)
    );

    return relevant.slice(0, count);
  }

  /**
   * Hole optimierte Prompts
   */
  getOptimizedPrompt(category = 'analytical') {
    const bestGenes = this.genesis.getBestGenes(10);
    const categoryGenes = bestGenes.filter(g => g.category === category);
    
    if (categoryGenes.length > 0) {
      return categoryGenes[0].content;
    }

    return null;
  }

  /**
   * Finde relevante Gene für Action
   */
  findRelevantGenes(action, metadata) {
    const allGenes = [
      ...Array.from(this.genesis.dna.promptGenes.values()),
      ...Array.from(this.genesis.dna.personaGenes.values()),
      ...Array.from(this.genesis.dna.strategyGenes.values())
    ];

    // Einfaches Matching basierend auf Keywords
    return allGenes.filter(gene => {
      if (metadata.category && gene.category === metadata.category) {
        return true;
      }
      if (metadata.type && gene.type === metadata.type) {
        return true;
      }
      return false;
    }).slice(0, 3); // Max 3 relevante Gene
  }

  /**
   * Get current stats für UI
   */
  getStats() {
    return this.genesis.getStats();
  }

  /**
   * Get Genesis Engine instance
   */
  getEngine() {
    return this.genesis;
  }

  /**
   * Event Handler registrieren
   */
  on(eventName, callback) {
    this.genesis.on(eventName, callback);
  }
}

// ═══════════════════════════════════════════════════════════
// 🚀 QUICK START HELPER
// ═══════════════════════════════════════════════════════════

export async function quickStartGenesis(config = {}) {
  const integration = new GenesisIntegration(config);
  await integration.initializeAndStart();
  return integration;
}

// ═══════════════════════════════════════════════════════════
// 📊 REACT HOOK
// ═══════════════════════════════════════════════════════════

export function useGenesis(config = {}) {
  const [genesis, setGenesis] = React.useState(null);
  const [stats, setStats] = React.useState(null);
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const integration = await quickStartGenesis(config);
        
        if (mounted) {
          setGenesis(integration);
          setIsReady(true);

          // Update stats periodically
          const interval = setInterval(() => {
            if (mounted) {
              setStats(integration.getStats());
            }
          }, 1000);

          return () => {
            clearInterval(interval);
            integration.genesis.stop();
          };
        }
      } catch (error) {
        console.error('Genesis initialization failed:', error);
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, []);

  return {
    genesis,
    stats,
    isReady,
    trackResult: genesis ? genesis.trackResult.bind(genesis) : () => {},
    getBestStrategy: genesis ? genesis.getBestStrategy.bind(genesis) : () => null,
    getOptimizedPrompt: genesis ? genesis.getOptimizedPrompt.bind(genesis) : () => null
  };
}

export default GenesisIntegration;
