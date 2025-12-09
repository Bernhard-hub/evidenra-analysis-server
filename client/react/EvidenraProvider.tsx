/**
 * EVIDENRA React Provider
 *
 * Für Integration in Basic, Pro, Ultimate und PWA
 */

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { EvidenraClient, EvidenraClientConfig, AnalyzeRequest, AnalyzeResponse } from '../EvidenraClient';

interface EvidenraContextType {
  client: EvidenraClient | null;
  isReady: boolean;
  isAuthenticated: boolean;
  subscription: string;
  error: string | null;

  // Analyse
  analyze: (request: AnalyzeRequest) => Promise<AnalyzeResponse>;
  calculateAKIHScore: (data: any) => Promise<any>;
  generateCategories: (data: any) => Promise<any>;

  // Personas
  analyzeWithPersonas: (data: any) => Promise<any>;
  getAvailablePersonas: () => Promise<any>;

  // Genesis
  evolvePrompt: (data: any) => Promise<any>;

  // Feature Check
  hasFeature: (feature: string) => boolean;
  getSubscriptionFeatures: () => any;
}

const EvidenraContext = createContext<EvidenraContextType | null>(null);

interface EvidenraProviderProps {
  children: ReactNode;
  config: Omit<EvidenraClientConfig, 'onAuthError'>;
  accessToken?: string;
  onAuthError?: () => void;
}

export function EvidenraProvider({
  children,
  config,
  accessToken,
  onAuthError
}: EvidenraProviderProps) {
  const [client, setClient] = useState<EvidenraClient | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialisiere Client
  useEffect(() => {
    const evidenraClient = new EvidenraClient({
      ...config,
      onAuthError: () => {
        setIsAuthenticated(false);
        onAuthError?.();
      }
    });

    setClient(evidenraClient);

    // Health Check
    evidenraClient.healthCheck()
      .then(() => {
        setIsReady(true);
        setError(null);
      })
      .catch((err) => {
        setError('Server nicht erreichbar: ' + err.message);
        setIsReady(false);
      });
  }, [config.serverUrl, config.supabaseUrl]);

  // Access Token setzen
  useEffect(() => {
    if (client && accessToken) {
      client.setAccessToken(accessToken);
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, [client, accessToken]);

  // Subscription aktualisieren
  useEffect(() => {
    if (client) {
      client.setSubscription(config.subscription);
    }
  }, [client, config.subscription]);

  // Wrapped Methods
  const analyze = useCallback(async (request: AnalyzeRequest) => {
    if (!client) throw new Error('Client not initialized');
    return client.analyze(request);
  }, [client]);

  const calculateAKIHScore = useCallback(async (data: any) => {
    if (!client) throw new Error('Client not initialized');
    return client.calculateAKIHScore(data);
  }, [client]);

  const generateCategories = useCallback(async (data: any) => {
    if (!client) throw new Error('Client not initialized');
    return client.generateCategories(data);
  }, [client]);

  const analyzeWithPersonas = useCallback(async (data: any) => {
    if (!client) throw new Error('Client not initialized');
    return client.analyzeWithPersonas(data);
  }, [client]);

  const getAvailablePersonas = useCallback(async () => {
    if (!client) throw new Error('Client not initialized');
    return client.getAvailablePersonas();
  }, [client]);

  const evolvePrompt = useCallback(async (data: any) => {
    if (!client) throw new Error('Client not initialized');
    return client.evolvePrompt(data);
  }, [client]);

  const hasFeature = useCallback((feature: string) => {
    if (!client) return false;
    return client.hasFeature(feature as any);
  }, [client]);

  const getSubscriptionFeatures = useCallback(() => {
    if (!client) return null;
    return client.getSubscriptionFeatures();
  }, [client]);

  const value: EvidenraContextType = {
    client,
    isReady,
    isAuthenticated,
    subscription: config.subscription,
    error,
    analyze,
    calculateAKIHScore,
    generateCategories,
    analyzeWithPersonas,
    getAvailablePersonas,
    evolvePrompt,
    hasFeature,
    getSubscriptionFeatures
  };

  return (
    <EvidenraContext.Provider value={value}>
      {children}
    </EvidenraContext.Provider>
  );
}

/**
 * Hook für Zugriff auf EVIDENRA Context
 */
export function useEvidenra(): EvidenraContextType {
  const context = useContext(EvidenraContext);
  if (!context) {
    throw new Error('useEvidenra must be used within an EvidenraProvider');
  }
  return context;
}

/**
 * Hook für Analyse
 */
export function useAnalysis() {
  const { analyze, calculateAKIHScore, generateCategories, isReady, isAuthenticated, error } = useEvidenra();

  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeResponse | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const runAnalysis = useCallback(async (request: AnalyzeRequest) => {
    if (!isReady || !isAuthenticated) {
      setAnalysisError('Nicht bereit oder nicht authentifiziert');
      return null;
    }

    setIsLoading(true);
    setAnalysisError(null);

    try {
      const result = await analyze(request);
      setAnalysisResult(result);
      return result;
    } catch (err: any) {
      setAnalysisError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [analyze, isReady, isAuthenticated]);

  return {
    runAnalysis,
    calculateAKIHScore,
    generateCategories,
    isLoading,
    result: analysisResult,
    error: analysisError || error,
    isReady,
    isAuthenticated
  };
}

/**
 * Hook für Personas
 */
export function usePersonas() {
  const { analyzeWithPersonas, getAvailablePersonas, hasFeature, isReady, isAuthenticated } = useEvidenra();

  const [personas, setPersonas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAvailable = hasFeature('personas');

  const loadPersonas = useCallback(async () => {
    if (!isAvailable || !isReady) return;

    try {
      const available = await getAvailablePersonas();
      setPersonas(available);
    } catch (err: any) {
      setError(err.message);
    }
  }, [getAvailablePersonas, isAvailable, isReady]);

  useEffect(() => {
    if (isReady && isAuthenticated && isAvailable) {
      loadPersonas();
    }
  }, [isReady, isAuthenticated, isAvailable, loadPersonas]);

  const analyze = useCallback(async (text: string, selectedPersonas: string[]) => {
    if (!isAvailable) {
      setError('Personas require Pro or higher subscription');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      return await analyzeWithPersonas({ text, personas: selectedPersonas });
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [analyzeWithPersonas, isAvailable]);

  return {
    personas,
    analyze,
    isLoading,
    error,
    isAvailable
  };
}

/**
 * Hook für Genesis Engine
 */
export function useGenesis() {
  const { evolvePrompt, hasFeature, isReady, isAuthenticated } = useEvidenra();

  const [isEvolving, setIsEvolving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const isAvailable = hasFeature('genesis');

  const evolve = useCallback(async (prompt: string, options?: {
    fitness?: 'quality' | 'speed' | 'accuracy';
    generations?: number;
    populationSize?: number;
  }) => {
    if (!isAvailable) {
      setError('Genesis Engine requires Pro or higher subscription');
      return null;
    }

    setIsEvolving(true);
    setProgress(0);
    setError(null);

    try {
      const result = await evolvePrompt({
        prompt,
        ...options
      });

      setProgress(100);
      return result;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsEvolving(false);
    }
  }, [evolvePrompt, isAvailable]);

  return {
    evolve,
    isEvolving,
    progress,
    error,
    isAvailable
  };
}

export default EvidenraProvider;
