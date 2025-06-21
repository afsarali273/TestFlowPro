// utils/soapUtils.ts
import axios from 'axios';
import fs from 'fs';
import { XMLParser } from 'fast-xml-parser';
import { DOMParser } from 'xmldom';
import xpath from 'xpath';
import { injectVariables } from './variableStore';

export async function sendSoapRequest(
    url: string,
    bodyXml: string,
    headers: Record<string, string>
): Promise<any> {
    const defaultHeaders = {
        'Content-Type': 'text/xml;charset=UTF-8',
        ...headers,
    };

    const res = await axios.post(url, bodyXml, { headers: defaultHeaders });
    return res.data;
}

export function parseXmlToJson(xml: string): any {
    const parser = new XMLParser({ ignoreAttributes: false });
    return parser.parse(xml);
}

export function evaluateXPath(xmlString: string, xpathQuery: string): string | null {
    const doc = new DOMParser().parseFromString(xmlString);
    const nodes = xpath.select(xpathQuery, doc);
    // @ts-ignore
    return nodes != null && nodes[0]?.textContent || null;
}
