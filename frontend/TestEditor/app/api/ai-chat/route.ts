import { NextRequest, NextResponse } from 'next/server'
import { AIService } from '../../../lib/ai/ai-service'
import path from 'path'

let aiService: AIService | null = null

const getAIService = async () => {
  if (!aiService) {
    const testDataPath = path.join(process.cwd(), 'testData')
    aiService = new AIService(testDataPath)
  }
  return aiService
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, type } = body

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const service = await getAIService()
    const result = await service.generateResponse({ message, type })
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('AI Chat API Error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}