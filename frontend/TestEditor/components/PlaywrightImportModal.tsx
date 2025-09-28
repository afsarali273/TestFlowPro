"use client"

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { PlaywrightParser } from '@/lib/ai/playwright-parser'
import { MousePointer, Code, FileText, Upload, AlertCircle, CheckCircle, Copy, Save, Plus } from 'lucide-react'
import type { TestSuite } from '@/types/test-suite'

interface PlaywrightImportModalProps {
  isOpen: boolean
  onClose: () => void
  existingSuites: TestSuite[]
  onSave: (testSuite: TestSuite) => void
  onAddToExisting: (suiteId: string, testCase: any) => void
}

export function PlaywrightImportModal({
  isOpen,
  onClose,
  existingSuites,
  onSave,
  onAddToExisting
}: PlaywrightImportModalProps) {
  const [activeTab, setActiveTab] = useState('input')
  const [playwrightCode, setPlaywrightCode] = useState('')
  const [parsedResult, setParsedResult] = useState<any>(null)
  const [generatedSuite, setGeneratedSuite] = useState<any>(null)
  const [suiteName, setSuiteName] = useState('')
  const [applicationName, setApplicationName] = useState('')
  const [selectedExistingSuite, setSelectedExistingSuite] = useState('')
  const [importMode, setImportMode] = useState<'new' | 'existing'>('new')
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const handleParse = () => {
    if (!playwrightCode.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter Playwright code to parse',
        variant: 'destructive'
      })
      return
    }

    try {
      setIsLoading(true)
      const parsed = PlaywrightParser.parse(playwrightCode)
      setParsedResult(parsed)
      
      // Generate test suite
      const suite = PlaywrightParser.generateTestSuite(
        parsed,
        suiteName || undefined,
        applicationName || undefined
      )
      setGeneratedSuite(suite)
      
      // Auto-fill names if not provided
      if (!suiteName) setSuiteName(suite.suiteName)
      if (!applicationName) setApplicationName(suite.applicationName)
      
      setActiveTab('preview')
      
      toast({
        title: 'Success',
        description: `Parsed ${parsed.testSteps.length} test steps successfully`
      })
    } catch (error: any) {
      toast({
        title: 'Parse Error',
        description: error.message || 'Failed to parse Playwright code',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleImport = () => {
    if (!generatedSuite) return

    if (importMode === 'new') {
      // Update suite with custom names
      const finalSuite = {
        ...generatedSuite,
        suiteName: suiteName || generatedSuite.suiteName,
        applicationName: applicationName || generatedSuite.applicationName
      }
      onSave(finalSuite)
    } else {
      if (!selectedExistingSuite) {
        toast({
          title: 'Error',
          description: 'Please select an existing suite',
          variant: 'destructive'
        })
        return
      }
      onAddToExisting(selectedExistingSuite, generatedSuite.testCases[0])
    }
    
    handleClose()
  }

  const handleClose = () => {
    setPlaywrightCode('')
    setParsedResult(null)
    setGeneratedSuite(null)
    setSuiteName('')
    setApplicationName('')
    setSelectedExistingSuite('')
    setImportMode('new')
    setActiveTab('input')
    onClose()
  }

  const uiSuites = existingSuites.filter(suite => suite.type === 'UI')

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MousePointer className="h-5 w-5 text-purple-600" />
            Import Playwright Tests
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="input" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Input Code
            </TabsTrigger>
            <TabsTrigger value="preview" disabled={!parsedResult}>
              <FileText className="h-4 w-4" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="import" disabled={!generatedSuite}>
              <Upload className="h-4 w-4" />
              Import
            </TabsTrigger>
          </TabsList>

          <TabsContent value="input" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="playwright-code">Playwright TypeScript Code</Label>
                <Textarea
                  id="playwright-code"
                  placeholder={`import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://community.smartbear.com/');
  await expect(page.getByTestId('SearchField.search')).toBeVisible();
  await expect(page.getByTestId('AuthenticationLink.registration')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Brand Logo' })).toBeVisible();
  await page.getByTestId('AuthenticationLink.registration').click();
  await expect(page.getByRole('textbox', { name: 'Email address' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('link', { name: 'Log in' }).click();
  await expect(page.getByRole('textbox', { name: 'Email address' })).toBeVisible();
});`}
                  value={playwrightCode}
                  onChange={(e) => setPlaywrightCode(e.target.value)}
                  className="min-h-[300px] font-mono text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="suite-name">Suite Name (Optional)</Label>
                  <Input
                    id="suite-name"
                    placeholder="Auto-generated from test name"
                    value={suiteName}
                    onChange={(e) => setSuiteName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="app-name">Application Name (Optional)</Label>
                  <Input
                    id="app-name"
                    placeholder="Auto-generated from URL"
                    value={applicationName}
                    onChange={(e) => setApplicationName(e.target.value)}
                  />
                </div>
              </div>

              <Button 
                onClick={handleParse} 
                disabled={!playwrightCode.trim() || isLoading}
                className="w-full"
              >
                {isLoading ? 'Parsing...' : 'Parse Playwright Code'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            {parsedResult && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Parsed Successfully
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Test Name:</span>
                        <p className="text-gray-600">{parsedResult.testName}</p>
                      </div>
                      <div>
                        <span className="font-medium">Base URL:</span>
                        <p className="text-gray-600">{parsedResult.baseUrl || 'Not detected'}</p>
                      </div>
                      <div>
                        <span className="font-medium">Steps:</span>
                        <p className="text-gray-600">{parsedResult.testSteps.length} steps</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Test Steps Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {parsedResult.testSteps.map((step: any, index: number) => (
                        <div key={step.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                          <Badge variant="secondary" className="text-xs">
                            {index + 1}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {step.keyword}
                          </Badge>
                          <span className="text-sm flex-1">
                            {step.value || step.locator?.value || step.target || 'No target'}
                          </span>
                          {step.locator && (
                            <Badge variant="outline" className="text-xs">
                              {step.locator.strategy}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {generatedSuite && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        Generated Test Suite JSON
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              navigator.clipboard.writeText(JSON.stringify(generatedSuite, null, 2))
                              setCopied(true)
                              setTimeout(() => setCopied(false), 2000)
                              toast({ title: 'Copied', description: 'JSON copied to clipboard' })
                            }}
                          >
                            {copied ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              const finalSuite = {
                                ...generatedSuite,
                                suiteName: suiteName || generatedSuite.suiteName,
                                applicationName: applicationName || generatedSuite.applicationName
                              }
                              onSave(finalSuite)
                              handleClose()
                            }}
                          >
                            <Save className="h-3 w-3 mr-1" />
                            Create Suite
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto max-h-40">
                        {JSON.stringify(generatedSuite, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="import" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label>Import Mode</Label>
                <Select value={importMode} onValueChange={(value: 'new' | 'existing') => setImportMode(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Create New Test Suite</SelectItem>
                    <SelectItem value="existing">Add to Existing Suite</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {importMode === 'new' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="final-suite-name">Suite Name</Label>
                    <Input
                      id="final-suite-name"
                      value={suiteName}
                      onChange={(e) => setSuiteName(e.target.value)}
                      placeholder="Enter suite name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="final-app-name">Application Name</Label>
                    <Input
                      id="final-app-name"
                      value={applicationName}
                      onChange={(e) => setApplicationName(e.target.value)}
                      placeholder="Enter application name"
                    />
                  </div>
                </div>
              )}

              {importMode === 'existing' && (
                <div>
                  <Label>Select Existing UI Suite</Label>
                  <Select value={selectedExistingSuite} onValueChange={setSelectedExistingSuite}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a UI test suite" />
                    </SelectTrigger>
                    <SelectContent>
                      {uiSuites.map((suite) => (
                        <SelectItem key={suite.id} value={suite.id}>
                          {suite.suiteName} ({suite.testCases.length} cases)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {uiSuites.length === 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      No UI test suites available. Create a new suite instead.
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-800">
                  {importMode === 'new' 
                    ? 'A new UI test suite will be created with the parsed test case.'
                    : 'The parsed test case will be added to the selected existing suite.'
                  }
                </span>
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(generatedSuite, null, 2))
                    toast({ title: 'Copied', description: 'Test suite JSON copied to clipboard' })
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy JSON
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                  {importMode === 'new' ? (
                    <Button onClick={handleImport}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Suite
                    </Button>
                  ) : (
                    <Button onClick={handleImport}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add to Existing
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}