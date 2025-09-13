import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const projectRoot = path.resolve(process.cwd(), '../../');
    const files = await fs.readdir(projectRoot);
    
    const envFiles = files
      .filter(file => file.startsWith('.env.') && file !== '.env.example')
      .map(file => file.replace('.env.', ''));
    
    return NextResponse.json({ environments: envFiles });
  } catch (error) {
    console.error('Error reading environment files:', error);
    return NextResponse.json({ environments: [] });
  }
}