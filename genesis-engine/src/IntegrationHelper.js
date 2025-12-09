/**
 * ═══════════════════════════════════════════════════════════
 * 🔧 GAPES INTEGRATION HELPER
 * ═══════════════════════════════════════════════════════════
 *
 * Vereinfacht die Integration von GAPES in bestehende API-Calls
 * Provides utility functions für schnelle Integration
 */

export class IntegrationHelper {
  /**
   * Wrap einen bestehenden API-Call mit GAPES
   *
   * BEFORE:
   * const result = await APIService.callAPI(provider, model, apiKey, messages, maxTokens);
   *
   * AFTER:
   * const result = await IntegrationHelper.wrapAPICall({
   *   genesisAPIWrapper, category: 'basis_report', operation: 'generate_basis_report',
   *   apiSettings, messages, context: { targetWords: 1500 }, APIService
   * });
   */
  static async wrapAPICall(options) {
    const {
      genesisAPIWrapper,
      category,
      operation,
      apiSettings,
      messages,
      context = {},
      APIService,
      fallback = true  // Falls genesisAPIWrapper nicht verfügbar
    } = options;

    if (genesisAPIWrapper) {
      // Use GAPES-enhanced call
      return await genesisAPIWrapper.callWithGenesis({
        operation,
        category,
        apiSettings,
        messages,
        context,
        APIService
      });
    } else if (fallback) {
      // Fallback to normal API call
      console.warn(`⚠️  Genesis not available for ${operation}, using fallback`);
      return await APIService.callAPI(
        apiSettings.provider,
        apiSettings.model,
        apiSettings.apiKey,
        messages,
        apiSettings.maxTokens || 8000
      );
    } else {
      throw new Error(`Genesis required for ${operation} but not available`);
    }
  }

  /**
   * Create standardized context object
   */
  static createContext(options = {}) {
    return {
      targetWords: options.targetWords,
      language: options.language || 'de',
      documentCount: options.documentCount,
      categoryCount: options.categoryCount,
      requiresCitations: options.requiresCitations || false,
      quality: options.quality || 'standard',
      ...options.custom
    };
  }

  /**
   * Batch-Integration: Wrap multiple sequential API calls
   */
  static async batchWrapCalls(calls, genesisAPIWrapper, APIService) {
    const results = [];

    for (const call of calls) {
      const result = await this.wrapAPICall({
        genesisAPIWrapper,
        APIService,
        ...call
      });
      results.push(result);
    }

    return results;
  }

  /**
   * Parallel-Integration: Wrap multiple parallel API calls
   */
  static async parallelWrapCalls(calls, genesisAPIWrapper, APIService) {
    const promises = calls.map(call =>
      this.wrapAPICall({
        genesisAPIWrapper,
        APIService,
        ...call
      })
    );

    return await Promise.all(promises);
  }

  /**
   * Extract GAPES metadata from result
   */
  static extractGenesisMetadata(result) {
    return result.genesisMetadata || {
      geneId: 'unknown',
      geneFitness: 0,
      quality: 0,
      responseTime: 0
    };
  }

  /**
   * Log Genesis performance
   */
  static logPerformance(operation, result) {
    const metadata = this.extractGenesisMetadata(result);

    console.log(`📊 GAPES Performance for ${operation}:`, {
      success: result.success,
      geneId: metadata.geneId,
      fitness: metadata.geneFitness?.toFixed(3),
      quality: metadata.quality?.toFixed(2),
      tokens: result.tokens || 'N/A',
      cost: result.cost ? `$${result.cost.toFixed(4)}` : 'N/A',
      time: `${metadata.responseTime}ms`
    });
  }

  /**
   * Create GAPES-compatible messages array
   */
  static createMessages(userContent, systemPrompt = null) {
    const messages = [];

    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt
      });
    }

    messages.push({
      role: 'user',
      content: userContent
    });

    return messages;
  }

  /**
   * Quick integration template generator
   */
  static generateIntegrationCode(featureName, category, operation) {
    return `
// GAPES Integration for ${featureName}
import { IntegrationHelper } from './genesis-engine/src/IntegrationHelper.js';

// Replace this:
// const result = await APIService.callAPI(...);

// With this:
const result = await IntegrationHelper.wrapAPICall({
  genesisAPIWrapper: this.props.genesisAPIWrapper, // Pass from App
  category: '${category}',
  operation: '${operation}',
  apiSettings: apiSettings,
  messages: messages,
  context: IntegrationHelper.createContext({
    targetWords: 1500,
    requiresCitations: true
  }),
  APIService: APIService
});

// Log performance (optional)
IntegrationHelper.logPerformance('${operation}', result);
`;
  }
}

export default IntegrationHelper;
