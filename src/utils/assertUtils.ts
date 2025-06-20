import { JSONPath } from 'jsonpath-plus';
import { Assertion } from '../types';

export function assertJson(response: any, statusCode: number, assertions: Assertion[]) {
    for (const a of assertions) {
        const { type, jsonPath, expected } = a;

        let result;
        if (jsonPath) {
            result = JSONPath({ path: jsonPath, json: response })[0];
        }

        switch (type) {
            case 'equals':
                if (result !== expected) throw new Error(`Assertion failed: ${jsonPath} expected ${expected}, got ${result}`);
                break;

            case 'notEquals':
                if (result === expected) throw new Error(`Assertion failed: ${jsonPath} should not equal ${expected}`);
                break;

            case 'contains':
                if (typeof result === 'string') {
                    if (!result.includes(expected)) throw new Error(`Assertion failed: ${jsonPath} does not contain ${expected}`);
                } else if (Array.isArray(result)) {
                    if (!result.includes(expected)) throw new Error(`Assertion failed: ${jsonPath} array does not contain ${expected}`);
                } else {
                    throw new Error(`'contains' only supports string or array`);
                }
                break;

            case 'size':
                const size = Array.isArray(result) ? result.length : Object.keys(result || {}).length;
                if (size !== expected) throw new Error(`Assertion failed: ${jsonPath} size expected ${expected}, got ${size}`);
                break;

            case 'statusCode':
                if (statusCode !== expected) throw new Error(`Assertion failed: statusCode expected ${expected}, got ${statusCode}`);
                break;

            case 'type':
                if (typeof result !== expected) throw new Error(`Assertion failed: ${jsonPath} type expected ${expected}, got ${typeof result}`);
                break;

            case 'exists':
                if (typeof result === 'undefined') throw new Error(`Assertion failed: ${jsonPath} does not exist`);
                break;

            case 'regex':
                if (!new RegExp(expected).test(result)) throw new Error(`Assertion failed: ${jsonPath} does not match regex ${expected}`);
                break;

            default:
                throw new Error(`Unsupported assertion type: ${type}`);
        }
    }
}
