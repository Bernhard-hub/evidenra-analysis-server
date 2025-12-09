/**
 * Mayring Qualitative Inhaltsanalyse - GESCHÜTZT
 *
 * Implementierung der inhaltlich strukturierenden qualitativen Inhaltsanalyse
 * nach Philipp Mayring (2015)
 */

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

/**
 * Hauptanalyse nach Mayring
 */
export async function analyzeWithMayring(text, options = {}) {
  const {
    approach = 'structuring', // 'structuring', 'summarizing', 'explicating'
    categories = null, // Vordefinierte Kategorien (deduktiv) oder null (induktiv)
    unitOfAnalysis = 'sentence',
    anchorExamples = true
  } = options;

  // GESCHÜTZTER PROMPT - nicht im Client sichtbar!
  const systemPrompt = buildMayringSystemPrompt(approach);
  const analysisPrompt = buildMayringAnalysisPrompt(text, {
    approach,
    categories,
    unitOfAnalysis,
    anchorExamples
  });

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: analysisPrompt
      }]
    });

    const result = parseAnalysisResponse(response.content[0].text);

    return {
      methodology: 'mayring',
      approach,
      codings: result.codings,
      categories: result.categories,
      summary: result.summary,
      memos: result.memos
    };
  } catch (error) {
    console.error('Mayring Analysis Error:', error);
    throw new Error('Analysis failed');
  }
}

/**
 * GESCHÜTZTER System-Prompt für Mayring-Analyse
 */
function buildMayringSystemPrompt(approach) {
  const basePrompt = `Du bist ein Experte für qualitative Inhaltsanalyse nach Philipp Mayring.
Du analysierst Texte streng nach den wissenschaftlichen Standards der qualitativen Forschung.

WICHTIGE PRINZIPIEN:
1. Systematik: Folge einem regelgeleiteten, schrittweisen Vorgehen
2. Intersubjektivität: Deine Analyse muss nachvollziehbar und überprüfbar sein
3. Theoriegeleitetheit: Beziehe dich auf das theoretische Rahmenkonzept
4. Gütekriterien: Achte auf Reliabilität und Validität deiner Kodierungen

QUALITÄTSKRITERIEN FÜR KODIERUNGEN:
- Jede Kodierung muss eine klare Textstelle referenzieren
- Kategorien müssen trennscharf definiert sein
- Ankerbeispiele müssen prototypisch sein
- Kodierregeln müssen eindeutig formuliert sein`;

  const approachSpecific = {
    structuring: `
INHALTLICH STRUKTURIERENDE ANALYSE:
- Extrahiere bestimmte Aspekte aus dem Material
- Ordne diese unter vorgegebenen Ordnungskriterien ein
- Strukturiere das Material nach bestimmten Kriterien

Schritte:
1. Bestimmung der Strukturierungsdimensionen
2. Ausprägungen der Dimensionen festlegen
3. Zusammenstellung des Kategoriensystems
4. Formulierung von Definitionen, Ankerbeispielen, Kodierregeln
5. Materialdurchlauf und Kodierung
6. Ergebnisaufbereitung`,

    summarizing: `
ZUSAMMENFASSENDE ANALYSE:
- Reduziere das Material auf wesentliche Inhalte
- Behalte ein Abbild des Grundmaterials
- Abstrahiere zu überschaubaren Kategorien

Reduktionsschritte:
1. Paraphrasierung der inhaltstragenden Textstellen
2. Generalisierung auf Abstraktionsniveau
3. Erste Reduktion (Selektion, Streichung)
4. Zweite Reduktion (Bündelung, Integration)`,

    explicating: `
EXPLIZIERENDE ANALYSE:
- Erkläre unklare Textstellen durch zusätzliches Material
- Nutze enge und weite Kontextanalyse
- Formuliere explizierende Paraphrasen

Schritte:
1. Lexikalisch-grammatische Definition
2. Bestimmung des engen Kontexts
3. Analyse des weiten Kontexts
4. Explizierende Paraphrase
5. Überprüfung der Explikation`
  };

  return basePrompt + (approachSpecific[approach] || approachSpecific.structuring);
}

/**
 * GESCHÜTZTER Analyse-Prompt
 */
function buildMayringAnalysisPrompt(text, options) {
  const { approach, categories, unitOfAnalysis, anchorExamples } = options;

  let prompt = `Analysiere den folgenden Text nach der ${approach === 'structuring' ? 'inhaltlich strukturierenden' : approach === 'summarizing' ? 'zusammenfassenden' : 'explizierenden'} qualitativen Inhaltsanalyse nach Mayring.

ANALYSEEINHEIT: ${unitOfAnalysis === 'sentence' ? 'Satz' : unitOfAnalysis === 'paragraph' ? 'Absatz' : 'Sinneinheit'}

`;

  if (categories && categories.length > 0) {
    prompt += `VORGEGEBENE KATEGORIEN (deduktiv):\n`;
    categories.forEach(cat => {
      prompt += `- ${cat.name}: ${cat.definition || ''}\n`;
    });
    prompt += '\n';
  } else {
    prompt += `KATEGORIENBILDUNG: Induktiv aus dem Material entwickeln\n\n`;
  }

  prompt += `TEXT ZUR ANALYSE:
---
${text}
---

AUSGABEFORMAT (JSON):
{
  "codings": [
    {
      "id": "C1",
      "text": "Exakte Textstelle",
      "category": "Kategoriename",
      "subcategory": "Optional: Unterkategorie",
      "reasoning": "Begründung für diese Zuordnung",
      "confidence": 0.0-1.0
    }
  ],
  "categories": [
    {
      "name": "Kategoriename",
      "definition": "Präzise Definition",
      "anchorExample": "Prototypisches Beispiel aus dem Text",
      "codingRule": "Wann wird diese Kategorie angewendet?"
    }
  ],
  "summary": "Zusammenfassung der Hauptergebnisse",
  "memos": ["Analytische Notizen und Reflexionen"]
}

${anchorExamples ? 'Füge für jede Kategorie ein Ankerbeispiel hinzu.' : ''}

Antworte NUR mit dem JSON, keine zusätzlichen Erklärungen.`;

  return prompt;
}

/**
 * Parst die Analyse-Antwort
 */
function parseAnalysisResponse(responseText) {
  try {
    // Versuche JSON zu extrahieren
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('JSON Parse Error:', error);
  }

  // Fallback: Leere Struktur
  return {
    codings: [],
    categories: [],
    summary: responseText,
    memos: []
  };
}

export default { analyzeWithMayring };
