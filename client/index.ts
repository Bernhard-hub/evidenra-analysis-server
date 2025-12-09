/**
 * EVIDENRA Client SDK - Prompt-Only Architecture
 *
 * Drop-in Integration für Basic, Pro, Ultimate und PWA
 *
 * NEUE ARCHITEKTUR:
 * - Server liefert nur geschützte Prompts
 * - App führt KI-Aufrufe selbst durch (AIBridge/Ollama/Claude)
 * - Server berechnet AKIH-Scores aus den Ergebnissen
 *
 * Installation:
 * 1. Kopiere diesen Ordner nach src/services/evidenra-client/
 * 2. Importiere: import { EvidenraClient, useEvidenra } from './services/evidenra-client'
 */

// Core Client
export { EvidenraClient, createEvidenraClient } from './EvidenraClient';
export type {
  EvidenraClientConfig,
  MethodologyPrompts,
  PersonaPrompt,
  AKIHScoreResult
} from './EvidenraClient';

// React Integration
export {
  EvidenraProvider,
  useEvidenra,
  useMethodologyPrompts,
  usePersonaPrompts,
  useAKIHScoring,
  useGenesis
} from './react/EvidenraProvider';

// Version Info
export const SDK_VERSION = '2.0.0';
export const SERVER_URL = 'https://evidenra-analysis-server-production-ad93.up.railway.app';

/**
 * Quick-Start Beispiel (Neue Architektur):
 *
 * ```tsx
 * // In App.tsx
 * import { EvidenraProvider } from './services/evidenra-client';
 *
 * function App() {
 *   const session = useSupabaseSession(); // Dein Auth Hook
 *
 *   return (
 *     <EvidenraProvider
 *       config={{
 *         supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
 *         supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
 *         subscription: 'basic' // oder 'pro', 'ultimate'
 *       }}
 *       accessToken={session?.access_token}
 *     >
 *       <YourApp />
 *     </EvidenraProvider>
 *   );
 * }
 *
 * // In einer Analyse-Komponente
 * import { useMethodologyPrompts, useAKIHScoring } from './services/evidenra-client';
 * import { useAIBridge } from '../AIBridge'; // Dein lokaler AI Service
 *
 * function AnalysisPage() {
 *   const { prompts, fetchPrompts } = useMethodologyPrompts('mayring');
 *   const { calculateScore } = useAKIHScoring();
 *   const aiBridge = useAIBridge();
 *
 *   const handleAnalyze = async (text: string) => {
 *     // 1. Hole geschützte Prompts vom Server
 *     const methodologyPrompts = await fetchPrompts();
 *
 *     // 2. Führe KI-Analyse lokal durch (mit eigenem API Key)
 *     const aiResult = await aiBridge.analyze({
 *       systemPrompt: methodologyPrompts.systemPrompt,
 *       userPrompt: methodologyPrompts.userPromptTemplate.replace('{{text}}', text),
 *       // API Key kommt von User-Einstellungen
 *     });
 *
 *     // 3. Parse das Ergebnis
 *     const codings = JSON.parse(aiResult).codings;
 *
 *     // 4. Berechne AKIH-Score auf dem Server (geschützter Algorithmus)
 *     const score = await calculateScore({
 *       codings,
 *       text,
 *       methodology: 'mayring'
 *     });
 *
 *     console.log('AKIH Score:', score);
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={() => handleAnalyze(documentText)}>
 *         Analyse starten
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 *
 * Unterschied zur alten Architektur:
 * - FRÜHER: Server machte komplette KI-Analyse
 * - JETZT: Server liefert nur Prompts, App macht KI-Analyse mit eigenem Key
 *
 * Vorteile:
 * - User behält Kontrolle über seinen API Key
 * - Funktioniert auch mit lokalen Modellen (Ollama)
 * - Geschützte Prompts sind trotzdem sicher auf dem Server
 * - AKIH-Algorithmus bleibt geschützt
 */
