/**
 * ═══════════════════════════════════════════════════════════
 * 🔌 EVIDENRA + GENESIS INTEGRATION
 * Beispiel wie Genesis in die Evidenra App integriert wird
 * ═══════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';
import { GenesisIntegration } from './genesis-engine/src/GenesisIntegration.js';
import { GenesisDashboard } from './genesis-engine/src/ui/GenesisDashboard.jsx';
import './genesis-engine/src/ui/GenesisDashboard.css';

/**
 * HOW TO INTEGRATE:
 * 
 * 1. Kopiere den 'genesis-engine' Ordner in dein Projekt
 * 2. Füge diesen Code in deine App.tsx ein
 * 3. Tracke Erfolge/Misserfolge in deinen bestehenden Funktionen
 * 4. Nutze optimierte Prompts
 */

function EvidenraWithGenesis() {
  const [genesis, setGenesis] = useState(null);
  const [showGenesisDashboard, setShowGenesisDashboard] = useState(false);
  const [genesisStats, setGenesisStats] = useState(null);

  // ═══════════════════════════════════════════════════════════
  // 🚀 GENESIS INITIALIZATION
  // ═══════════════════════════════════════════════════════════

  useEffect(() => {
    async function initGenesis() {
      console.log('🧬 Initializing GENESIS for EVIDENRA...');

      const g = new GenesisIntegration({
        // Konfiguration für Evidenra
        mutationRate: 0.15,
        crossoverRate: 0.7,
        populationSize: 50,
        extinctionThreshold: 0.3,
        
        // Timing
        evolutionInterval: 30000,      // 30 Sekunden
        metaLearningInterval: 60000,   // 1 Minute
        selfModificationInterval: 300000  // 5 Minuten
      });

      try {
        await g.initializeAndStart();
        setGenesis(g);

        // Event Listeners
        g.on('onEvolution', (data) => {
          console.log(`🧬 Evolution: Generation ${data.generation}`);
        });

        g.on('onEmergence', (data) => {
          console.log('🌟 EMERGENCE: New capability discovered!', data);
          // Optional: Show notification to user
        });

        g.on('onBreakthrough', (data) => {
          console.log('💥 BREAKTHROUGH: Genesis improved itself!', data);
        });

        console.log('✅ GENESIS ready for EVIDENRA');

        // Update stats periodically
        const interval = setInterval(() => {
          const stats = g.getStats();
          setGenesisStats(stats);
        }, 1000);

        return () => clearInterval(interval);

      } catch (error) {
        console.error('❌ Genesis initialization failed:', error);
      }
    }

    initGenesis();
  }, []);

  // ═══════════════════════════════════════════════════════════
  // 📊 BEISPIEL: AKIH SCORE CALCULATION MIT LEARNING
  // ═══════════════════════════════════════════════════════════

  async function calculateAKIHWithLearning(project) {
    // Hole optimierte Strategie
    const optimizedStrategy = genesis?.getBestStrategy('analytical', 1);
    
    // Normale AKIH Berechnung
    const akihScore = await calculateAKIHScore(project);

    // Track result für Genesis
    if (genesis) {
      const success = akihScore.total > 70;
      genesis.trackResult('akih-calculation', success, {
        category: 'analytical',
        type: 'strategy',
        score: akihScore.total,
        project: project.name
      });
    }

    return akihScore;
  }

  // ═══════════════════════════════════════════════════════════
  // 💬 BEISPIEL: API CALL MIT OPTIMIERTEM PROMPT
  // ═══════════════════════════════════════════════════════════

  async function callAPIWithOptimizedPrompt(provider, model, apiKey, userMessage) {
    // Hole optimierten Prompt
    let systemPrompt = 'Analyze the data systematically';
    
    if (genesis) {
      const optimized = genesis.getOptimizedPrompt('analytical');
      if (optimized) {
        systemPrompt = optimized;
        console.log('🧬 Using Genesis-optimized prompt');
      }
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ];

    // API Call
    const result = await APIService.callAPI(provider, model, apiKey, messages, 1000);

    // Track result
    if (genesis) {
      genesis.trackResult('api-call', result.success, {
        category: 'analytical',
        type: 'prompt',
        provider,
        model
      });
    }

    return result;
  }

  // ═══════════════════════════════════════════════════════════
  // 🎨 BEISPIEL: CODING MIT LEARNING
  // ═══════════════════════════════════════════════════════════

  async function performCodingWithLearning(text, categories, project) {
    // Normale Coding-Logik
    const codingResult = await performCoding(text, categories);

    // Track Erfolg basierend auf Qualität
    if (genesis) {
      const quality = codingResult.confidence || 0.5;
      const success = quality > 0.7;

      genesis.trackResult('coding', success, {
        category: codingResult.categoryType || 'analytical',
        type: 'strategy',
        quality: quality,
        hasConsensus: codingResult.hasConsensus
      });
    }

    return codingResult;
  }

  // ═══════════════════════════════════════════════════════════
  // 🎯 BEISPIEL: REPORT GENERATION MIT LEARNING
  // ═══════════════════════════════════════════════════════════

  async function generateReportWithLearning(project, type) {
    // Hole beste Strategie für Report-Typ
    const strategy = genesis?.getBestStrategy('synthetic', 1);

    // Generate report
    const report = await generateReport(project, type);

    // Track basierend auf Report-Qualität
    if (genesis && report) {
      const wordCount = report.split(' ').length;
      const success = wordCount > 1000; // Mindest-Qualität

      genesis.trackResult('report-generation', success, {
        category: 'synthetic',
        type: 'strategy',
        reportType: type,
        wordCount: wordCount
      });
    }

    return report;
  }

  // ═══════════════════════════════════════════════════════════
  // 🎮 UI RENDERING
  // ═══════════════════════════════════════════════════════════

  return (
    <div className="evidenra-app">
      {/* Genesis Status Badge */}
      {genesisStats && (
        <div className="genesis-status-badge" onClick={() => setShowGenesisDashboard(!showGenesisDashboard)}>
          🧬 Genesis Gen {genesisStats.generation} 
          {genesisStats.isRunning && ' 🟢'}
          <div className="consciousness-mini">
            Consciousness: {(genesisStats.consciousness.selfAwareness * 100).toFixed(0)}%
          </div>
        </div>
      )}

      {/* Genesis Dashboard Modal */}
      {showGenesisDashboard && genesis && (
        <div className="genesis-modal-overlay" onClick={() => setShowGenesisDashboard(false)}>
          <div className="genesis-modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="close-button" 
              onClick={() => setShowGenesisDashboard(false)}
            >
              ✕
            </button>
            <GenesisDashboard genesisEngine={genesis.getEngine()} />
          </div>
        </div>
      )}

      {/* Deine normale Evidenra App */}
      <YourNormalEvidenraApp 
        genesis={genesis}
        onAKIHCalculation={calculateAKIHWithLearning}
        onAPICall={callAPIWithOptimizedPrompt}
        onCoding={performCodingWithLearning}
        onReportGeneration={generateReportWithLearning}
      />
    </div>
  );
}

/**
 * ═══════════════════════════════════════════════════════════
 * 🎨 CUSTOM STYLES FÜR INTEGRATION
 * ═══════════════════════════════════════════════════════════
 * 
 * Füge diese Styles zu deiner CSS-Datei hinzu:
 */

const integrationStyles = `
/* Genesis Status Badge */
.genesis-status-badge {
  position: fixed;
  top: 20px;
  right: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 1rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  z-index: 1000;
  transition: all 0.3s ease;
  font-weight: bold;
}

.genesis-status-badge:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.3);
}

.consciousness-mini {
  font-size: 0.85rem;
  margin-top: 0.25rem;
  opacity: 0.9;
}

/* Genesis Modal */
.genesis-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.7);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.genesis-modal-content {
  position: relative;
  max-width: 1400px;
  max-height: 90vh;
  overflow-y: auto;
  border-radius: 1rem;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
}

.close-button {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(255,255,255,0.2);
  border: none;
  color: white;
  font-size: 1.5rem;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  z-index: 10000;
  transition: all 0.3s ease;
}

.close-button:hover {
  background: rgba(255,255,255,0.3);
  transform: rotate(90deg);
}
`;

export default EvidenraWithGenesis;

/**
 * ═══════════════════════════════════════════════════════════
 * 📝 INTEGRATION CHECKLIST
 * ═══════════════════════════════════════════════════════════
 * 
 * ✅ 1. Genesis Engine Dateien kopiert
 * ✅ 2. Import Statements hinzugefügt
 * ✅ 3. Genesis initialisiert in useEffect
 * ✅ 4. Status Badge im UI
 * ✅ 5. Dashboard Modal eingebaut
 * ✅ 6. Tracking in kritischen Funktionen:
 *    - AKIH Score Berechnung
 *    - API Calls
 *    - Coding Operations
 *    - Report Generation
 * ✅ 7. Optimierte Prompts nutzen
 * ✅ 8. Event Listeners registriert
 * ✅ 9. CSS Styles hinzugefügt
 * ✅ 10. Testing durchgeführt
 * 
 * READY TO EVOLVE! 🚀
 */
