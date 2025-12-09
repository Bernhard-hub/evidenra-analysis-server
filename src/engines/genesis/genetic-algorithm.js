/**
 * Genesis Engine - Genetic Algorithm for Prompt Evolution
 * GESCHÜTZT - Nur auf Server sichtbar!
 *
 * Evolutionärer Algorithmus zur Optimierung von Analyse-Prompts
 */

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

/**
 * Hauptfunktion: Prompt Evolution
 */
export async function evolvePrompt(config) {
  const {
    basePrompt,
    fitnessFunction = 'quality',
    generations = 10,
    populationSize = 20,
    mutationRate = 0.1,
    crossoverRate = 0.7
  } = config;

  // Initialisiere Population
  let population = await initializePopulation(basePrompt, populationSize);
  let bestEver = { prompt: basePrompt, fitness: 0 };
  const improvements = [];

  for (let gen = 0; gen < generations; gen++) {
    // Fitness bewerten
    population = await evaluateFitness(population, fitnessFunction);

    // Beste Lösung tracken
    const currentBest = population[0];
    if (currentBest.fitness > bestEver.fitness) {
      bestEver = { ...currentBest };
      improvements.push({
        generation: gen,
        fitness: currentBest.fitness,
        improvement: currentBest.fitness - (gen > 0 ? improvements[improvements.length - 1]?.fitness || 0 : 0)
      });
    }

    // Frühzeitiger Abbruch bei perfekter Lösung
    if (currentBest.fitness >= 0.98) break;

    // Nächste Generation
    population = await evolvePopulation(population, {
      mutationRate,
      crossoverRate,
      eliteCount: Math.max(2, Math.floor(populationSize * 0.1))
    });
  }

  return {
    best: bestEver.prompt,
    fitness: bestEver.fitness,
    generationsRun: improvements.length,
    improvements
  };
}

/**
 * Initialisiert Population mit Variationen des Basis-Prompts
 */
async function initializePopulation(basePrompt, size) {
  const population = [{ prompt: basePrompt, fitness: 0 }];

  // Generiere Variationen
  for (let i = 1; i < size; i++) {
    const variant = await mutatePrompt(basePrompt, 0.3);
    population.push({ prompt: variant, fitness: 0 });
  }

  return population;
}

/**
 * Bewertet Fitness aller Prompts
 */
async function evaluateFitness(population, fitnessFunction) {
  const evaluated = await Promise.all(
    population.map(async (individual) => {
      const fitness = await calculatePromptFitness(individual.prompt, fitnessFunction);
      return { ...individual, fitness };
    })
  );

  // Sortiere nach Fitness (höchste zuerst)
  return evaluated.sort((a, b) => b.fitness - a.fitness);
}

/**
 * Berechnet Fitness eines einzelnen Prompts
 */
async function calculatePromptFitness(prompt, fitnessType) {
  // Test-Analyse durchführen
  const testText = getTestText();

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-latest',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `${prompt}\n\nText zur Analyse:\n${testText}`
      }]
    });

    const result = response.content[0].text;

    // Fitness-Metriken
    let fitness = 0;

    // Strukturiertheit (JSON/Listen vorhanden)
    if (result.includes('[') || result.includes('{')) fitness += 0.2;

    // Kodierungen gefunden
    const codingCount = (result.match(/Kodierung|Code|Kategorie/gi) || []).length;
    fitness += Math.min(codingCount * 0.05, 0.2);

    // Begründungen vorhanden
    if (result.includes('weil') || result.includes('da') || result.includes('Begründung')) {
      fitness += 0.2;
    }

    // Methodologische Begriffe
    const methodTerms = ['induktiv', 'deduktiv', 'Ankerbeispiel', 'Dimension', 'Eigenschaft'];
    const methodScore = methodTerms.filter(t => result.toLowerCase().includes(t.toLowerCase())).length;
    fitness += methodScore * 0.08;

    // Länge (nicht zu kurz, nicht zu lang)
    const idealLength = 1500;
    const lengthRatio = Math.abs(result.length - idealLength) / idealLength;
    fitness += Math.max(0, 0.2 - lengthRatio * 0.2);

    return Math.min(fitness, 1);
  } catch (error) {
    console.error('Fitness evaluation error:', error);
    return 0;
  }
}

/**
 * Mutiert einen Prompt
 */
async function mutatePrompt(prompt, mutationStrength) {
  const mutations = [
    'Füge mehr Struktur hinzu',
    'Betone methodische Strenge',
    'Fordere mehr Begründungen',
    'Verlange konkrete Beispiele',
    'Füge Qualitätskriterien hinzu',
    'Vereinfache die Anweisungen',
    'Füge Schritt-für-Schritt Anleitung hinzu'
  ];

  const selectedMutation = mutations[Math.floor(Math.random() * mutations.length)];

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-latest',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `Modifiziere den folgenden Prompt für qualitative Analyse.
Änderung: ${selectedMutation}
Stärke der Änderung: ${Math.round(mutationStrength * 100)}%

Original-Prompt:
${prompt}

Gib NUR den modifizierten Prompt zurück, keine Erklärungen.`
      }]
    });

    return response.content[0].text;
  } catch (error) {
    console.error('Mutation error:', error);
    return prompt; // Fallback zu Original
  }
}

/**
 * Kreuzt zwei Prompts
 */
async function crossoverPrompts(parent1, parent2) {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-latest',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `Kombiniere die besten Elemente dieser zwei Prompts für qualitative Analyse zu einem neuen, verbesserten Prompt:

Prompt A:
${parent1}

Prompt B:
${parent2}

Gib NUR den kombinierten Prompt zurück, keine Erklärungen.`
      }]
    });

    return response.content[0].text;
  } catch (error) {
    console.error('Crossover error:', error);
    return Math.random() > 0.5 ? parent1 : parent2;
  }
}

/**
 * Erzeugt nächste Generation
 */
async function evolvePopulation(population, config) {
  const { mutationRate, crossoverRate, eliteCount } = config;
  const newPopulation = [];

  // Elitismus: Beste behalten
  for (let i = 0; i < eliteCount; i++) {
    newPopulation.push({ ...population[i] });
  }

  // Rest durch Selektion + Crossover + Mutation
  while (newPopulation.length < population.length) {
    // Tournament Selection
    const parent1 = tournamentSelect(population);
    const parent2 = tournamentSelect(population);

    let child;
    if (Math.random() < crossoverRate) {
      child = await crossoverPrompts(parent1.prompt, parent2.prompt);
    } else {
      child = parent1.prompt;
    }

    if (Math.random() < mutationRate) {
      child = await mutatePrompt(child, 0.2);
    }

    newPopulation.push({ prompt: child, fitness: 0 });
  }

  return newPopulation;
}

/**
 * Tournament Selection
 */
function tournamentSelect(population, tournamentSize = 3) {
  const tournament = [];
  for (let i = 0; i < tournamentSize; i++) {
    const idx = Math.floor(Math.random() * population.length);
    tournament.push(population[idx]);
  }
  return tournament.sort((a, b) => b.fitness - a.fitness)[0];
}

/**
 * Test-Text für Fitness-Evaluation
 */
function getTestText() {
  return `Das Interview mit der Lehrerin zeigt deutlich, wie sehr die Digitalisierung
den Schulalltag verändert hat. "Früher haben wir alles auf Papier gemacht",
erzählt sie, "heute nutzen die Kinder Tablets und lernen spielerisch."
Sie betont jedoch auch die Herausforderungen: "Nicht alle Eltern können sich
die Geräte leisten, und manche Kinder sind zu Hause komplett offline."
Die Ungleichheit sei ein großes Problem geworden. Trotzdem überwiegen für sie
die Vorteile: "Die Motivation der Schüler ist gestiegen, besonders bei
den sonst eher zurückhaltenden Kindern."`;
}

// Exportiere Genesis Konfiguration für neue Architektur
export const GENESIS_CONFIG = {
  defaultParameters: {
    generations: 10,
    populationSize: 20,
    mutationRate: 0.1,
    crossoverRate: 0.7,
    elitePercentage: 0.1
  },
  mutationOperators: [
    { name: 'add_structure', description: 'Füge mehr Struktur hinzu' },
    { name: 'emphasize_rigor', description: 'Betone methodische Strenge' },
    { name: 'require_reasoning', description: 'Fordere mehr Begründungen' },
    { name: 'add_examples', description: 'Verlange konkrete Beispiele' },
    { name: 'add_quality_criteria', description: 'Füge Qualitätskriterien hinzu' },
    { name: 'simplify', description: 'Vereinfache die Anweisungen' },
    { name: 'add_steps', description: 'Füge Schritt-für-Schritt Anleitung hinzu' }
  ],
  fitnessMetrics: {
    structure: { weight: 0.2, description: 'Strukturiertheit (JSON/Listen)' },
    codings: { weight: 0.2, description: 'Anzahl gefundener Kodierungen' },
    reasoning: { weight: 0.2, description: 'Begründungen vorhanden' },
    methodology: { weight: 0.2, description: 'Methodologische Begriffe' },
    length: { weight: 0.2, description: 'Optimale Antwortlänge' }
  },
  testText: getTestText()
};

export default { evolvePrompt, GENESIS_CONFIG };
