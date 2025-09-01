import { ChatOllama } from '@langchain/ollama'
import { PromptTemplate } from '@langchain/core/prompts'
import { RunnableSequence } from '@langchain/core/runnables'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { MemoryVectorStore } from 'langchain/vectorstores/memory'
import { OllamaEmbeddings } from '@langchain/ollama'
import { RAGKnowledgeBase } from './rag-knowledge-base'
import { CurlParser } from './curl-parser'
import { TestSuite, validateTestSuite } from '@/types/test-suite'

interface ChatRequest {
  message: string
  type: 'general' | 'curl' | 'swagger' | 'ui'
}

interface GenerateRequest {
  prompt: string
  context: string
}

interface AIResponse {
  response?: string
  testSuite?: TestSuite
  status?: string
  retryCount?: number
}

export class AIService {
  private llm: ChatOllama
  private embeddings: OllamaEmbeddings
  private vectorStore: MemoryVectorStore | null = null
  private ragChains: { [key: string]: RunnableSequence }

  constructor(testDataPath?: string) {
    this.llm = new ChatOllama({
      baseUrl: 'http://localhost:11434',
      model: 'qwen2.5-coder:14b'  // Specialized for code generation and structured output
    })
    
    this.embeddings = new OllamaEmbeddings({
      baseUrl: 'http://localhost:11434', 
      model: 'llama3.1:8b'  // Keep for embeddings (works fine)
    })
    
    this.ragChains = this.initializeRAGChains()
    this.initializeVectorStore(testDataPath)
  }

  private async initializeVectorStore(testDataPath?: string) {
    console.log('🚀 Initializing AI Knowledge Base...')
    const defaultPath = testDataPath || '/Users/afsarali/Repository/TestFlowPro/testData'
    const docsPath = '/Users/afsarali/Repository/TestFlowPro/docs'
    console.log(`📂 Using testData path: ${defaultPath}`)
    console.log(`📂 Using docs path: ${docsPath}`)
    
    const frameworkDocs = RAGKnowledgeBase.getFrameworkDocuments()
    const uiKnowledge = await RAGKnowledgeBase.loadKnowledgeBase(docsPath, 'ui')
    const apiKnowledge = await RAGKnowledgeBase.loadKnowledgeBase(docsPath, 'api')
    const exampleDocs = await RAGKnowledgeBase.loadTestSuiteExamples(defaultPath)
    const conversionRules = RAGKnowledgeBase.getConversionRules()
    
    const allDocuments = [...frameworkDocs, ...uiKnowledge, ...apiKnowledge, ...exampleDocs, conversionRules]
    console.log(`📚 Total documents loaded: ${allDocuments.length} (Framework: ${frameworkDocs.length}, UI: ${uiKnowledge.length}, API: ${apiKnowledge.length}, Examples: ${exampleDocs.length})`)
    
    this.vectorStore = await MemoryVectorStore.fromDocuments(allDocuments, this.embeddings)
    console.log('✅ Vector store initialized successfully')
  }

  private initializeRAGChains() {
    const baseTemplate = `You are an expert API and UI test automation engineer for TestFlow Pro framework.

Context: {context}

User Request: {input}

Generate a valid JSON test suite that STRICTLY follows this schema:
- id: string (required)
- suiteName: string (required)
- type: "UI" | "API" (required)
- baseUrl: string (required for API)
- tags: array of objects with key-value pairs
- testCases: array with name, type ("SOAP"|"REST"|"UI"), testData (for API), testSteps (for UI)
- For API: testData with name, method, endpoint, headers, body, assertions (type, jsonPath, expected)
- For UI: testSteps with id, keyword, target/locator, value, assertions

IMPORTANT: Use double quotes for all strings and property names. Respond ONLY with valid JSON using double quotes.`

    const curlTemplate = `Convert this cURL command to TestFlow Pro API test suite JSON:

Context: {context}

cURL Command: {input}

STRICT CONVERSION RULES:
1. Extract method from -X or default to GET
2. Split URL into baseUrl (protocol + domain) and endpoint (path + query)
3. Parse -H headers, ignore browser-specific ones (sec-ch-ua, sec-fetch-*, user-agent)
4. Parse -d/--data as JSON body if possible
5. Ignore cookies (-b flag) and referer headers
6. Add timeout: 30000 for slow APIs
7. Generate descriptive test names from endpoint

Required JSON Schema:
{{
  "id": "unique-string",
  "suiteName": "Descriptive API Test",
  "type": "API",
  "baseUrl": "https://domain.com",
  "timeout": 30000,
  "testCases": [{{
    "name": "Test Case Name",
    "type": "REST",
    "testData": [{{
      "name": "Test Step Name",
      "method": "GET|POST|PUT|DELETE",
      "endpoint": "/path?query=value",
      "headers": {{"Content-Type": "application/json"}},
      "body": {{}},
      "assertions": [
        {{"type": "statusCode", "jsonPath": "$", "expected": 200}}
      ]
    }}]
  }}]
}}

Respond ONLY with valid JSON using double quotes. No explanations.`

    const swaggerTemplate = `Convert this Swagger/OpenAPI spec to TestFlow Pro API test suite JSON:

Context: {context}

Swagger Spec: {input}

STRICT API SCHEMA REQUIREMENTS:
- id: generate unique string
- suiteName: from API title
- type: "API"
- baseUrl: from servers array
- testCases: array with name, type "REST", testData array with name, method, endpoint, headers, body, assertions
- Use proper API assertion types: statusCode, exists, equals, contains, greaterThan, lessThan
- Include API preprocessing functions when needed: faker.email, faker.uuid, custom.authToken

Respond ONLY with valid JSON using double quotes. No explanations.`

    const uiTemplate = `Convert ALL Playwright steps to TestFlow Pro JSON:

{input}

Rules:
- page.goto(url) → {{"keyword":"goto","value":"url"}}
- page.getByRole('type', {{name: 'text'}}).click() → {{"keyword":"click","locator":{{"strategy":"role","value":"type","options":{{"name":"text"}}}}}}
- expect(locator).toBeVisible() → {{"keyword":"assertVisible","locator":{{"strategy":"text","value":"text"}}}}

Return complete JSON with ALL steps:
{{"id":"playwright-test","suiteName":"Playwright Test","type":"UI","baseUrl":"","testCases":[{{"name":"Test Case","type":"UI","testSteps":[...ALL_STEPS_HERE...]}}]}}`

    return {
      general: RunnableSequence.from([
        async (input: { input: string }) => {
          const context = this.vectorStore 
            ? (await this.vectorStore.similaritySearch(input.input, 3)).map(doc => doc.pageContent).join('\n\n')
            : ''
          return { context, input: input.input }
        },
        PromptTemplate.fromTemplate(baseTemplate),
        this.llm,
        new StringOutputParser()
      ]),
      curl: RunnableSequence.from([
        async (input: { input: string }) => {
          const context = this.vectorStore 
            ? (await this.vectorStore.similaritySearch('api-knowledge cURL conversion', 3)).map(doc => doc.pageContent).join('\n\n')
            : ''
          return { context, input: input.input }
        },
        PromptTemplate.fromTemplate(curlTemplate),
        this.llm,
        new StringOutputParser()
      ]),
      swagger: RunnableSequence.from([
        async (input: { input: string }) => {
          const context = this.vectorStore 
            ? (await this.vectorStore.similaritySearch('api-knowledge swagger OpenAPI', 3)).map(doc => doc.pageContent).join('\n\n')
            : ''
          return { context, input: input.input }
        },
        PromptTemplate.fromTemplate(swaggerTemplate),
        this.llm,
        new StringOutputParser()
      ]),
      ui: RunnableSequence.from([
        async (input: { input: string }) => {
          const context = this.vectorStore 
            ? (await this.vectorStore.similaritySearch('ui-knowledge playwright conversion', 4)).map(doc => doc.pageContent).join('\n\n')
            : ''
          return { context, input: input.input }
        },
        PromptTemplate.fromTemplate(uiTemplate),
        this.llm,
        new StringOutputParser()
      ])
    }
  }

  private validateTestSuite(obj: any): boolean {
    return obj && 
           typeof obj.id === 'string' &&
           typeof obj.suiteName === 'string' &&
           obj.type === 'UI' &&
           Array.isArray(obj.testCases) &&
           obj.testCases.length > 0 &&
           Array.isArray(obj.testCases[0].testSteps)
  }

  private fixOptionsPlacement(testSuite: any): any {
    if (!testSuite.testCases) return testSuite
    
    testSuite.testCases.forEach((testCase: any) => {
      if (!testCase.testSteps) return
      
      testCase.testSteps.forEach((step: any) => {
        if (step.options && step.locator && !step.locator.options) {
          step.locator.options = step.options
          delete step.options
        }
      })
    })
    
    return testSuite
  }

  async generateContent(request: GenerateRequest): Promise<{ content: string }> {
    try {
      const chain = this.ragChains.general
      const response = await chain.invoke({ input: request.prompt })
      return { content: typeof response === 'string' ? response : String(response) }
    } catch (error) {
      console.error('AI Content Generation Error:', error)
      throw new Error('Failed to generate AI content')
    }
  }

  async generateResponse(request: ChatRequest, onStatusUpdate?: (status: string) => void): Promise<AIResponse> {
    try {
      // Handle cURL commands with AI-enhanced parser
      if (request.type === 'curl' && request.message.trim().startsWith('curl')) {
        try {
          onStatusUpdate?.('Parsing cURL command...')
          const parsed = CurlParser.parse(request.message)
          
          onStatusUpdate?.('Generating AI-powered test scenarios...')
          const testSuite = await CurlParser.generateTestSuite(parsed, true)
          
          onStatusUpdate?.('cURL converted with AI test scenarios!')
          return {
            testSuite,
            status: 'success',
            response: `Successfully converted cURL to comprehensive TestFlow Pro test suite with positive/negative scenarios for ${parsed.baseUrl}`
          }
        } catch (curlError) {
          console.warn('cURL parser failed, falling back to AI:', curlError)
          onStatusUpdate?.('cURL parser failed, using AI fallback...')
        }
      }
      
      const chain = this.ragChains[request.type] || this.ragChains.general
      let response = await chain.invoke({ input: request.message })

      // Retry with stricter prompt if needed
      let retryCount = 0
      while (retryCount < 2) {
        // Extract JSON from response - handle various formats
        let jsonStr = typeof response === 'string' ? response.trim() : String(response).trim()
        
        console.log('Raw AI response:', jsonStr.substring(0, 200))
        
        // Handle markdown code blocks first
        const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
        if (codeBlockMatch) {
          jsonStr = codeBlockMatch[1].trim()
        }
        
        // Parse the JSON (could be array or object)
        let rawData
        try {
          rawData = JSON.parse(jsonStr)
        } catch (parseError) {
          console.error('Parse failed:', parseError)
          console.log('Failed JSON string:', jsonStr.substring(0, 500))
          
          if (retryCount < 1) {
            retryCount++
            onStatusUpdate?.(`Parsing failed, retrying with stricter prompt... (${retryCount}/2)`)
            
            // Retry with more specific prompt for cURL
            if (request.type === 'curl') {
              const strictCurlPrompt = `Extract ONLY the essential parts from this cURL and create a minimal TestFlow Pro JSON:

${request.message}

Return ONLY this JSON structure with NO explanations:
{{
  "id": "api-test-${Date.now()}",
  "suiteName": "API Test Suite",
  "type": "API",
  "baseUrl": "EXTRACT_BASE_URL_HERE",
  "timeout": 30000,
  "testCases": [{{
    "name": "API Test",
    "type": "REST",
    "testData": [{{
      "name": "Test Request",
      "method": "EXTRACT_METHOD_HERE",
      "endpoint": "EXTRACT_ENDPOINT_HERE",
      "headers": {{"Accept": "application/json"}},
      "assertions": [{{"type": "statusCode", "jsonPath": "$", "expected": 200}}]
    }}]
  }}]
}}`
              
              response = await this.llm.invoke(strictCurlPrompt)
              continue
            }
            
            response = await chain.invoke({ input: `Generate a simple valid TestFlow Pro JSON for: ${request.message}` })
            continue
          }
          throw parseError
        }
        
        let rawSuite
        if (Array.isArray(rawData)) {
          // AI returned array of steps, wrap in test suite
          console.log('Converting steps array to test suite...')
          rawSuite = {
            id: `playwright-${Date.now()}`,
            suiteName: 'Playwright Test Suite',
            type: 'UI',
            baseUrl: '',
            testCases: [{
              name: 'Test Case',
              type: 'UI',
              testSteps: rawData.map((step, index) => ({
                id: `step-${index + 1}`,
                ...step,
                assertions: step.assertions || []
              }))
            }]
          }
        } else {
          rawSuite = rawData
        }
        
        try {
          
          // Fix if AI returned array instead of complete suite
          if (Array.isArray(rawSuite)) {
            console.log('AI returned array, converting to test suite...')
            rawSuite = {
              id: `generated-${Date.now()}`,
              suiteName: 'Generated Test Suite',
              type: 'UI',
              baseUrl: '',
              testCases: rawSuite
            }
          }
          
          // Fix options placement if needed
          rawSuite = this.fixOptionsPlacement(rawSuite)
          
          // Fix missing step IDs
          rawSuite.testCases?.forEach((testCase: any) => {
            testCase.testSteps?.forEach((step: any, index: number) => {
              if (!step.id || step.id === '') {
                step.id = `step-${index + 1}`
              }
            })
          })
          
          // Validate structure
          if (this.validateTestSuite(rawSuite)) {
            const testSuite = validateTestSuite(rawSuite)
            return { testSuite, status: retryCount > 0 ? `✅ Success after ${retryCount + 1} attempts` : '✅ Success' }
          } else if (retryCount < 1) {
            console.log('Invalid structure, retrying with stricter prompt...')
            onStatusUpdate?.('🔧 Invalid structure detected, retrying with template...')
            const strictPrompt = `Convert this Playwright code to valid TestFlow Pro JSON. Return ONLY this exact structure: {{"id":"test","suiteName":"Test","type":"UI","baseUrl":"","testCases":[{{"name":"Case","type":"UI","testSteps":[...]}}]}}. Input: ${request.message}`
            response = await this.llm.invoke(strictPrompt)
            retryCount++
            continue
          }
        } catch (parseError) {
          console.error('Parse error:', parseError)
          if (retryCount < 1) {
            onStatusUpdate?.('⚠️ JSON parse error, retrying...')
            retryCount++
            continue
          }
        }
        break
      }

      return { response }
    } catch (error) {
      console.error('AI Service Error:', error)
      throw new Error('Failed to generate response')
    }
  }

  // Static method for easy access
  static async generateAIContent(prompt: string, context: string = ''): Promise<string> {
    const service = new AIService()
    const result = await service.generateContent({ prompt, context })
    return result.content
  }
}