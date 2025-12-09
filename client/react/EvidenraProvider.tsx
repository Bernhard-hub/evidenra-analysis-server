/**
 * EVIDENRA React Provider - Prompt-Only Architecture
 *
 * Für Integration in Basic, Pro, Ultimate und PWA
 *
 * Der Provider:
 * 1. Holt geschützte Prompts vom Server
 * 2. Stellt sie der App zur Verfügung für lokale KI-Aufrufe
 * 3. Sendet Ergebnisse zur AKIH-Bewertung
 */

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { EvidenraClient, EvidenraClientConfig, MethodologyPrompts, PersonaPrompt, AKIHScoreResult } from '../EvidenraClient';

interface EvidenraContextType {
  client: EvidenraClient | null;
  isReady: boolean;
  isAuthenticated: boolean;
  subscription: string;
  error: string | null;

  // Prompt Fetching
  getMethodologyPrompts: (methodology: string, options?: any) => Promise<MethodologyPrompts>;
  getPersonaPrompts: () => Promise<Record<string, PersonaPrompt>>;
  getGenesisConfig: () => Promise<any>;

  // Scoring
  calculateAKIHScore: (data: any) => Promise<AKIHScoreResult>;
  getAKIHDimensions: () => Promise<any>;

  // Feature Check
  hasFeature: (feature: string) => boolean;
  getSubscriptionFeatures: () => any;
  getPersonaList: () => Promise<any>;
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
  const getMethodologyPrompts = useCallback(async (methodology: string, options?: any) => {
    if (!client) throw new Error('Client not initialized');
    return client.getMethodologyPrompts(methodology as any, options);
  }, [client]);

  const getPersonaPrompts = useCallback(async () => {
    if (!client) throw new Error('Client not initialized');
    return client.getPersonaPrompts();
  }, [client]);

  const getGenesisConfig = useCallback(async () => {
    if (!client) throw new Error('Client not initialized');
    return client.getGenesisConfig();
  }, [client]);

  const calculateAKIHScore = useCallback(async (data: any) => {
    if (!client) throw new Error('Client not initialized');
    return client.calculateAKIHScore(data);
  }, [client]);

  const getAKIHDimensions = useCallback(async () => {
    if (!client) throw new Error('Client not initialized');
    return client.getAKIHDimensions();
  }, [client]);

  const hasFeature = useCallback((feature: string) => {
    if (!client) return false;
    return client.hasFeature(feature as any);
  }, [client]);

  const getSubscriptionFeatures = useCallback(() => {
    if (!client) return null;
    return client.getSubscriptionFeatures();
  }, [client]);

  const getPersonaList = useCallback(async () => {
    if (!client) throw new Error('Client not initialized');
    return client.getPersonaList();
  }, [client]);

  const value: EvidenraContextType = {
    client,
    isReady,
    isAuthenticated,
    subscription: config.subscription,
    error,
    getMethodologyPrompts,
    getPersonaPrompts,
    getGenesisConfig,
    calculateAKIHScore,
    getAKIHDimensions,
    hasFeature,
    getSubscriptionFeatures,
    getPersonaList
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
 * Hook für Methodologie-Prompts
 * Holt die geschützten Prompts für eine bestimmte Methodologie
 */
export function useMethodologyPrompts(methodology: 'mayring' | 'grounded-theory' | 'thematic' | 'discourse') {
  const { getMethodologyPrompts, isReady, isAuthenticated } = useEvidenra();

  const [prompts, setPrompts] = useState<MethodologyPrompts | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrompts = useCallback(async (options?: { approach?: string }) => {
    if (!isReady || !isAuthenticated) {
      setError('Nicht bereit oder nicht authentifiziert');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getMethodologyPrompts(methodology, options);
      setPrompts(result);
      return result;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getMethodologyPrompts, methodology, isReady, isAuthenticated]);

  return {
    prompts,
    fetchPrompts,
    isLoading,
    error,
    isReady,
    isAuthenticated
  };
}

/**
 * Hook für Persona-Prompts
 */
export function usePersonaPrompts() {
  const { getPersonaPrompts, getPersonaList, hasFeature, isReady, isAuthenticated } = useEvidenra();

  const [prompts, setPrompts] = useState<Record<string, PersonaPrompt>>({});
  const [personaList, setPersonaList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAvailable = hasFeature('personas');

  const fetchPrompts = useCallback(async () => {
    if (!isAvailable || !isReady || !isAuthenticated) return;

    setIsLoading(true);
    setError(null);

    try {
      const [promptsResult, listResult] = await Promise.all([
        getPersonaPrompts(),
        getPersonaList()
      ]);
      setPrompts(promptsResult);
      setPersonaList(listResult);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [getPersonaPrompts, getPersonaList, isAvailable, isReady, isAuthenticated]);

  useEffect(() => {
    if (isReady && isAuthenticated && isAvailable) {
      fetchPrompts();
    }
  }, [isReady, isAuthenticated, isAvailable, fetchPrompts]);

  return {
    prompts,
    personaList,
    fetchPrompts,
    isLoading,
    error,
    isAvailable
  };
}

/**
 * Hook für AKIH Scoring
 */
export function useAKIHScoring() {
  const { calculateAKIHScore, getAKIHDimensions, hasFeature, isReady, isAuthenticated } = useEvidenra();

  const [dimensions, setDimensions] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAvailable = hasFeature('akih');

  // Lade Dimensionen beim Start
  useEffect(() => {
    if (isReady && isAuthenticated && isAvailable) {
      getAKIHDimensions()
        .then(setDimensions)
        .catch((err) => setError(err.message));
    }
  }, [isReady, isAuthenticated, isAvailable, getAKIHDimensions]);

  const calculateScore = useCallback(async (data: {
    codings: any[];
    text: string;
    methodology?: string;
    categories?: any[];
  }): Promise<AKIHScoreResult | null> => {
    if (!isAvailable) {
      setError('AKIH Scoring requires Basic or higher subscription');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await calculateAKIHScore(data);
      return result;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [calculateAKIHScore, isAvailable]);

  return {
    calculateScore,
    dimensions,
    isLoading,
    error,
    isAvailable
  };
}

/**
 * Hook für Genesis Engine
 */
export function useGenesis() {
  const { getGenesisConfig, hasFeature, isReady, isAuthenticated } = useEvidenra();

  const [config, setConfig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAvailable = hasFeature('genesis');

  const fetchConfig = useCallback(async () => {
    if (!isAvailable) {
      setError('Genesis Engine requires Basic or higher subscription');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getGenesisConfig();
      setConfig(result);
      return result;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getGenesisConfig, isAvailable]);

  useEffect(() => {
    if (isReady && isAuthenticated && isAvailable) {
      fetchConfig();
    }
  }, [isReady, isAuthenticated, isAvailable, fetchConfig]);

  return {
    config,
    fetchConfig,
    isLoading,
    error,
    isAvailable
  };
}

export default EvidenraProvider;
