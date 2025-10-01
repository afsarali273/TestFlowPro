import fs from 'fs';
import path from 'path';

export interface Variable {
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

export interface VariableConflict {
  exists: boolean;
  conflictType: 'global' | 'local' | 'both';
  existingVariable?: Variable;
  suggestedName?: string;
}

export class VariableConfig {
  private configPath: string;
  private variables: Variable[] = [];

  constructor(frameworkPath?: string) {
    // Use provided framework path or fallback to current directory
    const basePath = frameworkPath || process.cwd();
    this.configPath = path.join(basePath, 'src/variables/variables-config.json');
    this.loadConfig();
  }

  setFrameworkPath(frameworkPath: string): void {
    this.configPath = path.join(frameworkPath, 'src/variables/variables-config.json');
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
      fs.writeFileSync(this.configPath, JSON.stringify(this.variables, null, 2));
    } catch (error) {
      console.error('Failed to save variable config:', error);
    }
  }

  checkConflict(name: string, suiteId?: string, testCaseId?: string): VariableConflict {
    // Check global variables (no duplicates allowed)
    const globalVar = this.variables.find(v => v.name === name && v.type === 'global');
    
    // Check local variables at test case level
    const localVar = (suiteId && testCaseId) ? 
      this.variables.find(v => v.name === name && v.type === 'local' && v.suiteId === suiteId && v.testCaseId === testCaseId) : null;
    
    if (globalVar && localVar) {
      return {
        exists: true,
        conflictType: 'both',
        existingVariable: globalVar,
        suggestedName: this.generateSuggestion(name, suiteId, testCaseId)
      };
    }
    
    if (globalVar) {
      return {
        exists: true,
        conflictType: 'global',
        existingVariable: globalVar,
        suggestedName: this.generateSuggestion(name, suiteId, testCaseId)
      };
    }
    
    if (localVar) {
      return {
        exists: true,
        conflictType: 'local',
        existingVariable: localVar,
        suggestedName: this.generateSuggestion(name, suiteId, testCaseId)
      };
    }
    
    return { exists: false, conflictType: 'global' };
  }

  private generateSuggestion(baseName: string, suiteId?: string, testCaseId?: string): string {
    let counter = 1;
    let suggestion = `${baseName}_${counter}`;
    
    while (this.checkConflict(suggestion, suiteId, testCaseId).exists) {
      counter++;
      suggestion = `${baseName}_${counter}`;
    }
    
    return suggestion;
  }

  addVariable(variable: Omit<Variable, 'createdAt' | 'updatedAt'>, forceOverride?: boolean): { success: boolean; error?: string; conflict?: VariableConflict } {
    const conflict = this.checkConflict(variable.name, variable.suiteId, variable.testCaseId);
    
    if (conflict.exists && !forceOverride) {
      return {
        success: false,
        conflict,
        error: `Variable '${variable.name}' already exists as ${conflict.conflictType} variable`
      };
    }
    
    // Remove existing variable if overriding
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

  getVariables(suiteId?: string, testCaseId?: string): { global: Variable[]; local: Variable[] } {
    const global = this.variables.filter(v => v.type === 'global');
    const local = (suiteId && testCaseId) ? 
      this.variables.filter(v => v.type === 'local' && v.suiteId === suiteId && v.testCaseId === testCaseId) : [];
    
    return { global, local };
  }

  deleteVariable(name: string, suiteId?: string, testCaseId?: string): boolean {
    const index = this.variables.findIndex(v => 
      v.name === name && 
      ((v.type === 'global' && !suiteId) || (v.type === 'local' && v.suiteId === suiteId && v.testCaseId === testCaseId))
    );
    
    if (index === -1) return false;
    
    this.variables.splice(index, 1);
    this.saveConfig();
    return true;
  }

  cleanupSuite(suiteId: string): void {
    this.variables = this.variables.filter(v => !(v.type === 'local' && v.suiteId === suiteId));
    this.saveConfig();
  }

  cleanupTestCase(suiteId: string, testCaseId: string): void {
    this.variables = this.variables.filter(v => !(v.type === 'local' && v.suiteId === suiteId && v.testCaseId === testCaseId));
    this.saveConfig();
  }

  cleanupAllLocalVariables(): void {
    this.variables = this.variables.filter(v => v.type === 'global');
    this.saveConfig();
  }
}

export const variableConfig = new VariableConfig();