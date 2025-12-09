// src/services/ExpertPersonaGenerator.ts

import APIService, { APIMessage } from './APIService';
import ValidatedAIService from './ValidatedAIService';

export interface ExpertPersona {
  name: string;
  title: string;
  background: string;
  expertise: string[];
  theoreticalLens: string;
  codingFocus: string;
  potentialBias: string;
  blindSpots: string;
  methodologicalApproach: string;
  keyQuestions: string[];
  disciplinaryPerspective: string;
  yearsOfExperience: number;
  publicationFocus: string[];
}

export interface DocumentTheme {
  theme: string;
  frequency: number;
  keywords: string[];
  contexts: string[];
}

export interface CodingCategory {
  name: string;
  description: string;
  examples?: string[];
  theoreticalBasis?: string;
}

export class ExpertPersonaGenerator {
  private validatedAI: ValidatedAIService;

  // Pre-defined expert templates for different domains
  private expertTemplates = {
    psychology: {
      titles: ['Clinical Psychologist', 'Developmental Psychologist', 'Social Psychologist', 'Cognitive Psychologist'],
      lenses: ['Cognitive Behavioral', 'Psychodynamic', 'Humanistic', 'Behavioral', 'Systemic'],
      focuses: ['Individual differences', 'Cognitive processes', 'Emotional regulation', 'Social dynamics']
    },
    sociology: {
      titles: ['Medical Sociologist', 'Cultural Sociologist', 'Organizational Sociologist', 'Health Sociologist'],
      lenses: ['Symbolic Interactionism', 'Structural Functionalism', 'Conflict Theory', 'Social Constructivism'],
      focuses: ['Social structures', 'Power dynamics', 'Cultural patterns', 'Institutional processes']
    },
    medicine: {
      titles: ['Primary Care Physician', 'Public Health Specialist', 'Medical Researcher', 'Clinical Epidemiologist'],
      lenses: ['Evidence-Based Medicine', 'Patient-Centered Care', 'Population Health', 'Biomedical Model'],
      focuses: ['Clinical outcomes', 'Disease patterns', 'Treatment efficacy', 'Patient safety']
    },
    education: {
      titles: ['Educational Researcher', 'Learning Scientist', 'Curriculum Specialist', 'Educational Psychologist'],
      lenses: ['Constructivist Learning', 'Social Learning Theory', 'Critical Pedagogy', 'Cognitive Load Theory'],
      focuses: ['Learning processes', 'Pedagogical strategies', 'Student engagement', 'Educational equity']
    },
    anthropology: {
      titles: ['Medical Anthropologist', 'Cultural Anthropologist', 'Applied Anthropologist', 'Linguistic Anthropologist'],
      lenses: ['Cultural Relativism', 'Interpretive Anthropology', 'Medical Anthropology', 'Ethnographic Method'],
      focuses: ['Cultural meanings', 'Social practices', 'Symbolic systems', 'Community contexts']
    }
  };

  constructor() {
    this.validatedAI = new ValidatedAIService();
  }

  /**
   * Generiert drei komplementäre Experten basierend auf Dokumenten und Kategorien
   */
  async generateExpertsFromDocuments(
    documents: any[],
    categories: CodingCategory[],
    apiSettings: any
  ): Promise<ExpertPersona[]> {

    // 1. Analysiere Dokumentthemen
    const documentThemes = await this.analyzeDocumentThemes(documents, apiSettings);

    // 2. Identifiziere relevante Disziplinen
    const relevantDisciplines = this.identifyRelevantDisciplines(documentThemes, categories);

    // 3. Generiere drei komplementäre Experten
    const experts: ExpertPersona[] = [];

    for (let i = 0; i < 3; i++) {
      const expert = await this.generateSingleExpert(
        documentThemes,
        categories,
        relevantDisciplines[i] || relevantDisciplines[0],
        experts, // Bereits generierte Experten für Komplementarität
        apiSettings
      );
      experts.push(expert);
    }

    // 4. Validiere Komplementarität
    await this.ensureComplementarity(experts, apiSettings);

    return experts;
  }

  /**
   * Analysiert Dokumentinhalte und extrahiert Hauptthemen
   */
  private async analyzeDocumentThemes(documents: any[], apiSettings: any): Promise<DocumentTheme[]> {
    const documentContent = documents
      .map(d => d.content || d.text || '')
      .join('\n')
      .substring(0, 5000); // Limit für API

    const prompt = `
Analyze this research content and identify the TOP 5 THEMES with their key characteristics:

CONTENT:
${documentContent}

Return as JSON:
{
  "themes": [
    {
      "theme": "Main theme name",
      "frequency": "high/medium/low",
      "keywords": ["keyword1", "keyword2", "keyword3"],
      "contexts": ["context where theme appears"],
      "complexity": "low/medium/high",
      "disciplinaryRelevance": ["discipline1", "discipline2"]
    }
  ]
}

Focus on themes that would require different analytical perspectives for coding.`;

    try {
      const result = await this.validatedAI.generateValidatedContent(
        prompt,
        apiSettings,
        {
          strictMode: true,
          confidenceThreshold: 0.8
        }
      );

      const analysis = JSON.parse(result.content);
      return analysis.themes.map((theme: any) => ({
        theme: theme.theme,
        frequency: theme.frequency === 'high' ? 3 : theme.frequency === 'medium' ? 2 : 1,
        keywords: theme.keywords || [],
        contexts: theme.contexts || [],
        complexity: theme.complexity || 'medium',
        disciplinaryRelevance: theme.disciplinaryRelevance || []
      }));
    } catch (error) {
      console.error('Theme analysis failed:', error);

      // Fallback: Einfache Keyword-Extraktion
      return this.extractThemesFromKeywords(documentContent);
    }
  }

  /**
   * Identifiziert relevante Disziplinen basierend auf Themen
   */
  private identifyRelevantDisciplines(
    themes: DocumentTheme[],
    categories: CodingCategory[]
  ): string[] {
    const disciplineScores: Record<string, number> = {};

    // Bewerte Disziplinen basierend auf Themen
    themes.forEach(theme => {
      const themeText = theme.theme.toLowerCase();
      const keywords = theme.keywords.join(' ').toLowerCase();

      // Psychology indicators
      if (this.matchesDiscipline(themeText + ' ' + keywords,
          ['behavior', 'emotion', 'cognitive', 'mental', 'psychology', 'individual', 'personality'])) {
        disciplineScores['psychology'] = (disciplineScores['psychology'] || 0) + theme.frequency;
      }

      // Sociology indicators
      if (this.matchesDiscipline(themeText + ' ' + keywords,
          ['social', 'community', 'culture', 'group', 'society', 'interaction', 'structure'])) {
        disciplineScores['sociology'] = (disciplineScores['sociology'] || 0) + theme.frequency;
      }

      // Medicine indicators
      if (this.matchesDiscipline(themeText + ' ' + keywords,
          ['health', 'medical', 'treatment', 'patient', 'clinical', 'disease', 'care'])) {
        disciplineScores['medicine'] = (disciplineScores['medicine'] || 0) + theme.frequency;
      }

      // Education indicators
      if (this.matchesDiscipline(themeText + ' ' + keywords,
          ['learning', 'education', 'teaching', 'student', 'school', 'curriculum', 'pedagogy'])) {
        disciplineScores['education'] = (disciplineScores['education'] || 0) + theme.frequency;
      }

      // Anthropology indicators
      if (this.matchesDiscipline(themeText + ' ' + keywords,
          ['cultural', 'meaning', 'practice', 'ritual', 'belief', 'ethnography', 'context'])) {
        disciplineScores['anthropology'] = (disciplineScores['anthropology'] || 0) + theme.frequency;
      }
    });

    // Sortiere nach Relevanz
    const sortedDisciplines = Object.entries(disciplineScores)
      .sort(([,a], [,b]) => b - a)
      .map(([discipline]) => discipline);

    // Stelle sicher, dass wir mindestens 3 verschiedene Disziplinen haben
    const result = sortedDisciplines.slice(0, 3);
    const availableDisciplines = Object.keys(this.expertTemplates);

    while (result.length < 3) {
      const missing = availableDisciplines.find(d => !result.includes(d));
      if (missing) result.push(missing);
      else break;
    }

    return result;
  }

  /**
   * Generiert einen einzelnen Experten
   */
  private async generateSingleExpert(
    themes: DocumentTheme[],
    categories: CodingCategory[],
    discipline: string,
    existingExperts: ExpertPersona[],
    apiSettings: any
  ): Promise<ExpertPersona> {

    const template = this.expertTemplates[discipline as keyof typeof this.expertTemplates] || this.expertTemplates.psychology;

    const themesList = themes.map(t => `${t.theme} (${t.keywords.join(', ')})`).join('\n');
    const categoryList = categories.map(c => `${c.name}: ${c.description}`).join('\n');
    const existingExpertSummary = existingExperts.map(e =>
      `${e.disciplinaryPerspective} expert focusing on ${e.codingFocus}`
    ).join('\n');

    const prompt = `
Create a realistic expert persona for coding qualitative research data.

DISCIPLINE: ${discipline}
AVAILABLE TITLES: ${template.titles.join(', ')}
THEORETICAL FRAMEWORKS: ${template.lenses.join(', ')}

DOCUMENT THEMES TO CODE:
${themesList}

CODING CATEGORIES:
${categoryList}

EXISTING EXPERTS (to ensure complementarity):
${existingExpertSummary}

CREATE A COMPLEMENTARY EXPERT who:
1. Has a DIFFERENT theoretical lens from existing experts
2. Would notice DIFFERENT aspects in the data
3. Has SPECIFIC methodological expertise
4. Has realistic academic background and experience

Return as JSON:
{
  "name": "Dr. [Realistic First Last Name]",
  "title": "[Specific academic title from available titles]",
  "background": "[Detailed 2-3 sentence background with education and career path]",
  "expertise": ["specific area 1", "specific area 2", "specific area 3"],
  "theoreticalLens": "[One main theoretical framework]",
  "codingFocus": "[What this expert specifically looks for in data - be precise]",
  "potentialBias": "[What this expert might overemphasize]",
  "blindSpots": "[What this expert might miss - be specific]",
  "methodologicalApproach": "[Preferred research methods]",
  "keyQuestions": ["Question 1 this expert asks", "Question 2", "Question 3"],
  "disciplinaryPerspective": "${discipline}",
  "yearsOfExperience": [15-35],
  "publicationFocus": ["research area 1", "research area 2"]
}

Make this expert DISTINCTLY different from existing experts while being realistic.`;

    try {
      const result = await this.validatedAI.generateValidatedContent(
        prompt,
        apiSettings,
        {
          strictMode: true,
          confidenceThreshold: 0.8,
          maxRetries: 2
        }
      );

      const expert = JSON.parse(result.content);

      // Validiere und korrigiere falls nötig
      return this.validateAndCorrectExpert(expert, discipline, template);

    } catch (error) {
      console.error('Expert generation failed:', error);

      // Fallback: Generiere Standard-Experten
      return this.generateFallbackExpert(discipline, template, existingExperts.length);
    }
  }

  /**
   * Stellt sicher, dass die drei Experten komplementär sind
   */
  private async ensureComplementarity(experts: ExpertPersona[], apiSettings: any): Promise<void> {
    const prompt = `
Review these three expert personas for coding research data:

EXPERT 1: ${experts[0].name} (${experts[0].disciplinaryPerspective})
- Focus: ${experts[0].codingFocus}
- Lens: ${experts[0].theoreticalLens}
- Blind spots: ${experts[0].blindSpots}

EXPERT 2: ${experts[1].name} (${experts[1].disciplinaryPerspective})
- Focus: ${experts[1].codingFocus}
- Lens: ${experts[1].theoreticalLens}
- Blind spots: ${experts[1].blindSpots}

EXPERT 3: ${experts[2].name} (${experts[2].disciplinaryPerspective})
- Focus: ${experts[2].codingFocus}
- Lens: ${experts[2].theoreticalLens}
- Blind spots: ${experts[2].blindSpots}

Rate complementarity (0-100%) and suggest ONE specific improvement for better triangulation:

{
  "complementarityScore": 85,
  "strengths": "Good theoretical diversity...",
  "improvement": "Expert 2 should focus more on...",
  "overlapConcerns": "All experts might miss..."
}`;

    try {
      const result = await this.validatedAI.generateValidatedContent(
        prompt,
        apiSettings,
        { confidenceThreshold: 0.7 }
      );

      const assessment = JSON.parse(result.content);

      // Wenn Komplementarität niedrig, korrigiere
      if (assessment.complementarityScore < 70 && assessment.improvement) {
        console.warn('Low complementarity detected:', assessment);
        // Hier könnten wir automatische Korrekturen vornehmen
      }
    } catch (error) {
      console.warn('Complementarity check failed:', error);
    }
  }

  /**
   * Hilfsmethoden
   */
  private matchesDiscipline(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword));
  }

  private extractThemesFromKeywords(content: string): DocumentTheme[] {
    // Fallback keyword extraction
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 4);

    const wordCounts: Record<string, number> = {};
    words.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });

    const topWords = Object.entries(wordCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word, count]) => ({
        theme: word,
        frequency: count > 10 ? 3 : count > 5 ? 2 : 1,
        keywords: [word],
        contexts: ['extracted from content']
      }));

    return topWords;
  }

  private validateAndCorrectExpert(
    expert: any,
    discipline: string,
    template: any
  ): ExpertPersona {
    // Validiere Pflichtfelder
    const validated: ExpertPersona = {
      name: expert.name || `Dr. ${this.generateRandomName()}`,
      title: expert.title || template.titles[0],
      background: expert.background || `Expert in ${discipline} with extensive research experience.`,
      expertise: Array.isArray(expert.expertise) ? expert.expertise : [discipline],
      theoreticalLens: expert.theoreticalLens || template.lenses[0],
      codingFocus: expert.codingFocus || `${discipline}-based analysis`,
      potentialBias: expert.potentialBias || `May overemphasize ${discipline} factors`,
      blindSpots: expert.blindSpots || `May miss non-${discipline} aspects`,
      methodologicalApproach: expert.methodologicalApproach || 'Qualitative analysis',
      keyQuestions: Array.isArray(expert.keyQuestions) ? expert.keyQuestions :
        [`What ${discipline} factors are present?`, `How do ${discipline} theories apply?`, `What patterns emerge?`],
      disciplinaryPerspective: discipline,
      yearsOfExperience: expert.yearsOfExperience || 20,
      publicationFocus: Array.isArray(expert.publicationFocus) ? expert.publicationFocus : [discipline]
    };

    return validated;
  }

  private generateFallbackExpert(
    discipline: string,
    template: any,
    expertNumber: number
  ): ExpertPersona {
    const names = [
      'Dr. Sarah Mitchell', 'Dr. Michael Chen', 'Dr. Elena Rodriguez',
      'Dr. David Thompson', 'Dr. Maria Santos', 'Dr. James Wilson'
    ];

    return {
      name: names[expertNumber] || `Dr. Expert${expertNumber + 1}`,
      title: template.titles[expertNumber % template.titles.length],
      background: `Experienced ${discipline} researcher with ${15 + expertNumber * 5} years in the field.`,
      expertise: [`${discipline} research`, `qualitative methods`, `data analysis`],
      theoreticalLens: template.lenses[expertNumber % template.lenses.length],
      codingFocus: template.focuses[expertNumber % template.focuses.length],
      potentialBias: `May overemphasize ${discipline} perspectives`,
      blindSpots: `May miss interdisciplinary connections`,
      methodologicalApproach: 'Mixed methods research',
      keyQuestions: [
        `What ${discipline} patterns emerge?`,
        'How do theoretical frameworks apply?',
        'What are the implications?'
      ],
      disciplinaryPerspective: discipline,
      yearsOfExperience: 15 + expertNumber * 5,
      publicationFocus: [discipline, 'qualitative research']
    };
  }

  private generateRandomName(): string {
    const firstNames = ['Sarah', 'Michael', 'Elena', 'David', 'Maria', 'James', 'Anna', 'Robert', 'Lisa', 'Thomas'];
    const lastNames = ['Mitchell', 'Chen', 'Rodriguez', 'Thompson', 'Santos', 'Wilson', 'Johnson', 'Brown', 'Davis', 'Miller'];

    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

    return `${firstName} ${lastName}`;
  }

  /**
   * Öffentliche Hilfsmethoden
   */
  getAvailableDisciplines(): string[] {
    return Object.keys(this.expertTemplates);
  }

  getExpertTemplate(discipline: string) {
    return this.expertTemplates[discipline as keyof typeof this.expertTemplates] || null;
  }

  validateExpertPersona(expert: ExpertPersona): boolean {
    const required = ['name', 'title', 'background', 'expertise', 'theoreticalLens', 'codingFocus'];
    return required.every(field => expert[field as keyof ExpertPersona] != null);
  }
}

export default ExpertPersonaGenerator;