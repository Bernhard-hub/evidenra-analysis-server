/**
 * ═══════════════════════════════════════════════════════════
 * 💾 GENESIS PERSISTENCE
 * IndexedDB Layer für persistente Speicherung
 * ═══════════════════════════════════════════════════════════
 */

export class GenesisPersistence {
  constructor() {
    this.dbName = 'GenesisDB';
    this.version = 1;
    this.storeName = 'evolution';
    this.db = null;
  }

  // ═══════════════════════════════════════════════════════════
  // 🔧 DATABASE INITIALIZATION
  // ═══════════════════════════════════════════════════════════

  async init() {
    // Check if IndexedDB is available
    if (typeof indexedDB === 'undefined') {
      console.warn('⚠️ IndexedDB not available, using localStorage only');
      return null;
    }

    return new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open(this.dbName, this.version);

        // Set a timeout for slow IndexedDB operations
        const timeout = setTimeout(() => {
          console.warn('⚠️ IndexedDB init timeout, using localStorage');
          resolve(null);
        }, 5000);

        request.onerror = () => {
          clearTimeout(timeout);
          console.error('❌ Failed to open IndexedDB:', request.error);
          resolve(null); // Don't reject, just fallback to localStorage
        };

        request.onsuccess = () => {
          clearTimeout(timeout);
          this.db = request.result;
          console.log('✅ IndexedDB opened successfully');
          resolve(this.db);
        };

        request.onupgradeneeded = (event) => {
          const db = event.target.result;

          // Create object stores
          if (!db.objectStoreNames.contains(this.storeName)) {
            const objectStore = db.createObjectStore(this.storeName, { keyPath: 'id' });
            objectStore.createIndex('timestamp', 'timestamp', { unique: false });
            objectStore.createIndex('generation', 'generation', { unique: false });
            console.log('✅ Object store created');
          }
        };
      } catch (error) {
        console.error('❌ IndexedDB init error:', error);
        resolve(null);
      }
    });
  }

  // ═══════════════════════════════════════════════════════════
  // 💾 SAVE STATE
  // ═══════════════════════════════════════════════════════════

  async save(state) {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);

      // Convert Maps to Objects for storage
      const serializedState = {
        id: 'current',
        timestamp: Date.now(),
        generation: state.dna.generation,
        dna: this.serializeDNA(state.dna),
        metaEvolution: state.metaEvolution,
        consciousness: state.consciousness
      };

      const request = objectStore.put(serializedState);

      request.onsuccess = () => {
        console.log(`💾 State saved - Generation ${state.dna.generation}`);
        
        // Also save to localStorage as backup
        this.saveToLocalStorage(serializedState);
        
        resolve();
      };

      request.onerror = () => {
        console.error('❌ Failed to save state:', request.error);
        reject(request.error);
      };
    });
  }

  // ═══════════════════════════════════════════════════════════
  // 📥 LOAD STATE
  // ═══════════════════════════════════════════════════════════

  async load() {
    try {
      if (!this.db) {
        await this.init();
      }

      return new Promise((resolve, reject) => {
        try {
          const transaction = this.db.transaction([this.storeName], 'readonly');
          const objectStore = transaction.objectStore(this.storeName);
          const request = objectStore.get('current');

          request.onsuccess = () => {
            if (request.result) {
              const state = this.deserializeState(request.result);
              console.log(`📥 State loaded - Generation ${state.dna.generation}`);
              resolve(state);
            } else {
              console.log('📭 No saved state found');
              resolve(null);
            }
          };

          request.onerror = () => {
            console.error('❌ Failed to load state:', request.error);

            // Try localStorage backup
            const backup = this.loadFromLocalStorage();
            if (backup) {
              console.log('📥 Loaded from localStorage backup');
              resolve(backup);
            } else {
              resolve(null); // Return null instead of rejecting
            }
          };
        } catch (error) {
          console.error('❌ Transaction error:', error);
          const backup = this.loadFromLocalStorage();
          resolve(backup || null);
        }
      });
    } catch (error) {
      console.error('❌ Genesis persistence load failed:', error);
      // Try localStorage backup as last resort
      const backup = this.loadFromLocalStorage();
      return backup || null;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 🗄️ HISTORY MANAGEMENT
  // ═══════════════════════════════════════════════════════════

  async saveSnapshot(state, label = '') {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);

      const snapshot = {
        id: `snapshot_${Date.now()}`,
        label,
        timestamp: Date.now(),
        generation: state.dna.generation,
        dna: this.serializeDNA(state.dna),
        metaEvolution: state.metaEvolution,
        consciousness: state.consciousness
      };

      const request = objectStore.put(snapshot);

      request.onsuccess = () => {
        console.log(`📸 Snapshot saved: ${snapshot.id}`);
        resolve(snapshot.id);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async getSnapshots() {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.getAll();

      request.onsuccess = () => {
        const snapshots = request.result.filter(s => s.id.startsWith('snapshot_'));
        resolve(snapshots);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // ═══════════════════════════════════════════════════════════
  // 🔄 SERIALIZATION / DESERIALIZATION
  // ═══════════════════════════════════════════════════════════

  serializeDNA(dna) {
    return {
      promptGenes: Array.from(dna.promptGenes.entries()),
      personaGenes: Array.from(dna.personaGenes.entries()),
      strategyGenes: Array.from(dna.strategyGenes.entries()),
      mutationRate: dna.mutationRate,
      crossoverRate: dna.crossoverRate,
      generation: dna.generation,
      totalMutations: dna.totalMutations,
      totalCrossovers: dna.totalCrossovers,
      extinctionEvents: dna.extinctionEvents,
      survivalMetrics: Array.from(dna.survivalMetrics.entries()),
      fitnessHistory: dna.fitnessHistory,
      bestGenes: dna.bestGenes
    };
  }

  deserializeState(serialized) {
    return {
      dna: {
        promptGenes: new Map(serialized.dna.promptGenes),
        personaGenes: new Map(serialized.dna.personaGenes),
        strategyGenes: new Map(serialized.dna.strategyGenes),
        mutationRate: serialized.dna.mutationRate,
        crossoverRate: serialized.dna.crossoverRate,
        generation: serialized.dna.generation,
        totalMutations: serialized.dna.totalMutations,
        totalCrossovers: serialized.dna.totalCrossovers,
        extinctionEvents: serialized.dna.extinctionEvents,
        survivalMetrics: new Map(serialized.dna.survivalMetrics),
        fitnessHistory: serialized.dna.fitnessHistory,
        bestGenes: serialized.dna.bestGenes
      },
      metaEvolution: serialized.metaEvolution,
      consciousness: serialized.consciousness
    };
  }

  // ═══════════════════════════════════════════════════════════
  // 💾 LOCALSTORAGE BACKUP
  // ═══════════════════════════════════════════════════════════

  saveToLocalStorage(state) {
    try {
      localStorage.setItem('genesis_backup', JSON.stringify(state));
      localStorage.setItem('genesis_backup_timestamp', Date.now().toString());
    } catch (error) {
      console.error('❌ localStorage backup failed:', error);
    }
  }

  loadFromLocalStorage() {
    try {
      const backup = localStorage.getItem('genesis_backup');
      if (backup) {
        return this.deserializeState(JSON.parse(backup));
      }
    } catch (error) {
      console.error('❌ localStorage load failed:', error);
    }
    return null;
  }

  // ═══════════════════════════════════════════════════════════
  // 🗑️ CLEANUP
  // ═══════════════════════════════════════════════════════════

  async clearAll() {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.clear();

      request.onsuccess = () => {
        console.log('🗑️ All data cleared');
        localStorage.removeItem('genesis_backup');
        localStorage.removeItem('genesis_backup_timestamp');
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async exportData() {
    const state = await this.load();
    const snapshots = await this.getSnapshots();

    return {
      current: state,
      snapshots: snapshots,
      exportDate: new Date().toISOString(),
      version: this.version
    };
  }

  async importData(data) {
    if (data.current) {
      await this.save(data.current);
    }

    if (data.snapshots) {
      for (const snapshot of data.snapshots) {
        await this.saveSnapshot(snapshot, snapshot.label);
      }
    }

    console.log('✅ Data imported successfully');
  }
}
