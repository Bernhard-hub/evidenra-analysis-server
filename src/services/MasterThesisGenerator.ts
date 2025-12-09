// src/services/MasterThesisGenerator.ts
// MVP: VOLLSTÄNDIGE KAPITEL-GENERIERUNG FÜR MASTERARBEITEN
// ANTI-PLACEHOLDER-ARCHITEKTUR
// ================================================================================

import APIService, { type APIMessage } from './APIService';

// ================================================================================
// TYPE DEFINITIONS
// ================================================================================

export interface ChapterContext {
  thesisTitle: string;
  thesisTopic: string;
  chapterNumber: number;
  chapterTitle: string;
  targetWords: number; // Ziel-Wortanzahl (min. 3000-5000 pro Kapitel)
  previousChaptersSummary?: string; // Zusammenfassung vorheriger Kapitel
  researchQuestions?: string[]; // Forschungsfragen
  methodology?: string; // Methodischer Ansatz
  theoreticalFramework?: string; // Theoretischer Rahmen
  keyReferences?: string[]; // Wichtige Quellen (für Kontext)
}

export interface ChapterSection {
  sectionNumber: string; // z.B. "2.1"
  sectionTitle: string;
  content: string;
  wordCount: number;
  containsPlaceholders: boolean;
}

export interface CompleteChapter {
  chapterNumber: number;
  chapterTitle: string;
  abstract: string; // Kurze Zusammenfassung des Kapitels
  sections: ChapterSection[];
  totalWordCount: number;
  isComplete: boolean; // true = keine Platzhalter
  qualityScore: number; // 0-1, basierend auf Vollständigkeit
  generatedAt: string;
  validationReport: ValidationReport;
}

export interface ValidationReport {
  hasPlaceholders: boolean;
  placeholderCount: number;
  placeholderLocations: string[];
  meetsWordCount: boolean;
  actualWordCount: number;
  targetWordCount: number;
  completenessRate: number; // 0-1
  recommendations: string[];
}

export interface GenerationOptions {
  language: 'de' | 'en';
  academicLevel: 'bachelor' | 'master' | 'phd';
  citationStyle: 'APA' | 'Harvard' | 'IEEE' | 'Chicago';
  maxRetries: number; // Wie oft neu generieren bei Platzhaltern?
  strictMode: boolean; // true = MUSS 100% vollständig sein
  onProgress?: (percent: number, message: string, details?: string) => void; // Fortschritts-Callback
}

// ================================================================================
// MASTER THESIS GENERATOR SERVICE
// ================================================================================

export class MasterThesisGenerator {

  /**
   * HAUPTFUNKTION: Generiert ein vollständiges Kapitel
   * MIT Anti-Placeholder-Garantie
   */
  static async generateCompleteChapter(
    context: ChapterContext,
    apiSettings: { provider: string; model: string; apiKey: string },
    options: Partial<GenerationOptions> = {}
  ): Promise<CompleteChapter> {

    const opts: GenerationOptions = {
      language: 'de',
      academicLevel: 'master',
      citationStyle: 'APA',
      maxRetries: 1, // ⚠️ NUR 1 Versuch (nicht 3!) um Endlosschleifen zu vermeiden
      strictMode: false, // ⚠️ Strict Mode AUS - akzeptiere auch unvollständige Kapitel
      ...options
    };

    console.log(`\n🎓 STARTE KAPITEL-GENERIERUNG`);
    console.log(`📖 Kapitel ${context.chapterNumber}: ${context.chapterTitle}`);
    console.log(`🎯 Ziel-Wortanzahl: ${context.targetWords} Wörter`);
    console.log(`🔒 Strict Mode: ${opts.strictMode ? 'AN' : 'AUS'}`);

    // ⏱️ TIMEOUT: Max 10 Minuten
    const TIMEOUT_MS = 10 * 60 * 1000; // 10 Minuten
    const startTime = Date.now();

    let attempt = 1;
    let chapter: CompleteChapter | null = null;

    // VERSUCH 1-N: Generiere bis vollständig
    while (attempt <= opts.maxRetries) {
      // ⏱️ TIMEOUT CHECK
      if (Date.now() - startTime > TIMEOUT_MS) {
        console.error(`⏱️ TIMEOUT nach ${Math.round((Date.now() - startTime) / 1000 / 60)} Minuten!`);
        throw new Error(`Generierung abgebrochen: Timeout nach ${Math.round(TIMEOUT_MS / 1000 / 60)} Minuten`);
      }

      console.log(`\n🔄 Versuch ${attempt}/${opts.maxRetries}...`);
      opts.onProgress?.(5, opts.language === 'de' ? 'Starte Generierung...' : 'Starting generation...', `Versuch ${attempt}/${opts.maxRetries}`);

      try {
        // Schritt 1: Generiere Kapitel-Struktur (Outline)
        opts.onProgress?.(10, opts.language === 'de' ? 'Erstelle Gliederung...' : 'Creating outline...', 'API-Call läuft');
        const outline = await this.generateChapterOutline(context, apiSettings, opts);
        console.log(`✅ Outline erstellt: ${outline.sections.length} Abschnitte`);
        opts.onProgress?.(20, opts.language === 'de' ? 'Gliederung erstellt' : 'Outline created', `${outline.sections.length} Abschnitte`);

        // Schritt 2: Generiere jeden Abschnitt vollständig
        const sections: ChapterSection[] = [];
        const totalSections = outline.sections.length;

        for (let i = 0; i < totalSections; i++) {
          const sectionOutline = outline.sections[i];
          const sectionProgress = 20 + ((i / totalSections) * 60); // 20-80%

          opts.onProgress?.(
            sectionProgress,
            opts.language === 'de' ? `Generiere Abschnitt ${i + 1}/${totalSections}` : `Generating section ${i + 1}/${totalSections}`,
            sectionOutline.title
          );

          console.log(`\n  📝 Generiere Abschnitt ${i + 1}/${totalSections}: ${sectionOutline.title}`);

          const section = await this.generateCompleteSection(
            sectionOutline,
            context,
            apiSettings,
            opts
          );

          sections.push(section);
          console.log(`  ✅ Abschnitt generiert: ${section.wordCount} Wörter (Platzhalter: ${section.containsPlaceholders ? 'JA' : 'NEIN'})`);
        }

        // Schritt 3: Erstelle vollständiges Kapitel
        opts.onProgress?.(80, opts.language === 'de' ? 'Füge Kapitel zusammen...' : 'Assembling chapter...', '');
        chapter = this.assembleChapter(context, outline.abstract, sections);

        // Schritt 4: Validiere
        opts.onProgress?.(90, opts.language === 'de' ? 'Validiere Kapitel...' : 'Validating chapter...', '');
        const validation = this.validateChapter(chapter, context.targetWords, opts.strictMode);
        chapter.validationReport = validation;

        console.log(`\n📊 VALIDIERUNG:`);
        console.log(`  Wortanzahl: ${validation.actualWordCount}/${validation.targetWordCount}`);
        console.log(`  Vollständigkeit: ${(validation.completenessRate * 100).toFixed(1)}%`);
        console.log(`  Platzhalter: ${validation.placeholderCount}`);

        // Schritt 5: Prüfe ob akzeptabel
        if (validation.completenessRate >= 0.95 && !validation.hasPlaceholders) {
          console.log(`\n✅ KAPITEL VOLLSTÄNDIG GENERIERT!`);
          opts.onProgress?.(100, opts.language === 'de' ? '✅ Kapitel vollständig!' : '✅ Chapter complete!', `${validation.actualWordCount} Wörter`);
          chapter.isComplete = true;
          chapter.qualityScore = validation.completenessRate;
          return chapter;
        }

        // Nicht vollständig - versuche erneut
        if (opts.strictMode && attempt < opts.maxRetries) {
          console.log(`\n⚠️ Kapitel nicht vollständig (${(validation.completenessRate * 100).toFixed(1)}%) - Regeneriere...`);
          attempt++;
          continue;
        }

        // Strict Mode AUS oder letzte Chance
        if (!opts.strictMode) {
          console.log(`\n⚠️ Kapitel nicht 100% vollständig, aber Strict Mode deaktiviert - Akzeptiere Ergebnis`);
          chapter.isComplete = false;
          chapter.qualityScore = validation.completenessRate;
          return chapter;
        }

      } catch (error) {
        console.error(`❌ Fehler bei Versuch ${attempt}:`, error);
        if (attempt >= opts.maxRetries) {
          throw new Error(`Kapitel-Generierung fehlgeschlagen nach ${opts.maxRetries} Versuchen`);
        }
        attempt++;
      }
    }

    // Sollte nie erreicht werden
    if (!chapter) {
      throw new Error('Kapitel-Generierung fehlgeschlagen');
    }

    return chapter;
  }

  /**
   * SCHRITT 1: Generiert Kapitel-Outline (Gliederung)
   */
  private static async generateChapterOutline(
    context: ChapterContext,
    apiSettings: { provider: string; model: string; apiKey: string },
    options: GenerationOptions
  ): Promise<{ abstract: string; sections: { number: string; title: string; targetWords: number }[] }> {

    const messages: APIMessage[] = [
      {
        role: 'system',
        content: this.getOutlineSystemPrompt(options)
      },
      {
        role: 'user',
        content: this.getOutlineUserPrompt(context, options)
      }
    ];

    const result = await APIService.callAPI(
      apiSettings.provider,
      apiSettings.model,
      apiSettings.apiKey,
      messages,
      500
    );

    if (!result.success) {
      throw new Error(`Outline-Generierung fehlgeschlagen: ${result.error}`);
    }

    return this.parseOutlineResponse(result.content, context);
  }

  /**
   * SCHRITT 2: Generiert einen vollständigen Abschnitt
   */
  private static async generateCompleteSection(
    sectionOutline: { number: string; title: string; targetWords: number },
    context: ChapterContext,
    apiSettings: { provider: string; model: string; apiKey: string },
    options: GenerationOptions
  ): Promise<ChapterSection> {

    const messages: APIMessage[] = [
      {
        role: 'system',
        content: this.getSectionSystemPrompt(options)
      },
      {
        role: 'user',
        content: this.getSectionUserPrompt(sectionOutline, context, options)
      }
    ];

    const result = await APIService.callAPI(
      apiSettings.provider,
      apiSettings.model,
      apiSettings.apiKey,
      messages,
      Math.max(1000, sectionOutline.targetWords * 2) // Token-Limit anpassen
    );

    if (!result.success) {
      throw new Error(`Abschnitt-Generierung fehlgeschlagen: ${result.error}`);
    }

    const content = result.content;
    const wordCount = this.countWords(content);
    const containsPlaceholders = this.detectPlaceholders(content);

    return {
      sectionNumber: sectionOutline.number,
      sectionTitle: sectionOutline.title,
      content,
      wordCount,
      containsPlaceholders
    };
  }

  /**
   * KRITISCH: System-Prompt für Outline (Anti-Placeholder)
   */
  private static getOutlineSystemPrompt(options: GenerationOptions): string {
    const langInstructions = options.language === 'de'
      ? 'Du bist ein erfahrener wissenschaftlicher Autor und Ghostwriter für akademische Arbeiten.'
      : 'You are an experienced academic author and ghostwriter for scholarly works.';

    return `${langInstructions}

DEINE AUFGABE:
Erstelle eine detaillierte GLIEDERUNG (Outline) für ein Kapitel einer ${options.academicLevel === 'master' ? 'Masterarbeit' : 'wissenschaftlichen Arbeit'}.

WICHTIGE REGELN:
• Die Gliederung muss ALLE Unterabschnitte enthalten
• Jeder Abschnitt bekommt eine Ziel-Wortanzahl
• Gesamte Wortanzahl muss erreicht werden
• Strukturiere logisch und wissenschaftlich fundiert

FORMAT:
Antworte in folgendem JSON-Format:
{
  "abstract": "Kurze Zusammenfassung des Kapitels (100-150 Wörter)",
  "sections": [
    {
      "number": "2.1",
      "title": "Abschnittstitel",
      "targetWords": 800
    }
  ]
}`;
  }

  /**
   * KRITISCH: User-Prompt für Outline
   */
  private static getOutlineUserPrompt(context: ChapterContext, options: GenerationOptions): string {
    return `Erstelle eine detaillierte Gliederung für folgendes Kapitel:

MASTERARBEIT: "${context.thesisTitle}"
THEMA: ${context.thesisTopic}

KAPITEL ${context.chapterNumber}: "${context.chapterTitle}"
ZIEL-WORTANZAHL: ${context.targetWords} Wörter

${context.previousChaptersSummary ? `VORHERIGE KAPITEL:\n${context.previousChaptersSummary}\n` : ''}
${context.researchQuestions ? `FORSCHUNGSFRAGEN:\n${context.researchQuestions.map(q => `• ${q}`).join('\n')}\n` : ''}
${context.methodology ? `METHODISCHER ANSATZ: ${context.methodology}\n` : ''}
${context.theoreticalFramework ? `THEORETISCHER RAHMEN: ${context.theoreticalFramework}\n` : ''}

Erstelle eine wissenschaftlich fundierte Gliederung mit 4-6 Hauptabschnitten.
Die Summe aller Abschnitte muss ${context.targetWords} Wörter ergeben.`;
  }

  /**
   * KRITISCH: System-Prompt für Abschnitte (ANTI-PLACEHOLDER!)
   */
  private static getSectionSystemPrompt(options: GenerationOptions): string {
    const lang = options.language;

    return `Du bist ein erfahrener wissenschaftlicher Autor für ${options.academicLevel}-Arbeiten.

🚨 KRITISCH WICHTIG - ABSOLUTE REGELN:

❌ ABSOLUT VERBOTEN:
• "hier würde folgen..."
• "an dieser Stelle könnte..."
• "würde man beschreiben..."
• "[Platzhalter]"
• "etc.", "usw." ohne Ausführung
• "siehe Kapitel X" ohne Inhalt
• Unvollständige Sätze oder Gedanken
• Auslassungspunkte "..."

✅ ERFORDERLICH:
• JEDER Satz vollständig ausformuliert
• ALLE Gedanken zu Ende geführt
• KONKRETE Beispiele, keine abstrakten Andeutungen
• Mindestens die Ziel-Wortanzahl erreichen
• Wissenschaftlich fundiert mit Argumentation
• Flüssiger, akademischer Schreibstil
• ${options.citationStyle}-Zitierweise

QUALITÄTSSTANDARDS (${options.academicLevel}-Niveau):
• Klare Argumentation
• Logischer Aufbau
• Wissenschaftliche Präzision
• Kritische Reflexion
• Theoretische Fundierung

Schreibe den KOMPLETTEN Abschnitt, nicht nur eine Skizze!`;
  }

  /**
   * KRITISCH: User-Prompt für Abschnitt-Generierung
   */
  private static getSectionUserPrompt(
    sectionOutline: { number: string; title: string; targetWords: number },
    context: ChapterContext,
    options: GenerationOptions
  ): string {
    return `Schreibe den folgenden Abschnitt VOLLSTÄNDIG aus:

MASTERARBEIT: "${context.thesisTitle}"
KAPITEL: ${context.chapterNumber}. ${context.chapterTitle}

ABSCHNITT ${sectionOutline.number}: ${sectionOutline.title}

ANFORDERUNGEN:
• Mindestens ${sectionOutline.targetWords} Wörter
• Vollständig ausformuliert (KEINE Platzhalter!)
• Wissenschaftlich fundiert
• ${options.citationStyle}-Zitierweise

${context.theoreticalFramework ? `THEORETISCHER RAHMEN: ${context.theoreticalFramework}` : ''}
${context.methodology ? `METHODISCHER ANSATZ: ${context.methodology}` : ''}
${context.keyReferences ? `RELEVANTE QUELLEN:\n${context.keyReferences.map(ref => `• ${ref}`).join('\n')}` : ''}

🚨 WICHTIG: Schreibe den GESAMTEN Abschnitt vollständig aus. Verwende KEINE Platzhalter, Auslassungen oder "würde folgen"-Formulierungen!

Beginne direkt mit dem Fließtext des Abschnitts:`;
  }

  /**
   * VALIDIERUNG: Erkennt Platzhalter-Patterns
   */
  private static detectPlaceholders(text: string): boolean {
    const placeholderPatterns = [
      /hier würde/gi,
      /würde folgen/gi,
      /könnte beschrieben werden/gi,
      /an dieser Stelle/gi,
      /\[.*?\]/g, // [Platzhalter]
      /\.{3,}/g, // ...
      /siehe Kapitel(?! \d+\.\d+)/gi, // "siehe Kapitel" ohne konkrete Ausführung
      /etc\.(?!\s+\w)/gi, // "etc." am Satzende ohne Fortsetzung
      /usw\.(?!\s+\w)/gi,
      /im Folgenden(?! wird)/gi,
      /im nächsten Abschnitt(?! wird konkret)/gi
    ];

    return placeholderPatterns.some(pattern => pattern.test(text));
  }

  /**
   * VALIDIERUNG: Zählt Wörter
   */
  private static countWords(text: string): number {
    // Entferne Markdown-Formatierung
    const cleanText = text
      .replace(/#{1,6}\s/g, '') // Headers
      .replace(/\*\*/g, '') // Bold
      .replace(/\*/g, '') // Italic
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Links
      .trim();

    const words = cleanText.split(/\s+/).filter(word => word.length > 0);
    return words.length;
  }

  /**
   * Parst Outline-Antwort von AI
   */
  private static parseOutlineResponse(
    content: string,
    context: ChapterContext
  ): { abstract: string; sections: { number: string; title: string; targetWords: number }[] } {
    try {
      // Versuche JSON zu parsen
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed;
      }

      // Fallback: Text-Parsing
      throw new Error('Konnte Outline nicht parsen');

    } catch (error) {
      console.error('Fehler beim Parsen der Outline:', error);

      // Emergency Fallback: Standard-Gliederung
      const sectionsCount = 5;
      const wordsPerSection = Math.floor(context.targetWords / sectionsCount);

      return {
        abstract: `Dieses Kapitel behandelt ${context.chapterTitle}.`,
        sections: Array.from({ length: sectionsCount }, (_, i) => ({
          number: `${context.chapterNumber}.${i + 1}`,
          title: `Abschnitt ${i + 1}`,
          targetWords: wordsPerSection
        }))
      };
    }
  }

  /**
   * Fügt Abschnitte zu vollständigem Kapitel zusammen
   */
  private static assembleChapter(
    context: ChapterContext,
    abstract: string,
    sections: ChapterSection[]
  ): CompleteChapter {
    const totalWordCount = sections.reduce((sum, s) => sum + s.wordCount, 0);

    return {
      chapterNumber: context.chapterNumber,
      chapterTitle: context.chapterTitle,
      abstract,
      sections,
      totalWordCount,
      isComplete: false, // Wird durch Validierung gesetzt
      qualityScore: 0,
      generatedAt: new Date().toISOString(),
      validationReport: {
        hasPlaceholders: false,
        placeholderCount: 0,
        placeholderLocations: [],
        meetsWordCount: false,
        actualWordCount: 0,
        targetWordCount: 0,
        completenessRate: 0,
        recommendations: []
      }
    };
  }

  /**
   * VALIDIERUNG: Prüft Kapitel auf Vollständigkeit
   */
  private static validateChapter(
    chapter: CompleteChapter,
    targetWords: number,
    strictMode: boolean
  ): ValidationReport {

    const placeholderLocations: string[] = [];
    let placeholderCount = 0;

    // Prüfe jeden Abschnitt auf Platzhalter
    for (const section of chapter.sections) {
      if (section.containsPlaceholders) {
        placeholderCount++;
        placeholderLocations.push(`Abschnitt ${section.sectionNumber}: ${section.sectionTitle}`);
      }
    }

    const actualWordCount = chapter.totalWordCount;
    const meetsWordCount = actualWordCount >= targetWords * 0.9; // 90% Toleranz
    const hasPlaceholders = placeholderCount > 0;

    // Berechne Vollständigkeit
    let completenessRate = 1.0;
    if (hasPlaceholders) completenessRate -= 0.3;
    if (!meetsWordCount) completenessRate -= 0.2;

    completenessRate = Math.max(0, Math.min(1, completenessRate));

    // Empfehlungen
    const recommendations: string[] = [];
    if (hasPlaceholders) {
      recommendations.push(`${placeholderCount} Abschnitt(e) enthalten Platzhalter - müssen neu generiert werden`);
    }
    if (!meetsWordCount) {
      recommendations.push(`Wortanzahl zu niedrig: ${actualWordCount}/${targetWords} (${((actualWordCount / targetWords) * 100).toFixed(1)}%)`);
    }
    if (completenessRate >= 0.95) {
      recommendations.push('✅ Kapitel ist vollständig und bereit zur Verwendung');
    }

    return {
      hasPlaceholders,
      placeholderCount,
      placeholderLocations,
      meetsWordCount,
      actualWordCount,
      targetWordCount: targetWords,
      completenessRate,
      recommendations
    };
  }

  /**
   * EXPORT: Exportiert Kapitel als Markdown
   */
  static exportAsMarkdown(chapter: CompleteChapter): string {
    let markdown = `# ${chapter.chapterNumber}. ${chapter.chapterTitle}\n\n`;
    markdown += `**Abstract:** ${chapter.abstract}\n\n`;
    markdown += `---\n\n`;

    for (const section of chapter.sections) {
      markdown += `## ${section.sectionNumber} ${section.sectionTitle}\n\n`;
      markdown += `${section.content}\n\n`;
    }

    markdown += `\n---\n\n`;
    markdown += `*Generiert am: ${new Date(chapter.generatedAt).toLocaleString('de-DE')}*\n`;
    markdown += `*Wortanzahl: ${chapter.totalWordCount} Wörter*\n`;
    markdown += `*Qualität: ${(chapter.qualityScore * 100).toFixed(1)}%*\n`;

    return markdown;
  }

  /**
   * EXPORT: Exportiert Kapitel als Plain Text
   */
  static exportAsPlainText(chapter: CompleteChapter): string {
    let text = `${chapter.chapterNumber}. ${chapter.chapterTitle}\n\n`;
    text += `Abstract: ${chapter.abstract}\n\n`;

    for (const section of chapter.sections) {
      text += `${section.sectionNumber} ${section.sectionTitle}\n\n`;
      // Entferne Markdown-Formatierung
      const plainContent = section.content
        .replace(/#{1,6}\s/g, '')
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
      text += `${plainContent}\n\n`;
    }

    return text;
  }

  /**
   * LITERATURVERZEICHNIS: Generiert Literaturverzeichnis aus Dokumenten
   */
  static generateBibliography(
    documents: Array<{ id: string; name: string; metadata?: any }>,
    citationStyle: 'APA' | 'Harvard' | 'IEEE' | 'Chicago' = 'APA'
  ): string {
    if (!documents || documents.length === 0) {
      return '';
    }

    let bibliography = '# Literaturverzeichnis\n\n';

    // Sortiere alphabetisch nach Namen
    const sortedDocs = [...documents].sort((a, b) => a.name.localeCompare(b.name));

    sortedDocs.forEach(doc => {
      // Versuche Autor und Jahr aus Dateinamen zu extrahieren
      const authorYearMatch = doc.name.match(/([A-Za-zäöüÄÖÜß\s,&.]+?)\s*\((\d{4})\)/);

      if (authorYearMatch) {
        const author = authorYearMatch[1].trim();
        const year = authorYearMatch[2];
        const title = doc.name.replace(/\.\w+$/, ''); // Entferne Dateierweiterung

        switch (citationStyle) {
          case 'APA':
            bibliography += `${author} (${year}). ${title}.\n\n`;
            break;
          case 'Harvard':
            bibliography += `${author} ${year}, ${title}.\n\n`;
            break;
          case 'IEEE':
            bibliography += `${author}, "${title}," ${year}.\n\n`;
            break;
          case 'Chicago':
            bibliography += `${author}. ${year}. ${title}.\n\n`;
            break;
        }
      } else {
        // Fallback: Nur Dokumentname
        const title = doc.name.replace(/\.\w+$/, '');
        bibliography += `${title}.\n\n`;
      }
    });

    return bibliography;
  }

  /**
   * EXPORT MIT LITERATURVERZEICHNIS: Exportiert Kapitel + Literaturverzeichnis
   */
  static exportWithBibliography(
    chapter: CompleteChapter,
    documents: Array<{ id: string; name: string; metadata?: any }>,
    citationStyle: 'APA' | 'Harvard' | 'IEEE' | 'Chicago' = 'APA'
  ): string {
    const chapterMarkdown = this.exportAsMarkdown(chapter);
    const bibliography = this.generateBibliography(documents, citationStyle);

    return `${chapterMarkdown}\n\n${bibliography}`;
  }
}
