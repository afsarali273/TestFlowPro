"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Bot, X, Send, Upload, FileText, Code, Globe, Sparkles, Copy, Check, RotateCcw, Play, Square, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'

interface Message {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
}

interface GeneratedSuite {
  suiteName: string
  baseUrl?: string
  type: 'API' | 'UI'
  tags: Array<{ [key: string]: string }>
  testCases: any[]
}

export function AIChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('chat')
  const [curlCommand, setCurlCommand] = useState('')
  const [swaggerContent, setSwaggerContent] = useState('')
  const [uiSteps, setUiSteps] = useState('')
  const [recordUrl, setRecordUrl] = useState('')
  const [generatedSuite, setGeneratedSuite] = useState<GeneratedSuite | null>(null)
  const [saveLocation, setSaveLocation] = useState('')
  const [fileName, setFileName] = useState('')
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [generateTestCaseOnly, setGenerateTestCaseOnly] = useState(false)
  const [copied, setCopied] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const addMessage = (content: string, type: 'user' | 'ai') => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, newMessage])
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    addMessage(inputMessage, 'user')
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputMessage,
          type: 'general'
        })
      })

      const data = await response.json()
      
      if (data.testSuite) {
        setGeneratedSuite(data.testSuite)
        addMessage('I\'ve generated a test suite based on your requirements. You can review and save it below.', 'ai')
      } else {
        addMessage(data.response, 'ai')
      }
    } catch (error) {
      addMessage('Sorry, I encountered an error. Please try again.', 'ai')
    } finally {
      setIsLoading(false)
      setInputMessage('')
    }
  }

  const handleCurlGeneration = async () => {
    if (!curlCommand.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: curlCommand,
          type: 'curl'
        })
      })

      const data = await response.json()
      setGeneratedSuite(data.testSuite)
      toast({ title: 'Test Suite Generated', description: 'Generated from cURL command' })
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to generate test suite', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSwaggerGeneration = async () => {
    if (!swaggerContent.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: swaggerContent,
          type: 'swagger'
        })
      })

      const data = await response.json()
      setGeneratedSuite(data.testSuite)
      toast({ title: 'Test Suite Generated', description: 'Generated from Swagger specification' })
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to generate test suite', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUIStepsGeneration = async () => {
    if (!uiSteps.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: uiSteps,
          type: 'ui'
        })
      })

      const data = await response.json()
      setGeneratedSuite(data.testSuite)
      toast({ title: 'UI Test Suite Generated', description: 'Generated from test steps' })
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to generate UI test suite', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        if (file.name.endsWith('.json') || file.name.endsWith('.yaml') || file.name.endsWith('.yml')) {
          setSwaggerContent(content)
          setActiveTab('swagger')
        }
      }
      reader.readAsText(file)
    }
  }

  const handleSaveSuite = () => {
    if (!generatedSuite) {
      console.log('No generated suite to save')
      return
    }
    
    console.log('Opening save dialog for:', generatedSuite.suiteName)
    
    const defaultLocation = typeof window !== 'undefined' 
      ? localStorage.getItem('testSuitePath') || '/Users/afsarali/Repository/TestFlowPro/testData'
      : '/Users/afsarali/Repository/TestFlowPro/testData'
    const defaultFileName = `${generatedSuite.suiteName.replace(/[^a-zA-Z0-9]/g, '_')}.json`
    
    setSaveLocation(defaultLocation)
    setFileName(defaultFileName)
    setShowSaveDialog(true)
  }

  const handleConfirmSave = async () => {
    if (!generatedSuite || !saveLocation || !fileName) {
      console.log('Missing data:', { generatedSuite: !!generatedSuite, saveLocation, fileName })
      return
    }

    console.log('Saving suite to:', saveLocation, fileName)

    try {
      const response = await fetch('/api/save-test-suite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testSuite: generatedSuite,
          location: saveLocation,
          fileName: fileName
        })
      })

      const result = await response.json()
      console.log('Save response:', result)

      if (response.ok) {
        toast({ title: 'Success', description: 'Test suite saved successfully' })
        setGeneratedSuite(null)
        setShowSaveDialog(false)
        window.dispatchEvent(new CustomEvent('refresh-suites'))
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to save test suite', variant: 'destructive' })
      }
    } catch (error) {
      console.error('Save error:', error)
      toast({ title: 'Error', description: 'Failed to save test suite', variant: 'destructive' })
    }
  }

  const handleCopyTestCases = async () => {
    if (!generatedSuite) return
    
    const testCasesJson = JSON.stringify(generatedSuite.testCases, null, 2)
    
    try {
      await navigator.clipboard.writeText(testCasesJson)
      setCopied(true)
      toast({ title: 'Copied!', description: 'Test cases copied to clipboard' })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to copy to clipboard', variant: 'destructive' })
    }
  }

  const handleReset = () => {
    setMessages([])
    setInputMessage('')
    setCurlCommand('')
    setSwaggerContent('')
    setUiSteps('')
    setRecordUrl('')
    setGeneratedSuite(null)
    setCopied(false)
    toast({ title: 'Reset', description: 'Chat cleared successfully' })
  }

  const handleStartRecording = async () => {
    if (!recordUrl) return

    try {
      setIsLoading(true)
      
      const response = await fetch('/api/mcp-standalone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: recordUrl })
      })
      
      const result = await response.json()
      
      if (response.ok) {
        toast({
          title: 'Playwright Codegen Started',
          description: result.message
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      toast({
        title: 'Failed to Start Recording',
        description: error.message || 'Could not start Playwright codegen',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Floating Chat Icon */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 animate-pulse"
        size="icon"
      >
        <Bot className="h-6 w-6 text-white" />
      </Button>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl h-[85vh] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-purple-600" />
                AI Test Suite Generator
                <Sparkles className="h-4 w-4 text-yellow-500 animate-pulse" />
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={handleReset} title="Reset Chat">
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col overflow-hidden">
              {/* Generation Options */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={generateTestCaseOnly}
                    onChange={(e) => setGenerateTestCaseOnly(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span>Generate test cases only (without suite wrapper)</span>
                </label>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="chat">Chat</TabsTrigger>
                  <TabsTrigger value="curl">cURL</TabsTrigger>
                  <TabsTrigger value="swagger">Swagger</TabsTrigger>
                  <TabsTrigger value="ui">UI Steps</TabsTrigger>
                  <TabsTrigger value="record">Record</TabsTrigger>
                </TabsList>

                <TabsContent value="chat" className="flex-1 flex flex-col max-h-[calc(100vh-400px)]">
                  <div className="flex-1 min-h-0 overflow-y-auto border rounded-lg p-4 mb-4 space-y-4">
                    {messages.map((message) => (
                      <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-lg ${
                          message.type === 'user' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          {message.content}
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-4 rounded-lg border border-purple-200">
                          <div className="flex items-center space-x-3">
                            <Bot className="h-5 w-5 text-purple-600 animate-spin" />
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                            </div>
                            <span className="text-sm text-purple-700 font-medium animate-pulse">AI is thinking...</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <Input
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="Describe your API or test requirements..."
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <Button onClick={handleSendMessage} disabled={isLoading}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="curl" className="flex-1 flex flex-col">
                  <Textarea
                    value={curlCommand}
                    onChange={(e) => setCurlCommand(e.target.value)}
                    placeholder="Paste your cURL command here..."
                    className="flex-1 mb-4"
                  />
                  <Button onClick={handleCurlGeneration} disabled={isLoading} className="relative">
                    {isLoading ? (
                      <>
                        <Bot className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Code className="h-4 w-4 mr-2" />
                        Generate Test Suite
                      </>
                    )}
                  </Button>
                </TabsContent>

                <TabsContent value="swagger" className="flex-1 flex flex-col">
                  <div className="mb-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json,.yaml,.yml"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="mb-2"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Swagger File
                    </Button>
                  </div>
                  <Textarea
                    value={swaggerContent}
                    onChange={(e) => setSwaggerContent(e.target.value)}
                    placeholder="Paste your Swagger/OpenAPI specification here..."
                    className="flex-1 mb-4"
                  />
                  <Button onClick={handleSwaggerGeneration} disabled={isLoading} className="relative">
                    {isLoading ? (
                      <>
                        <Bot className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        Generate Test Suite
                      </>
                    )}
                  </Button>
                </TabsContent>

                <TabsContent value="ui" className="flex-1 flex flex-col">
                  <Textarea
                    value={uiSteps}
                    onChange={(e) => setUiSteps(e.target.value)}
                    placeholder="Describe your UI test steps (e.g., 'Navigate to login page, enter credentials, click login button, verify dashboard')..."
                    className="flex-1 mb-4"
                  />
                  <Button onClick={handleUIStepsGeneration} disabled={isLoading} className="relative">
                    {isLoading ? (
                      <>
                        <Bot className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Globe className="h-4 w-4 mr-2" />
                        Generate UI Test Suite
                      </>
                    )}
                  </Button>
                </TabsContent>

                <TabsContent value="record" className="flex-1 flex flex-col">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        URL to Record
                      </label>
                      <Input
                        value={recordUrl}
                        onChange={(e) => setRecordUrl(e.target.value)}
                        placeholder="https://example.com"
                        className="mb-4"
                      />
                    </div>
                    
                    <Button
                      onClick={handleStartRecording}
                      disabled={!recordUrl || isLoading}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start Playwright Codegen
                    </Button>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">🎬 Playwright Codegen</h4>
                      <div className="text-sm text-blue-700 space-y-2">
                        <p>1. Enter the URL you want to test</p>
                        <p>2. Click "Start Playwright Codegen"</p>
                        <p>3. Browser will open with recording tools</p>
                        <p>4. Perform your test actions</p>
                        <p>5. Copy the generated code from Playwright Inspector</p>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <h5 className="font-medium text-green-900 mb-2">💡 Tips</h5>
                      <div className="text-xs text-green-700 space-y-1">
                        <p>• Use the Playwright Inspector to see generated code</p>
                        <p>• Record multiple test scenarios</p>
                        <p>• Copy and convert the code to TestFlow Pro format</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Generated Suite Preview - Always visible */}
              {generatedSuite && (
                <div className="mt-4 border-t pt-4 flex-shrink-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">
                      {generateTestCaseOnly ? 'Generated Test Cases' : 'Generated Test Suite'}
                    </h3>
                    <div className="flex gap-2">
                      <Badge variant={generatedSuite.type === 'API' ? 'default' : 'secondary'}>
                        {generatedSuite.type}
                      </Badge>
                      <Button size="sm" variant="outline" onClick={handleCopyTestCases}>
                        {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                        {copied ? 'Copied!' : 'Copy'}
                      </Button>
                      {!generateTestCaseOnly && (
                        <Button size="sm" onClick={handleSaveSuite}>
                          Save Suite
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg max-h-40 overflow-y-auto">
                    <pre className="text-sm">
                      {generateTestCaseOnly 
                        ? JSON.stringify(generatedSuite.testCases, null, 2)
                        : JSON.stringify(generatedSuite, null, 2)
                      }
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Save Test Suite</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Save Location</label>
                <Input
                  value={saveLocation}
                  onChange={(e) => setSaveLocation(e.target.value)}
                  placeholder="/path/to/testData"
                />
              </div>
              <div>
                <label className="text-sm font-medium">File Name</label>
                <Input
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="test-suite.json"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleConfirmSave} className="flex-1">
                  Save
                </Button>
                <Button variant="outline" onClick={() => setShowSaveDialog(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}