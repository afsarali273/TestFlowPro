import { ChatOllama } from '@langchain/ollama'
import { PromptTemplate } from '@langchain/core/prompts'
import { RunnableSequence } from '@langchain/core/runnables'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { MemoryVectorStore } from 'langchain/vectorstores/memory'
import { OllamaEmbeddings } from '@langchain/ollama'
import { Document } from '@langchain/core/documents'
import { RAGKnowledgeBase } from './rag-knowledge-base'
import { TestSuite, validateTestSuite } from '../../types/test-suite'

interface ChatRequest {
  message: string
  type: 'general' | 'curl' | 'swagger' | 'ui'
}

export class AIService {
  private llm: ChatOllama
  private embeddings: OllamaEmbeddings
  private vectorStore: MemoryVectorStore | null = null
  private ragChains: { [key: string]: RunnableSequence }

  constructor(testDataPath?: string) {
    this.llm = new ChatOllama({
      baseUrl: 'http://localhost:11434',
      model: 'llama3.1:8b'
    })
    
    this.embeddings = new OllamaEmbeddings({
      baseUrl: 'http://localhost:11434',
      model: 'llama3.1:8b'
    })
    
    this.ragChains = this.initializeRAGChains()
    this.initializeVectorStore(testDataPath)
  }

  private async initializeVectorStore(testDataPath?: string) {
    const frameworkDocs = RAGKnowledgeBase.getFrameworkDocuments()
    const defaultPath = testDataPath || '/Users/afsarali/Repository/TestFlowPro/testData/'
    const exampleDocs = await RAGKnowledgeBase.loadTestSuiteExamples(defaultPath)
    
    const allDocuments = [...frameworkDocs, ...exampleDocs]
    this.vectorStore = await MemoryVectorStore.fromDocuments(allDocuments, this.embeddings)
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

STRICT SCHEMA REQUIREMENTS:
- id: generate unique string
- suiteName: descriptive name
- type: "API"
- baseUrl: extract from URL
- testCases: array with name, type "REST", testData array with name, method, endpoint, headers, body, assertions
- assertions must have type "statusCode", jsonPath "$", expected 200 or 201

Respond ONLY with valid JSON using double quotes. No explanations.`

    const swaggerTemplate = `Convert this Swagger/OpenAPI spec to TestFlow Pro API test suite JSON:

Context: {context}

Swagger Spec: {input}

STRICT SCHEMA REQUIREMENTS:
- id: generate unique string
- suiteName: from API title
- type: "API"
- baseUrl: from servers array
- testCases: array with name, type "REST", testData array with name, method, endpoint, headers, body, assertions
- Use proper assertion types: statusCode, exists, equals, contains

Respond ONLY with valid JSON using double quotes. No explanations.`

    const uiTemplate = `Convert these UI test steps to TestFlow Pro UI test suite JSON:

Context: {context}

UI Steps: {input}

STRICT SCHEMA REQUIREMENTS:
- id: generate unique string
- suiteName: descriptive name
- type: "UI"
- baseUrl: empty string for UI
- testCases: array with name, type "UI", testSteps array
- testSteps: id, keyword, locator (preferred) or target (fallback), value
- Keywords: openBrowser, goto, click, type, select, waitFor, assertText, assertVisible, screenshot
- Locator strategies: role, label, text, placeholder, altText, testId, css
- Use locator object with strategy and value, prefer semantic locators (role, label, text) over CSS

Respond ONLY with valid JSON using double quotes. No explanations.`

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
            ? (await this.vectorStore.similaritySearch('API structure cURL', 2)).map(doc => doc.pageContent).join('\n\n')
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
            ? (await this.vectorStore.similaritySearch('API structure swagger', 2)).map(doc => doc.pageContent).join('\n\n')
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
            ? (await this.vectorStore.similaritySearch('UI structure playwright', 2)).map(doc => doc.pageContent).join('\n\n')
            : ''
          return { context, input: input.input }
        },
        PromptTemplate.fromTemplate(uiTemplate),
        this.llm,
        new StringOutputParser()
      ])
    }
  }

  async generateResponse(request: ChatRequest): Promise<{ response?: string; testSuite?: TestSuite }> {
    try {
      const chain = this.ragChains[request.type] || this.ragChains.general
      const response = await chain.invoke({ input: request.message })

      // Try to extract and clean JSON
      let jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          let jsonStr = jsonMatch[0]
          // Clean up common JSON issues
          jsonStr = jsonStr.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*):/g, '$1"$2":')
          jsonStr = jsonStr.replace(/:\s*([a-zA-Z_][a-zA-Z0-9_]*)(\s*[,}])/g, ': "$1"$2')
          
          const rawSuite = JSON.parse(jsonStr)
          const testSuite = validateTestSuite(rawSuite)
          return { testSuite }
        } catch (parseError) {
          console.error('Failed to parse JSON:', parseError)
          console.error('Raw response:', response)
        }
      }

      return { response }
    } catch (error) {
      console.error('AI Service Error:', error)
      throw new Error('Failed to generate response')
    }
  }
}