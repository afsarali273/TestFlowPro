"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Clock, AlertTriangle, Activity } from "lucide-react"

interface TestResult {
  testCase: string
  dataSet: string
  status: "PASS" | "FAIL"
  error?: string
  assertionsPassed: number
  assertionsFailed: number
  responseTimeMs: number
  responseBody?: any
}

interface TestResultDetailModalProps {
  isOpen: boolean
  onClose: () => void
  testResult: TestResult | null
}

// Helper function to format API assertion errors
const formatApiError = (errorString: string) => {
  const errors = errorString.split(' | ').filter(error => error.trim())
  
  return (
    <div className="space-y-2">
      {errors.map((error, index) => {
        const trimmedError = error.trim()
        
        if (trimmedError.includes('Assertion failed:')) {
          const assertionText = trimmedError.replace('Assertion failed: ', '')
          
          if (assertionText.includes('statusCode expected')) {
            const match = assertionText.match(/statusCode expected (\d+), got (\d+)/)
            if (match) {
              return (
                <div key={index} className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-red-800">Status Code Mismatch</div>
                    <div className="text-xs text-red-600 mt-1">
                      Expected: <span className="font-mono bg-red-100 px-1 rounded">{match[1]}</span> | 
                      Received: <span className="font-mono bg-red-100 px-1 rounded">{match[2]}</span>
                    </div>
                  </div>
                </div>
              )
            }
          }
          
          if (assertionText.includes('expected') && assertionText.includes('got')) {
            const parts = assertionText.split(' expected ')
            if (parts.length === 2) {
              const jsonPath = parts[0]
              const expectedGot = parts[1].split(', got ')
              const expected = expectedGot[0]
              const got = expectedGot[1] || 'undefined'
              
              return (
                <div key={index} className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-orange-800">JSONPath Assertion Failed</div>
                    <div className="text-xs text-orange-600 mt-1">
                      Path: <span className="font-mono bg-orange-100 px-1 rounded">{jsonPath}</span>
                    </div>
                    <div className="text-xs text-orange-600 mt-1">
                      Expected: <span className="font-mono bg-orange-100 px-1 rounded">{expected}</span> | 
                      Got: <span className="font-mono bg-orange-100 px-1 rounded">{got}</span>
                    </div>
                  </div>
                </div>
              )
            }
          }
          
          if (assertionText.includes('does not exist')) {
            const jsonPath = assertionText.replace(' does not exist', '')
            return (
              <div key={index} className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-blue-800">Missing Field</div>
                  <div className="text-xs text-blue-600 mt-1">
                    Path: <span className="font-mono bg-blue-100 px-1 rounded">{jsonPath}</span> does not exist
                  </div>
                </div>
              </div>
            )
          }
        }
        
        return (
          <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
            <div className="text-sm text-gray-700">{trimmedError}</div>
          </div>
        )
      })}
    </div>
  )
}

// Helper function to format Playwright errors
const formatPlaywrightError = (errorString: string) => {
  const cleanError = errorString.replace(/\x1B\[[0-9;]*m/g, '')
  const sections = cleanError.split('\n\n')
  
  return (
    <div className="space-y-3 font-mono text-sm">
      {sections.map((section, index) => {
        const lines = section.split('\n')
        
        return (
          <div key={index} className="space-y-1">
            {lines.map((line, lineIndex) => {
              if (line.includes('expect(') && line.includes('failed')) {
                return (
                  <div key={lineIndex} className="text-red-600 font-semibold">
                    {line}
                  </div>
                )
              }
              
              if (line.includes('Locator:')) {
                return (
                  <div key={lineIndex} className="text-blue-600">
                    {line}
                  </div>
                )
              }
              
              if (line.startsWith('- ')) {
                return (
                  <div key={lineIndex} className="text-red-500 bg-red-50 px-2 py-1 rounded">
                    <span className="text-red-700 font-bold">- </span>
                    {line.substring(2)}
                  </div>
                )
              }
              
              if (line.startsWith('+ ')) {
                return (
                  <div key={lineIndex} className="text-green-600 bg-green-50 px-2 py-1 rounded">
                    <span className="text-green-700 font-bold">+ </span>
                    {line.substring(2)}
                  </div>
                )
              }
              
              if (line.includes('Timeout:')) {
                return (
                  <div key={lineIndex} className="text-orange-600 font-medium">
                    {line}
                  </div>
                )
              }
              
              return (
                <div key={lineIndex} className="text-gray-700">
                  {line}
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

const formatExecutionTime = (ms: number) => {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

export function TestResultDetailModal({ isOpen, onClose, testResult }: TestResultDetailModalProps) {
  if (!testResult) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {testResult.status === "PASS" ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            Test Result Details
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className="space-y-6 pr-4">
            {/* Test Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Test Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-gray-600">Test Case</div>
                    <div className="text-base font-semibold">{testResult.testCase}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-600">Data Set</div>
                    <div className="text-base">{testResult.dataSet}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Badge className={testResult.status === "PASS" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {testResult.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-mono">{formatExecutionTime(testResult.responseTimeMs)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Assertions Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Assertions Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <div className="text-lg font-bold text-green-700">{testResult.assertionsPassed}</div>
                      <div className="text-sm text-green-600">Passed</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                    <XCircle className="h-5 w-5 text-red-500" />
                    <div>
                      <div className="text-lg font-bold text-red-700">{testResult.assertionsFailed}</div>
                      <div className="text-sm text-red-600">Failed</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Error Details */}
            {testResult.error && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    Error Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-white rounded-lg p-4 border border-red-200">
                    {testResult.error.includes('Assertion failed:') && testResult.error.includes(' | ') 
                      ? formatApiError(testResult.error)
                      : formatPlaywrightError(testResult.error)
                    }
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Response Body */}
            {testResult.responseBody && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-500" />
                    Response Body
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64 w-full border rounded-lg bg-gray-900">
                    <pre className="p-4 text-xs font-mono whitespace-pre-wrap break-words">
                      <code className="text-green-300">
                        {typeof testResult.responseBody === "string"
                          ? testResult.responseBody
                          : JSON.stringify(testResult.responseBody, null, 2)}
                      </code>
                    </pre>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}