export interface ParsedPlaywright {
  testName: string
  baseUrl: string
  testSteps: Array<{
    id: string
    keyword: string
    locator?: {
      strategy: string
      value: string
      options?: Record<string, any>
    }
    value?: string
    target?: string
  }>
}

export class PlaywrightParser {
  static parse(playwrightCode: string): ParsedPlaywright {
    const testNameMatch = playwrightCode.match(/test\(['"`]([^'"`]+)['"`]/)
    const testName = testNameMatch ? testNameMatch[1] : 'Playwright Test'
    
    const gotoMatch = playwrightCode.match(/page\.goto\(['"`]([^'"`]+)['"`]\)/)
    const baseUrl = gotoMatch ? new URL(gotoMatch[1]).origin : ''
    
    const testSteps: Array<{
      id: string
      keyword: string
      locator?: {
        strategy: string
        value: string
        options?: Record<string, any>
        filter?: any
      }
      value?: string
      target?: string
    }> = []
    
    const statements = this.extractStatements(playwrightCode)
    let stepCounter = 1
    
    for (const statement of statements) {
      const step = this.parseStep(statement, stepCounter)
      if (step) {
        testSteps.push(step)
        stepCounter++
      }
    }
    
    return { testName, baseUrl, testSteps }
  }
  
  private static extractStatements(code: string): string[] {
    const lines = code.split('\n').map(line => line.trim())
    const statements: string[] = []
    const variables: Record<string, string> = {}
    let currentStatement = ''
    
    for (const line of lines) {
      if (!line || line.startsWith('//') || line.includes('import')) continue
      
      // Track variable declarations
      const varMatch = line.match(/const\s+(\w+)\s*=\s*(page\..+);?$/)
      if (varMatch) {
        variables[varMatch[1]] = varMatch[2]
        continue
      }
      
      currentStatement += line + ' '
      
      if (line.endsWith(';') || line.endsWith(')') || 
          (line.includes('await ') && currentStatement.trim() !== line)) {
        let statement = currentStatement.trim().replace(/\s+/g, ' ')
        
        // Replace variables with their definitions
        for (const [varName, definition] of Object.entries(variables)) {
          statement = statement.replace(new RegExp(`\\b${varName}\\b`, 'g'), definition)
        }
        
        // Handle undefined variables by creating default locator
        const undefinedVarMatch = statement.match(/await\s+(\w+)\./)
        if (undefinedVarMatch && !statement.includes('page.')) {
          const varName = undefinedVarMatch[1]
          statement = statement.replace(new RegExp(`\\b${varName}\\b`, 'g'), 'page.getByRole(\'listitem\')')
        }
        
        if (statement.startsWith('await ')) {
          statements.push(statement)
        }
        currentStatement = ''
      }
    }
    
    if (currentStatement.trim().startsWith('await ')) {
      let statement = currentStatement.trim().replace(/\s+/g, ' ')
      for (const [varName, definition] of Object.entries(variables)) {
        statement = statement.replace(new RegExp(`\\b${varName}\\b`, 'g'), definition)
      }
      
      // Handle undefined variables
      const undefinedVarMatch = statement.match(/await\s+(\w+)\./)
      if (undefinedVarMatch && !statement.includes('page.')) {
        const varName = undefinedVarMatch[1]
        statement = statement.replace(new RegExp(`\\b${varName}\\b`, 'g'), 'page.getByRole(\'listitem\')')
      }
      statements.push(statement)
    }
    
    return statements
  }
  
  private static parseStep(line: string, stepId: number): any | null {
    const id = `step-${stepId}`
    
    // goto command
    if (line.includes('page.goto(')) {
      const urlMatch = line.match(/page\.goto\(['"`]([^'"`]+)['"`]\)/)
      if (urlMatch) return { id, keyword: 'goto', value: urlMatch[1] }
    }
    
    // Actions with locators
    if (line.includes('.click()')) {
      const locator = this.extractLocator(line)
      if (locator) return { id, keyword: 'click', locator }
    }
    
    if (line.includes('.fill(') || line.includes('.type(')) {
      const locator = this.extractLocator(line)
      const valueMatch = line.match(/\.(?:fill|type)\(['"`]([^'"`]+)['"`]\)/)
      if (locator && valueMatch) return { id, keyword: 'fill', locator, value: valueMatch[1] }
    }
    
    if (line.includes('.hover()')) {
      const locator = this.extractLocator(line)
      if (locator) return { id, keyword: 'hover', locator }
    }
    
    if (line.includes('.check()')) {
      const locator = this.extractLocator(line)
      if (locator) return { id, keyword: 'check', locator }
    }
    
    if (line.includes('.uncheck()')) {
      const locator = this.extractLocator(line)
      if (locator) return { id, keyword: 'uncheck', locator }
    }
    
    if (line.includes('.selectOption(')) {
      const locator = this.extractLocator(line)
      const optionMatch = line.match(/\.selectOption\(['"`]([^'"`]+)['"`]\)/)
      if (locator && optionMatch) return { id, keyword: 'select', locator, value: optionMatch[1] }
    }
    
    if (line.includes('.press(')) {
      const locator = this.extractLocator(line)
      const keyMatch = line.match(/\.press\(['"`]([^'"`]+)['"`]\)/)
      if (locator && keyMatch) return { id, keyword: 'press', locator, value: keyMatch[1] }
    }
    
    // Assertions
    if (line.includes('expect(') && line.includes('.toBeVisible()')) {
      const locator = this.extractLocator(line)
      if (locator) return { id, keyword: 'assertVisible', locator }
    }
    
    if (line.includes('expect(') && line.includes('.toHaveText(')) {
      const locator = this.extractLocator(line)
      const textMatch = line.match(/\.toHaveText\(['"`]([^'"`]+)['"`]\)/)
      if (locator && textMatch) return { id, keyword: 'assertText', locator, value: textMatch[1] }
    }
    
    if (line.includes('expect(') && line.includes('.toHaveCount(')) {
      const locator = this.extractLocator(line)
      const countMatch = line.match(/\.toHaveCount\((\d+)\)/)
      if (locator && countMatch) return { id, keyword: 'assertCount', locator, value: countMatch[1] }
    }
    
    if (line.includes('expect(') && line.includes('.toBeEnabled()')) {
      const locator = this.extractLocator(line)
      if (locator) return { id, keyword: 'assertEnabled', locator }
    }
    
    if (line.includes('expect(') && line.includes('.toBeDisabled()')) {
      const locator = this.extractLocator(line)
      if (locator) return { id, keyword: 'assertDisabled', locator }
    }
    
    if (line.includes('expect(') && line.includes('.toBeChecked()')) {
      const locator = this.extractLocator(line)
      if (locator) return { id, keyword: 'assertChecked', locator }
    }
    
    if (line.includes('.screenshot(')) {
      const locator = this.extractLocator(line)
      const pathMatch = line.match(/\.screenshot\(\{\s*path:\s*['"`]([^'"`]+)['"`]\s*\}\)/)
      if (locator && pathMatch) return { id, keyword: 'screenshot', locator, value: pathMatch[1] }
    }
    
    return null
  }
  
  private static extractLocator(line: string): any | null {
    // Handle complex chaining with filters
    if (line.includes('.filter(') || line.includes('.getBy')) {
      return this.parseFilteredLocator(line)
    }
    
    // getByRole with options
    const roleMatch = line.match(/getByRole\(['"`]([^'"`]+)['"`](?:,\s*\{([^}]+)\})?\)/)
    if (roleMatch) {
      const role = roleMatch[1]
      const optionsStr = roleMatch[2]
      const locator: any = { strategy: 'role', value: role }
      
      if (optionsStr) {
        const options: Record<string, any> = {}
        const nameMatch = optionsStr.match(/name:\s*['"`]([^'"`]+)['"`]/)
        if (nameMatch) options.name = nameMatch[1]
        const exactMatch = optionsStr.match(/exact:\s*(true|false)/)
        if (exactMatch) options.exact = exactMatch[1] === 'true'
        if (Object.keys(options).length > 0) locator.options = options
      }
      
      // Check for .first() or .last()
      if (line.includes('.first()')) {
        locator.index = 'first'
      } else if (line.includes('.last()')) {
        locator.index = 'last'
      }
      
      return locator
    }
    
    // getByText with options
    const textMatch = line.match(/getByText\(['"`]([^'"`]+)['"`](?:,\s*\{([^}]+)\})?\)/)
    if (textMatch) {
      const text = textMatch[1]
      const optionsStr = textMatch[2]
      const locator: any = { strategy: 'text', value: text }
      
      if (optionsStr) {
        const options: Record<string, any> = {}
        const exactMatch = optionsStr.match(/exact:\s*(true|false)/)
        if (exactMatch) options.exact = exactMatch[1] === 'true'
        if (Object.keys(options).length > 0) locator.options = options
      }
      
      return locator
    }
    
    // Other locator strategies
    const strategies = [
      { pattern: /getByTestId\(['"`]([^'"`]+)['"`]\)/, strategy: 'testId' },
      { pattern: /getByLabel\(['"`]([^'"`]+)['"`]\)/, strategy: 'label' },
      { pattern: /getByPlaceholder\(['"`]([^'"`]+)['"`]\)/, strategy: 'placeholder' },
      { pattern: /getByAltText\(['"`]([^'"`]+)['"`]\)/, strategy: 'altText' },
      { pattern: /getByTitle\(['"`]([^'"`]+)['"`]\)/, strategy: 'title' }
    ]
    
    for (const { pattern, strategy } of strategies) {
      const match = line.match(pattern)
      if (match) {
        const locator: any = { strategy, value: match[1] }
        // Check for .first() or .last()
        if (line.includes('.first()')) {
          locator.index = 'first'
        } else if (line.includes('.last()')) {
          locator.index = 'last'
        }
        return locator
      }
    }
    
    // locator (CSS/XPath)
    const locatorMatch = line.match(/locator\(['"`]([^'"`]+)['"`]\)/)
    if (locatorMatch) {
      const selector = locatorMatch[1]
      const locator: any = {
        strategy: selector.startsWith('//') ? 'xpath' : 'css',
        value: selector
      }
      // Check for .first() or .last()
      if (line.includes('.first()')) {
        locator.index = 'first'
      } else if (line.includes('.last()')) {
        locator.index = 'last'
      }
      return locator
    }
    
    return null
  }
  
  private static parseFilteredLocator(line: string): any | null {

    
    // Extract base locator (first getBy* or locator call)
    const baseMatch = line.match(/(page\.)?(getBy\w+|locator)\([^)]+\)/)
    if (!baseMatch) return null
    
    const baseLocator = this.parseLocatorMethod(baseMatch[2], baseMatch[0].match(/\(([^)]+)\)/)?.[1] || '')
    if (!baseLocator) return null
    
    // Extract all filters
    const filterMatches = [...line.matchAll(/\.filter\(\{([^}]+)\}\)/g)]
    const filters = filterMatches.map(match => this.parseFilterContent(match[1])).filter(Boolean)
    
    // Extract chained locators (getBy* calls after filters)
    const afterFilters = line.split('.filter(').pop()?.split(').').slice(1).join(').') || ''
    const chainMatches = [...afterFilters.matchAll(/\.(getBy\w+)\(([^)]+)\)/g)]
    const chainSteps = chainMatches.map(match => ({
      operation: 'locator',
      locator: this.parseLocatorMethod(match[1], match[2])
    })).filter(step => step.locator)
    
    // Extract index
    let index: string | number | undefined
    if (line.includes('.first()')) index = 'first'
    else if (line.includes('.last()')) index = 'last'
    else {
      const nthMatch = line.match(/\.nth\((\d+)\)/)
      if (nthMatch) index = parseInt(nthMatch[1])
    }
    
    // Build final locator
    if (filters.length === 1) baseLocator.filter = filters[0]
    else if (filters.length > 1) baseLocator.filters = filters
    
    if (chainSteps.length > 0) baseLocator.chain = chainSteps
    if (index !== undefined) baseLocator.index = index
    
    return baseLocator
  }
  

  
  private static parseLocatorMethod(method: string, content: string): any | null {
    const valueMatch = content.match(/['"`]([^'"`]+)['"`]/)
    if (!valueMatch) return null
    
    const value = valueMatch[1]
    const locator: any = { strategy: this.getStrategy(method, value), value }
    
    // Parse options if present
    const optionsMatch = content.match(/,\s*\{([^}]+)\}/)
    if (optionsMatch) {
      locator.options = this.parseObjectLiteral(optionsMatch[1])
    }
    
    return locator
  }
  
  private static getStrategy(method: string, value: string): string {
    if (method === 'getByRole') return 'role'
    if (method === 'getByText') return 'text'
    if (method === 'getByLabel') return 'label'
    if (method === 'getByTestId') return 'testId'
    if (method === 'getByPlaceholder') return 'placeholder'
    if (method === 'getByAltText') return 'altText'
    if (method === 'getByTitle') return 'title'
    if (method === 'locator') {
      if (value.startsWith('css=')) return 'locator'
      if (value.startsWith('xpath=')) return 'locator'
      return value.startsWith('//') ? 'xpath' : 'css'
    }
    return 'css'
  }
  
  private static parseFilterContent(content: string): any | null {
    // hasText filter
    const hasTextMatch = content.match(/hasText:\s*['"`]([^'"`]+)['"`]/)
    if (hasTextMatch) return { type: 'hasText', value: hasTextMatch[1] }
    
    // hasNotText filter
    const hasNotTextMatch = content.match(/hasNotText:\s*['"`]([^'"`]+)['"`]/)
    if (hasNotTextMatch) return { type: 'hasNotText', value: hasNotTextMatch[1] }
    
    // has filter with nested locator
    const hasMatch = content.match(/has:\s*(page\.(getBy\w+)\([^)]+\))/)
    if (hasMatch) {
      const nestedLocator = this.parseLocatorMethod(hasMatch[2], hasMatch[1].match(/\(([^)]+)\)/)?.[1] || '')
      if (nestedLocator) return { type: 'has', locator: nestedLocator }
    }
    
    // hasNot filter
    const hasNotMatch = content.match(/hasNot:\s*(page\.(getBy\w+)\([^)]+\))/)
    if (hasNotMatch) {
      const nestedLocator = this.parseLocatorMethod(hasNotMatch[2], hasNotMatch[1].match(/\(([^)]+)\)/)?.[1] || '')
      if (nestedLocator) return { type: 'hasNot', locator: nestedLocator }
    }
    
    // visible filter
    if (content.includes('visible: true')) return { type: 'visible' }
    if (content.includes('visible: false')) return { type: 'hidden' }
    
    return null
  }
  

  
  private static parseObjectLiteral(content: string): any {
    const obj: any = {}
    const pairs = content.split(',')
    
    for (const pair of pairs) {
      const colonIndex = pair.indexOf(':')
      if (colonIndex > 0) {
        const key = pair.substring(0, colonIndex).trim()
        const value = pair.substring(colonIndex + 1).trim().replace(/^['"`]|['"`]$/g, '')
        
        if (value === 'true') obj[key] = true
        else if (value === 'false') obj[key] = false
        else if (/^\d+$/.test(value)) obj[key] = parseInt(value)
        else obj[key] = value
      }
    }
    
    return obj
  }
  

  
  static generateTestSuite(parsed: ParsedPlaywright, suiteName?: string, applicationName?: string): any {
    const timestamp = Date.now()
    
    // Clean test steps - remove empty fields
    const cleanedSteps = parsed.testSteps.map(step => {
      const cleaned: any = {
        id: step.id,
        keyword: step.keyword
      }
      
      if (step.value) cleaned.value = step.value
      if (step.locator) cleaned.locator = step.locator
      
      return cleaned
    })
    
    return {
      id: `playwright-suite-${timestamp}`,
      suiteName: suiteName || `${parsed.testName} Suite`,
      applicationName: applicationName || this.extractApplicationName(parsed.baseUrl),
      type: "UI",
      baseUrl: parsed.baseUrl,
      tags: [
        { serviceName: "@UIService" },
        { suiteType: "@playwright" }
      ],
      testCases: [{
        id: `tc-${timestamp}`,
        name: parsed.testName,
        type: "UI",
        status: "Not Started",
        testData: [],
        testSteps: cleanedSteps,
        enabled: true
      }]
    }
  }
  
  private static extractApplicationName(baseUrl: string): string {
    if (!baseUrl) return 'Web Application'
    
    try {
      const url = new URL(baseUrl)
      const hostname = url.hostname
      
      // Remove www. prefix
      const cleanHostname = hostname.replace(/^www\./, '')
      
      // Extract main domain name
      const parts = cleanHostname.split('.')
      const mainPart = parts[0]
      
      // Capitalize first letter
      return mainPart.charAt(0).toUpperCase() + mainPart.slice(1)
    } catch {
      return 'Web Application'
    }
  }
}