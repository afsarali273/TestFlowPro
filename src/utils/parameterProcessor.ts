import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

export interface ParameterSet {
    [key: string]: any;
}

export function loadParameterData(dataSource: any): ParameterSet[] {
    if (!dataSource || dataSource.type === 'inline') {
        return dataSource?.data || [];
    }

    if (dataSource.type === 'csv' && dataSource.filePath) {
        const resolvedPath = path.resolve(dataSource.filePath);
        const csvContent = fs.readFileSync(resolvedPath, 'utf-8');
        return parse(csvContent, { columns: true, skip_empty_lines: true });
    }

    if (dataSource.type === 'json' && dataSource.filePath) {
        const resolvedPath = path.resolve(dataSource.filePath);
        const jsonContent = fs.readFileSync(resolvedPath, 'utf-8');
        return JSON.parse(jsonContent);
    }

    return [];
}

export function injectParameters(template: string, parameters: ParameterSet): string {
    let result = template;
    
    for (const [key, value] of Object.entries(parameters)) {
        const regex = new RegExp(`{{param\\.${key}}}`, 'g');
        result = result.replace(regex, String(value));
    }
    
    return result;
}

export function injectParametersInObject(obj: any, parameters: ParameterSet): any {
    if (typeof obj === 'string') {
        return injectParameters(obj, parameters);
    }
    
    if (Array.isArray(obj)) {
        return obj.map(item => injectParametersInObject(item, parameters));
    }
    
    if (obj && typeof obj === 'object') {
        const result: any = {};
        for (const [key, value] of Object.entries(obj)) {
            result[key] = injectParametersInObject(value, parameters);
        }
        return result;
    }
    
    return obj;
}