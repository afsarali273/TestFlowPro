import fs from 'fs';
import path from 'path';
import { injectVariables } from './variableStore';

export function loadRequestBody(bodyFile?: string, body?: any, isSoap = false, suiteId?: string, testCaseId?: string): any {
    if (bodyFile) {
        const bodyFilePath = path.normalize(path.resolve(__dirname, '../', bodyFile));
        const raw = fs.readFileSync(bodyFilePath, 'utf-8');
        const injected = injectVariables(raw, suiteId, testCaseId);
        return isSoap ? injected : JSON.parse(injected);
    }

    if (body) {
        const injected = injectVariables(typeof body === 'string' ? body : JSON.stringify(body), suiteId, testCaseId);
        return isSoap ? injected : JSON.parse(injected);
    }

    return undefined;
}
