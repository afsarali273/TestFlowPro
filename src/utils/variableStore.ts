const store: Record<string, any> = {};

export const setVariable = (key: string, value: any) => {
    store[key] = value;
};

export const getVariable = (key: string) => store[key];

export const injectVariables = (input: string): string => {
    return input.replace(/\{\{(.*?)\}\}/g, (_, key) => getVariable(key.trim()) || "");
};
