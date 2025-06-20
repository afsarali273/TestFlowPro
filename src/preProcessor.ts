import { faker } from '@faker-js/faker';
import { setVariable } from './utils/variableStore';
import crypto from 'crypto';

interface PreProcessStep {
    var: string;
    function: string;
    args?: any[];
}

export async function runPreProcessors(steps: PreProcessStep[]) {
    for (const step of steps) {
        let value: any;

        switch (step.function) {
            case 'faker.email':
                value = faker.internet.email();
                break;
            case 'faker.uuid':
                //value = faker.datatype.uuid();
                break;
            case 'faker.username':
                value = faker.internet.userName();
                break;
            case 'date.now':
                value = Date.now().toString();
                break;
            case 'encrypt':
                const [text] = step.args || [];
                const cipher = crypto.createCipheriv(
                    'aes-256-ctr',
                    'My32charPassword1234567890abcdef', // Key: 32 chars
                    '1234567890123456' // IV: 16 chars
                );
                value = cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
                break;
            case 'authToken':
                const [user] = step.args || [];
                //const token = await auth.generateToken(user.id);
                //value = token;
                break;
            default:
                console.warn(`⚠️ Unknown preProcess function: ${step.function}`);
                value = '';
        }

        setVariable(step.var, value);
        console.log(`🔧 PreProcess: ${step.var} = ${value}`);
    }
}
