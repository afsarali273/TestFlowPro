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
    // Extract test name
    const testNameMatch = playwrightCode.match(/test\(['"`]([^'"`]+)['"`]/)
    const testName = testNameMatch ? testNameMatch[1] : 'Playwright Test'
    
    // Extract base URL from goto command
    const gotoMatch = playwrightCode.match(/page\.goto\(['"`]([^'"`]+)['"`]\)/)
    const baseUrl = gotoMatch ? new URL(gotoMatch[1]).origin : ''
    
    const testSteps: Array<{
      id: string
      keyword: string
      locator?: {
        strategy: string
        value: string
        options?: Record<string, any>
      }
      value?: string
      target?: string
    }> = []
    
    // Join multi-line statements
    const statements = this.extractStatements(playwrightCode)
    console.log('Extracted statements:', statements)
    
    let stepCounter = 1
    
    for (const statement of statements) {
      console.log('Parsing statement:', statement)
      const step = this.parseStep(statement, stepCounter)
      console.log('Parsed step:', step)
      if (step) {
        testSteps.push(step)
        stepCounter++
      }
    }
    
    return {
      testName,
      baseUrl,
      testSteps
    }
  }
  
  private static extractStatements(code: string): string[] {
    const statements: string[] = []
    const lines = code.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('//'))
    
    let currentStatement = ''
    let openParens = 0
    
    for (const line of lines) {
      currentStatement += line + ' '
      
      // Count parentheses to detect complete statements
      for (const char of line) {
        if (char === '(') openParens++
        if (char === ')') openParens--
      }
      
      // Statement is complete when parentheses are balanced and ends with semicolon
      if (openParens === 0 && (line.endsWith(';') || line.endsWith('))'))) {
        statements.push(currentStatement.trim())
        currentStatement = ''
      }
    }
    
    // Add any remaining statement
    if (currentStatement.trim()) {
      statements.push(currentStatement.trim())
    }
    
    return statements
  }
  
  private static parseStep(line: string, stepId: number): any | null {
    const id = `step-${stepId}`
    
    // Complex expect with filter chains
    if (line.includes('expect(') && line.includes('.filter(')) {
      console.log('Found complex expect with filter:', line)
      const complexLocator = this.parseComplexLocator(line)
      console.log('Complex locator result:', complexLocator)
      if (complexLocator) {
        // Determine assertion type
        if (line.includes('.toHaveCount(')) {
          const countMatch = line.match(/\.toHaveCount\((\d+)\)/)
          if (countMatch) {
            return {
              id,
              keyword: 'assertCount',
              locator: complexLocator,
              value: countMatch[1]
            }
          }
        }
        if (line.includes('.toBeVisible()')) {
          return {
            id,
            keyword: 'assertVisible',
            locator: complexLocator
          }
        }
        if (line.includes('.toHaveText(')) {
          const textMatch = line.match(/\.toHaveText\(['"`]([^'"`]+)['"`]\)/)
          if (textMatch) {
            return {
              id,
              keyword: 'assertText',
              locator: complexLocator,
              value: textMatch[1]
            }
          }
        }
      }
    }
    
    // goto command
    if (line.includes('page.goto(')) {
      const urlMatch = line.match(/page\.goto\(['"`]([^'"`]+)['"`]\)/)
      if (urlMatch) {
        return {
          id,
          keyword: 'goto',
          value: urlMatch[1]
        }
      }
    }
    
    // click commands
    if (line.includes('.click()')) {
      const locator = this.extractLocator(line)
      if (locator) {
        return {
          id,
          keyword: 'click',
          locator
        }
      }
    }
    
    // hover commands
    if (line.includes('.hover()')) {
      const locator = this.extractLocator(line)
      if (locator) {
        return {
          id,
          keyword: 'hover',
          locator
        }
      }
    }
    
    // check commands
    if (line.includes('.check()')) {
      const locator = this.extractLocator(line)
      if (locator) {
        return {
          id,
          keyword: 'check',
          locator
        }
      }
    }
    
    // uncheck commands
    if (line.includes('.uncheck()')) {
      const locator = this.extractLocator(line)
      if (locator) {
        return {
          id,
          keyword: 'uncheck',
          locator
        }
      }
    }
    
    // selectOption commands
    if (line.includes('.selectOption(')) {
      const locator = this.extractLocator(line)
      const optionMatch = line.match(/\.selectOption\(['"`]([^'"`]+)['"`]\)/)
      if (locator && optionMatch) {
        return {
          id,
          keyword: 'selectOption',
          locator,
          value: optionMatch[1]
        }
      }
    }
    
    // fill/type commands
    if (line.includes('.fill(') || line.includes('.type(')) {
      const locator = this.extractLocator(line)
      const valueMatch = line.match(/\.(?:fill|type)\(['"`]([^'"`]+)['"`]\)/)
      if (locator && valueMatch) {
        return {
          id,
          keyword: 'fill',
          locator,
          value: valueMatch[1]
        }
      }
    }
    
    // expect assertions
    if (line.includes('expect(') && line.includes('.toBeVisible()')) {
      const locator = this.extractLocator(line)
      if (locator) {
        return {
          id,
          keyword: 'assertVisible',
          locator
        }
      }
    }
    
    if (line.includes('expect(') && line.includes('.toBeHidden()')) {
      const locator = this.extractLocator(line)
      if (locator) {
        return {
          id,
          keyword: 'assertHidden',
          locator
        }
      }
    }
    
    if (line.includes('expect(') && line.includes('.toHaveText(')) {
      const locator = this.extractLocator(line)
      const textMatch = line.match(/\.toHaveText\(['"`]([^'"`]+)['"`]\)/)
      if (locator && textMatch) {
        return {
          id,
          keyword: 'assertText',
          locator,
          value: textMatch[1]
        }
      }
    }
    
    if (line.includes('expect(') && line.includes('.toBeEnabled()')) {
      const locator = this.extractLocator(line)
      if (locator) {
        return {
          id,
          keyword: 'assertEnabled',
          locator
        }
      }
    }
    
    if (line.includes('expect(') && line.includes('.toBeDisabled()')) {
      const locator = this.extractLocator(line)
      if (locator) {
        return {
          id,
          keyword: 'assertDisabled',
          locator
        }
      }
    }
    
    if (line.includes('expect(') && line.includes('.toHaveValue(')) {
      const locator = this.extractLocator(line)
      const valueMatch = line.match(/\.toHaveValue\(['"`]([^'"`]+)['"`]\)/)
      if (locator && valueMatch) {
        return {
          id,
          keyword: 'assertValue',
          locator,
          value: valueMatch[1]
        }
      }
    }
    
    if (line.includes('expect(') && line.includes('.toContainText(')) {
      const locator = this.extractLocator(line)
      const textMatch = line.match(/\.toContainText\(['"`]([^'"`]+)['"`]\)/)
      if (locator && textMatch) {
        return {
          id,
          keyword: 'assertContainsText',
          locator,
          value: textMatch[1]
        }
      }
    }
    
    if (line.includes('expect(') && line.includes('.toHaveCount(')) {
      const locator = this.extractLocator(line)
      const countMatch = line.match(/\.toHaveCount\((\d+)\)/)
      if (locator && countMatch) {
        return {
          id,
          keyword: 'assertCount',
          locator,
          value: countMatch[1]
        }
      }
    }
    
    if (line.includes('expect(') && line.includes('.toBeChecked()')) {
      const locator = this.extractLocator(line)
      if (locator) {
        return {
          id,
          keyword: 'assertChecked',
          locator
        }
      }
    }
    
    // wait commands
    if (line.includes('page.waitFor')) {
      if (line.includes('waitForSelector')) {
        const selectorMatch = line.match(/waitForSelector\(['"`]([^'"`]+)['"`]\)/)
        if (selectorMatch) {
          return {
            id,
            keyword: 'waitForElement',
            locator: {
              strategy: 'css',
              value: selectorMatch[1]
            }
          }
        }
      }
      
      if (line.includes('waitForTimeout')) {
        const timeoutMatch = line.match(/waitForTimeout\((\d+)\)/)
        if (timeoutMatch) {
          return {
            id,
            keyword: 'waitForTimeout',
            value: timeoutMatch[1]
          }
        }
      }
    }
    
    // screenshot command
    if (line.includes('page.screenshot(')) {
      return {
        id,
        keyword: 'screenshot'
      }
    }
    
    // double click commands
    if (line.includes('.dblclick()')) {
      const locator = this.extractLocator(line)
      if (locator) {
        return {
          id,
          keyword: 'dblClick',
          locator
        }
      }
    }
    
    // right click commands
    if (line.includes('.click({ button: \'right\' })') || line.includes('.click({button:\'right\'})')) {
      const locator = this.extractLocator(line)
      if (locator) {
        return {
          id,
          keyword: 'rightClick',
          locator
        }
      }
    }
    
    // press key commands
    if (line.includes('.press(')) {
      const locator = this.extractLocator(line)
      const keyMatch = line.match(/\.press\(['"`]([^'"`]+)['"`]\)/)
      if (locator && keyMatch) {
        return {
          id,
          keyword: 'press',
          locator,
          value: keyMatch[1]
        }
      }
    }
    
    return null
  }
  
  private static extractLocator(line: string): any | null {
    // getByTestId
    const testIdMatch = line.match(/getByTestId\(['"`]([^'"`]+)['"`]\)/)
    if (testIdMatch) {
      return {
        strategy: 'testId',
        value: testIdMatch[1]
      }
    }
    
    // getByRole with options
    const roleMatch = line.match(/getByRole\(['"`]([^'"`]+)['"`](?:,\s*\{([^}]+)\})?\)/)
    if (roleMatch) {
      const role = roleMatch[1]
      const optionsStr = roleMatch[2]
      const options: Record<string, any> = {}
      
      if (optionsStr) {
        // Parse name option
        const nameMatch = optionsStr.match(/name:\s*['"`]([^'"`]+)['"`]/)
        if (nameMatch) {
          options.name = nameMatch[1]
        }
        
        // Parse exact option
        const exactMatch = optionsStr.match(/exact:\s*(true|false)/)
        if (exactMatch) {
          options.exact = exactMatch[1] === 'true'
        }
      }
      
      return {
        strategy: 'role',
        value: role,
        ...(Object.keys(options).length > 0 && { options })
      }
    }
    
    // getByText with options
    const textMatch = line.match(/getByText\(['"`]([^'"`]+)['"`](?:,\s*\{([^}]+)\})?\)/) || line.match(/getByText\(\/([^/]+)\/([gimuy]*)\)/)
    if (textMatch) {
      const text = textMatch[1]
      const optionsStr = textMatch[2]
      const options: Record<string, any> = {}
      
      if (optionsStr) {
        const exactMatch = optionsStr.match(/exact:\s*(true|false)/)
        if (exactMatch) {
          options.exact = exactMatch[1] === 'true'
        }
      }
      
      return {
        strategy: 'text',
        value: text,
        ...(Object.keys(options).length > 0 && { options })
      }
    }
    
    // getByLabel
    const labelMatch = line.match(/getByLabel\(['"`]([^'"`]+)['"`]\)/)
    if (labelMatch) {
      return {
        strategy: 'label',
        value: labelMatch[1]
      }
    }
    
    // getByPlaceholder
    const placeholderMatch = line.match(/getByPlaceholder\(['"`]([^'"`]+)['"`]\)/)
    if (placeholderMatch) {
      return {
        strategy: 'placeholder',
        value: placeholderMatch[1]
      }
    }
    
    // getByAltText
    const altTextMatch = line.match(/getByAltText\(['"`]([^'"`]+)['"`]\)/)
    if (altTextMatch) {
      return {
        strategy: 'altText',
        value: altTextMatch[1]
      }
    }
    
    // getByTitle
    const titleMatch = line.match(/getByTitle\(['"`]([^'"`]+)['"`]\)/)
    if (titleMatch) {
      return {
        strategy: 'title',
        value: titleMatch[1]
      }
    }
    
    // locator (CSS/XPath selector)
    const locatorMatch = line.match(/locator\(['"`]([^'"`]+)['"`]\)/)
    if (locatorMatch) {
      const selector = locatorMatch[1]
      return {
        strategy: selector.startsWith('xpath=') || selector.startsWith('//') ? 'xpath' : 'css',
        value: selector.replace(/^xpath=/, '')
      }
    }
    
    return null
  }
  
  private static parseComplexLocator(statement: string): any | null {
    // Remove whitespace and normalize the statement
    const normalized = statement.replace(/\s+/g, ' ').trim()
    
    // Extract the locator chain from expect() parentheses
    const expectMatch = normalized.match(/expect\((.+?)\)\s*\./)
    if (!expectMatch) return null
    
    const locatorChain = expectMatch[1]
    
    // Match: page.getByRole('listitem').filter({ has: page.getByRole('heading', { name: 'Product 2' }) })
    const chainPattern = /page\.getBy(\w+)\(['"`]([^'"`]+)['"`](?:,\s*\{([^}]+)\})?\)\s*\.filter\(\{\s*has:\s*page\.getBy(\w+)\(['"`]([^'"`]+)['"`](?:,\s*\{([^}]+)\})?\)\s*\}\)/
    const chainMatch = locatorChain.match(chainPattern)
    
    if (chainMatch) {
      const [, baseStrategy, baseValue, baseOptionsStr, filterStrategy, filterValue, filterOptionsStr] = chainMatch
      
      // Parse base locator options
      const baseOptions: Record<string, any> = {}
      if (baseOptionsStr) {
        const nameMatch = baseOptionsStr.match(/name:\s*['"`]([^'"`]+)['"`]/)
        if (nameMatch) baseOptions.name = nameMatch[1]
        const exactMatch = baseOptionsStr.match(/exact:\s*(true|false)/)
        if (exactMatch) baseOptions.exact = exactMatch[1] === 'true'
      }
      
      // Parse filter locator options
      const filterOptions: Record<string, any> = {}
      if (filterOptionsStr) {
        const nameMatch = filterOptionsStr.match(/name:\s*['"`]([^'"`]+)['"`]/)
        if (nameMatch) filterOptions.name = nameMatch[1]
        const exactMatch = filterOptionsStr.match(/exact:\s*(true|false)/)
        if (exactMatch) filterOptions.exact = exactMatch[1] === 'true'
      }
      
      // Convert strategy names
      const strategyMap: Record<string, string> = {
        'Role': 'role',
        'Text': 'text',
        'Label': 'label',
        'TestId': 'testId',
        'Placeholder': 'placeholder',
        'AltText': 'altText',
        'Title': 'title'
      }
      
      return {
        strategy: strategyMap[baseStrategy] || baseStrategy.toLowerCase(),
        value: baseValue,
        ...(Object.keys(baseOptions).length > 0 && { options: baseOptions }),
        filter: {
          type: 'has',
          locator: {
            strategy: strategyMap[filterStrategy] || filterStrategy.toLowerCase(),
            value: filterValue,
            ...(Object.keys(filterOptions).length > 0 && { options: filterOptions })
          }
        }
      }
    }
    
    return null
  }
  
  static generateTestSuite(parsed: ParsedPlaywright, suiteName?: string, applicationName?: string): any {
    const timestamp = Date.now()
    
    return {
      id: `playwright-suite-${timestamp}`,
      suiteName: suiteName || `${parsed.testName} Suite`,
      applicationName: applicationName || this.extractApplicationName(parsed.baseUrl),
      type: "UI",
      baseUrl: parsed.baseUrl,
      timeout: 30000,
      testCases: [{
        name: parsed.testName,
        type: "UI",
        testData: [],
        testSteps: parsed.testSteps
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