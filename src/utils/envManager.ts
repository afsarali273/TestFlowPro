import dotenv from 'dotenv';
import path from 'path';

export function loadEnvironment() {
    dotenv.config(); // loads `.env`
    const envName = process.env.ENV || 'qa';

    dotenv.config({ path: path.resolve(process.cwd(), `.env.${envName}`) });

    return {
        baseUrl: process.env.BASE_URL || ''
    };
}
