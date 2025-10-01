import { JSONPath } from 'jsonpath-plus';
import { variableConfig } from '../variables/VariableConfig';

const store: Record<string, any> = {};
const localStore: Record<string, any> = {};

// --- Variable API ---
export const setVariable = (key: string, value: any, suiteId?: string, suiteName?: string) => {
    store[key] = value;
    
    // Sync with variable config (global variables)
    variableConfig.addVariable({
        name: key,
        value: String(value),
        type: 'global',
        suiteName: suiteName || 'Runtime Suite',
        description: 'Runtime global variable'
    });
};

export const getVariable = (key: string, suiteId?: string, testCaseId?: string) => {
    // First check local store, then global store
    let value = localStore[key] ?? store[key];
    
    // If not found in memory, check variable config
    if (value === undefined && suiteId && testCaseId) {
        const variables = variableConfig.getVariables(suiteId, testCaseId);
        const localVar = variables.local.find(v => v.name === key);
        const globalVar = variables.global.find(v => v.name === key);
        
        if (localVar) {
            value = localVar.value;
            localStore[key] = value; // Cache in memory
        } else if (globalVar) {
            value = globalVar.value;
            store[key] = value; // Cache in memory
        }
    }
    
    return value;
};

export const clearVariables = () => {
    Object.keys(store).forEach(key => delete store[key]);
};

// --- Local Variable API ---
export const setLocalVariable = (key: string, value: any, suiteId?: string, testCaseId?: string, suiteName?: string, testCaseName?: string) => {
    localStore[key] = value;
    
    // Sync with variable config (local variables)
    if (suiteId && testCaseId) {
        variableConfig.addVariable({
            name: key,
            value: String(value),
            type: 'local',
            suiteId,
            testCaseId,
            suiteName: suiteName || 'Runtime Suite',
            testCaseName: testCaseName || 'Runtime Test Case',
            description: 'Runtime local variable'
        });
    }
};

export const getLocalVariable = (key: string) => localStore[key];

export const clearLocalVariables = () => {
    Object.keys(localStore).forEach(key => delete localStore[key]);
    // Note: variableConfig cleanup is handled by executor
};

export const injectVariables = (input: string, suiteId?: string, testCaseId?: string): string => {
    return input.replace(/\{\{(.*?)\}\}/g, (_, key) => {
        const trimmedKey = key.trim();
        
        // First check local store, then global store
        let value = localStore[trimmedKey] ?? store[trimmedKey];
        
        // If not found in memory, check variable config
        if (value === undefined && suiteId) {
            const variables = variableConfig.getVariables(suiteId, testCaseId);
            const localVar = variables.local.find(v => v.name === trimmedKey);
            const globalVar = variables.global.find(v => v.name === trimmedKey);
            
            if (localVar) {
                value = localVar.value;
                localStore[trimmedKey] = value; // Cache in memory
            } else if (globalVar) {
                value = globalVar.value;
                store[trimmedKey] = value; // Cache in memory
            }
        }
        
        return typeof value === 'undefined' ? '' : value;
    });
};

// --- Response Variable Storage ---
type SimpleStoreMap = Record<string, string>;
type ArrayObjectMatchStore = {
    type: 'arrayObjectMatch';
    jsonPath: string;
    matchField: string;
    matchValue: string;
    extractField: string;
    variableName: string;
};

type StoreEntry = SimpleStoreMap | ArrayObjectMatchStore[];

/**
 * Stores variables from API response using either key-path map or arrayObjectMatch list
 */
export const storeResponseVariables = (response: any, storeConfig: StoreEntry, useLocal: boolean = false, suiteId?: string, testCaseId?: string, suiteName?: string, testCaseName?: string) => {
    const storeFunction = useLocal ? 
        (key: string, value: any) => setLocalVariable(key, value, suiteId, testCaseId, suiteName, testCaseName) :
        (key: string, value: any) => setVariable(key, value, suiteId, suiteName);
    
    // Handle key-value simple object
    if (!Array.isArray(storeConfig)) {
        for (const key in storeConfig) {
            const val = JSONPath({ path: storeConfig[key], json: response })[0];
            if (val !== undefined) {
                storeFunction(key, val);
            }
        }
    } else {
        for (const entry of storeConfig) {
            if (entry.type === 'arrayObjectMatch') {
                const array = JSONPath({ path: entry.jsonPath, json: response })[0];

                if (!Array.isArray(array)) {
                    throw new Error(`store: ${entry.jsonPath} did not return an array`);
                }

                const match = array.find((item: any) => item[entry.matchField] === entry.matchValue);
                if (!match) {
                    throw new Error(`store: No item in ${entry.jsonPath} with ${entry.matchField} = '${entry.matchValue}'`);
                }

                storeFunction(entry.variableName, match[entry.extractField]);
            } else {
                throw new Error(`Unsupported store type in array: ${(entry as any).type}`);
            }
        }
    }
};
