/**
 * ═══════════════════════════════════════════════════════════
 * 🔌 GENESIS API WRAPPER
 * ═══════════════════════════════════════════════════════════
 *
 * Wrapper für alle API-Calls mit automatischem:
 * - Prompt-Optimierung durch GAPES
 * - Erfolgs/Misserfolgs-Tracking
 * - Cost/Token-Monitoring
 * - Quality-Assessment
 */

import { GAPES } from './GAPES.js';

export class GenesisAPIWrapper {
  constructor(genesisIntegration) {
    this.genesis = genesisIntegration;
    this.gapes = new GAPES(genesisIntegration.getEngine());

    // Load persisted stats from localStorage
    const savedStats = this.loadStats();
    this.stats = savedStats || {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      totalTokens: 0,
      totalCost: 0,
      avgResponseTime: 0,
      streak: 0, // Consecutive successful calls
      lastCallTimestamp: 0
    };
  }

  /**
   * 💾 Load stats from localStorage
   */
  loadStats() {
    try {
      const saved = localStorage.getItem('genesis_api_stats');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.warn('Could not load Genesis API stats:', error);
      return null;
    }
  }

  /**
   * 💾 Save stats to localStorage
   */
  saveStats() {
    try {
      localStorage.setItem('genesis_api_stats', JSON.stringify(this.stats));
    } catch (error) {
      console.warn('Could not save Genesis API stats:', error);
    }
  }

  /**
   * 🎯 MAIN METHOD: Call API with Genesis Enhancement
   */
  async callWithGenesis(options) {
    const {
      operation,           // e.g. 'ultimate_section_generation'
      category,            // e.g. 'scientific_article_section'
      apiSettings,         // { provider, model, apiKey, maxTokens }
      messages,            // Original API messages
      context = {},        // Additional context
      APIService           // The API service to use
    } = options;

    console.log(`🧬 Genesis API Call: ${operation} (${category})`);

    const startTime = Date.now();
    this.stats.totalCalls++;

    try {
      // 1. Get optimized prompt from GAPES
      const gapesResult = this.gapes.getOptimizedPrompt(category, context);
      let optimizedMessages = [...messages];

      if (gapesResult && gapesResult.prompt) {
        // Replace system prompt with optimized version
        if (optimizedMessages[0]?.role === 'system') {
          console.log(`🧬 GAPES: Replacing prompt with gene ${gapesResult.geneId}`);
          optimizedMessages[0] = {
            ...optimizedMessages[0],
            content: gapesResult.prompt
          };
        } else {
          // Add as system message if no system message exists
          optimizedMessages.unshift({
            role: 'system',
            content: gapesResult.prompt
          });
        }
      }

      // 2. Make API call
      const result = await APIService.callAPI(
        apiSettings.provider,
        apiSettings.model,
        apiSettings.apiKey,
        optimizedMessages,
        apiSettings.maxTokens || 8000
      );

      const responseTime = Date.now() - startTime;

      // 3. Calculate quality metrics
      const quality = this.assessQuality(result, context);

      // 4. Track result in Genesis
      if (result.success) {
        this.stats.successfulCalls++;

        // Track in GAPES if we used optimized prompt
        if (gapesResult) {
          await this.gapes.trackResult(gapesResult.geneId, true, {
            tokenCount: result.tokens || this.estimateTokens(result.content),
            cost: result.cost || 0,
            quality: quality,
            responseTime: responseTime,
            operation: operation
          });
        }

        // Track in Genesis
        this.genesis.trackResult(operation, true, {
          category: category,
          type: 'api_call',
          provider: apiSettings.provider,
          model: apiSettings.model,
          tokens: result.tokens,
          cost: result.cost,
          quality: quality,
          responseTime: responseTime
        });
      } else {
        this.stats.failedCalls++;

        // Track failure
        if (gapesResult) {
          await this.gapes.trackResult(gapesResult.geneId, false, {
            error: result.error,
            operation: operation
          });
        }

        this.genesis.trackResult(operation, false, {
          category: category,
          type: 'api_call',
          error: result.error
        });
      }

      // 5. Update stats
      this.updateStats(result, responseTime);

      // 6. Log result
      console.log(`🧬 Genesis API Result: ${result.success ? '✅' : '❌'} (${responseTime}ms, ${result.tokens || 0} tokens, $${result.cost || 0})`);

      return {
        ...result,
        genesisMetadata: {
          geneId: gapesResult?.geneId,
          geneFitness: gapesResult?.metadata?.fitness,
          quality: quality,
          responseTime: responseTime
        }
      };

    } catch (error) {
      console.error(`❌ Genesis API Error:`, error);
      this.stats.failedCalls++;

      this.genesis.trackResult(operation, false, {
        category: category,
        type: 'api_call',
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Assess quality of API response
   */
  assessQuality(result, context) {
    if (!result.success || !result.content) {
      return 0;
    }

    let score = 0.5; // Base score

    // Word count check
    if (context.targetWords) {
      const wordCount = result.content.split(/\s+/).length;
      const targetWords = context.targetWords;
      const wordRatio = Math.min(wordCount, targetWords) / Math.max(wordCount, targetWords);
      score += wordRatio * 0.2;
    }

    // Content length check (not empty)
    if (result.content.length > 100) {
      score += 0.1;
    }

    // Has proper structure (paragraphs)
    if (result.content.includes('\n\n')) {
      score += 0.1;
    }

    // For scientific content: check for citations
    if (context.requiresCitations) {
      const hasCitations = /\([A-Z][a-z]+,?\s+\d{4}\)|\[\d+\]/.test(result.content);
      if (hasCitations) {
        score += 0.1;
      }
    }

    return Math.min(score, 1.0); // Cap at 1.0
  }

  /**
   * Estimate tokens from text
   */
  estimateTokens(text) {
    if (!text) return 0;
    // Rough estimate: ~1.3 tokens per word
    return Math.ceil(text.split(/\s+/).length * 1.3);
  }

  /**
   * Update statistics
   */
  updateStats(result, responseTime) {
    if (result.tokens) {
      this.stats.totalTokens += result.tokens;
    }
    if (result.cost) {
      this.stats.totalCost += result.cost;
    }

    // Update average response time
    const totalCalls = this.stats.totalCalls;
    this.stats.avgResponseTime =
      (this.stats.avgResponseTime * (totalCalls - 1) + responseTime) / totalCalls;

    // Update streak
    if (result.success) {
      this.stats.streak++;
    } else {
      this.stats.streak = 0; // Reset on failure
    }

    // Update last call timestamp
    this.stats.lastCallTimestamp = Date.now();

    // 💾 Persist stats to localStorage
    this.saveStats();
  }

  /**
   * Get wrapper statistics
   */
  getStats() {
    return {
      ...this.stats,
      cost: this.stats.totalCost, // Alias for compatibility with UI
      successRate: this.stats.totalCalls > 0 ?
        this.stats.successfulCalls / this.stats.totalCalls : 0,
      avgCostPerCall: this.stats.totalCalls > 0 ?
        this.stats.totalCost / this.stats.totalCalls : 0,
      avgTokensPerCall: this.stats.totalCalls > 0 ?
        this.stats.totalTokens / this.stats.totalCalls : 0,
      streak: this.stats.streak || 0, // Current success streak
      gapesStats: this.gapes.getStats()
    };
  }

  /**
   * Export GAPES genes for backup
   */
  exportGenes() {
    return this.gapes.exportGenes();
  }

  /**
   * Import GAPES genes from backup
   */
  importGenes(data) {
    this.gapes.importGenes(data);
  }

  /**
   * Get GAPES instance (for direct access if needed)
   */
  getGAPES() {
    return this.gapes;
  }

  /**
   * Trigger Meta-Learning
   */
  async triggerMetaLearning() {
    console.log('🧠 Genesis: Triggering Meta-Learning...');
    this.gapes.learnMetaPatterns();
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      totalTokens: 0,
      totalCost: 0,
      avgResponseTime: 0
    };
  }
}

export default GenesisAPIWrapper;
