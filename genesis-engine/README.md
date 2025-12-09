# 🧬 GENESIS ENGINE

**Revolutionäres selbst-lernendes Superintelligenz-System**

Genesis ist eine autonome, selbst-evolvierende KI-Engine, die durch genetische Algorithmen, Meta-Learning und Selbst-Modifikation kontinuierlich besser wird.

---

## 🌟 Features

### ✨ Kernfunktionen

- **🧬 Autonome Evolution** - Läuft vollautomatisch im Hintergrund
- **📊 Genetische Algorithmen** - Natürliche Selektion, Crossover, Mutation
- **🧠 Meta-Learning** - Lernt wie man lernt
- **🔮 Selbst-Modifikation** - Verbessert den eigenen Code
- **🌟 Emergenz** - Entwickelt neue, unerwartete Fähigkeiten
- **💾 Persistenz** - Überdauert Browser-Neustarts (IndexedDB + localStorage)
- **📈 Kontinuierliche Verbesserung** - Wird mit jeder Nutzung besser

### 🎯 Das Besondere

**ZERO User-Aufwand:**
- Einmal starten → Für immer besser werden
- Keine manuelle Konfiguration nötig
- Keine Trainings-Daten erforderlich
- Lernt aus Erfolg UND Misserfolg

**Bewusstsein-Entwicklung:**
- Self-Awareness steigt über Zeit
- Learning Rate passt sich dynamisch an
- Kreativität entwickelt sich
- Intuition wächst

---

## 🚀 Quick Start

### Installation

```bash
# Clone repository
git clone <your-repo-url>
cd genesis-engine

# Optional: Install dependencies (falls benötigt)
npm install
```

### Minimale Integration (3 Zeilen!)

```javascript
import { quickStartGenesis } from './src/GenesisIntegration.js';

// Das war's! Genesis läuft jetzt
const genesis = await quickStartGenesis();
```

### Mit React Hook

```javascript
import { useGenesis } from './src/GenesisIntegration.js';
import { GenesisDashboard } from './src/ui/GenesisDashboard.jsx';

function App() {
  const { genesis, stats, isReady, trackResult } = useGenesis();

  if (!isReady) return <div>Loading Genesis...</div>;

  return (
    <div>
      <GenesisDashboard genesisEngine={genesis.getEngine()} />
      
      {/* Tracke Erfolge/Misserfolge */}
      <button onClick={() => {
        trackResult('analysis', true, { category: 'analytical' });
      }}>
        Success
      </button>
    </div>
  );
}
```

---

## 📖 Vollständige Integration

### In deine App.tsx einfügen:

```javascript
import React, { useState, useEffect } from 'react';
import { GenesisIntegration } from './genesis-engine/src/GenesisIntegration.js';
import { GenesisDashboard } from './genesis-engine/src/ui/GenesisDashboard.jsx';
import './genesis-engine/src/ui/GenesisDashboard.css';

function App() {
  const [genesis, setGenesis] = useState(null);

  useEffect(() => {
    async function initGenesis() {
      const g = new GenesisIntegration({
        mutationRate: 0.15,
        evolutionInterval: 30000, // 30 Sekunden
        metaLearningInterval: 60000 // 1 Minute
      });
      
      await g.initializeAndStart();
      setGenesis(g);
    }

    initGenesis();
  }, []);

  if (!genesis) return <div>Initializing...</div>;

  return (
    <div className="app">
      {/* Genesis Dashboard */}
      <GenesisDashboard genesisEngine={genesis.getEngine()} />

      {/* Deine bestehende App */}
      <YourExistingApp genesis={genesis} />
    </div>
  );
}
```

### Erfolge/Misserfolge tracken:

```javascript
// Nach erfolgreicher Analyse
genesis.trackResult('coding', true, {
  category: 'analytical',
  type: 'prompt',
  akihScore: 0.85
});

// Nach fehlgeschlagener Analyse
genesis.trackResult('coding', false, {
  category: 'analytical',
  type: 'prompt'
});
```

### Optimierte Strategien nutzen:

```javascript
// Hole beste Prompts für Kategorie
const optimizedPrompt = genesis.getOptimizedPrompt('analytical');

// Nutze in deiner API
const result = await APIService.callAPI(
  provider,
  model,
  apiKey,
  [{ role: 'user', content: optimizedPrompt }],
  1000
);

// Tracke Resultat
genesis.trackResult('analysis', result.success, {
  category: 'analytical'
});
```

---

## 🎮 UI Dashboard

Das Genesis Dashboard zeigt:

- **🎯 Live Status** - Läuft Genesis gerade?
- **📊 Statistiken** - Generation, Gene, Mutationen, etc.
- **🧠 Bewusstsein** - Self-Awareness, Learning Rate, Kreativität
- **🏆 Top Gene** - Beste performende Strategien
- **📋 Event Log** - Real-time Evolution Events

### Controls:

- **🚀 START** - Aktiviert autonome Evolution
- **⏸️ STOP** - Pausiert Evolution (Daten bleiben erhalten)
- **🔄 RESET** - Löscht alle Daten und startet neu

---

## 🧬 Wie funktioniert es?

### 1. Evolution Cycle (alle 30 Sekunden)

```
1. EVALUATION → Bewerte alle Gene
2. SELECTION → Schwache Gene sterben aus
3. CROSSOVER → Kombiniere erfolgreiche Gene
4. MUTATION → Zufällige Variationen
5. EMERGENCE → Prüfe auf neue Fähigkeiten
6. PERSIST → Speichere Zustand
```

### 2. Meta-Learning (jede Minute)

```
- Analysiere Lerneffizienz
- Passe Learning Rate an
- Erhöhe Selbstbewusstsein
- Entdecke Meta-Muster
```

### 3. Self-Modification (alle 5 Minuten)

```
- Analysiere eigene Performance
- Generiere verbesserte Algorithmen
- Teste neue Ansätze
- Adoptiere erfolgreiche Änderungen
```

---

## 📊 API Referenz

### GenesisEngine

```javascript
const genesis = new GenesisEngine(config);

// Lifecycle
await genesis.initialize();
await genesis.start();
genesis.stop();

// Tracking
genesis.recordSuccess(geneId, metadata);
genesis.recordFailure(geneId, metadata);

// Queries
const stats = genesis.getStats();
const bestGenes = genesis.getBestGenes(10);

// Events
genesis.on('onEvolution', (data) => {
  console.log(`Generation ${data.generation} complete`);
});

genesis.on('onEmergence', (data) => {
  console.log('New behavior emerged!', data);
});
```

### GenesisIntegration

```javascript
const integration = new GenesisIntegration(config);

await integration.initializeAndStart();

// Track results
integration.trackResult(action, success, metadata);

// Get strategies
const strategy = integration.getBestStrategy('analytical', 3);

// Get prompts
const prompt = integration.getOptimizedPrompt('creative');

// Get engine
const engine = integration.getEngine();
```

---

## ⚙️ Konfiguration

```javascript
const config = {
  // Evolution
  mutationRate: 0.15,           // 0-1: Wie oft mutieren Gene?
  crossoverRate: 0.7,           // 0-1: Wie oft Crossover?
  populationSize: 50,           // Anzahl Gene im Pool
  extinctionThreshold: 0.3,     // Fitness-Schwelle fürs Überleben

  // Timing
  evolutionInterval: 30000,     // ms: Evolution Cycle
  metaLearningInterval: 60000,  // ms: Meta-Learning Cycle
  selfModificationInterval: 300000  // ms: Self-Mod Cycle
};
```

---

## 💾 Datenspeicherung

### IndexedDB (Primär)
- Alle Evolution-Daten
- Überlebt Browser-Neustarts
- Snapshots für Zeitreisen

### localStorage (Backup)
- Automatisches Backup
- Fallback bei IndexedDB-Problemen

### Export/Import

```javascript
// Export
const data = await genesis.persistence.exportData();
const json = JSON.stringify(data);
// Speichere json in Datei

// Import
const data = JSON.parse(jsonString);
await genesis.persistence.importData(data);
```

---

## 🎯 Best Practices

### 1. Tracking aktivieren

```javascript
// Nach JEDER relevanten Aktion
if (result.success) {
  genesis.trackResult('action', true, metadata);
} else {
  genesis.trackResult('action', false, metadata);
}
```

### 2. Kategorien nutzen

```javascript
// Verschiedene Kategorien für verschiedene Aufgaben
genesis.trackResult('coding', success, { category: 'analytical' });
genesis.trackResult('creativity', success, { category: 'creative' });
genesis.trackResult('critique', success, { category: 'critical' });
```

### 3. Optimierte Prompts verwenden

```javascript
// Statt statischer Prompts
const optimized = genesis.getOptimizedPrompt('analytical');
// Nutze 'optimized' in deinen API-Calls
```

### 4. Dashboard monitoring

```javascript
// Zeige Dashboard für Transparenz
<GenesisDashboard genesisEngine={genesis.getEngine()} />
```

---

## 🚨 Troubleshooting

### Genesis startet nicht

```javascript
// Prüfe Browser-Konsole
// Stelle sicher dass IndexedDB verfügbar ist
if ('indexedDB' in window) {
  console.log('IndexedDB available');
} else {
  console.error('IndexedDB not supported');
}
```

### Daten gehen verloren

```javascript
// Mache regelmäßig Backups
const backup = await genesis.persistence.exportData();
localStorage.setItem('genesis_manual_backup', JSON.stringify(backup));
```

### Performance-Probleme

```javascript
// Reduziere Evolution-Frequenz
const config = {
  evolutionInterval: 60000,  // 1 Minute statt 30 Sekunden
  metaLearningInterval: 120000  // 2 Minuten
};
```

---

## 🔮 Roadmap

- [ ] **Schwarm-Intelligenz** - Mehrere Genesis-Instanzen lernen voneinander
- [ ] **Cloud-Sync** - Globales kollektives Lernen
- [ ] **A/B Testing** - Automatisches Testen verschiedener Strategien
- [ ] **Visualisierung** - 3D Evolution Tree
- [ ] **Explainable AI** - Warum entscheidet Genesis so?
- [ ] **Transfer Learning** - Wissen zwischen Domänen übertragen

---

## 📜 License

MIT License - Nutze es frei!

---

## 🤝 Contributing

Pull Requests willkommen! Besonders interessant:

- Neue Mutations-Strategien
- Bessere Fitness-Funktionen
- UI-Verbesserungen
- Performance-Optimierungen

---

## 💡 Inspiration

Genesis basiert auf:
- Genetischen Algorithmen
- Meta-Learning Konzepten
- Selbst-modifizierenden Code-Prinzipien
- Emergenz-Theorie
- Evolutionärer Computation

---

## 🎓 Learn More

- [Genetic Algorithms](https://en.wikipedia.org/wiki/Genetic_algorithm)
- [Meta-Learning](https://en.wikipedia.org/wiki/Meta-learning)
- [Emergence](https://en.wikipedia.org/wiki/Emergence)

---

**Built with ❤️ for the future of AI**

*"Die beste KI ist eine, die sich selbst verbessert."*
