import { Document } from '@langchain/core/documents'
import fs from 'fs/promises'
import path from 'path'

export class RAGKnowledgeBase {
  static async loadTestSuiteExamples(testDataPath: string): Promise<Document[]> {
    const documents: Document[] = []
    
    try {
      // Check if directory exists
      await fs.access(testDataPath)
      const files = await fs.readdir(testDataPath)
      const jsonFiles = files.filter(file => file.endsWith('.json'))
      
      for (const file of jsonFiles.slice(0, 3)) { // Limit to 3 examples
        try {
          const filePath = path.join(testDataPath, file)
          const content = await fs.readFile(filePath, 'utf-8')
          const testSuite = JSON.parse(content)
          
          documents.push(new Document({
            pageContent: `Example TestFlow Pro Suite: ${JSON.stringify(testSuite, null, 2)}`,
            metadata: { 
              type: 'example',
              suiteType: testSuite.type || 'API',
              fileName: file,
              suiteName: testSuite.suiteName
            }
          }))
        } catch (error) {
          console.warn(`Failed to load ${file}:`, error)
        }
      }
    } catch (error) {
      console.warn('TestData directory not found, using framework docs only')
    }
    
    return documents
  }

  static getFrameworkDocuments(): Document[] {
    return [
      new Document({
        pageContent: `TestFlow Pro Complete Schema Example:
{
  "id": "suite-123",
  "suiteName": "Complete Example Suite",
  "type": "API",
  "baseUrl": "https://api.example.com",
  "tags": ["serviceName=@UserService", "suiteType=@smoke"],
  "testCases": [{
    "name": "User Operations",
    "type": "REST",
    "testData": [{
      "name": "Create User",
      "method": "POST",
      "endpoint": "/users",
      "headers": {"Content-Type": "application/json"},
      "preProcess": [{"var": "email", "function": "faker.email"}],
      "body": {"name": "John", "email": "{{email}}"},
      "assertions": [{"type": "statusCode", "jsonPath": "$", "expected": 201}, {"type": "exists", "jsonPath": "$.id"}],
      "store": {"userId": "$.id"}
    }]
  }]
}`,
        metadata: { type: 'complete-example' }
      }),
      
      new Document({
        pageContent: `API Test Suite Schema:
{
  "id": "unique-string",
  "suiteName": "API Suite Name",
  "type": "API",
  "baseUrl": "https://api.example.com",
  "tags": ["serviceName=@ServiceName"],
  "testCases": [{
    "name": "Test Case Name",
    "type": "REST",
    "testData": [{
      "name": "Test Data Name",
      "method": "GET|POST|PUT|DELETE",
      "endpoint": "/path",
      "headers": {"Content-Type": "application/json"},
      "body": {},
      "assertions": [{"type": "statusCode", "jsonPath": "$", "expected": 200}],
      "store": {"varName": "$.jsonPath"}
    }]
  }]
}`,
        metadata: { type: 'api-schema' }
      }),
      
      new Document({
        pageContent: `TestFlow Pro UI Test Complete Reference:

SUPPORTED KEYWORDS (from UIRunner):
1. openBrowser - Initialize browser (handled automatically)
2. goto - Navigate to URL (requires value with URL)
3. click - Click element (requires locator)
4. type - Fill input field (requires locator + value)
5. select - Select dropdown option (requires locator + value)
6. waitFor - Wait for element or time (value = CSS selector or milliseconds)
7. assertText - Verify element text (requires locator + value with expected text)
8. assertVisible - Verify element visibility (requires locator)
9. screenshot - Take screenshot (optional value = file path)

LOCATOR STRATEGIES & USAGE RULES:

Playwright Built-in Locators (use 'locator' field, ignore 'target'):
- role: page.getByRole() - semantic roles (button, link, textbox, etc.)
- label: page.getByLabel() - form labels  
- text: page.getByText() - visible text content
- placeholder: page.getByPlaceholder() - input placeholders
- altText: page.getByAltText() - image alt text
- testId: page.getByTestId() - data-testid attributes

CSS/XPath Locators (use 'target' field, ignore 'locator'):
- css: page.locator() - CSS selectors
- xpath: page.locator() - XPath expressions

USAGE EXAMPLES:
✅ Playwright locator: {"locator": {"strategy": "role", "value": "button"}}
✅ CSS/XPath: {"target": "#submit-btn"} or {"target": "//button[@id='submit']"}
❌ Don't mix: Never use both 'target' and 'locator' in same step

UI TEST STRUCTURE:
{
  "id": "ui-test-1",
  "suiteName": "Login Flow Test",
  "type": "UI",
  "baseUrl": "",
  "tags": ["testType=@ui", "suiteType=@smoke"],
  "testCases": [{
    "name": "User Login",
    "type": "UI",
    "testSteps": [
      {"id": "step-1", "keyword": "goto", "value": "https://example.com/login"},
      {"id": "step-2", "keyword": "type", "locator": {"strategy": "testId", "value": "email"}, "value": "user@example.com"},
      {"id": "step-3", "keyword": "type", "locator": {"strategy": "testId", "value": "password"}, "value": "password123"},
      {"id": "step-4", "keyword": "click", "locator": {"strategy": "role", "value": "button"}},
      {"id": "step-5", "keyword": "assertVisible", "locator": {"strategy": "text", "value": "Dashboard"}}
    ]
  }]
}

BEST PRACTICES:
- Prefer semantic locators (role, label, text) over CSS
- Use testId for reliable element identification
- Include descriptive step IDs
- Use assertText for text verification, assertVisible for element presence
- waitFor accepts both selectors and milliseconds (e.g. "5000" for 5 seconds)`,
        metadata: { type: 'ui-complete-reference' }
      }),
      
      new Document({
        pageContent: `PreProcess Schema:
[
  {"var": "randomEmail", "function": "faker.email"},
  {"var": "randomUUID", "function": "faker.uuid"},
  {"var": "currentTime", "function": "date.now"},
  {"var": "authToken", "function": "custom.authToken"},
  {"function": "dbQuery", "args": ["SELECT * FROM users"], "db": "userDb", "mapTo": {"userId": "id"}}
]

Available Functions:
faker.email, faker.uuid, faker.username, faker.name, faker.phone
date.now, encrypt, custom.authToken
generateUser (with mapTo), dbQuery (with mapTo)`,
        metadata: { type: 'preprocess-schema' }
      }),
      
      new Document({
        pageContent: `Assertion Schema:
{
  "type": "equals|notEquals|contains|startsWith|endsWith|greaterThan|lessThan|in|notIn|includesAll|length|size|statusCode|type|exists|regex|arrayObjectMatch",
  "jsonPath": "$.path.to.value",
  "expected": "expected-value",
  "xpathExpression": "optional-xpath",
  "matchField": "field-for-arrayObjectMatch",
  "matchValue": "value-for-arrayObjectMatch",
  "assertField": "field-to-assert"
}

Common Examples:
{"type": "statusCode", "jsonPath": "$", "expected": 200}
{"type": "exists", "jsonPath": "$.id"}
{"type": "equals", "jsonPath": "$.name", "expected": "John"}`,
        metadata: { type: 'assertion-schema' }
      })
    ]
  }
}