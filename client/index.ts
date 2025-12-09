/**
 * EVIDENRA Client SDK
 *
 * Drop-in Integration für Basic, Pro, Ultimate und PWA
 *
 * Installation:
 * 1. Kopiere diesen Ordner nach src/services/evidenra-client/
 * 2. Importiere: import { EvidenraClient, useEvidenra } from './services/evidenra-client'
 */

// Core Client
export { EvidenraClient, createEvidenraClient } from './EvidenraClient';
export type {
  EvidenraClientConfig,
  AnalyzeRequest,
  AnalyzeResponse,
  GenesisEvolveRequest,
  GenesisEvolveResponse
} from './EvidenraClient';

// React Integration
export {
  EvidenraProvider,
  useEvidenra,
  useAnalysis,
  usePersonas,
  useGenesis
} from './react/EvidenraProvider';

// Version Info
export const SDK_VERSION = '1.0.0';
export const SERVER_URL = 'https://api.evidenra.app';

/**
 * Quick-Start Beispiel:
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
 * // In einer Komponente
 * import { useAnalysis, useGenesis } from './services/evidenra-client';
 *
 * function AnalysisPage() {
 *   const { runAnalysis, isLoading, result } = useAnalysis();
 *   const { evolve, isAvailable: hasGenesis } = useGenesis();
 *
 *   const handleAnalyze = async () => {
 *     const result = await runAnalysis({
 *       text: "Interview-Text hier...",
 *       methodology: 'mayring',
 *       personas: ['orthodox', 'critical']
 *     });
 *     console.log(result);
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={handleAnalyze} disabled={isLoading}>
 *         {isLoading ? 'Analysiere...' : 'Analyse starten'}
 *       </button>
 *       {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
 *     </div>
 *   );
 * }
 * ```
 */
