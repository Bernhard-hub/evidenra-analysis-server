/**
 * Grounded Theory Analyse - GESCHÜTZT
 *
 * Implementierung der Grounded Theory Methodologie
 * nach Strauss & Corbin
 */

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

/**
 * Grounded Theory Analyse
 */
export async function analyzeWithGroundedTheory(text, options = {}) {
  const {
    codingLevel = 'open', // 'open', 'axial', 'selective'
    existingCodes = [],
    theoreticalSensitivity = true
  } = options;

  const systemPrompt = buildGTSystemPrompt();
  const analysisPrompt = buildGTAnalysisPrompt(text, {
    codingLevel,
    existingCodes,
    theoreticalSensitivity
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

    const result = parseGTResponse(response.content[0].text);

    return {
      methodology: 'grounded-theory',
      codingLevel,
      codings: result.codings,
      categories: result.categories,
      axialRelations: result.axialRelations,
      memos: result.memos
    };
  } catch (error) {
    console.error('Grounded Theory Analysis Error:', error);
    throw new Error('GT Analysis failed');
  }
}

/**
 * GESCHÜTZTER System-Prompt
 */
function buildGTSystemPrompt() {
  return `Du bist ein Experte für Grounded Theory Methodologie nach Strauss und Corbin.

GRUNDPRINZIPIEN DER GROUNDED THEORY:
1. Theoretische Sensibilität: Fähigkeit, relevante Aspekte in Daten zu erkennen
2. Konstanter Vergleich: Kontinuierlicher Vergleich zwischen Daten, Konzepten und Kategorien
3. Theoretisches Sampling: Datenerhebung geleitet von entstehender Theorie
4. Theoretische Sättigung: Kodieren bis keine neuen Eigenschaften mehr auftauchen

KODIERPARADIGMA:
- Phänomen: Das zentrale Ereignis/Geschehen
- Ursächliche Bedingungen: Was führt zum Phänomen?
- Kontext: Spezifische Eigenschaften des Phänomens
- Intervenierende Bedingungen: Breitere strukturelle Bedingungen
- Handlungsstrategien: Wie gehen Akteure mit dem Phänomen um?
- Konsequenzen: Ergebnisse der Handlungen

KODIERARTEN:
1. OFFENES KODIEREN: Aufbrechen, Untersuchen, Vergleichen, Konzeptualisieren
2. AXIALES KODIEREN: Zusammenfügen nach dem Kodierparadigma
3. SELEKTIVES KODIEREN: Integration zur Kernkategorie

MEMO-TYPEN:
- Kode-Notizen: Zu einzelnen Kodes
- Theoretische Memos: Zur Theorieentwicklung
- Operative Memos: Zum Forschungsprozess`;
}

/**
 * GESCHÜTZTER Analyse-Prompt
 */
function buildGTAnalysisPrompt(text, options) {
  const { codingLevel, existingCodes, theoreticalSensitivity } = options;

  let prompt = `Analysiere den folgenden Text mit der Grounded Theory Methode.

KODIEREBENE: ${codingLevel === 'open' ? 'Offenes Kodieren' : codingLevel === 'axial' ? 'Axiales Kodieren' : 'Selektives Kodieren'}

`;

  if (existingCodes.length > 0) {
    prompt += `BEREITS ENTWICKELTE KODES:\n`;
    existingCodes.forEach(code => {
      prompt += `- ${code.name}: ${code.properties?.join(', ') || ''}\n`;
    });
    prompt += '\n';
  }

  prompt += `TEXT ZUR ANALYSE:
---
${text}
---

`;

  if (codingLevel === 'open') {
    prompt += `AUFGABEN BEIM OFFENEN KODIEREN:
1. Identifiziere Konzepte (In-Vivo-Kodes und konstruierte Kodes)
2. Entwickle Eigenschaften und Dimensionen für jedes Konzept
3. Gruppiere ähnliche Konzepte zu vorläufigen Kategorien
4. Notiere theoretische Memos zu interessanten Beobachtungen

AUSGABEFORMAT (JSON):
{
  "codings": [
    {
      "id": "K1",
      "text": "Textstelle",
      "concept": "Konzeptname",
      "type": "in-vivo|constructed",
      "properties": ["Eigenschaft1", "Eigenschaft2"],
      "dimensions": [
        {"property": "Eigenschaft1", "range": "niedrig...hoch", "position": "mittel"}
      ]
    }
  ],
  "categories": [
    {
      "name": "Kategoriename",
      "concepts": ["Konzept1", "Konzept2"],
      "properties": [],
      "dimensions": []
    }
  ],
  "memos": [
    {
      "type": "theoretical",
      "content": "Memo-Inhalt",
      "relatedCodes": ["K1", "K2"]
    }
  ]
}`;
  } else if (codingLevel === 'axial') {
    prompt += `AUFGABEN BEIM AXIALEN KODIEREN:
1. Ordne Kodes nach dem Kodierparadigma
2. Identifiziere Beziehungen zwischen Kategorien
3. Entwickle Subkategorien
4. Verfeinere Eigenschaften und Dimensionen

AUSGABEFORMAT (JSON):
{
  "axialRelations": [
    {
      "phenomenon": "Hauptphänomen",
      "causalConditions": ["Ursache1", "Ursache2"],
      "context": ["Kontextfaktor1"],
      "interveningConditions": ["Bedingung1"],
      "strategies": ["Strategie1", "Strategie2"],
      "consequences": ["Konsequenz1"]
    }
  ],
  "categories": [...],
  "memos": [...]
}`;
  } else {
    prompt += `AUFGABEN BEIM SELEKTIVEN KODIEREN:
1. Identifiziere die Kernkategorie
2. Integriere alle anderen Kategorien systematisch
3. Fülle Lücken in der entstehenden Theorie
4. Validiere die Beziehungen

AUSGABEFORMAT (JSON):
{
  "coreCategory": {
    "name": "Kernkategorie",
    "definition": "Definition",
    "storyline": "Narrative Beschreibung der Theorie"
  },
  "integration": [
    {
      "category": "Kategorie",
      "relationToCore": "Beziehung zur Kernkategorie"
    }
  ],
  "emergingTheory": "Beschreibung der entstehenden gegenstandsverankerten Theorie"
}`;
  }

  prompt += `\n\nAntworte NUR mit dem JSON.`;

  return prompt;
}

/**
 * Parst die GT-Antwort
 */
function parseGTResponse(responseText) {
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('GT JSON Parse Error:', error);
  }

  return {
    codings: [],
    categories: [],
    axialRelations: [],
    memos: []
  };
}

export default { analyzeWithGroundedTheory };
