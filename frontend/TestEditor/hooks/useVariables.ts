import { useState, useCallback } from 'react';

export interface Variable {
  name: string;
  value: string;
  type: 'global' | 'local';
  suiteId?: string;
  testCaseId?: string;
  suiteName?: string;
  testCaseName?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VariableConflict {
  exists: boolean;
  conflictType: 'global' | 'local' | 'both';
  existingVariable?: Variable;
  suggestedName?: string;
}

export function useVariables() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkConflict = useCallback(async (name: string, suiteId?: string, testCaseId?: string): Promise<VariableConflict> => {
    try {
      setLoading(true);
      setError(null);
      
      const frameworkPath = localStorage.getItem('frameworkPath');
      const response = await fetch('/api/variables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check-conflict',
          name,
          suiteId,
          testCaseId,
          frameworkPath
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to check variable conflict');
      }
      
      return await response.json();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const addVariable = useCallback(async (variable: {
    name: string;
    value: string;
    type: 'global' | 'local';
    suiteId?: string;
    testCaseId?: string;
    suiteName?: string;
    testCaseName?: string;
    description?: string;
  }, forceOverride?: boolean): Promise<{ success: boolean; error?: string; conflict?: VariableConflict }> => {
    try {
      setLoading(true);
      setError(null);
      
      const frameworkPath = localStorage.getItem('frameworkPath');
      const response = await fetch('/api/variables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          ...variable,
          frameworkPath,
          forceOverride
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        return { success: false, error: result.error, conflict: result.conflict };
      }
      
      return { success: true };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  const getVariables = useCallback(async (suiteId?: string, testCaseId?: string): Promise<{ global: Variable[]; local: Variable[] }> => {
    try {
      setLoading(true);
      setError(null);
      
      const frameworkPath = localStorage.getItem('frameworkPath');
      const params = new URLSearchParams();
      if (suiteId) params.set('suiteId', suiteId);
      if (testCaseId) params.set('testCaseId', testCaseId);
      if (frameworkPath) params.set('frameworkPath', frameworkPath);
      
      const url = `/api/variables?${params.toString()}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to get variables');
      }
      
      return await response.json();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteVariable = useCallback(async (name: string, suiteId?: string, testCaseId?: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const frameworkPath = localStorage.getItem('frameworkPath');
      const params = new URLSearchParams({ name });
      if (suiteId) params.set('suiteId', suiteId);
      if (testCaseId) params.set('testCaseId', testCaseId);
      if (frameworkPath) params.set('frameworkPath', frameworkPath);
      
      const url = `/api/variables?${params.toString()}`;
      const response = await fetch(url, { method: 'DELETE' });
      
      return response.ok;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const cleanupSuiteVariables = useCallback(async (suiteId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const frameworkPath = localStorage.getItem('frameworkPath');
      const params = new URLSearchParams({ action: 'cleanup-suite', suiteId });
      if (frameworkPath) params.set('frameworkPath', frameworkPath);
      
      const response = await fetch(`/api/variables?${params.toString()}`, {
        method: 'DELETE'
      });
      
      return response.ok;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const cleanupTestCaseVariables = useCallback(async (suiteId: string, testCaseId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const frameworkPath = localStorage.getItem('frameworkPath');
      const params = new URLSearchParams({ action: 'cleanup-testcase', suiteId, testCaseId });
      if (frameworkPath) params.set('frameworkPath', frameworkPath);
      
      const response = await fetch(`/api/variables?${params.toString()}`, {
        method: 'DELETE'
      });
      
      return response.ok;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const cleanupAllLocalVariables = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const frameworkPath = localStorage.getItem('frameworkPath');
      const params = new URLSearchParams({ action: 'cleanup-all-local' });
      if (frameworkPath) params.set('frameworkPath', frameworkPath);
      
      const response = await fetch(`/api/variables?${params.toString()}`, {
        method: 'DELETE'
      });
      
      return response.ok;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const injectVariables = useCallback(async (
    input: string,
    suiteId?: string,
    testCaseId?: string,
    memoryVariables?: Record<string, any>
  ): Promise<string> => {
    if (!input || typeof input !== 'string') return input;

    let configVariables: { global: Variable[]; local: Variable[] } = { global: [], local: [] };
    
    if (suiteId) {
      try {
        configVariables = await getVariables(suiteId, testCaseId);
      } catch (error) {
        console.warn('Failed to fetch variables:', error);
      }
    }

    const variableMap = new Map<string, string>();
    
    if (memoryVariables) {
      Object.entries(memoryVariables).forEach(([key, value]) => {
        variableMap.set(key, String(value));
      });
    }
    
    configVariables.global.forEach(variable => {
      variableMap.set(variable.name, variable.value);
    });
    
    configVariables.local.forEach(variable => {
      variableMap.set(variable.name, variable.value);
    });

    return input.replace(/\{\{(.*?)\}\}/g, (match, variableName) => {
      const value = variableMap.get(variableName.trim());
      return value !== undefined ? value : match;
    });
  }, [getVariables]);

  return {
    loading,
    error,
    checkConflict,
    addVariable,
    getVariables,
    deleteVariable,
    cleanupSuiteVariables,
    cleanupTestCaseVariables,
    cleanupAllLocalVariables,
    injectVariables
  };
}