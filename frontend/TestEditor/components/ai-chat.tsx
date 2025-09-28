"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Bot, X, Send, Upload, FileText, Code, Globe, Sparkles, Copy, Check, RotateCcw, Play, Square, Download, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { AI_CONFIG } from '../ai-config'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

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
  const [curlResponse, setCurlResponse] = useState<any>(null)
  const [jsonPath, setJsonPath] = useState('')
  const [filteredResult, setFilteredResult] = useState<any>(null)
  const [swaggerContent, setSwaggerContent] = useState('')
  const [uiSteps, setUiSteps] = useState('')
  const [recordUrl, setRecordUrl] = useState('')
  const [generatedSuite, setGeneratedSuite] = useState<GeneratedSuite | null>(null)
  const [saveLocation, setSaveLocation] = useState('')
  const [fileName, setFileName] = useState('')
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [generateTestCaseOnly, setGenerateTestCaseOnly] = useState(false)
  const [copied, setCopied] = useState(false)
  const [aiProvider, setAiProvider] = useState<'ollama' | 'github-copilot'>(AI_CONFIG.defaults.provider)
  const [showProviderSettings, setShowProviderSettings] = useState(false)
  const [githubAuthStatus, setGithubAuthStatus] = useState<'unknown' | 'authenticated' | 'not-authenticated'>('unknown')
  const [showTokenInput, setShowTokenInput] = useState(false)
  const [githubToken, setGithubToken] = useState('')
  const [deviceFlow, setDeviceFlow] = useState<{ userCode: string; verificationUri: string; deviceCode: string } | null>(null)
  const [isPolling, setIsPolling] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])
  
  useEffect(() => {
    // Check GitHub auth status when provider changes
    if (aiProvider === 'github-copilot') {
      checkGitHubAuth()
    }
  }, [aiProvider])
  
  // Clear device flow when switching away from GitHub Copilot
  useEffect(() => {
    if (aiProvider !== 'github-copilot') {
      setDeviceFlow(null)
      setIsPolling(false)
    }
  }, [aiProvider])
  
  const checkGitHubAuth = async () => {
    try {
      const { GitHubAuthService } = await import('@/lib/services/githubAuth')
      const authService = new GitHubAuthService()
      const status = await authService.checkAuthStatus()
      const isAuthenticated = status.hasToken && status.isValid
      setGithubAuthStatus(isAuthenticated ? 'authenticated' : 'not-authenticated')
      
      // Clear device flow only if already authenticated
      if (isAuthenticated && deviceFlow) {
        setDeviceFlow(null)
        setIsPolling(false)
      }
    } catch (error) {
      setGithubAuthStatus('not-authenticated')
    }
  }
  
  const handleGitHubAuth = async () => {
    try {
      setIsLoading(true)
      const { GitHubAuthService } = await import('@/lib/services/githubAuth')
      const authService = new GitHubAuthService()
      const flow = await authService.startDeviceFlow()
      
      console.log('Device flow response:', flow)
      setDeviceFlow(flow)
      
      toast({ 
        title: 'GitHub Authentication Started', 
        description: `Code: ${flow.userCode} - Opening GitHub...` 
      })
      
      // Open GitHub auth page after a short delay to ensure state is set
      setTimeout(() => {
        window.open(flow.verificationUri, '_blank')
      }, 500)
      
      // Start polling for token
      startPolling(authService, flow.deviceCode, flow.interval)
    } catch (error: any) {
      console.error('GitHub auth error:', error)
      toast({ title: 'Error', description: error.message || 'Authentication failed', variant: 'destructive' })
      setIsLoading(false)
    }
  }
  
  const startPolling = async (authService: any, deviceCode: string, interval: number) => {
    setIsPolling(true)
    setIsLoading(false) // Allow UI to show device code while polling
    
    const poll = async () => {
      try {
        console.log('Polling for token...')
        const result = await authService.pollForToken(deviceCode)
        
        if (result.success) {
          console.log('Authentication successful!')
          setGithubAuthStatus('authenticated')
          setDeviceFlow(null)
          setIsPolling(false)
          toast({ title: '✅ Success', description: 'GitHub authentication successful!' })
          return
        }
        
        if (result.pending) {
          console.log('Still pending, polling again...')
          setTimeout(poll, interval * 1000)
        }
      } catch (error: any) {
        console.error('Polling error:', error)
        // Don't clear device flow on polling errors - keep showing the code
        if (error.message?.includes('Body is unusable') || error.message?.includes('authorization_pending')) {
          console.log('Continuing to poll despite error...')
          setTimeout(poll, interval * 1000)
        } else {
          setIsPolling(false)
          setDeviceFlow(null)
          toast({ title: 'Error', description: error.message || 'Authentication failed', variant: 'destructive' })
        }
      }
    }
    
    // Start polling immediately, then continue at intervals
    setTimeout(poll, 2000) // Start after 2 seconds
  }
  
  const handleReAuth = async () => {
    try {
      setIsLoading(true)
      const { GitHubAuthService } = await import('@/lib/services/githubAuth')
      const authService = new GitHubAuthService()
      await authService.clearTokens()
      setGithubAuthStatus('not-authenticated')
      setDeviceFlow(null)
      setIsPolling(false)
      toast({ title: 'Cleared', description: 'Please authenticate again with new permissions' })
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to clear tokens', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleManualTokenSubmit = async () => {
    if (!githubToken.trim()) {
      toast({ title: 'Error', description: 'Please enter a valid GitHub token', variant: 'destructive' })
      return
    }
    
    try {
      setIsLoading(true)
      const { GitHubAuthService } = await import('@/lib/services/githubAuth')
      const authService = new GitHubAuthService()
      await authService.setToken(githubToken)
      setGithubAuthStatus('authenticated')
      setShowTokenInput(false)
      setGithubToken('')
      toast({ title: 'Success', description: 'GitHub token saved successfully' })
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to save token', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

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
      const endpoint = aiProvider === 'github-copilot' ? '/api/copilot-chat' : '/api/ai-chat'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputMessage,
          type: 'general',
          provider: aiProvider
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        let errorMessage = 'Sorry, I encountered an error. Please try again.'
        
        if (response.status === 402) {
          errorMessage = '💳 GitHub Copilot quota exceeded. You have no remaining quota. Please check your subscription or switch to Ollama provider.'
        } else if (errorData.error) {
          errorMessage = `❌ API Error (${response.status}): ${errorData.error}`
        }
        
        addMessage(errorMessage, 'ai')
        setIsLoading(false)
        setInputMessage('')
        return
      }
      
      const data = await response.json()
      
      if (aiProvider === 'github-copilot') {
        addMessage(data.response, 'ai')
        // Try to extract JSON if it looks like a test suite
        try {
          const jsonMatch = data.response.match(/```json\s*([\s\S]*?)\s*```/) || data.response.match(/{[\s\S]*}/)
          if (jsonMatch && jsonMatch[0].includes('testCases')) {
            const jsonStr = jsonMatch[1] || jsonMatch[0]
            const parsedSuite = JSON.parse(jsonStr)
            setGeneratedSuite(parsedSuite)
          }
        } catch (parseError) {
          // Ignore parsing errors for general chat
        }
      } else {
        if (data.testSuite) {
          setGeneratedSuite(data.testSuite)
          addMessage('I\'ve generated a test suite based on your requirements. You can review and save it below.', 'ai')
        } else {
          addMessage(data.response, 'ai')
        }
      }
    } catch (error: any) {
      const errorResponse = await error.response?.json?.() || {}
      let errorMessage = 'Sorry, I encountered an error. Please try again.'
      
      if (error.response?.status === 402) {
        errorMessage = '💳 GitHub Copilot quota exceeded. Please check your subscription or switch to Ollama provider.'
      } else if (errorResponse.error) {
        errorMessage = `❌ ${errorResponse.error}`
      }
      
      addMessage(errorMessage, 'ai')
    } finally {
      setIsLoading(false)
      setInputMessage('')
    }
  }

  const handleCurlGeneration = async () => {
    if (!curlCommand.trim()) return

    setIsLoading(true)
    try {
      const endpoint = aiProvider === 'github-copilot' ? '/api/copilot-chat' : '/api/ai-chat'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: curlCommand,
          type: 'curl',
          provider: aiProvider
        })
      })

      const data = await response.json()
      if (aiProvider === 'github-copilot') {
        try {
          const jsonMatch = data.response.match(/```json\s*([\s\S]*?)\s*```/) || data.response.match(/{[\s\S]*}/)
          if (jsonMatch) {
            const jsonStr = jsonMatch[1] || jsonMatch[0]
            const parsedSuite = JSON.parse(jsonStr)
            setGeneratedSuite(parsedSuite)
          } else {
            throw new Error('No JSON found in response')
          }
        } catch (parseError) {
          console.error('Failed to parse GitHub Copilot response:', parseError)
          toast({ title: 'Error', description: 'Failed to parse AI response', variant: 'destructive' })
          return
        }
      } else {
        setGeneratedSuite(data.testSuite)
      }
      toast({ title: 'Test Suite Generated', description: 'Generated from cURL command' })
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to generate test suite', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestCurl = async () => {
    if (!curlCommand.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/test-curl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ curlCommand })
      })

      const data = await response.json()
      setCurlResponse(data)
      toast({ title: 'cURL Executed', description: 'Response received successfully' })
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to execute cURL', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleJsonPathFilter = () => {
    if (!curlResponse || !jsonPath.trim()) {
      setFilteredResult(null)
      return
    }

    try {
      // Simple JSONPath implementation for basic queries
      const data = curlResponse.data
      let result = data
      
      if (jsonPath === '$') {
        result = data
      } else if (jsonPath.startsWith('$.')) {
        const path = jsonPath.substring(2)
        const parts = path.split('.')
        
        for (const part of parts) {
          if (part.includes('[') && part.includes(']')) {
            const [key, indexStr] = part.split('[')
            const index = parseInt(indexStr.replace(']', ''))
            result = key ? result[key][index] : result[index]
          } else {
            result = result[part]
          }
          if (result === undefined) break
        }
      }
      
      setFilteredResult(result)
    } catch (error) {
      toast({ title: 'Error', description: 'Invalid JSONPath expression', variant: 'destructive' })
      setFilteredResult(null)
    }
  }

  const handleSwaggerGeneration = async () => {
    if (!swaggerContent.trim()) return

    setIsLoading(true)
    try {
      const endpoint = aiProvider === 'github-copilot' ? '/api/copilot-chat' : '/api/ai-chat'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: swaggerContent,
          type: 'swagger',
          provider: aiProvider
        })
      })

      const data = await response.json()
      if (aiProvider === 'github-copilot') {
        try {
          const jsonMatch = data.response.match(/```json\s*([\s\S]*?)\s*```/) || data.response.match(/{[\s\S]*}/)
          if (jsonMatch) {
            const jsonStr = jsonMatch[1] || jsonMatch[0]
            const parsedSuite = JSON.parse(jsonStr)
            setGeneratedSuite(parsedSuite)
          } else {
            throw new Error('No JSON found in response')
          }
        } catch (parseError) {
          console.error('Failed to parse GitHub Copilot response:', parseError)
          toast({ title: 'Error', description: 'Failed to parse AI response', variant: 'destructive' })
          return
        }
      } else {
        setGeneratedSuite(data.testSuite)
      }
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
      const endpoint = aiProvider === 'github-copilot' ? '/api/copilot-chat' : '/api/ai-chat'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: uiSteps,
          type: 'ui',
          provider: aiProvider
        })
      })

      const data = await response.json()
      if (aiProvider === 'github-copilot') {
        // Parse GitHub Copilot response
        try {
          const jsonMatch = data.response.match(/```json\s*([\s\S]*?)\s*```/) || data.response.match(/{[\s\S]*}/)
          if (jsonMatch) {
            const jsonStr = jsonMatch[1] || jsonMatch[0]
            const parsedSuite = JSON.parse(jsonStr)
            setGeneratedSuite(parsedSuite)
          } else {
            throw new Error('No JSON found in response')
          }
        } catch (parseError) {
          console.error('Failed to parse GitHub Copilot response:', parseError)
          toast({ title: 'Error', description: 'Failed to parse AI response', variant: 'destructive' })
          return
        }
      } else {
        setGeneratedSuite(data.testSuite)
      }
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
    
    const contentToCopy = generateTestCaseOnly 
      ? JSON.stringify(generatedSuite.testCases, null, 2)
      : JSON.stringify(generatedSuite, null, 2)
    
    try {
      await navigator.clipboard.writeText(contentToCopy)
      setCopied(true)
      toast({ 
        title: 'Copied!', 
        description: generateTestCaseOnly ? 'Test cases copied to clipboard' : 'Complete test suite copied to clipboard'
      })
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
                <Button variant="ghost" size="icon" onClick={() => setShowProviderSettings(!showProviderSettings)} title="AI Provider Settings">
                  <Settings className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleReset} title="Reset Chat">
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col overflow-hidden">
              {/* Provider Settings */}
              {showProviderSettings && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium mb-3 text-blue-900">AI Provider Settings</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-blue-800 mb-2 block">Select AI Provider</label>
                      <div className="flex gap-3">
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="aiProvider"
                            value="ollama"
                            checked={aiProvider === 'ollama'}
                            onChange={(e) => setAiProvider(e.target.value as 'ollama')}
                            className="text-blue-600"
                          />
                          <span className="text-sm">Ollama (Local)</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="aiProvider"
                            value="github-copilot"
                            checked={aiProvider === 'github-copilot'}
                            onChange={(e) => setAiProvider(e.target.value as 'github-copilot')}
                            className="text-blue-600"
                          />
                          <span className="text-sm">GitHub Copilot</span>
                        </label>
                      </div>
                    </div>
                    <div className="text-xs text-blue-600">
                      {aiProvider === 'ollama' ? 
                        '🏠 Using local Ollama instance (http://localhost:11434)' : 
                        <div className="flex items-center justify-between">
                          <span>🔗 Using GitHub Copilot API</span>
                          {githubAuthStatus === 'authenticated' ? (
                            <div className="flex gap-2 items-center">
                              <Badge className="bg-green-100 text-green-800 text-xs">✓ Authenticated</Badge>
                              <Button size="sm" variant="outline" onClick={handleReAuth} className="text-xs h-6">
                                Re-auth
                              </Button>
                            </div>
                          ) : githubAuthStatus === 'not-authenticated' ? (
                            <div className="flex gap-2">
                              <Button size="sm" onClick={handleGitHubAuth} disabled={isLoading || isPolling} className="text-xs h-6">
                                {isLoading ? 'Starting...' : isPolling ? 'Waiting...' : 'OAuth'}
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setShowTokenInput(true)} className="text-xs h-6">
                                Manual
                              </Button>
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-xs">Checking...</Badge>
                          )}
                        </div>
                      }
                    </div>
                    

                    
                    {deviceFlow && (
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-300 rounded">
                        <div className="space-y-2">
                          <div className="text-sm font-bold text-yellow-800">🔐 GitHub Device Authentication</div>
                          <div className="bg-white p-2 rounded border">
                            <div className="text-xs text-gray-600 mb-1">Enter this code on GitHub:</div>
                            <div className="text-lg font-mono font-bold text-center bg-gray-100 p-2 rounded border-2 border-dashed">
                              {deviceFlow.userCode}
                            </div>
                          </div>
                          <div className="text-xs text-yellow-700">
                            🌐 URL: <code className="bg-yellow-100 px-1 rounded text-xs">{deviceFlow.verificationUri}</code>
                          </div>
                          <div className="text-xs text-yellow-600 flex items-center gap-1">
                            {isPolling ? (
                              <>
                                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                                Waiting for you to authorize in GitHub...
                              </>
                            ) : (
                              '✅ Complete authorization in the opened browser tab'
                            )}
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => window.open(deviceFlow.verificationUri, '_blank')}
                            className="w-full text-xs"
                          >
                            🔗 Open GitHub Again
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {showTokenInput && (
                      <div className="mt-3 p-3 bg-white border border-blue-300 rounded">
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-blue-800">GitHub Personal Access Token</label>
                          <Input
                            type="password"
                            value={githubToken}
                            onChange={(e) => setGithubToken(e.target.value)}
                            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                            className="text-xs h-8"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={handleManualTokenSubmit} disabled={isLoading} className="text-xs h-6">
                              {isLoading ? 'Saving...' : 'Save Token'}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setShowTokenInput(false)} className="text-xs h-6">
                              Cancel
                            </Button>
                          </div>
                          <p className="text-xs text-blue-600">
                            Get token from: <a href="https://github.com/settings/tokens" target="_blank" className="underline">GitHub Settings → Developer settings → Personal access tokens</a>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
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
                      onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                    />
                    <Button onClick={handleSendMessage} disabled={isLoading}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="curl" className="flex-1 flex flex-col">
                  <div className="flex-1 flex flex-col space-y-4">
                    <Textarea
                      value={curlCommand}
                      onChange={(e) => setCurlCommand(e.target.value)}
                      placeholder="Paste your cURL command here..."
                      className="h-24"
                    />
                    
                    <div className="flex gap-2">
                      <Button onClick={handleTestCurl} disabled={isLoading} variant="outline" className="flex-1">
                        {isLoading ? 'Testing...' : 'Test cURL'}
                      </Button>
                      <Button onClick={handleCurlGeneration} disabled={isLoading} className="flex-1">
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
                    </div>

                    {curlResponse && (
                      <div className="space-y-3">
                        <div className="bg-gray-50 p-3 rounded border">
                          <h4 className="font-medium text-sm mb-2">API Response</h4>
                          <div className="text-xs text-gray-600 mb-1">
                            Status: {curlResponse.status} | Time: {curlResponse.time}ms
                          </div>
                          <div className="bg-white p-2 rounded border max-h-32 overflow-y-auto">
                            <pre className="text-xs">{JSON.stringify(curlResponse.data, null, 2)}</pre>
                          </div>
                        </div>

                        <div className="bg-blue-50 p-3 rounded border">
                          <h4 className="font-medium text-sm mb-2">JSONPath Filter</h4>
                          <div className="flex gap-2 mb-2">
                            <Input
                              value={jsonPath}
                              onChange={(e) => setJsonPath(e.target.value)}
                              placeholder="$.data[0].name or $..id"
                              className="text-xs h-8"
                            />
                            <Button size="sm" onClick={handleJsonPathFilter} className="text-xs h-8">
                              Filter
                            </Button>
                          </div>
                          {filteredResult !== null && (
                            <div className="bg-white p-2 rounded border">
                              <pre className="text-xs">{JSON.stringify(filteredResult, null, 2)}</pre>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
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
                <div className="mt-4 border-t pt-3 flex-shrink-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm">
                      {generateTestCaseOnly ? 'Generated Test Cases' : 'Generated Test Suite'}
                    </h3>
                    <div className="flex gap-2">
                      <Badge variant={generatedSuite.type === 'API' ? 'default' : 'secondary'} className="text-xs">
                        {generatedSuite.type}
                      </Badge>
                      <Button size="sm" variant="outline" onClick={handleCopyTestCases} className="text-xs h-7">
                        {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                        {copied ? 'Copied!' : 'Copy'}
                      </Button>
                      {!generateTestCaseOnly && (
                        <Button size="sm" onClick={handleSaveSuite} className="text-xs h-7">
                          Save Suite
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg h-32 overflow-y-auto">
                    <pre className="text-xs">
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