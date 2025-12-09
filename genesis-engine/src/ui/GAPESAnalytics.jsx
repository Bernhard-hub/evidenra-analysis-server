/**
 * ═══════════════════════════════════════════════════════════
 * 📊 GAPES ANALYTICS DASHBOARD
 * ═══════════════════════════════════════════════════════════
 *
 * Zeigt detaillierte Analytics für GAPES Performance
 */

import React, { useState, useEffect } from 'react';

/**
 * Format gene category/type for better readability
 */
const formatGeneCategory = (category, operation) => {
  const categoryMap = {
    'omniscience_query': '🔮 Omniscience Query',
    'ultimate_report_section': '📊 ULTIMATE Report Section',
    'basis_report': '📋 BASIS Methodology Report',
    'scientific_article': '📄 Scientific Article',
    'coding_operation': '🏷️ AI Category Generation',
    'meta_intelligence': '🧠 Meta-Intelligence',
    'enhanced_report': '✨ Enhanced Report',
    'methodology_documentation': '📚 Methodology Documentation'
  };

  // Try to get mapped category name
  let displayName = categoryMap[category] || category;

  // Add operation details if available
  if (operation) {
    const operationMap = {
      'meta_stage1_self_assessment': 'Stage 1: Self-Assessment',
      'meta_stage2_prompt_generation': 'Stage 2: Prompt Generation',
      'meta_stage3_report_generation': 'Stage 3: Report Generation',
      'ai_category_generation': 'AI-Powered Categorization',
      'generate_enhanced_article': 'Enhanced Article Generation'
    };

    if (operationMap[operation]) {
      displayName += ` - ${operationMap[operation]}`;
    }
  }

  return displayName;
};

export function GAPESAnalytics({ genesisAPIWrapper }) {
  const [stats, setStats] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    if (!genesisAPIWrapper) return;

    const updateStats = () => {
      const wrapperStats = genesisAPIWrapper.getStats();
      setStats(wrapperStats);
    };

    updateStats();
    const interval = setInterval(updateStats, 2000);

    return () => clearInterval(interval);
  }, [genesisAPIWrapper]);

  if (!stats) {
    return (
      <div className="gapes-analytics-loading">
        <div className="spinner"></div>
        <p>Loading GAPES Analytics...</p>
      </div>
    );
  }

  const { gapesStats } = stats;

  return (
    <div className="gapes-analytics">
      <h2 className="gapes-title">🧬 GAPES Analytics Dashboard</h2>

      {/* Summary Cards */}
      <div className="gapes-summary">
        <div className="gapes-card">
          <div className="card-icon">📞</div>
          <div className="card-content">
            <div className="card-value">{stats.totalCalls}</div>
            <div className="card-label">Total API Calls</div>
          </div>
        </div>

        <div className="gapes-card success">
          <div className="card-icon">✅</div>
          <div className="card-content">
            <div className="card-value">{(stats.successRate * 100).toFixed(1)}%</div>
            <div className="card-label">Success Rate</div>
          </div>
        </div>

        <div className="gapes-card cost">
          <div className="card-icon">💰</div>
          <div className="card-content">
            <div className="card-value">${stats.totalCost.toFixed(2)}</div>
            <div className="card-label">Total Cost</div>
            <div className="card-subtext">Avg: ${stats.avgCostPerCall.toFixed(4)}/call</div>
          </div>
        </div>

        <div className="gapes-card tokens">
          <div className="card-icon">🎫</div>
          <div className="card-content">
            <div className="card-value">{stats.totalTokens.toLocaleString()}</div>
            <div className="card-label">Total Tokens</div>
            <div className="card-subtext">Avg: {Math.round(stats.avgTokensPerCall)}/call</div>
          </div>
        </div>

        <div className="gapes-card time">
          <div className="card-icon">⏱️</div>
          <div className="card-content">
            <div className="card-value">{Math.round(stats.avgResponseTime)}ms</div>
            <div className="card-label">Avg Response Time</div>
          </div>
        </div>
      </div>

      {/* GAPES Evolution Stats */}
      <div className="gapes-evolution">
        <h3>🧬 Evolution Statistics</h3>
        <div className="evolution-stats">
          <div className="stat-item">
            <span className="stat-label">Total Genes:</span>
            <span className="stat-value">{gapesStats.totalGenes}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Categories:</span>
            <span className="stat-value">{gapesStats.categoriesCount}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Avg Fitness:</span>
            <span className="stat-value fitness-high">{gapesStats.avgFitness.toFixed(3)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Evolutions:</span>
            <span className="stat-value">{gapesStats.totalEvolutions}</span>
          </div>
        </div>
      </div>

      {/* Best Genes by Category */}
      <div className="gapes-best-genes">
        <h3>🏆 Best Performing Genes</h3>
        <div className="genes-grid">
          {gapesStats.bestGenes.map((gene, index) => (
            <div
              key={gene.category}
              className={`gene-card ${selectedCategory === gene.category ? 'selected' : ''}`}
              onClick={() => setSelectedCategory(gene.category)}
            >
              <div className="gene-rank">#{index + 1}</div>
              <div className="gene-category">{formatGeneCategory(gene.category, gene.operation)}</div>
              <div className="gene-fitness">
                <div className="fitness-bar">
                  <div
                    className="fitness-fill"
                    style={{ width: `${gene.fitness * 100}%` }}
                  ></div>
                </div>
                <span className="fitness-value">{(gene.fitness * 100).toFixed(1)}%</span>
              </div>
              <div className="gene-details">
                <span>Gen {gene.generation}</span>
                <span>{gene.mutations} mutations</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Details (if selected) */}
      {selectedCategory && (
        <div className="category-details">
          <h3>📋 Details: {selectedCategory}</h3>
          <button
            className="close-details"
            onClick={() => setSelectedCategory(null)}
          >
            ✕
          </button>
          <p className="details-content">
            Detailed analytics for this category would show:
            <ul>
              <li>Evolution history</li>
              <li>Fitness over time</li>
              <li>Cost reduction trend</li>
              <li>Quality improvements</li>
              <li>Gene DNA details</li>
            </ul>
          </p>
        </div>
      )}

      {/* Performance Trends */}
      <div className="gapes-trends">
        <h3>📈 Performance Trends</h3>
        <div className="trend-info">
          <p>
            <strong>Cost Efficiency:</strong> {' '}
            {stats.avgCostPerCall < 0.10 ? '🟢 Excellent' :
             stats.avgCostPerCall < 0.25 ? '🟡 Good' : '🔴 Needs Improvement'}
          </p>
          <p>
            <strong>Token Efficiency:</strong> {' '}
            {stats.avgTokensPerCall < 1000 ? '🟢 Excellent' :
             stats.avgTokensPerCall < 3000 ? '🟡 Good' : '🔴 Needs Improvement'}
          </p>
          <p>
            <strong>Evolution Progress:</strong> {' '}
            {gapesStats.avgFitness > 0.80 ? '🟢 Highly Evolved' :
             gapesStats.avgFitness > 0.60 ? '🟡 Evolving' : '🔴 Early Stage'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default GAPESAnalytics;
