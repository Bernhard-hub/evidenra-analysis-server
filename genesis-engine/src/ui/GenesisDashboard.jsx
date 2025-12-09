/**
 * ═══════════════════════════════════════════════════════════
 * 🧬 GENESIS DASHBOARD V7.3 - UNIFIED DESIGN
 * Komplett neu aufgesetztes Dashboard mit einheitlichem Format
 * + Integrierte GAPES Analytics in einem Dashboard
 * ═══════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';

/**
 * V7.3 UNIFIED GENESIS DASHBOARD
 * Combines Evolution Monitoring + GAPES Analytics in ONE format
 */
export const GenesisDashboard = ({ genesisEngine, genesisAPIWrapper }) => {
  const [stats, setStats] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [bestGenes, setBestGenes] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);
  const [gapesStats, setGapesStats] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview | evolution | gapes | analytics

  useEffect(() => {
    if (!genesisEngine) return;

    // Update stats every second
    const interval = setInterval(() => {
      const currentStats = genesisEngine.getStats();
      setStats(currentStats);
      setIsRunning(currentStats.isRunning);

      const best = genesisEngine.getBestGenes(10);
      setBestGenes(best);

      // Get GAPES stats from API wrapper
      if (genesisAPIWrapper) {
        const gapes = genesisAPIWrapper.getStats();
        setGapesStats(gapes);
      }
    }, 1000);

    // Event listeners
    genesisEngine.on('onEvolution', (data) => {
      addEvent('🧬 Evolution', `Gen ${data.generation}: ${data.survivors} survivors → ${data.offspring} offspring`, 'info');
    });

    genesisEngine.on('onEmergence', (data) => {
      addEvent('✨ Emergence', `New emergent behavior in Gen ${data.generation}!`, 'success');
    });

    genesisEngine.on('onExtinction', (data) => {
      addEvent('💀 Extinction', `${data.count} genes eliminated`, 'warning');
    });

    genesisEngine.on('onBreakthrough', (data) => {
      addEvent('🚀 Breakthrough', `Self-improvement milestone achieved!`, 'success');
    });

    return () => clearInterval(interval);
  }, [genesisEngine, genesisAPIWrapper]);

  const addEvent = (type, message, severity = 'info') => {
    setRecentEvents(prev => [
      { type, message, severity, timestamp: Date.now() },
      ...prev.slice(0, 19) // Keep last 20 events
    ]);
  };

  const handleStart = async () => {
    await genesisEngine.start();
    setIsRunning(true);
  };

  const handleStop = () => {
    genesisEngine.stop();
    setIsRunning(false);
  };

  const handleReset = async () => {
    if (window.confirm('⚠️ RESET ALL EVOLUTION DATA?\n\nThis will delete:\n✗ All learned genes & fitness data\n✗ Evolution history & statistics\n✗ GAPES Analytics & Consciousness Metrics\n\nThis CANNOT be undone!')) {
      genesisEngine.stop();
      await genesisEngine.persistence.clearAll();
      window.location.reload();
    }
  };

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-white text-xl">Initializing Genesis Engine...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-6">

      {/* 🎯 MAIN HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-3xl shadow-2xl shadow-purple-500/50">
            🧬
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              GENESIS Engine v7.3
            </h1>
            <p className="text-gray-400 text-sm">Evolution-Driven AI Learning System</p>
          </div>
        </div>

        {/* Status Badge */}
        <div className={`px-6 py-3 rounded-full font-bold flex items-center gap-3 ${
          isRunning
            ? 'bg-green-500/20 border-2 border-green-500 animate-pulse'
            : 'bg-gray-700/50 border-2 border-gray-600'
        }`}>
          <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-green-400' : 'bg-gray-500'}`}></div>
          {isRunning ? '🟢 ACTIVE' : '⚪ IDLE'}
        </div>
      </div>

      {/* 🎮 MAIN CONTROLS */}
      <div className="flex gap-3 mb-8">
        {!isRunning ? (
          <button
            onClick={handleStart}
            className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-xl font-bold text-lg shadow-lg hover:shadow-green-500/50 transition-all transform hover:scale-105"
          >
            🚀 START EVOLUTION
          </button>
        ) : (
          <button
            onClick={handleStop}
            className="px-8 py-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 rounded-xl font-bold text-lg shadow-lg hover:shadow-red-500/50 transition-all transform hover:scale-105"
          >
            ⏸️ STOP
          </button>
        )}

        <button
          onClick={handleReset}
          className="px-6 py-4 bg-red-900 hover:bg-red-800 rounded-xl font-semibold shadow-lg transition-all border-2 border-red-600"
          title="⚠️ ACHTUNG: Löscht ALLE gelernten Daten, Evolution History & GAPES Analytics - UNWIDERRUFLICH!"
        >
          🔄 RESET
        </button>
      </div>

      {/* 📊 TAB NAVIGATION */}
      <div className="flex gap-2 mb-6 bg-gray-800/50 p-2 rounded-xl backdrop-blur-xl">
        {[
          { id: 'overview', label: '📊 Overview', icon: '📊' },
          { id: 'evolution', label: '🧬 Evolution', icon: '🧬' },
          { id: 'gapes', label: '🎯 GAPES', icon: '🎯' },
          { id: 'analytics', label: '📈 Analytics', icon: '📈' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg'
                : 'bg-gray-700/50 hover:bg-gray-600/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 📊 OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label="Generation" value={stats.generation} icon="🧬" color="purple" />
            <MetricCard label="Total Genes" value={stats.totalGenes} icon="🔬" color="blue" />
            <MetricCard label="Mutations" value={stats.totalMutations} icon="⚡" color="yellow" />
            <MetricCard label="Crossovers" value={stats.totalCrossovers} icon="🔀" color="green" />
          </div>

          {/* Consciousness Metrics */}
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="text-3xl">🧠</span>
              Consciousness Metrics
            </h2>
            <div className="space-y-4">
              <ConsciousnessBar label="Self-Awareness" value={stats.consciousness.selfAwareness} color="#8b5cf6" />
              <ConsciousnessBar label="Learning Rate" value={stats.consciousness.learningRate / 2} color="#10b981" />
              <ConsciousnessBar label="Creativity" value={stats.consciousness.creativityIndex} color="#f59e0b" />
              <ConsciousnessBar label="Intuition" value={stats.consciousness.intuitionLevel} color="#ec4899" />
              <ConsciousnessBar label="Wisdom" value={stats.consciousness.wisdomScore} color="#3b82f6" />
            </div>
            <div className="mt-6 p-4 bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border-2 border-yellow-500/50 rounded-xl text-center">
              <div className="text-3xl font-bold">⭐ {stats.consciousness.experiencePoints} XP</div>
              <div className="text-sm text-gray-300">Experience Points</div>
            </div>
          </div>

          {/* GAPES Quick Stats */}
          {gapesStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard label="API Calls" value={gapesStats.totalCalls ?? 0} icon="📡" color="cyan" />
              <MetricCard label="Success Streak" value={gapesStats.streak ?? 0} icon="🔥" color="orange" />
              <MetricCard label="Success Rate" value={`${((gapesStats.successRate ?? 0) * 100).toFixed(0)}%`} icon="✅" color="green" />
              <MetricCard label="Total Cost" value={`$${(gapesStats.cost ?? 0).toFixed(2)}`} icon="💰" color="yellow" />
            </div>
          )}
        </div>
      )}

      {/* 🧬 EVOLUTION TAB */}
      {activeTab === 'evolution' && (
        <div className="space-y-6">
          {/* Top Genes */}
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="text-3xl">🏆</span>
              Top Performing Genes
            </h2>
            <div className="space-y-3">
              {bestGenes.map((gene, index) => (
                <GeneCard key={gene.id} gene={gene} rank={index + 1} />
              ))}
            </div>
          </div>

          {/* Event Log */}
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="text-3xl">📋</span>
              Evolution Events
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {recentEvents.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No events yet. Start evolution to see activity.
                </div>
              ) : (
                recentEvents.map((event, index) => (
                  <EventItem key={index} event={event} />
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 🎯 GAPES TAB */}
      {activeTab === 'gapes' && gapesStats && (
        <div className="space-y-6">
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="text-3xl">🎯</span>
              GAPES Performance System
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <StatBox
                label="Total API Calls"
                value={gapesStats.totalCalls ?? 0}
                subtitle="All Genesis-enhanced operations"
                color="blue"
              />
              <StatBox
                label="Success Streak"
                value={gapesStats.streak ?? 0}
                subtitle="Consecutive successful calls"
                color="orange"
              />
              <StatBox
                label="Success Rate"
                value={`${((gapesStats.successRate ?? 0) * 100).toFixed(1)}%`}
                subtitle="Overall reliability metric"
                color="green"
              />
              <StatBox
                label="Total Cost"
                value={`$${(gapesStats.cost ?? 0).toFixed(3)}`}
                subtitle="Cumulative API expenditure"
                color="yellow"
              />
            </div>

            <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-2 border-purple-500/50 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-3">🧬 Evolution Integration</h3>
              <p className="text-gray-300">
                GAPES (Genesis-Augmented Performance Evolution System) uses evolutionary algorithms
                to optimize AI prompts and operations. Every successful call teaches the system to
                perform better on future tasks.
              </p>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div className="bg-black/30 rounded-lg p-3">
                  <div className="text-2xl font-bold text-purple-400">{stats.totalMutations}</div>
                  <div className="text-xs text-gray-400">Mutations</div>
                </div>
                <div className="bg-black/30 rounded-lg p-3">
                  <div className="text-2xl font-bold text-pink-400">{stats.totalCrossovers}</div>
                  <div className="text-xs text-gray-400">Crossovers</div>
                </div>
                <div className="bg-black/30 rounded-lg p-3">
                  <div className="text-2xl font-bold text-blue-400">{stats.emergentBehaviors}</div>
                  <div className="text-xs text-gray-400">Emergent Behaviors</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📈 ANALYTICS TAB */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="text-3xl">📈</span>
              Evolution Analytics
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-900/50 rounded-xl p-5">
                <h3 className="font-bold text-lg mb-4 text-purple-400">🧬 Genetic Diversity</h3>
                <div className="space-y-3">
                  <AnalyticRow label="Total Gene Pool" value={stats.totalGenes} />
                  <AnalyticRow label="Active Mutations" value={stats.totalMutations} />
                  <AnalyticRow label="Successful Crosses" value={stats.totalCrossovers} />
                  <AnalyticRow label="Extinction Events" value={stats.extinctions} />
                </div>
              </div>

              <div className="bg-gray-900/50 rounded-xl p-5">
                <h3 className="font-bold text-lg mb-4 text-pink-400">✨ Emergence Metrics</h3>
                <div className="space-y-3">
                  <AnalyticRow label="Emergent Behaviors" value={stats.emergentBehaviors} />
                  <AnalyticRow label="Current Generation" value={stats.generation} />
                  <AnalyticRow label="Avg Fitness" value={(bestGenes[0]?.fitness * 100 || 50).toFixed(1) + '%'} />
                  <AnalyticRow label="Learning Velocity" value={(stats.consciousness.learningRate * 50).toFixed(1) + '%'} />
                </div>
              </div>
            </div>

            {gapesStats && (
              <div className="mt-6 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border-2 border-cyan-500/50 rounded-xl p-5">
                <h3 className="font-bold text-lg mb-4 text-cyan-400">📡 GAPES Performance Breakdown</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold">{gapesStats.totalCalls ?? 0}</div>
                    <div className="text-xs text-gray-400">Total Calls</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-400">{gapesStats.streak ?? 0}</div>
                    <div className="text-xs text-gray-400">Streak</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-400">{((gapesStats.successRate ?? 0) * 100).toFixed(0)}%</div>
                    <div className="text-xs text-gray-400">Success Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-400">${(gapesStats.cost ?? 0).toFixed(2)}</div>
                    <div className="text-xs text-gray-400">Total Cost</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ═════════════════════════════════════════════════════════════
// 🎨 COMPONENT LIBRARY - Unified Design System
// ═════════════════════════════════════════════════════════════

const MetricCard = ({ label, value, icon, color }) => {
  const colorClasses = {
    purple: 'from-purple-600 to-purple-700 border-purple-500',
    blue: 'from-blue-600 to-blue-700 border-blue-500',
    yellow: 'from-yellow-600 to-yellow-700 border-yellow-500',
    green: 'from-green-600 to-green-700 border-green-500',
    cyan: 'from-cyan-600 to-cyan-700 border-cyan-500',
    orange: 'from-orange-600 to-orange-700 border-orange-500'
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl p-5 border-2 shadow-lg hover:scale-105 transition-transform`}>
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm opacity-90 mt-1">{label}</div>
    </div>
  );
};

const ConsciousnessBar = ({ label, value, color }) => {
  const percentage = Math.min(100, value * 100);

  return (
    <div className="flex items-center gap-4">
      <div className="w-40 font-semibold text-sm">{label}</div>
      <div className="flex-1 h-6 bg-gray-700 rounded-full overflow-hidden relative">
        <div
          className="h-full rounded-full transition-all duration-500 relative overflow-hidden"
          style={{
            width: `${percentage}%`,
            backgroundColor: color
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
        </div>
      </div>
      <div className="w-16 text-right font-bold">{percentage.toFixed(0)}%</div>
    </div>
  );
};

const GeneCard = ({ gene, rank }) => {
  const formatCategory = (gene) => {
    const categoryMap = {
      'omniscience_query': '🔮 Omniscience',
      'ultimate_report_section': '📊 ULTIMATE',
      'basis_report': '📋 BASIS',
      'scientific_article': '📄 Scientific',
      'scientific_hypothesis': '🔬 Hypothesis',
      'coding_operation': '🏷️ AI Category',
      'meta_intelligence': '🧠 Meta-Intelligence'
    };
    return categoryMap[gene.category || gene.type] || gene.category || gene.type || 'Unknown';
  };

  return (
    <div className={`bg-gray-900/50 rounded-xl p-4 border-2 ${
      rank === 1 ? 'border-yellow-500 shadow-lg shadow-yellow-500/30' : 'border-gray-700'
    } hover:border-purple-500 transition-all group`}>
      <div className="flex items-start gap-4">
        <div className="text-3xl font-bold text-gray-600">#{rank}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-purple-600/50 rounded-full text-xs font-semibold">
              {formatCategory(gene)}
            </span>
            {gene.generation > 0 && (
              <span className="px-3 py-1 bg-gray-700 rounded-full text-xs">
                Gen {gene.generation}
              </span>
            )}
          </div>
          {gene.content && (
            <div className="text-sm text-gray-300 mb-2 italic">
              {gene.content.substring(0, 120)}...
            </div>
          )}
          <div className="text-xs text-gray-500 font-mono">ID: {gene.id.substring(0, 16)}...</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-400">{(gene.fitness * 100).toFixed(1)}%</div>
          <div className="text-xs text-gray-500">Fitness</div>
        </div>
      </div>
    </div>
  );
};

const EventItem = ({ event }) => {
  const severityColors = {
    info: 'border-blue-500 bg-blue-600/10',
    success: 'border-green-500 bg-green-600/10',
    warning: 'border-yellow-500 bg-yellow-600/10',
    error: 'border-red-500 bg-red-600/10'
  };

  return (
    <div className={`border-l-4 ${severityColors[event.severity]} rounded-lg p-3 flex items-center justify-between`}>
      <div className="flex items-center gap-3">
        <span className="font-semibold text-sm">{event.type}</span>
        <span className="text-sm text-gray-300">{event.message}</span>
      </div>
      <span className="text-xs text-gray-500">
        {new Date(event.timestamp).toLocaleTimeString()}
      </span>
    </div>
  );
};

const StatBox = ({ label, value, subtitle, color }) => {
  const colorClasses = {
    blue: 'text-blue-400 border-blue-500/30',
    orange: 'text-orange-400 border-orange-500/30',
    green: 'text-green-400 border-green-500/30',
    yellow: 'text-yellow-400 border-yellow-500/30'
  };

  return (
    <div className={`bg-gray-900/50 rounded-xl p-5 border-2 ${colorClasses[color]}`}>
      <div className={`text-4xl font-bold mb-2 ${colorClasses[color].split(' ')[0]}`}>{value}</div>
      <div className="font-semibold text-white">{label}</div>
      <div className="text-sm text-gray-400 mt-1">{subtitle}</div>
    </div>
  );
};

const AnalyticRow = ({ label, value }) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
    <span className="text-gray-300">{label}</span>
    <span className="font-bold text-white">{value}</span>
  </div>
);

export default GenesisDashboard;
