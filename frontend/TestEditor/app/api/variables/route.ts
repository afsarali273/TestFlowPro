import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface Variable {
  name: string;
  value: string;
  type: 'global' | 'local';
  suiteId?: string;
  testCaseId?: string;
  suiteName?: string;
  testCaseName?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

class VariableConfig {
  private configPath: string;
  private variables: Variable[] = [];

  constructor(frameworkPath?: string | null) {
    const basePath = frameworkPath || path.join(process.cwd(), '../../');
    this.configPath = path.join(basePath, 'src/variables/variables-config.json');
    this.loadConfig();
  }

  private loadConfig(): void {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf8');
        this.variables = JSON.parse(data);
      }
    } catch (error) {
      console.warn('Failed to load variable config:', error);
      this.variables = [];
    }
  }

  private saveConfig(): void {
    try {
      console.log('Saving to path:', this.configPath);
      console.log('Variables to save:', this.variables);
      fs.writeFileSync(this.configPath, JSON.stringify(this.variables, null, 2));
      console.log('Successfully saved variables config');
    } catch (error) {
      console.error('Failed to save variable config:', error);
    }
  }

  checkConflict(name: string, suiteId?: string, testCaseId?: string) {
    const globalVar = this.variables.find(v => v.name === name && v.type === 'global');
    const localVar = (suiteId && testCaseId) ? 
      this.variables.find(v => v.name === name && v.type === 'local' && v.suiteId === suiteId && v.testCaseId === testCaseId) : null;
    
    if (globalVar && localVar) {
      return { exists: true, conflictType: 'both', existingVariable: globalVar };
    }
    if (globalVar) {
      return { exists: true, conflictType: 'global', existingVariable: globalVar };
    }
    if (localVar) {
      return { exists: true, conflictType: 'local', existingVariable: localVar };
    }
    return { exists: false, conflictType: 'global' };
  }

  addVariable(variable: Omit<Variable, 'createdAt' | 'updatedAt'>, forceOverride?: boolean) {
    const conflict = this.checkConflict(variable.name, variable.suiteId, variable.testCaseId);
    
    if (conflict.exists && !forceOverride) {
      return { success: false, conflict, error: `Variable '${variable.name}' already exists` };
    }
    
    if (conflict.exists && forceOverride) {
      this.deleteVariable(variable.name, variable.suiteId, variable.testCaseId);
    }
    
    const newVariable: Variable = {
      ...variable,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.variables.push(newVariable);
    this.saveConfig();
    return { success: true };
  }

  deleteVariable(name: string, suiteId?: string, testCaseId?: string): boolean {
    console.log('Deleting variable:', { name, suiteId, testCaseId });
    
    // For global variables, just match by name and type
    // For local variables, match by name, type, suiteId, and testCaseId
    const index = this.variables.findIndex(v => {
      if (v.name === name) {
        if (v.type === 'global') {
          return true; // Global variables are matched by name only
        } else if (v.type === 'local' && suiteId && testCaseId) {
          return v.suiteId === suiteId && v.testCaseId === testCaseId;
        }
      }
      return false;
    });
    
    console.log('Found variable at index:', index);
    
    if (index === -1) {
      console.log('Variable not found');
      return false;
    }
    
    this.variables.splice(index, 1);
    console.log('Variable deleted, saving config');
    this.saveConfig();
    return true;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, name, value, type, suiteId, testCaseId, suiteName, testCaseName, description, frameworkPath, forceOverride } = body;

    const variableConfig = new VariableConfig(frameworkPath);
    
    if (action === 'check-conflict') {
      const conflict = variableConfig.checkConflict(name, suiteId, testCaseId);
      return NextResponse.json(conflict);
    }
    
    if (action === 'add') {
      const result = variableConfig.addVariable({
        name,
        value,
        type,
        suiteId,
        testCaseId,
        suiteName,
        testCaseName,
        description
      }, forceOverride);
      
      if (result.success) {
        return NextResponse.json({ success: true });
      } else if (result.conflict) {
        return NextResponse.json({ conflict: result.conflict, error: result.error }, { status: 409 });
      } else {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Variables API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const suiteId = searchParams.get('suiteId');
    const testCaseId = searchParams.get('testCaseId');
    const frameworkPath = searchParams.get('frameworkPath');
    
    const variableConfig = new VariableConfig(frameworkPath);
    const global = variableConfig['variables'].filter((v: Variable) => v.type === 'global');
    const local = (suiteId && testCaseId) ? 
      variableConfig['variables'].filter((v: Variable) => v.type === 'local' && v.suiteId === suiteId && v.testCaseId === testCaseId) : [];
    
    return NextResponse.json({ global, local });
  } catch (error) {
    console.error('Get variables error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const suiteId = searchParams.get('suiteId');
    const testCaseId = searchParams.get('testCaseId');
    const frameworkPath = searchParams.get('frameworkPath');
    
    const variableConfig = new VariableConfig(frameworkPath);
    
    if (name) {
      const success = variableConfig.deleteVariable(name, suiteId ?? undefined, testCaseId ?? undefined);
      
      if (success) {
        return NextResponse.json({ success: true });
      } else {
        return NextResponse.json({ error: 'Variable not found' }, { status: 404 });
      }
    }
    
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  } catch (error) {
    console.error('Delete variable error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}