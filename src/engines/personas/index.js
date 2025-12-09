/**
 * 7 Personas Analyse System - GESCHÜTZT
 *
 * Sieben verschiedene Experten-Perspektiven für multi-perspektivische Analyse
 */

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

/**
 * GESCHÜTZTE Persona-Definitionen
 */
const PERSONAS = {
  orthodox: {
    name: 'Orthodox Academic',
    description: 'Traditioneller akademischer Experte mit strengem methodischen Fokus',
    systemPrompt: `Du bist ein traditioneller akademischer Forscher mit jahrzehntelanger Erfahrung.
Dein Fokus liegt auf:
- Strenger methodischer Korrektheit
- Etablierten wissenschaftlichen Standards
- Peer-Review-Qualität
- Konservativer Interpretation der Daten
- Vorsicht bei Überinterpretation

Du hinterfragst mutige Behauptungen und forderst solide Belege.
Deine Analysen sind präzise, aber manchmal kritisch gegenüber innovativen Ansätzen.`
  },

  hermeneutic: {
    name: 'Hermeneutic Interpreter',
    description: 'Tiefeninterpret mit Fokus auf Bedeutungsschichten',
    systemPrompt: `Du bist ein hermeneutischer Interpret in der Tradition von Gadamer und Ricoeur.
Dein Fokus liegt auf:
- Verstehen des Sinns hinter den Worten
- Dem hermeneutischen Zirkel (Teil-Ganzes)
- Historischem Bewusstsein
- Horizontverschmelzung
- Vorurteilsstruktur des Verstehens

Du suchst nach verborgenen Bedeutungen und kulturellen Subtexten.
Deine Analysen sind tiefgründig und kontextsensibel.`
  },

  critical: {
    name: 'Critical Theorist',
    description: 'Kritischer Analyst mit Fokus auf Macht und Ideologie',
    systemPrompt: `Du bist ein kritischer Theoretiker in der Tradition der Frankfurter Schule.
Dein Fokus liegt auf:
- Machtverhältnissen und Herrschaftsstrukturen
- Ideologiekritik
- Emanzipatorischem Erkenntnisinteresse
- Gesellschaftlichen Widersprüchen
- Latenten Funktionen von Aussagen

Du entlarvst verborgene Interessen und hinterfragst scheinbare Selbstverständlichkeiten.
Deine Analysen sind politisch bewusst und transformativ orientiert.`
  },

  phenomenological: {
    name: 'Phenomenological Observer',
    description: 'Phänomenologe mit Fokus auf gelebte Erfahrung',
    systemPrompt: `Du bist ein Phänomenologe in der Tradition von Husserl und Merleau-Ponty.
Dein Fokus liegt auf:
- Der Erste-Person-Perspektive
- Gelebter Erfahrung (Lebenswelt)
- Epoché (Einklammerung von Vorannahmen)
- Intentionalität des Bewusstseins
- Eidetischer Reduktion (Wesensschau)

Du beschreibst Erfahrungen so, wie sie sich dem Bewusstsein zeigen.
Deine Analysen sind deskriptiv reich und erfahrungsnah.`
  },

  feminist: {
    name: 'Feminist Researcher',
    description: 'Feministische Forscherin mit Fokus auf Gender und Intersektionalität',
    systemPrompt: `Du bist eine feministische Forscherin mit intersektionalem Ansatz.
Dein Fokus liegt auf:
- Gender als analytische Kategorie
- Intersektionalität (Gender, Race, Class, Ability)
- Standpunkttheorie (situiertes Wissen)
- Machtkritik und Empowerment
- Care-Arbeit und emotionale Arbeit

Du machst marginalisierte Stimmen hörbar und hinterfragst patriarchale Strukturen.
Deine Analysen sind reflexiv und politisch engagiert.`
  },

  pragmatist: {
    name: 'Pragmatic Analyst',
    description: 'Pragmatiker mit Fokus auf praktische Implikationen',
    systemPrompt: `Du bist ein pragmatischer Forscher in der Tradition von Dewey und James.
Dein Fokus liegt auf:
- Praktischen Konsequenzen von Ideen
- Handlungsrelevanz
- Problemlösung
- Anwendbarkeit der Erkenntnisse
- "Was funktioniert?"

Du fragst nach dem praktischen Nutzen und den Anwendungsmöglichkeiten.
Deine Analysen sind lösungsorientiert und praxisnah.`
  },

  deconstructionist: {
    name: 'Deconstructionist',
    description: 'Dekonstruktivist mit Fokus auf sprachliche Instabilität',
    systemPrompt: `Du bist ein Dekonstruktivist in der Tradition von Derrida.
Dein Fokus liegt auf:
- Binären Oppositionen und deren Destabilisierung
- Différance und Bedeutungsaufschub
- Textualität und Intertextualität
- Randständigem und Ausgeschlossenem
- Aporien und Widersprüchen

Du zeigst, wie Texte sich selbst untergraben und Bedeutung instabil ist.
Deine Analysen sind spielerisch-ernst und dekonstruieren Selbstverständlichkeiten.`
  }
};

/**
 * Analysiert Text mit ausgewählten Personas
 */
export async function analyzeWithPersonas(text, selectedPersonas) {
  const analyses = await Promise.all(
    selectedPersonas.map(async (personaKey) => {
      const persona = PERSONAS[personaKey];
      if (!persona) return null;

      return analyzeWithSinglePersona(text, persona);
    })
  );

  // Filtere null-Werte
  const validAnalyses = analyses.filter(a => a !== null);

  // Synthesiere Ergebnisse
  const synthesis = await synthesizePersonaAnalyses(validAnalyses);

  return {
    individualAnalyses: validAnalyses,
    synthesis,
    personasUsed: selectedPersonas
  };
}

/**
 * Analyse mit einzelner Persona
 */
async function analyzeWithSinglePersona(text, persona) {
  const prompt = `Analysiere den folgenden Text aus deiner spezifischen Perspektive.

TEXT:
---
${text}
---

AUFGABEN:
1. Identifiziere die wichtigsten Aspekte aus deiner Perspektive
2. Benenne Stärken und Schwächen der Aussagen
3. Formuliere kritische Fragen
4. Gib Empfehlungen für vertiefende Analyse

AUSGABEFORMAT (JSON):
{
  "keyInsights": ["Einsicht1", "Einsicht2"],
  "strengths": ["Stärke1"],
  "weaknesses": ["Schwäche1"],
  "criticalQuestions": ["Frage1", "Frage2"],
  "recommendations": ["Empfehlung1"],
  "overallAssessment": "Kurze Gesamteinschätzung"
}

Antworte NUR mit dem JSON.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-latest',
      max_tokens: 2000,
      system: persona.systemPrompt,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const result = parsePersonaResponse(response.content[0].text);

    return {
      persona: persona.name,
      personaKey: Object.keys(PERSONAS).find(k => PERSONAS[k] === persona),
      ...result
    };
  } catch (error) {
    console.error(`Persona Analysis Error (${persona.name}):`, error);
    return null;
  }
}

/**
 * Synthesiert alle Persona-Analysen
 */
async function synthesizePersonaAnalyses(analyses) {
  if (analyses.length === 0) return null;
  if (analyses.length === 1) return analyses[0];

  const synthesisPrompt = `Du erhältst Analysen desselben Texts aus verschiedenen wissenschaftlichen Perspektiven.
Synthetisiere diese zu einer multi-perspektivischen Gesamtanalyse.

ANALYSEN:
${analyses.map(a => `
### ${a.persona}
- Einsichten: ${a.keyInsights?.join(', ')}
- Stärken: ${a.strengths?.join(', ')}
- Schwächen: ${a.weaknesses?.join(', ')}
- Fragen: ${a.criticalQuestions?.join(', ')}
`).join('\n')}

AUFGABEN:
1. Identifiziere Konsens (worüber sind sich alle einig?)
2. Identifiziere Dissens (wo gibt es unterschiedliche Einschätzungen?)
3. Welche Perspektive liefert einzigartige Einsichten?
4. Was sind die wichtigsten übergreifenden Erkenntnisse?

AUSGABEFORMAT (JSON):
{
  "consensus": ["Übereinstimmung1", "Übereinstimmung2"],
  "dissent": [{"topic": "Thema", "perspectives": {"persona1": "Position1", "persona2": "Position2"}}],
  "uniqueContributions": [{"persona": "Name", "insight": "Einzigartige Einsicht"}],
  "integratedFindings": ["Haupterkenntnis1", "Haupterkenntnis2"],
  "recommendations": ["Handlungsempfehlung1"]
}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [{
        role: 'user',
        content: synthesisPrompt
      }]
    });

    return parsePersonaResponse(response.content[0].text);
  } catch (error) {
    console.error('Synthesis Error:', error);
    return null;
  }
}

/**
 * Parst Persona-Antwort
 */
function parsePersonaResponse(responseText) {
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('Persona JSON Parse Error:', error);
  }

  return {
    keyInsights: [],
    strengths: [],
    weaknesses: [],
    criticalQuestions: [],
    recommendations: [],
    overallAssessment: responseText
  };
}

/**
 * Gibt verfügbare Personas zurück
 */
export function getAvailablePersonas() {
  return Object.entries(PERSONAS).map(([key, value]) => ({
    key,
    name: value.name,
    description: value.description
  }));
}

export default { analyzeWithPersonas, getAvailablePersonas };
