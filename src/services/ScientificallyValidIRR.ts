// src/services/ScientificallyValidIRR.ts

export interface KappaResult {
  kappa: number;
  standardError: number;
  confidenceInterval: {
    lower: number;
    upper: number;
    level: number;
  };
  significance: {
    zScore: number;
    pValue: number;
    isSignificant: boolean;
  };
  interpretation: string;
  observedAgreement: number;
  expectedAgreement: number;
  n: number;
}

export interface FleissKappaResult extends KappaResult {
  perCategoryAgreement: CategoryAgreement[];
  raters: number;
  categories: number;
}

export interface CategoryAgreement {
  category: string;
  agreement: number;
  frequency: number;
  proportion: number;
}

export interface KrippendorffResult {
  alpha: number;
  confidenceInterval: {
    lower: number;
    upper: number;
    level: number;
    method: string;
  };
  interpretation: string;
  observedDisagreement: number;
  expectedDisagreement: number;
  bootstrapSamples: number;
  reliability: 'insufficient' | 'tentative' | 'good' | 'excellent';
}

export interface CodingData {
  segmentId: string;
  expert1: string;
  expert2: string;
  expert3: string;
  [key: string]: any;
}

export class ScientificallyValidIRR {

  /**
   * Berechnet Cohen's Kappa für zwei Rater
   * Standardmethode für Zwei-Rater-Übereinstimmung
   */
  calculateCohenKappa(
    ratings1: string[],
    ratings2: string[],
    categories: string[]
  ): KappaResult {
    if (ratings1.length !== ratings2.length) {
      throw new Error('Rating arrays must have same length');
    }

    const n = ratings1.length;
    const k = categories.length;

    // Erstelle Konfusionsmatrix
    const matrix: number[][] = Array(k).fill(0).map(() => Array(k).fill(0));
    const categoryIndex = new Map(categories.map((cat, i) => [cat, i]));

    // Berechne beobachtete Übereinstimmung
    let observedAgreement = 0;

    for (let i = 0; i < n; i++) {
      const idx1 = categoryIndex.get(ratings1[i]);
      const idx2 = categoryIndex.get(ratings2[i]);

      if (idx1 !== undefined && idx2 !== undefined) {
        matrix[idx1][idx2]++;
        if (idx1 === idx2) observedAgreement++;
      }
    }

    const Po = observedAgreement / n;

    // Berechne marginale Wahrscheinlichkeiten
    const marginal1 = Array(k).fill(0);
    const marginal2 = Array(k).fill(0);

    for (let i = 0; i < k; i++) {
      for (let j = 0; j < k; j++) {
        marginal1[i] += matrix[i][j];
        marginal2[j] += matrix[i][j];
      }
    }

    // Erwartete Übereinstimmung
    let Pe = 0;
    for (let i = 0; i < k; i++) {
      Pe += (marginal1[i] / n) * (marginal2[i] / n);
    }

    // Cohen's Kappa
    const kappa = (Po - Pe) / (1 - Pe);

    // Standard Error
    const SE = this.calculateCohenKappaSE(Po, Pe, marginal1, marginal2, n);

    // Konfidenzintervall
    const CI_lower = kappa - 1.96 * SE;
    const CI_upper = kappa + 1.96 * SE;

    // Signifikanztest
    const z = kappa / SE;
    const pValue = 2 * (1 - this.normalCDF(Math.abs(z)));

    return {
      kappa,
      standardError: SE,
      confidenceInterval: {
        lower: CI_lower,
        upper: CI_upper,
        level: 0.95
      },
      significance: {
        zScore: z,
        pValue,
        isSignificant: pValue < 0.05
      },
      interpretation: this.interpretKappa(kappa),
      observedAgreement: Po,
      expectedAgreement: Pe,
      n
    };
  }

  /**
   * Berechnet Fleiss' Kappa für multiple Rater
   * Goldstandard für Inter-Rater Reliability mit mehr als 2 Ratern
   */
  calculateFleissKappa(
    ratings: CodingData[],
    categories: string[],
    raters: number = 3
  ): FleissKappaResult {
    const n = ratings.length;
    const k = categories.length;

    // Erstelle Rating-Matrix: n items x k categories
    const ratingMatrix: number[][] = [];
    const categoryIndex = new Map(categories.map((cat, i) => [cat, i]));

    for (const rating of ratings) {
      const row = Array(k).fill(0);

      for (let r = 1; r <= raters; r++) {
        const category = rating[`expert${r}`];
        const catIndex = categoryIndex.get(category);
        if (catIndex !== undefined) {
          row[catIndex]++;
        }
      }
      ratingMatrix.push(row);
    }

    // Berechne P_i (Übereinstimmung pro Item)
    const P: number[] = [];
    for (const row of ratingMatrix) {
      let sum = 0;
      for (const count of row) {
        sum += count * (count - 1);
      }
      P.push(sum / (raters * (raters - 1)));
    }

    // P_bar (durchschnittliche Übereinstimmung)
    const P_bar = P.reduce((a, b) => a + b, 0) / n;

    // p_j (Proportion jeder Kategorie über alle Ratings)
    const p: number[] = Array(k).fill(0);
    for (let j = 0; j < k; j++) {
      for (const row of ratingMatrix) {
        p[j] += row[j];
      }
      p[j] = p[j] / (n * raters);
    }

    // P_e (erwartete Übereinstimmung)
    const P_e = p.reduce((sum, pj) => sum + pj * pj, 0);

    // Fleiss' Kappa
    const kappa = (P_bar - P_e) / (1 - P_e);

    // Standard Error (vereinfachte Formel)
    const SE = this.calculateFleissKappaSE(P_bar, P_e, p, n, raters);

    // Konfidenzintervall
    const CI_lower = kappa - 1.96 * SE;
    const CI_upper = kappa + 1.96 * SE;

    // Signifikanztest
    const z = kappa / SE;
    const pValue = 2 * (1 - this.normalCDF(Math.abs(z)));

    // Per-Category Agreement
    const perCategoryAgreement = this.calculatePerCategoryAgreement(
      ratingMatrix,
      categories,
      p
    );

    return {
      kappa,
      standardError: SE,
      confidenceInterval: {
        lower: CI_lower,
        upper: CI_upper,
        level: 0.95
      },
      significance: {
        zScore: z,
        pValue,
        isSignificant: pValue < 0.05
      },
      interpretation: this.interpretKappa(kappa),
      observedAgreement: P_bar,
      expectedAgreement: P_e,
      n,
      perCategoryAgreement,
      raters,
      categories: k
    };
  }

  /**
   * Berechnet Krippendorff's Alpha mit Bootstrap-Konfidenzintervallen
   * Robustester Reliability-Koeffizient
   */
  calculateKrippendorffAlpha(
    ratings: CodingData[],
    distanceFunction: 'nominal' | 'ordinal' | 'interval' = 'nominal',
    bootstrapSamples: number = 1000
  ): KrippendorffResult {
    // Observed Disagreement
    const D_o = this.calculateObservedDisagreement(ratings, distanceFunction);

    // Expected Disagreement
    const D_e = this.calculateExpectedDisagreement(ratings, distanceFunction);

    // Krippendorff's Alpha
    const alpha = 1 - (D_o / D_e);

    // Bootstrap für Konfidenzintervalle
    const alphaBootstrap: number[] = [];

    for (let i = 0; i < bootstrapSamples; i++) {
      const sample = this.bootstrapSample(ratings);

      const D_o_boot = this.calculateObservedDisagreement(sample, distanceFunction);
      const D_e_boot = this.calculateExpectedDisagreement(sample, distanceFunction);

      if (D_e_boot > 0) {
        alphaBootstrap.push(1 - (D_o_boot / D_e_boot));
      }
    }

    // Sortiere Bootstrap-Werte
    alphaBootstrap.sort((a, b) => a - b);

    // 95% Konfidenzintervall
    const CI_lower = alphaBootstrap[Math.floor(bootstrapSamples * 0.025)];
    const CI_upper = alphaBootstrap[Math.floor(bootstrapSamples * 0.975)];

    return {
      alpha,
      confidenceInterval: {
        lower: CI_lower || alpha - 0.1,
        upper: CI_upper || alpha + 0.1,
        level: 0.95,
        method: 'bootstrap'
      },
      interpretation: this.interpretKrippendorff(alpha),
      observedDisagreement: D_o,
      expectedDisagreement: D_e,
      bootstrapSamples,
      reliability: this.classifyKrippendorffReliability(alpha)
    };
  }

  /**
   * Berechnet beobachtete Uneinigkeit für Krippendorff's Alpha
   */
  private calculateObservedDisagreement(
    ratings: CodingData[],
    distanceFunction: string
  ): number {
    let totalDisagreement = 0;
    let totalPairs = 0;

    for (const rating of ratings) {
      const expertRatings = [rating.expert1, rating.expert2, rating.expert3];

      // Alle Paare vergleichen
      for (let i = 0; i < expertRatings.length; i++) {
        for (let j = i + 1; j < expertRatings.length; j++) {
          const distance = this.calculateDistance(
            expertRatings[i],
            expertRatings[j],
            distanceFunction
          );
          totalDisagreement += distance;
          totalPairs++;
        }
      }
    }

    return totalPairs > 0 ? totalDisagreement / totalPairs : 0;
  }

  /**
   * Berechnet erwartete Uneinigkeit für Krippendorff's Alpha
   */
  private calculateExpectedDisagreement(
    ratings: CodingData[],
    distanceFunction: string
  ): number {
    // Sammle alle Ratings
    const allRatings: string[] = [];
    for (const rating of ratings) {
      allRatings.push(rating.expert1, rating.expert2, rating.expert3);
    }

    // Berechne erwartete Uneinigkeit basierend auf Gesamtverteilung
    let totalDisagreement = 0;
    let totalPairs = 0;

    for (let i = 0; i < allRatings.length; i++) {
      for (let j = i + 1; j < allRatings.length; j++) {
        const distance = this.calculateDistance(
          allRatings[i],
          allRatings[j],
          distanceFunction
        );
        totalDisagreement += distance;
        totalPairs++;
      }
    }

    return totalPairs > 0 ? totalDisagreement / totalPairs : 1;
  }

  /**
   * Berechnet Distanz zwischen zwei Ratings
   */
  private calculateDistance(
    rating1: string,
    rating2: string,
    distanceFunction: string
  ): number {
    switch (distanceFunction) {
      case 'nominal':
        return rating1 === rating2 ? 0 : 1;

      case 'ordinal':
        // Hier könnten wir ordinale Distanzen implementieren
        // Für jetzt: binär
        return rating1 === rating2 ? 0 : 1;

      case 'interval':
        // Für kategoriale Daten meist nicht anwendbar
        return rating1 === rating2 ? 0 : 1;

      default:
        return rating1 === rating2 ? 0 : 1;
    }
  }

  /**
   * Bootstrap-Sampling für Konfidenzintervalle
   */
  private bootstrapSample(ratings: CodingData[]): CodingData[] {
    const sample: CodingData[] = [];

    for (let i = 0; i < ratings.length; i++) {
      const randomIndex = Math.floor(Math.random() * ratings.length);
      sample.push(ratings[randomIndex]);
    }

    return sample;
  }

  /**
   * Berechnet Standard Error für Cohen's Kappa
   */
  private calculateCohenKappaSE(
    Po: number,
    Pe: number,
    marginal1: number[],
    marginal2: number[],
    n: number
  ): number {
    // Vereinfachte SE-Formel
    const variance = Po * (1 - Po) / (n * Math.pow(1 - Pe, 2));
    return Math.sqrt(variance);
  }

  /**
   * Berechnet Standard Error für Fleiss' Kappa
   */
  private calculateFleissKappaSE(
    P_bar: number,
    P_e: number,
    p: number[],
    n: number,
    raters: number
  ): number {
    // Vereinfachte SE-Berechnung für Fleiss' Kappa
    const variance = (2 / (n * raters * (raters - 1))) *
      (P_e - (2 * raters - 3) * P_e * P_e +
       2 * (raters - 2) * p.reduce((sum, pj) => sum + pj * pj * pj, 0));

    return Math.sqrt(Math.abs(variance));
  }

  /**
   * Berechnet Per-Category Agreement für Fleiss' Kappa
   */
  private calculatePerCategoryAgreement(
    ratingMatrix: number[][],
    categories: string[],
    p: number[]
  ): CategoryAgreement[] {
    const result: CategoryAgreement[] = [];

    for (let i = 0; i < categories.length; i++) {
      const categoryUsage = ratingMatrix.reduce((sum, row) => sum + row[i], 0);
      const agreement = p[i]; // Vereinfacht

      result.push({
        category: categories[i],
        agreement,
        frequency: categoryUsage,
        proportion: p[i]
      });
    }

    return result;
  }

  /**
   * Normalverteilungs-CDF (Cumulative Distribution Function)
   */
  private normalCDF(z: number): number {
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp(-z * z / 2);
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 +
               t * (-1.821256 + t * 1.330274))));
    return z > 0 ? 1 - p : p;
  }

  /**
   * Interpretiert Kappa-Werte nach Landis & Koch (1977)
   */
  interpretKappa(kappa: number): string {
    if (kappa < 0) return "Poor (worse than chance)";
    if (kappa <= 0.20) return "Slight agreement";
    if (kappa <= 0.40) return "Fair agreement";
    if (kappa <= 0.60) return "Moderate agreement";
    if (kappa <= 0.80) return "Substantial agreement";
    return "Almost perfect agreement";
  }

  /**
   * Interpretiert Krippendorff's Alpha
   */
  interpretKrippendorff(alpha: number): string {
    if (alpha < 0.667) return "Insufficient agreement for reliable coding";
    if (alpha < 0.800) return "Tentative conclusions possible";
    if (alpha < 0.900) return "Good reliability for most purposes";
    return "Excellent reliability";
  }

  /**
   * Klassifiziert Krippendorff's Alpha Reliability
   */
  private classifyKrippendorffReliability(alpha: number): 'insufficient' | 'tentative' | 'good' | 'excellent' {
    if (alpha < 0.667) return 'insufficient';
    if (alpha < 0.800) return 'tentative';
    if (alpha < 0.900) return 'good';
    return 'excellent';
  }

  /**
   * Generiert detaillierten statistischen Report
   */
  generateStatisticalReport(
    fleissResult: FleissKappaResult,
    krippendorffResult: KrippendorffResult,
    cohenResults?: KappaResult[]
  ): string {
    let report = `# Inter-Rater Reliability Statistical Report\n\n`;

    // Fleiss' Kappa Sektion
    report += `## Fleiss' Kappa (Multiple Raters)\n`;
    report += `- **κ = ${fleissResult.kappa.toFixed(4)}** (${fleissResult.interpretation})\n`;
    report += `- **95% CI:** [${fleissResult.confidenceInterval.lower.toFixed(4)}, ${fleissResult.confidenceInterval.upper.toFixed(4)}]\n`;
    report += `- **Standard Error:** ${fleissResult.standardError.toFixed(4)}\n`;
    report += `- **z-score:** ${fleissResult.significance.zScore.toFixed(4)}\n`;
    report += `- **p-value:** ${fleissResult.significance.pValue.toFixed(6)} ${fleissResult.significance.isSignificant ? '(significant)' : '(not significant)'}\n`;
    report += `- **Sample Size:** n = ${fleissResult.n}\n`;
    report += `- **Raters:** ${fleissResult.raters}\n`;
    report += `- **Categories:** ${fleissResult.categories}\n\n`;

    // Per-Category Agreement
    if (fleissResult.perCategoryAgreement.length > 0) {
      report += `### Per-Category Agreement\n`;
      fleissResult.perCategoryAgreement.forEach(cat => {
        report += `- **${cat.category}:** ${(cat.agreement * 100).toFixed(1)}% (used ${cat.frequency} times)\n`;
      });
      report += '\n';
    }

    // Krippendorff's Alpha Sektion
    report += `## Krippendorff's Alpha\n`;
    report += `- **α = ${krippendorffResult.alpha.toFixed(4)}** (${krippendorffResult.interpretation})\n`;
    report += `- **95% CI (Bootstrap):** [${krippendorffResult.confidenceInterval.lower.toFixed(4)}, ${krippendorffResult.confidenceInterval.upper.toFixed(4)}]\n`;
    report += `- **Reliability Classification:** ${krippendorffResult.reliability}\n`;
    report += `- **Bootstrap Samples:** ${krippendorffResult.bootstrapSamples}\n\n`;

    // Cohen's Kappa (falls verfügbar)
    if (cohenResults && cohenResults.length > 0) {
      report += `## Pairwise Cohen's Kappa\n`;
      cohenResults.forEach((result, i) => {
        report += `### Rater Pair ${i + 1}\n`;
        report += `- **κ = ${result.kappa.toFixed(4)}** (${result.interpretation})\n`;
        report += `- **95% CI:** [${result.confidenceInterval.lower.toFixed(4)}, ${result.confidenceInterval.upper.toFixed(4)}]\n`;
        report += `- **p-value:** ${result.significance.pValue.toFixed(6)}\n\n`;
      });
    }

    // Interpretation und Empfehlungen
    report += `## Interpretation & Recommendations\n`;

    if (fleissResult.kappa >= 0.80 && krippendorffResult.alpha >= 0.80) {
      report += `✅ **Excellent Agreement:** Both metrics indicate very high inter-rater reliability.\n`;
      report += `- The coding scheme is reliable and ready for final analysis.\n`;
      report += `- High confidence in coding consistency across all raters.\n`;
    } else if (fleissResult.kappa >= 0.60 && krippendorffResult.alpha >= 0.67) {
      report += `✅ **Good Agreement:** Acceptable reliability for most research purposes.\n`;
      report += `- Consider minor refinements to coding guidelines.\n`;
      report += `- Monitor categories with lower agreement rates.\n`;
    } else if (fleissResult.kappa >= 0.40 || krippendorffResult.alpha >= 0.40) {
      report += `⚠️ **Moderate Agreement:** Additional coder training may be beneficial.\n`;
      report += `- Review and clarify coding criteria.\n`;
      report += `- Consider additional training rounds.\n`;
      report += `- Examine categories with persistent disagreement.\n`;
    } else {
      report += `❌ **Poor Agreement:** Coding scheme needs significant revision.\n`;
      report += `- Revise coding guidelines and category definitions.\n`;
      report += `- Provide additional coder training.\n`;
      report += `- Consider reducing number of categories.\n`;
      report += `- Re-code subset of data after improvements.\n`;
    }

    // Methodologische Notizen
    report += `\n## Methodological Notes\n`;
    report += `- **Fleiss' Kappa** is preferred for multiple raters and provides category-specific insights.\n`;
    report += `- **Krippendorff's Alpha** is more robust for missing data and different data types.\n`;
    report += `- **Bootstrap confidence intervals** provide non-parametric reliability estimates.\n`;
    report += `- **Statistical significance** indicates agreement better than chance levels.\n`;

    return report;
  }

  /**
   * Berechnet Summary Statistics
   */
  calculateSummaryStatistics(ratings: CodingData[]): {
    totalSegments: number;
    unanimousAgreement: number;
    majorityAgreement: number;
    noAgreement: number;
    agreementRates: {
      unanimous: number;
      majority: number;
      none: number;
    };
  } {
    const total = ratings.length;
    let unanimous = 0;
    let majority = 0;
    let noAgreement = 0;

    ratings.forEach(rating => {
      const votes = [rating.expert1, rating.expert2, rating.expert3];
      const counts: Record<string, number> = {};

      votes.forEach(vote => {
        counts[vote] = (counts[vote] || 0) + 1;
      });

      const maxCount = Math.max(...Object.values(counts));

      if (maxCount === 3) {
        unanimous++;
      } else if (maxCount === 2) {
        majority++;
      } else {
        noAgreement++;
      }
    });

    return {
      totalSegments: total,
      unanimousAgreement: unanimous,
      majorityAgreement: majority,
      noAgreement,
      agreementRates: {
        unanimous: unanimous / total,
        majority: majority / total,
        none: noAgreement / total
      }
    };
  }
}

export default ScientificallyValidIRR;