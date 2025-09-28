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
    const lines = playwrightCode.split('\n').map(line => line.trim()).filter(line => line)
    
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
    
    let stepCounter = 1
    
    for (const line of lines) {
      const step = this.parseStep(line, stepCounter)
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
  
  private static parseStep(line: string, stepId: number): any | null {
    const id = `step-${stepId}`
    
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
    
    // getByText
    const textMatch = line.match(/getByText\(['"`]([^'"`]+)['"`]\)/)
    if (textMatch) {
      return {
        strategy: 'text',
        value: textMatch[1]
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
    
    // locator (CSS selector)
    const locatorMatch = line.match(/locator\(['"`]([^'"`]+)['"`]\)/)
    if (locatorMatch) {
      return {
        strategy: 'css',
        value: locatorMatch[1]
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