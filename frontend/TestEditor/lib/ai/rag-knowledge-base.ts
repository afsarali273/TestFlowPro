import { Document } from '@langchain/core/documents'
import fs from 'fs/promises'
import path from 'path'

export class RAGKnowledgeBase {
  static async loadTestSuiteExamples(testDataPath: string): Promise<Document[]> {
    const documents: Document[] = []
    
    try {
      console.log(`🔍 Loading test examples from: ${testDataPath}`)
      await fs.access(testDataPath)
      const files = await fs.readdir(testDataPath)
      const jsonFiles = files.filter(file => file.endsWith('.json'))
      console.log(`📁 Found ${jsonFiles.length} JSON files: ${jsonFiles.join(', ')}`)
      
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
          console.log(`✅ Loaded example: ${file} (${testSuite.type || 'API'} - ${testSuite.suiteName})`)
        } catch (error) {
          console.warn(`❌ Failed to load ${file}:`, error)
        }
      }
      console.log(`📚 Total test examples loaded: ${documents.length}`)
    } catch (error) {
      console.warn('⚠️ TestData directory not found, using framework docs only')
    }
    
    return documents
  }

  static async loadKnowledgeBase(docsPath: string, type: 'ui' | 'api'): Promise<Document[]> {
    const documents: Document[] = []
    
    try {
      console.log(`🧠 Loading ${type.toUpperCase()} knowledge base from: ${docsPath}`)
      const knowledgeFiles = {
        ui: [
          'ui-playwright-knowledge-base.md',
          'ui-playwright-conversion-examples.json', 
          'ui-testflow-schema.json',
          'strict-conversion-rules.md'
        ],
        api: [
          'api-testing-knowledge-base.md', 
          'api-conversion-examples.json',
          'api-testflow-schema.json',
          'api-testdata-format.md',
          'curl-conversion-rules.md',
          'postman-conversion-examples.md'
        ]
      }
      
      for (const fileName of knowledgeFiles[type]) {
        try {
          const filePath = path.join(docsPath, fileName)
          const content = await fs.readFile(filePath, 'utf-8')
          const contentSize = Math.round(content.length / 1024)
          
          documents.push(new Document({
            pageContent: content,
            metadata: {
              type: `${type}-knowledge`,
              fileName,
              source: 'knowledge-base'
            }
          }))
          console.log(`✅ Loaded ${type} knowledge: ${fileName} (${contentSize}KB)`)
        } catch (error) {
          console.warn(`❌ Failed to load ${fileName}:`, error)
        }
      }
      console.log(`🎯 Total ${type} knowledge files loaded: ${documents.length}`)
    } catch (error) {
      console.warn('⚠️ Knowledge base files not found')
    }
    
    return documents
  }

  static getFrameworkDocuments(): Document[] {
    console.log('📋 Loading framework documents...')
    const docs = [
      new Document({
        pageContent: `STRICT API TESTDATA FORMAT - TestFlow Pro:

CORRECT testData Array Structure:
"testData": [
  {
    "name": "Valid Request",
    "method": "GET",
    "endpoint": "/api/users",
    "headers": {"Accept": "application/json"},
    "assertions": [{"type": "statusCode", "expected": 200}]
  },
  {
    "name": "Invalid Request",
    "method": "GET",
    "endpoint": "/api/users",
    "headers": {"Accept": "application/json"},
    "assertions": [{"type": "statusCode", "expected": 400}]
  }
]

INCORRECT PATTERNS TO AVOID:
❌ NEVER nest testCases inside testData
❌ NEVER add id, suiteName, type, baseUrl inside testData objects
❌ NEVER create nested test suite structure in testData
❌ testData should be FLAT array of test objects

CORRECT testData Object Fields:
- name: string (required)
- method: string (required)
- endpoint: string (required)
- headers: object (required)
- body: object (optional)
- assertions: array (required)
- preProcess: array (optional)
- store: object (optional)

FULL CORRECT API SUITE:
{
  "id": "api-suite-123",
  "suiteName": "API Test Suite",
  "type": "API",
  "baseUrl": "https://api.example.com",
  "testCases": [{
    "name": "User Operations",
    "type": "REST",
    "testData": [
      {
        "name": "Create User",
        "method": "POST",
        "endpoint": "/users",
        "headers": {"Content-Type": "application/json"},
        "body": {"name": "John", "email": "john@example.com"},
        "assertions": [{"type": "statusCode", "expected": 201}]
      },
      {
        "name": "Get User",
        "method": "GET",
        "endpoint": "/users/1",
        "headers": {"Accept": "application/json"},
        "assertions": [{"type": "statusCode", "expected": 200}]
      }
    ]
  }]
}`,
        metadata: { type: 'api-testdata-format' }
      }),
      
      new Document({
        pageContent: `cURL to TestFlow Pro Conversion Examples:

Example 1 - GET with headers:
curl 'https://api.example.com/users/123' -H 'Authorization: Bearer token' -H 'Accept: application/json'

Converts to:
{
  "id": "get-user-test",
  "suiteName": "Get User API Test",
  "type": "API",
  "baseUrl": "https://api.example.com",
  "testCases": [{
    "name": "Get User",
    "type": "REST",
    "testData": [{
      "name": "Get User by ID",
      "method": "GET",
      "endpoint": "/users/123",
      "headers": {
        "Authorization": "Bearer token",
        "Accept": "application/json"
      },
      "assertions": [
        {"type": "statusCode", "jsonPath": "$", "expected": 200},
        {"type": "exists", "jsonPath": "$.id"}
      ]
    }]
  }]
}

Example 2 - POST with body:
curl -X POST 'https://api.example.com/users' -H 'Content-Type: application/json' -d '{"name":"John","email":"john@example.com"}'

Converts to:
{
  "id": "create-user-test",
  "suiteName": "Create User API Test",
  "type": "API",
  "baseUrl": "https://api.example.com",
  "testCases": [{
    "name": "Create User",
    "type": "REST",
    "testData": [{
      "name": "Create New User",
      "method": "POST",
      "endpoint": "/users",
      "headers": {"Content-Type": "application/json"},
      "body": {"name": "John", "email": "john@example.com"},
      "assertions": [
        {"type": "statusCode", "jsonPath": "$", "expected": 201},
        {"type": "exists", "jsonPath": "$.id"}
      ]
    }]
  }]
}

cURL Parsing Rules:
1. Extract method from -X flag or default to GET
2. Extract URL and split into baseUrl + endpoint
3. Parse -H headers into headers object
4. Parse -d or --data body into body object (try JSON.parse)
5. Ignore cookies (-b) and browser-specific headers
6. Add timeout configuration for slow APIs
7. Always include basic assertions (statusCode, exists)`,
        metadata: { type: 'curl-conversion' }
      }),
      
      new Document({
        pageContent: `TestFlow Pro UI Schema CORRECT Example:
{
  "id": "ui-suite-123",
  "suiteName": "UI Test Suite",
  "type": "UI",
  "baseUrl": "",
  "tags": ["testType=@ui", "suiteType=@smoke"],
  "testCases": [{
    "name": "Login Flow",
    "type": "UI",
    "testSteps": [
      {"id": "step-1", "keyword": "goto", "value": "https://example.com/login"},
      {"id": "step-2", "keyword": "fill", "locator": {"strategy": "testId", "value": "email"}, "value": "user@example.com"},
      {"id": "step-3", "keyword": "press", "locator": {"strategy": "testId", "value": "password"}, "value": "Enter"},
      {"id": "step-4", "keyword": "click", "locator": {"strategy": "role", "value": "button"}},
      {"id": "step-5", "keyword": "assertVisible", "locator": {"strategy": "text", "value": "Dashboard"}}
    ]
  }]
}

CRITICAL CONVERSION RULES:
1. goto steps: NO locator field, only "value" with URL
2. press() action: use "press" keyword, NOT "click"
3. fill() action: use "fill" keyword, NOT "type"
4. role strategy: "role" NOT "heading" - use getByRole() mapping
5. Proper locator structure: {"strategy": "role", "value": "button", "options": {"name": "Submit"}}
6. Never use "strategy": "value" - this is invalid
7. For role-based locators: strategy="role", value=role_type, options.name=accessible_name`,
        metadata: { type: 'ui-example' }
      })
    ]
    console.log(`📖 Framework documents loaded: ${docs.length}`)
    return docs
  }
  
  static getConversionRules(): Document {
    return new Document({
      pageContent: `PLAYWRIGHT TO TESTFLOW CONVERSION RULES:

CORRECT CONVERSIONS:
✅ page.goto('url') → {"keyword": "goto", "value": "url"} (NO locator field)
✅ page.getByRole('button').click() → {"keyword": "click", "locator": {"strategy": "role", "value": "button"}}
✅ page.getByRole('button', {name: 'Submit'}).click() → {"keyword": "click", "locator": {"strategy": "role", "value": "button", "options": {"name": "Submit"}}}
✅ page.getByRole('searchbox').fill('text') → {"keyword": "fill", "locator": {"strategy": "role", "value": "searchbox"}, "value": "text"}
✅ page.getByRole('searchbox').press('Enter') → {"keyword": "press", "locator": {"strategy": "role", "value": "searchbox"}, "value": "Enter"}
✅ page.getByRole('heading', {name: 'Title'}) → {"strategy": "role", "value": "heading", "options": {"name": "Title"}}

INCORRECT PATTERNS TO AVOID:
❌ NEVER use "strategy": "value" - this is invalid
❌ NEVER use "strategy": "heading" - use "role" with value "heading"
❌ NEVER add locator field to goto steps
❌ NEVER use "click" for press() actions - use "press" keyword
❌ NEVER use "type" keyword - use "fill" keyword

KEYWORD MAPPING:
- .goto() → "goto" (value only, no locator)
- .click() → "click" (requires locator)
- .fill() → "fill" (requires locator + value)
- .press() → "press" (requires locator + value)
- expect().toBeVisible() → "assertVisible" (requires locator)

LOCATOR STRATEGY MAPPING:
- getByRole() → "strategy": "role"
- getByText() → "strategy": "text"
- getByLabel() → "strategy": "label"
- getByTestId() → "strategy": "testId"
- getByPlaceholder() → "strategy": "placeholder"`,
      metadata: { type: 'conversion-rules' }
    })
  }


}