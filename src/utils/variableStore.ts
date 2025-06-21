import { JSONPath } from 'jsonpath-plus';

const store: Record<string, any> = {};

// --- Variable API ---
export const setVariable = (key: string, value: any) => {
    store[key] = value;
};

export const getVariable = (key: string) => store[key];

export const clearVariables = () => {
    Object.keys(store).forEach(key => delete store[key]);
};

export const injectVariables = (input: string): string => {
    return input.replace(/\{\{(.*?)\}\}/g, (_, key) => {
        const value = getVariable(key.trim());
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
export const storeResponseVariables = (response: any, storeConfig: StoreEntry) => {
    // Handle key-value simple object
    if (!Array.isArray(storeConfig)) {
        for (const key in storeConfig) {
            const val = JSONPath({ path: storeConfig[key], json: response })[0];
            if (val !== undefined) {
                setVariable(key, val);
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

                setVariable(entry.variableName, match[entry.extractField]);
            } else {
                throw new Error(`Unsupported store type in array: ${(entry as any).type}`);
            }
        }
    }
};
