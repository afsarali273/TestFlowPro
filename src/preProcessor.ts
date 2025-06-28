import { faker } from '@faker-js/faker';
import { setVariable } from './utils/variableStore';
import crypto from 'crypto';
import {runQuery} from "./db/dbClient";

interface PreProcessStep {
    var?: string; // Optional, only for single output
    function: string;
    args?: any[];
    db?: string;
    mapTo?: Record<string, string>; // key = variable name, value = key in returned object
}

export async function runPreProcessors(steps: PreProcessStep[]) {
    for (const step of steps) {
        let value: any;

        switch (step.function) {
            case 'faker.email':
                value = faker.internet.email();
                break;
            case 'faker.username':
                value = faker.internet.userName();
                break;
            case 'faker.uuid':
                //value = faker.datatype.uuid();
                break;
            case 'date.now':
                value = Date.now().toString();
                break;
            case 'encrypt':
                const [text] = step.args || [];
                const cipher = crypto.createCipheriv(
                    'aes-256-ctr',
                    'My32charPassword1234567890abcdef',
                    '1234567890123456'
                );
                value = cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
                break;

            //    // Example usage
            //     {
            //   "function": "generateUser",
            //   "mapTo": {
            //     "userEmail": "email",
            //     "userName": "username"
            //   }
            // }
            case 'generateUser':
                value = {
                    username: faker.internet.userName(),
                    email: faker.internet.email(),
                    //uuid: faker.datatype.uuid()
                };
                break;

            case 'dbQuery':
                const [query] = step.args || [];
                const dbName = step.db;
                if (!dbName) throw new Error(`Missing 'db' field for dbQuery preProcess`);

                const rows = await runQuery(query, dbName);

                if (rows.length === 0) {
                    console.warn(`⚠️ No result from DB query on ${dbName}: ${query}`);
                    value = '';
                    break;
                }

                value = rows[0];
                break;

            default:
                console.warn(`⚠️ Unknown preProcess function: ${step.function}`);
                value = '';
        }

        if (step.mapTo && typeof value === 'object') {
            for (const [targetVar, keyInValue] of Object.entries(step.mapTo)) {
                if (value.hasOwnProperty(keyInValue)) {
                    setVariable(targetVar, value[keyInValue]);
                    console.log(`🔧 PreProcess (mapTo): ${targetVar} = ${value[keyInValue]}`);
                } else {
                    console.warn(`⚠️ mapTo key "${keyInValue}" not found in function output`);
                }
            }
        } else if (value && typeof value === 'object' && !Array.isArray(value) && !step.var) {
            for (const [k, v] of Object.entries(value)) {
                setVariable(k, v);
                console.log(`🔧 PreProcess (multi): ${k} = ${v}`);
            }
        } else {
            setVariable(step.var || step.function, value);
            console.log(`🔧 PreProcess: ${step.var || step.function} = ${value}`);
        }
    }
}
