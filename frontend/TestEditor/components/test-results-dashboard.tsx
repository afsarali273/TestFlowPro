"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Eye,
  EyeOff,
  Download,
  RefreshCw,
  Settings,
  Search,
} from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

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

interface TestResultsData {
  summary: {
    suiteName: string
    tags: {
      serviceName: string
      suiteType: string
    }
    totalTestCases: number
    totalDataSets: number
    passed: number
    failed: number
    totalAssertionsPassed: number
    totalAssertionsFailed: number
    executionTimeMs: number
  }
  results: TestResult[]
  fileName?: string
  lastModified?: string
}

interface TestResultsDashboardProps {
  onClose: () => void
}

export function TestResultsDashboard({ onClose }: TestResultsDashboardProps) {
  const [allResults, setAllResults] = useState<TestResultsData[]>([])
  const [selectedResult, setSelectedResult] = useState<TestResultsData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedResults, setExpandedResults] = useState<Set<number>>(new Set())
  const [searchTerm, setSearchTerm] = useState("")
  const [resultsPath, setResultsPath] = useState<string>("")
  const [isPathConfigOpen, setIsPathConfigOpen] = useState(false)

  useEffect(() => {
    // Check if results path is configured
    const savedResultsPath = localStorage.getItem("resultsPath")
    if (savedResultsPath) {
      setResultsPath(savedResultsPath)
      loadAllResults(savedResultsPath)
    } else {
      setIsPathConfigOpen(true)
    }
  }, [])

  const loadAllResults = async (path: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/test-results/all?path=${encodeURIComponent(path)}`)
      if (!response.ok) {
        throw new Error("Failed to load test results")
      }

      const results = await response.json()
      setAllResults(results)

      // Select first result by default
      if (results.length > 0) {
        setSelectedResult(results[0])
      }
    } catch (err: any) {
      setError(err.message || "Failed to load test results")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePathSave = (path: string) => {
    setResultsPath(path)
    localStorage.setItem("resultsPath", path)
    setIsPathConfigOpen(false)
    loadAllResults(path)
  }

  const toggleResultExpansion = (index: number) => {
    const newExpanded = new Set(expandedResults)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedResults(newExpanded)
  }

  const getStatusIcon = (status: string) => {
    return status === "PASS" ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    )
  }

  const getStatusColor = (status: string) => {
    return status === "PASS" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
  }

  const formatExecutionTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const calculateSuccessRate = (passed: number, total: number) => {
    return total > 0 ? Math.round((passed / total) * 100) : 0
  }

  const exportResults = (result: TestResultsData) => {
    const dataStr = JSON.stringify(result, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)
    const exportFileDefaultName = `${result.summary.suiteName.replace(/\s+/g, "_")}_results.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  const filteredResults = allResults.filter(
    (result) =>
      result.summary.suiteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.summary.tags.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.summary.tags.suiteType.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Path configuration modal
  if (isPathConfigOpen) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Configure Results Path</CardTitle>
            <CardDescription>Enter the path to your test results folder</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="/path/to/test-results"
              value={resultsPath}
              onChange={(e) => setResultsPath(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={() => handlePathSave(resultsPath)}>Save & Load</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-lg font-medium">Loading Test Results...</p>
            <p className="text-gray-600 mt-2">Please wait while we fetch all results</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <XCircle className="h-8 w-8 mx-auto mb-4 text-red-500" />
            <p className="text-lg font-medium text-red-800">Failed to Load Results</p>
            <p className="text-gray-600 mt-2">{error}</p>
            <div className="flex gap-2 mt-4 justify-center">
              <Button variant="outline" onClick={onClose}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button onClick={() => loadAllResults(resultsPath)}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onClose}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Test Results Dashboard</h1>
              <p className="text-gray-600">View and analyze all test execution results</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsPathConfigOpen(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Configure Path
            </Button>
            <Button onClick={() => loadAllResults(resultsPath)}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r flex flex-col">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search test suites..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              {filteredResults.map((result, index) => {
                const successRate = calculateSuccessRate(result.summary.passed, result.summary.totalDataSets)
                const isSelected = selectedResult?.summary.suiteName === result.summary.suiteName

                return (
                  <Card
                    key={index}
                    className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                      isSelected ? "ring-2 ring-blue-500 bg-blue-50" : ""
                    }`}
                    onClick={() => setSelectedResult(result)}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-medium text-sm truncate">{result.summary.suiteName}</h3>
                          <div className="flex gap-1 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {result.summary.tags.serviceName}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {result.summary.tags.suiteType}
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span>Success Rate</span>
                            <span className="font-medium">{successRate}%</span>
                          </div>
                          <Progress value={successRate} className="h-1" />
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span>{result.summary.passed}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <XCircle className="h-3 w-3 text-red-500" />
                            <span>{result.summary.failed}</span>
                          </div>
                        </div>

                        <div className="text-xs text-gray-500">
                          {formatExecutionTime(result.summary.executionTimeMs)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}

              {filteredResults.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No test results found</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {selectedResult ? (
            <ScrollArea className="h-full">
              <div className="p-6 space-y-6">
                {/* Summary Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">{selectedResult.summary.suiteName}</h2>
                    <Button variant="outline" onClick={() => exportResults(selectedResult)}>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>

                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Success Rate</p>
                            <p className="text-2xl font-bold text-green-600">
                              {calculateSuccessRate(
                                selectedResult.summary.passed,
                                selectedResult.summary.totalDataSets,
                              )}
                              %
                            </p>
                          </div>
                          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                          </div>
                        </div>
                        <Progress
                          value={calculateSuccessRate(
                            selectedResult.summary.passed,
                            selectedResult.summary.totalDataSets,
                          )}
                          className="mt-2"
                        />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Test Cases</p>
                            <p className="text-2xl font-bold">{selectedResult.summary.totalTestCases}</p>
                            <p className="text-xs text-gray-500">{selectedResult.summary.totalDataSets} data sets</p>
                          </div>
                          <FileText className="h-8 w-8 text-blue-400" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Assertions</p>
                            <p className="text-2xl font-bold text-green-600">
                              {selectedResult.summary.totalAssertionsPassed}
                            </p>
                            <p className="text-xs text-red-500">
                              {selectedResult.summary.totalAssertionsFailed} failed
                            </p>
                          </div>
                          <div className="text-right">
                            <CheckCircle className="h-8 w-8 text-green-400" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Execution Time</p>
                            <p className="text-2xl font-bold">
                              {formatExecutionTime(selectedResult.summary.executionTimeMs)}
                            </p>
                          </div>
                          <Clock className="h-8 w-8 text-purple-400" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Tags */}
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium">Tags:</span>
                        <Badge variant="secondary">{selectedResult.summary.tags.serviceName}</Badge>
                        <Badge variant="secondary">{selectedResult.summary.tags.suiteType}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Separator />

                {/* Test Results */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Test Results ({selectedResult.results.length})</h3>

                  {selectedResult.results.map((result, index) => (
                    <Card
                      key={index}
                      className={`border-l-4 ${result.status === "PASS" ? "border-l-green-500" : "border-l-red-500"}`}
                    >
                      <Collapsible>
                        <CollapsibleTrigger asChild>
                          <CardHeader className="cursor-pointer hover:bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {getStatusIcon(result.status)}
                                <div>
                                  <CardTitle className="text-base">{result.testCase}</CardTitle>
                                  <CardDescription>{result.dataSet}</CardDescription>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right text-sm">
                                  <div className="flex items-center gap-2">
                                    <Badge className={getStatusColor(result.status)}>{result.status}</Badge>
                                    <span className="text-gray-500">{formatExecutionTime(result.responseTimeMs)}</span>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    ✓ {result.assertionsPassed}
                                    {result.assertionsFailed > 0 && (
                                      <span className="text-red-500 ml-2">✗ {result.assertionsFailed}</span>
                                    )}
                                  </div>
                                </div>
                                {expandedResults.has(index) ? (
                                  <EyeOff className="h-4 w-4 text-gray-400" />
                                ) : (
                                  <Eye className="h-4 w-4 text-gray-400" />
                                )}
                              </div>
                            </div>
                          </CardHeader>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <CardContent className="pt-0">
                            {result.error && (
                              <Alert className="mb-4 border-red-200 bg-red-50">
                                <XCircle className="h-4 w-4 text-red-600" />
                                <AlertDescription className="text-red-800">
                                  <div className="font-medium mb-2">Error Details:</div>
                                  <div className="text-sm">
                                    {result.error.split(" | ").map((error, i) => (
                                      <div key={i} className="mb-1">
                                        • {error}
                                      </div>
                                    ))}
                                  </div>
                                </AlertDescription>
                              </Alert>
                            )}

                            {result.responseBody && (
                              <div className="mt-4">
                                <h4 className="font-medium mb-2 text-red-800">Response Body (Failed Test):</h4>
                                <ScrollArea className="h-64 w-full border rounded-lg">
                                  <pre className="p-4 text-xs bg-gray-900 text-green-400 font-mono">
                                    {JSON.stringify(result.responseBody, null, 2)}
                                  </pre>
                                </ScrollArea>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                              <div>
                                <span className="font-medium">Assertions Passed:</span>
                                <span className="ml-2 text-green-600">{result.assertionsPassed}</span>
                              </div>
                              <div>
                                <span className="font-medium">Assertions Failed:</span>
                                <span className="ml-2 text-red-600">{result.assertionsFailed}</span>
                              </div>
                            </div>
                          </CardContent>
                        </CollapsibleContent>
                      </Collapsible>
                    </Card>
                  ))}
                </div>
              </div>
            </ScrollArea>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Select a test suite</p>
                <p className="text-sm">Choose a test suite from the sidebar to view results</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
