import fs from 'fs';
import path from 'path';

export interface Variable {
  name: string;
  value: string;
  type: 'global' | 'local';
  suiteId?: string;
  suiteName?: string;
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

export class VariableManager {
  private variablesFilePath: string;
  private variables: Variable[] = [];

  constructor() {
    this.variablesFilePath = path.join(process.cwd(), 'variables.json');
    this.loadVariables();
  }

  private loadVariables(): void {
    try {
      if (fs.existsSync(this.variablesFilePath)) {
        const data = fs.readFileSync(this.variablesFilePath, 'utf8');
        this.variables = JSON.parse(data);
      }
    } catch (error) {
      console.warn('Failed to load variables:', error);
      this.variables = [];
    }
  }

  private saveVariables(): void {
    try {
      fs.writeFileSync(this.variablesFilePath, JSON.stringify(this.variables, null, 2));
    } catch (error) {
      console.error('Failed to save variables:', error);
    }
  }

  checkVariableConflict(name: string, suiteId?: string): VariableConflict {
    const globalVar = this.variables.find(v => v.name === name && v.type === 'global');
    const localVar = suiteId ? this.variables.find(v => v.name === name && v.type === 'local' && v.suiteId === suiteId) : null;
    
    if (globalVar && localVar) {
      return {
        exists: true,
        conflictType: 'both',
        existingVariable: globalVar,
        suggestedName: this.generateSuggestedName(name, suiteId)
      };
    }
    
    if (globalVar) {
      return {
        exists: true,
        conflictType: 'global',
        existingVariable: globalVar,
        suggestedName: this.generateSuggestedName(name, suiteId)
      };
    }
    
    if (localVar) {
      return {
        exists: true,
        conflictType: 'local',
        existingVariable: localVar,
        suggestedName: this.generateSuggestedName(name, suiteId)
      };
    }
    
    return { exists: false, conflictType: 'global' };
  }

  private generateSuggestedName(baseName: string, suiteId?: string): string {
    let counter = 1;
    let suggestedName = `${baseName}_${counter}`;
    
    while (this.checkVariableConflict(suggestedName, suiteId).exists) {
      counter++;
      suggestedName = `${baseName}_${counter}`;
    }
    
    return suggestedName;
  }

  addVariable(variable: Omit<Variable, 'createdAt' | 'updatedAt'>): { success: boolean; error?: string; variable?: Variable } {
    const conflict = this.checkVariableConflict(variable.name, variable.suiteId);
    
    if (conflict.exists) {
      return {
        success: false,
        error: `Variable '${variable.name}' already exists as ${conflict.conflictType} variable. Suggested name: ${conflict.suggestedName}`
      };
    }
    
    const newVariable: Variable = {
      ...variable,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.variables.push(newVariable);
    this.saveVariables();
    
    return { success: true, variable: newVariable };
  }

  updateVariable(name: string, suiteId: string | undefined, updates: Partial<Variable>): { success: boolean; error?: string; variable?: Variable } {
    const index = this.variables.findIndex(v => 
      v.name === name && 
      ((v.type === 'global' && !suiteId) || (v.type === 'local' && v.suiteId === suiteId))
    );
    
    if (index === -1) {
      return { success: false, error: 'Variable not found' };
    }
    
    // If renaming, check for conflicts
    if (updates.name && updates.name !== name) {
      const conflict = this.checkVariableConflict(updates.name, suiteId);
      if (conflict.exists) {
        return {
          success: false,
          error: `Variable '${updates.name}' already exists as ${conflict.conflictType} variable. Suggested name: ${conflict.suggestedName}`
        };
      }
    }
    
    this.variables[index] = {
      ...this.variables[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    this.saveVariables();
    return { success: true, variable: this.variables[index] };
  }

  deleteVariable(name: string, suiteId?: string): { success: boolean; error?: string } {
    const index = this.variables.findIndex(v => 
      v.name === name && 
      ((v.type === 'global' && !suiteId) || (v.type === 'local' && v.suiteId === suiteId))
    );
    
    if (index === -1) {
      return { success: false, error: 'Variable not found' };
    }
    
    this.variables.splice(index, 1);
    this.saveVariables();
    return { success: true };
  }

  getVariables(suiteId?: string): { global: Variable[]; local: Variable[] } {
    const global = this.variables.filter(v => v.type === 'global');
    const local = suiteId ? this.variables.filter(v => v.type === 'local' && v.suiteId === suiteId) : [];
    
    return { global, local };
  }

  getAllVariables(): Variable[] {
    return [...this.variables];
  }

  cleanupSuiteVariables(suiteId: string): void {
    this.variables = this.variables.filter(v => !(v.type === 'local' && v.suiteId === suiteId));
    this.saveVariables();
  }
}

export const variableManager = new VariableManager();