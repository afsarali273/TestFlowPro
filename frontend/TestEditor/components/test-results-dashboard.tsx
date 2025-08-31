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
  Filter,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  Zap,
  Calendar,
  BarChart3,
  PieChart,
  AlertTriangle,
  Award,
  Timer,
} from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TestResultDetailModal } from "@/components/test-result-detail-modal"

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
    runId?: string
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

interface TestRun {
  runId: string
  runName: string
  suites: TestResultsData[]
  totalSuites: number
  totalTests: number
  totalPassed: number
  totalFailed: number
  totalExecutionTime: number
  lastModified: string
}

interface TestResultsDashboardProps {
  onClose: () => void
}

// Helper function to format XML content
const formatXmlContent = (xmlString: string): string => {
  try {
    const formatted = xmlString.replace(/></g, ">\n<")
    let indent = 0
    const lines = formatted.split("\n")

    return lines
      .map((line) => {
        const trimmed = line.trim()
        if (trimmed.startsWith("</")) {
          indent = Math.max(0, indent - 1)
        }

        const indentedLine = "  ".repeat(indent) + trimmed

        if (trimmed.startsWith("<") && !trimmed.startsWith("</") && !trimmed.endsWith("/>")) {
          indent++
        }

        return indentedLine
      })
      .join("\n")
  } catch (error) {
    return xmlString
  }
}

// Helper function to format API assertion errors
const formatApiError = (errorString: string) => {
  const errors = errorString.split(' | ').filter(error => error.trim())
  
  return (
    <div className="space-y-2">
      {errors.map((error, index) => {
        const trimmedError = error.trim()
        
        // Parse different types of API assertions
        if (trimmedError.includes('Assertion failed:')) {
          const assertionText = trimmedError.replace('Assertion failed: ', '')
          
          // Status code assertions
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
          
          // JSONPath assertions with expected/got values
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
          
          // Existence assertions
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
        
        // Fallback for other error formats
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

// Helper function to format Playwright errors with proper styling
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
              
              if (line.includes('Call log:')) {
                return (
                  <div key={lineIndex} className="text-gray-700 font-semibold mt-2">
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

const isXmlContent = (content: string): boolean => {
  if (typeof content !== "string") return false
  const trimmed = content.trim()
  return trimmed.startsWith("<?xml") || (trimmed.startsWith("<") && trimmed.includes("</"))
}

export function TestResultsDashboard({ onClose }: TestResultsDashboardProps) {
  const [allRuns, setAllRuns] = useState<TestRun[]>([])
  const [selectedRun, setSelectedRun] = useState<TestRun | null>(null)
  const [selectedResult, setSelectedResult] = useState<TestResultsData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [resultsPath, setResultsPath] = useState<string>("")
  const [isPathConfigOpen, setIsPathConfigOpen] = useState(false)
  const [sortBy, setSortBy] = useState<string>("date")
  const [selectedTestResult, setSelectedTestResult] = useState<TestResult | null>(null)
  const [showTestResultModal, setShowTestResultModal] = useState(false)
  const [expandedResults, setExpandedResults] = useState<Set<number>>(new Set())

  useEffect(() => {
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

      const results: TestResultsData[] = await response.json()
      
      // Group results by runId
      const runsMap = new Map<string, TestResultsData[]>()
      
      results.forEach(result => {
        const runId = result.summary.runId || 'unknown-run'
        if (!runsMap.has(runId)) {
          runsMap.set(runId, [])
        }
        runsMap.get(runId)!.push(result)
      })
      
      // Convert to TestRun objects
      const runs: TestRun[] = Array.from(runsMap.entries()).map(([runId, suites]) => {
        const totalSuites = suites.length
        const totalTests = suites.reduce((sum, s) => sum + s.summary.totalDataSets, 0)
        const totalPassed = suites.reduce((sum, s) => sum + s.summary.passed, 0)
        const totalFailed = suites.reduce((sum, s) => sum + s.summary.failed, 0)
        const totalExecutionTime = suites.reduce((sum, s) => sum + s.summary.executionTimeMs, 0)
        const lastModified = suites.reduce((latest, s) => 
          new Date(s.lastModified || 0) > new Date(latest) ? s.lastModified || latest : latest, 
          suites[0]?.lastModified || new Date().toISOString()
        )
        
        return {
          runId,
          runName: `Test Run ${runId.replace('run-', '')}`,
          suites,
          totalSuites,
          totalTests,
          totalPassed,
          totalFailed,
          totalExecutionTime,
          lastModified
        }
      }).sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
      
      setAllRuns(runs)

      if (runs.length > 0) {
        setSelectedRun(runs[0])
        if (runs[0].suites.length > 0) {
          setSelectedResult(runs[0].suites[0])
        }
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

  const handleTestResultClick = (result: TestResult) => {
    setSelectedTestResult(result)
    setShowTestResultModal(true)
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

  // Calculate overall statistics
  const overallStats = allRuns.reduce(
    (acc, run) => ({
      totalRuns: acc.totalRuns + 1,
      totalSuites: acc.totalSuites + run.totalSuites,
      totalTests: acc.totalTests + run.totalTests,
      totalPassed: acc.totalPassed + run.totalPassed,
      totalFailed: acc.totalFailed + run.totalFailed,
      totalExecutionTime: acc.totalExecutionTime + run.totalExecutionTime,
    }),
    {
      totalRuns: 0,
      totalSuites: 0,
      totalTests: 0,
      totalPassed: 0,
      totalFailed: 0,
      totalExecutionTime: 0,
    }
  )



  // Filter and sort runs
  const filteredRuns = allRuns
    .filter((run) => {
      if (!searchTerm) return true
      
      const searchLower = searchTerm.toLowerCase()
      
      return run.runName.toLowerCase().includes(searchLower) ||
        run.suites.some(suite => 
          suite.summary.suiteName.toLowerCase().includes(searchLower) ||
          (suite.summary.tags && Object.values(suite.summary.tags).some(tagValue => 
            tagValue && tagValue.toString().toLowerCase().includes(searchLower)
          ))
        )
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.runName.localeCompare(b.runName)
        case "success":
          return calculateSuccessRate(b.totalPassed, b.totalTests) - 
                 calculateSuccessRate(a.totalPassed, a.totalTests)
        case "time":
          return b.totalExecutionTime - a.totalExecutionTime
        case "date":
        default:
          return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
      }
    })

  // Path configuration modal
  if (isPathConfigOpen) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Configure Results Path
            </CardTitle>
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <Card className="w-96 shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            </div>
            <p className="text-lg font-medium text-gray-900">Loading Test Results...</p>
            <p className="text-gray-600 mt-2">Analyzing all test execution data</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <Card className="w-96 shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <p className="text-lg font-medium text-red-800">Failed to Load Results</p>
            <p className="text-gray-600 mt-2">{error}</p>
            <div className="flex gap-2 mt-6 justify-center">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Modern Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={onClose} size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Test Results</h1>
                <p className="text-sm text-gray-500">{overallStats.totalRuns} runs • {overallStats.totalSuites} suites • {overallStats.totalTests} tests</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsPathConfigOpen(true)}>
                <Settings className="h-4 w-4 mr-1" />
                Settings
              </Button>
              <Button size="sm" onClick={() => loadAllResults(resultsPath)}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-900">{overallStats.totalRuns}</div>
              <div className="text-sm text-gray-600">Test Runs</div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">
                {calculateSuccessRate(overallStats.totalPassed, overallStats.totalTests)}%
              </div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{overallStats.totalTests}</div>
              <div className="text-sm text-gray-600">Total Tests</div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-900">
                {formatExecutionTime(overallStats.totalExecutionTime / Math.max(overallStats.totalSuites, 1))}
              </div>
              <div className="text-sm text-gray-600">Avg Time</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-6 h-[calc(100vh-280px)]">
          {/* Sidebar */}
          <div className="w-80 bg-white rounded-lg border border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search runs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-9 border-gray-200"
                />
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-3 space-y-2">
                {filteredRuns.map((run, index) => {
                  const successRate = calculateSuccessRate(run.totalPassed, run.totalTests)
                  const isSelected = selectedRun?.runId === run.runId

                  return (
                    <div key={index} className="space-y-2">
                      <div
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          isSelected ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50"
                        }`}
                        onClick={() => {
                          setSelectedRun(run)
                          if (run.suites.length > 0) {
                            setSelectedResult(run.suites[0])
                          }
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-sm text-gray-900 truncate">
                            {run.runName}
                          </h3>
                          <div className={`w-2 h-2 rounded-full ${
                            successRate === 100 ? "bg-green-500" :
                            successRate >= 80 ? "bg-yellow-500" : "bg-red-500"
                          }`} />
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>{run.totalSuites} suites • {run.totalTests} tests</span>
                          <span>{successRate}% passed</span>
                        </div>
                        
                        <div className="mt-2">
                          <Progress value={successRate} className="h-1" />
                        </div>
                      </div>
                      
                      {isSelected && (
                        <div className="ml-4 space-y-1">
                          {run.suites.map((suite, suiteIndex) => {
                            const suiteSuccessRate = calculateSuccessRate(suite.summary.passed, suite.summary.totalDataSets)
                            const isSuiteSelected = selectedResult?.summary.suiteName === suite.summary.suiteName
                            
                            return (
                              <div
                                key={suiteIndex}
                                className={`p-2 rounded cursor-pointer text-xs transition-colors ${
                                  isSuiteSelected ? "bg-blue-100" : "hover:bg-gray-100"
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedResult(suite)
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="truncate">{suite.summary.suiteName}</span>
                                  <span className="text-gray-500">{suiteSuccessRate}%</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}

                {filteredRuns.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">No runs found</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Enhanced Main Content */}
          <div className="flex-1 overflow-hidden">
            {selectedResult && selectedRun ? (
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 h-full flex flex-col">
                <div className="p-3 border-b border-gray-200 flex-shrink-0">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-bold text-gray-900">{selectedResult.summary.suiteName}</h2>
                    <Button variant="outline" size="sm" onClick={() => exportResults(selectedResult)} className="hover:bg-gray-50">
                      <Download className="h-3 w-3 mr-1" />
                      Export
                    </Button>
                  </div>

                  {/* Compact Summary */}
                  <div className="flex items-center gap-4 mb-2">
                    <div className="text-sm">
                      <span className="font-bold text-green-600">
                        {calculateSuccessRate(selectedResult.summary.passed, selectedResult.summary.totalDataSets)}%
                      </span>
                      <span className="text-gray-500 ml-1">success</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-bold text-gray-900">{selectedResult.summary.totalDataSets}</span>
                      <span className="text-gray-500 ml-1">tests</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-bold text-blue-600">{selectedResult.summary.totalAssertionsPassed}</span>
                      <span className="text-gray-500 ml-1">assertions</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-bold text-gray-900">{formatExecutionTime(selectedResult.summary.executionTimeMs)}</span>
                      <span className="text-gray-500 ml-1">duration</span>
                    </div>
                  </div>

                  {/* Compact Tags */}
                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 px-2 py-0.5">
                      {selectedResult.summary.tags.serviceName}
                    </Badge>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700 px-2 py-0.5">
                      {selectedResult.summary.tags.suiteType}
                    </Badge>
                    <span className="text-gray-500 ml-auto">
                      {new Date(selectedResult.lastModified || 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Test Results with Tabs */}
                <div className="flex-1 overflow-hidden">
                  <Tabs defaultValue="results" className="h-full flex flex-col">
                    <div className="px-4 pt-2 flex-shrink-0">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="results">
                          Test Results ({selectedResult.results.length})
                        </TabsTrigger>
                        <TabsTrigger value="summary">
                          Detailed Summary
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    <TabsContent value="results" className="flex-1 overflow-hidden mt-4">
                      <ScrollArea className="h-full px-6">
                        <div className="space-y-3 pb-6">
                          {selectedResult.results.map((result, index) => (
                            <Card
                              key={index}
                              className={`border-l-4 cursor-pointer hover:shadow-md transition-all ${
                                result.status === "PASS" ? "border-l-green-500 hover:bg-green-50/50" : "border-l-red-500 hover:bg-red-50/50"
                              }`}
                              onClick={() => handleTestResultClick(result)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    {getStatusIcon(result.status)}
                                    <div>
                                      <div className="font-medium text-gray-900">{result.testCase}</div>
                                      <div className="text-sm text-gray-600">{result.dataSet}</div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-4">
                                    <div className="text-right text-sm">
                                      <Badge className={getStatusColor(result.status)} variant="secondary">
                                        {result.status}
                                      </Badge>
                                      <div className="text-xs text-gray-500 mt-1">
                                        {formatExecutionTime(result.responseTimeMs)}
                                      </div>
                                    </div>
                                    
                                    <div className="text-right text-sm">
                                      <div className="text-green-600">✓ {result.assertionsPassed}</div>
                                      {result.assertionsFailed > 0 && (
                                        <div className="text-red-500">✗ {result.assertionsFailed}</div>
                                      )}
                                    </div>
                                    
                                    <Eye className="h-4 w-4 text-gray-400" />
                                  </div>
                                </div>
                                
                                {result.error && (
                                  <div className="mt-3 pt-3 border-t border-gray-200">
                                    <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                                      ⚠️ Error: Click to view details
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="summary" className="flex-1 overflow-hidden mt-4">
                      <ScrollArea className="h-full px-6">
                        <div className="space-y-6 pb-6">
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <PieChart className="h-5 w-5" />
                                Execution Summary
                              </CardTitle>
                              <CardDescription>Detailed breakdown of test execution results</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-4">
                                  <h4 className="font-medium text-gray-900">Test Coverage</h4>
                                  <div className="space-y-3 text-sm">
                                    <div className="flex justify-between items-center">
                                      <span className="text-gray-600">Total Test Cases:</span>
                                      <span className="font-medium">{selectedResult.summary.totalTestCases}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-gray-600">Total Data Sets:</span>
                                      <span className="font-medium">{selectedResult.summary.totalDataSets}</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between items-center">
                                      <span className="text-green-600 flex items-center gap-1">
                                        <CheckCircle className="h-4 w-4" />
                                        Passed:
                                      </span>
                                      <span className="font-medium text-green-600">{selectedResult.summary.passed}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-red-600 flex items-center gap-1">
                                        <XCircle className="h-4 w-4" />
                                        Failed:
                                      </span>
                                      <span className="font-medium text-red-600">{selectedResult.summary.failed}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <h4 className="font-medium text-gray-900">Performance Metrics</h4>
                                  <div className="space-y-3 text-sm">
                                    <div className="flex justify-between items-center">
                                      <span className="text-gray-600">Total Execution Time:</span>
                                      <span className="font-medium">{formatExecutionTime(selectedResult.summary.executionTimeMs)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-gray-600">Average Response Time:</span>
                                      <span className="font-medium">
                                        {formatExecutionTime(
                                          selectedResult.results.reduce((acc, r) => acc + r.responseTimeMs, 0) / 
                                          Math.max(selectedResult.results.length, 1)
                                        )}
                                      </span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between items-center">
                                      <span className="text-green-600">Assertions Passed:</span>
                                      <span className="font-medium text-green-600">{selectedResult.summary.totalAssertionsPassed}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-red-600">Assertions Failed:</span>
                                      <span className="font-medium text-red-600">{selectedResult.summary.totalAssertionsFailed}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Test Performance Chart */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <Activity className="h-5 w-5" />
                                Response Time Analysis
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                {selectedResult.results.map((result, index) => (
                                  <div key={index} className="flex items-center gap-4">
                                    <div className="w-48 text-sm truncate">{result.testCase}</div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                                          <div
                                            className={`h-2 rounded-full ${
                                              result.responseTimeMs < 500 ? "bg-green-500" :
                                              result.responseTimeMs < 1000 ? "bg-yellow-500" : "bg-red-500"
                                            }`}
                                            style={{
                                              width: `${Math.min((result.responseTimeMs / Math.max(...selectedResult.results.map(r => r.responseTimeMs))) * 100, 100)}%`
                                            }}
                                          />
                                        </div>
                                        <span className="text-sm font-mono w-16 text-right">
                                          {formatExecutionTime(result.responseTimeMs)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 h-full flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-xl font-medium">Select a test suite</p>
                  <p className="text-sm">Choose a test suite from the sidebar to view detailed results</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <TestResultDetailModal
        isOpen={showTestResultModal}
        onClose={() => setShowTestResultModal(false)}
        testResult={selectedTestResult}
      />
    </div>
  )
}