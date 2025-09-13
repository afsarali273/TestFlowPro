"use client"

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Copy, Download, Save, Upload, FileText, Globe } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { SwaggerParser } from '@/lib/swaggerParser'
import type { TestSuite } from '@/types/test-suite'

interface SwaggerImportModalProps {
  isOpen: boolean
  onClose: () => void
  existingSuites: TestSuite[]
  onSave: (testSuite: TestSuite) => void
  onAddToExisting: (suiteId: string, testCase: any) => void
}

export function SwaggerImportModal({ 
  isOpen, 
  onClose, 
  existingSuites, 
  onSave, 
  onAddToExisting 
}: SwaggerImportModalProps) {
  const [swaggerInput, setSwaggerInput] = useState('')
  const [swaggerUrl, setSwaggerUrl] = useState('')
  const [generatedJson, setGeneratedJson] = useState('')
  const [isConverting, setIsConverting] = useState(false)
  const [activeTab, setActiveTab] = useState('input')
  const [selectedSuite, setSelectedSuite] = useState<string>('')
  const [importMode, setImportMode] = useState<'new' | 'existing'>('new')
  
  const { toast } = useToast()
  const parser = new SwaggerParser()

  const handleConvert = async () => {
    if (!swaggerInput.trim()) {
      toast({
        title: "Input Required",
        description: "Please provide Swagger/OpenAPI specification",
        variant: "destructive"
      })
      return
    }

    setIsConverting(true)
    try {
      const swaggerSpec = JSON.parse(swaggerInput)
      const testSuite = parser.parseSwagger(swaggerSpec)
      setGeneratedJson(JSON.stringify(testSuite, null, 2))
      setActiveTab('output')
      
      toast({
        title: "Conversion Successful",
        description: "Swagger specification converted to TestFlow Pro format"
      })
    } catch (error) {
      toast({
        title: "Conversion Failed",
        description: "Invalid Swagger/OpenAPI specification or conversion error",
        variant: "destructive"
      })
    } finally {
      setIsConverting(false)
    }
  }

  const handleUrlImport = async () => {
    if (!swaggerUrl.trim()) {
      toast({
        title: "URL Required",
        description: "Please provide Swagger/OpenAPI URL",
        variant: "destructive"
      })
      return
    }

    setIsConverting(true)
    try {
      console.log('Fetching from URL:', swaggerUrl)
      const response = await fetch(swaggerUrl)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const contentType = response.headers.get('content-type') || ''
      let swaggerSpec: any
      
      if (contentType.includes('application/json')) {
        swaggerSpec = await response.json()
      } else {
        // Try to parse as text first, then JSON
        const text = await response.text()
        try {
          swaggerSpec = JSON.parse(text)
        } catch {
          // If not JSON, might be YAML - for now just show error
          throw new Error('YAML format not supported yet. Please convert to JSON or paste directly.')
        }
      }
      
      console.log('Fetched spec:', swaggerSpec)
      
      // Validate it's a Swagger/OpenAPI spec
      if (!swaggerSpec.swagger && !swaggerSpec.openapi) {
        throw new Error('Not a valid Swagger/OpenAPI specification. Missing swagger or openapi field.')
      }
      
      if (!swaggerSpec.paths) {
        throw new Error('Not a valid Swagger/OpenAPI specification. Missing paths field.')
      }
      
      setSwaggerInput(JSON.stringify(swaggerSpec, null, 2))
      
      const testSuite = parser.parseSwagger(swaggerSpec)
      setGeneratedJson(JSON.stringify(testSuite, null, 2))
      setActiveTab('output')
      
      toast({
        title: "Import Successful",
        description: "Swagger specification imported and converted"
      })
    } catch (error: any) {
      console.error('Import error:', error)
      toast({
        title: "Import Failed",
        description: error.message || "Failed to fetch or parse Swagger specification from URL",
        variant: "destructive"
      })
    } finally {
      setIsConverting(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setSwaggerInput(content)
      }
      reader.readAsText(file)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedJson)
    toast({
      title: "Copied",
      description: "Test suite JSON copied to clipboard"
    })
  }

  const handleDownload = () => {
    const testSuite = JSON.parse(generatedJson)
    const blob = new Blob([generatedJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${testSuite.suiteName.replace(/[^a-zA-Z0-9]/g, '_')}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleSave = () => {
    if (!generatedJson) return

    try {
      const testSuite = JSON.parse(generatedJson)
      
      if (importMode === 'existing' && selectedSuite) {
        // Add test cases to existing suite
        testSuite.testCases.forEach((testCase: any) => {
          onAddToExisting(selectedSuite, testCase)
        })
        toast({
          title: "Test Cases Added",
          description: `Added ${testSuite.testCases.length} test cases to existing suite`
        })
      } else {
        // Create new suite
        onSave(testSuite)
      }
      
      onClose()
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Invalid JSON format",
        variant: "destructive"
      })
    }
  }

  const handleReset = () => {
    setSwaggerInput('')
    setSwaggerUrl('')
    setGeneratedJson('')
    setActiveTab('input')
    setSelectedSuite('')
    setImportMode('new')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Import Swagger/OpenAPI Specification
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="input">Input Specification</TabsTrigger>
            <TabsTrigger value="output" disabled={!generatedJson}>Generated Test Suite</TabsTrigger>
          </TabsList>

          <TabsContent value="input" className="flex-1 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* URL Import */}
              <div className="space-y-2">
                <Label>Import from URL</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://petstore.swagger.io/v2/swagger.json"
                    value={swaggerUrl}
                    onChange={(e) => setSwaggerUrl(e.target.value)}
                  />
                  <Button onClick={handleUrlImport} disabled={isConverting}>
                    <Globe className="h-4 w-4 mr-1" />
                    Import
                  </Button>
                </div>
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label>Upload File</Label>
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept=".json,.yaml,.yml"
                    onChange={handleFileUpload}
                  />
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-1" />
                    Browse
                  </Button>
                </div>
              </div>
            </div>

            {/* Manual Input */}
            <div className="space-y-2">
              <Label>Swagger/OpenAPI Specification (JSON/YAML)</Label>
              <Textarea
                placeholder="Paste your Swagger/OpenAPI specification here..."
                value={swaggerInput}
                onChange={(e) => setSwaggerInput(e.target.value)}
                className="min-h-[300px] font-mono text-sm"
              />
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={handleReset}>
                Clear All
              </Button>
              <Button onClick={handleConvert} disabled={isConverting}>
                {isConverting ? 'Converting...' : 'Convert to TestFlow Pro'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="output" className="flex-1 space-y-4">
            {generatedJson && (
              <>
                {/* Import Mode Selection */}
                <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="new-suite"
                      name="import-mode"
                      checked={importMode === 'new'}
                      onChange={() => setImportMode('new')}
                    />
                    <Label htmlFor="new-suite">Create New Test Suite</Label>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="existing-suite"
                      name="import-mode"
                      checked={importMode === 'existing'}
                      onChange={() => setImportMode('existing')}
                    />
                    <Label htmlFor="existing-suite">Add to Existing Suite</Label>
                  </div>

                  {importMode === 'existing' && (
                    <select
                      value={selectedSuite}
                      onChange={(e) => setSelectedSuite(e.target.value)}
                      className="px-3 py-1 border border-slate-300 rounded-md"
                    >
                      <option value="">Select Suite...</option>
                      {existingSuites.filter(s => s.type === 'API').map(suite => (
                        <option key={suite.id} value={suite.id}>
                          {suite.suiteName}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Generated JSON Display */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Generated TestFlow Pro Test Suite</Label>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={handleCopy}>
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleDownload}>
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                  
                  <Textarea
                    value={generatedJson}
                    onChange={(e) => setGeneratedJson(e.target.value)}
                    className="min-h-[400px] font-mono text-sm"
                  />
                </div>

                {/* Suite Preview */}
                {(() => {
                  try {
                    const suite = JSON.parse(generatedJson)
                    return (
                      <div className="p-3 bg-slate-50 rounded-lg space-y-2">
                        <h4 className="font-medium">Suite Preview:</h4>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">{suite.suiteName}</Badge>
                          <Badge variant="outline">{suite.testCases.length} test cases</Badge>
                          <Badge variant="outline">
                            {suite.testCases.reduce((acc: number, tc: any) => acc + tc.testData.length, 0)} test scenarios
                          </Badge>
                        </div>
                      </div>
                    )
                  } catch {
                    return null
                  }
                })()}

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setActiveTab('input')}>
                    Back to Input
                  </Button>
                  <Button 
                    onClick={handleSave}
                    disabled={importMode === 'existing' && !selectedSuite}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    {importMode === 'existing' ? 'Add to Suite' : 'Create Test Suite'}
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}