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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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

const isXmlContent = (content: string): boolean => {
  if (typeof content !== "string") return false
  const trimmed = content.trim()
  return trimmed.startsWith("<?xml") || (trimmed.startsWith("<") && trimmed.includes("</"))
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
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [serviceFilter, setServiceFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("date")

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

      const results = await response.json()
      setAllResults(results)

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

  // Calculate overall statistics
  const overallStats = allResults.reduce(
    (acc, result) => ({
      totalSuites: acc.totalSuites + 1,
      totalTests: acc.totalTests + result.summary.totalDataSets,
      totalPassed: acc.totalPassed + result.summary.passed,
      totalFailed: acc.totalFailed + result.summary.failed,
      totalExecutionTime: acc.totalExecutionTime + result.summary.executionTimeMs,
      totalAssertions: acc.totalAssertions + result.summary.totalAssertionsPassed + result.summary.totalAssertionsFailed,
      passedAssertions: acc.passedAssertions + result.summary.totalAssertionsPassed,
    }),
    {
      totalSuites: 0,
      totalTests: 0,
      totalPassed: 0,
      totalFailed: 0,
      totalExecutionTime: 0,
      totalAssertions: 0,
      passedAssertions: 0,
    }
  )

  // Get unique services and types for filters
  const uniqueServices = [...new Set(allResults.map(r => r.summary.tags.serviceName).filter(Boolean))]
  const uniqueTypes = [...new Set(allResults.map(r => r.summary.tags.suiteType).filter(Boolean))]

  // Filter and sort results
  const filteredResults = allResults
    .filter((result) => {
      const matchesSearch = result.summary.suiteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.summary.tags.serviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.summary.tags.suiteType?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "passed" && result.summary.failed === 0) ||
        (statusFilter === "failed" && result.summary.failed > 0)
      
      const matchesService = serviceFilter === "all" || result.summary.tags.serviceName === serviceFilter

      return matchesSearch && matchesStatus && matchesService
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.summary.suiteName.localeCompare(b.summary.suiteName)
        case "success":
          return calculateSuccessRate(b.summary.passed, b.summary.totalDataSets) - 
                 calculateSuccessRate(a.summary.passed, a.summary.totalDataSets)
        case "time":
          return b.summary.executionTimeMs - a.summary.executionTimeMs
        case "date":
        default:
          return new Date(b.lastModified || 0).getTime() - new Date(a.lastModified || 0).getTime()
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
      {/* Enhanced Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={onClose} className="hover:bg-gray-100">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                  <BarChart3 className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Test Analytics Dashboard
                  </h1>
                  <p className="text-gray-600 font-medium">Comprehensive test execution insights and analysis</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setIsPathConfigOpen(true)} className="hover:bg-gray-50">
                <Settings className="h-4 w-4 mr-2" />
                Configure Path
              </Button>
              <Button onClick={() => loadAllResults(resultsPath)} className="bg-blue-600 hover:bg-blue-700 shadow-lg">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Overall Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Total Test Suites</p>
                  <p className="text-3xl font-bold text-blue-900">{overallStats.totalSuites}</p>
                  <p className="text-xs text-blue-600 mt-1">{overallStats.totalTests} total tests</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-200 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Success Rate</p>
                  <p className="text-3xl font-bold text-green-900">
                    {calculateSuccessRate(overallStats.totalPassed, overallStats.totalTests)}%
                  </p>
                  <p className="text-xs text-green-600 mt-1">{overallStats.totalPassed} passed</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-200 flex items-center justify-center">
                  <Award className="h-6 w-6 text-green-700" />
                </div>
              </div>
              <div className="mt-3">
                <Progress 
                  value={calculateSuccessRate(overallStats.totalPassed, overallStats.totalTests)} 
                  className="h-2 bg-green-200"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Assertions</p>
                  <p className="text-3xl font-bold text-purple-900">{overallStats.totalAssertions}</p>
                  <p className="text-xs text-purple-600 mt-1">
                    {calculateSuccessRate(overallStats.passedAssertions, overallStats.totalAssertions)}% passed
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-purple-200 flex items-center justify-center">
                  <Target className="h-6 w-6 text-purple-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700">Avg Execution Time</p>
                  <p className="text-3xl font-bold text-orange-900">
                    {formatExecutionTime(overallStats.totalExecutionTime / Math.max(overallStats.totalSuites, 1))}
                  </p>
                  <p className="text-xs text-orange-600 mt-1">per suite</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-orange-200 flex items-center justify-center">
                  <Timer className="h-6 w-6 text-orange-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex h-[calc(100vh-300px)]">
          {/* Enhanced Sidebar */}
          <div className="w-96 bg-white rounded-lg shadow-lg border border-gray-200 flex flex-col mr-6">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Suites</h2>
              
              {/* Search and Filters */}
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search test suites..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-10"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="passed">Passed Only</SelectItem>
                      <SelectItem value="failed">Failed Only</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={serviceFilter} onValueChange={setServiceFilter}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Services</SelectItem>
                      {uniqueServices.map(service => (
                        <SelectItem key={service} value={service}>{service}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Latest First</SelectItem>
                    <SelectItem value="name">Name A-Z</SelectItem>
                    <SelectItem value="success">Success Rate</SelectItem>
                    <SelectItem value="time">Execution Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filter Summary */}
              {(searchTerm || statusFilter !== "all" || serviceFilter !== "all") && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    Showing {filteredResults.length} of {allResults.length} suites
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {searchTerm && (
                      <Badge variant="secondary" className="text-xs">Search: {searchTerm}</Badge>
                    )}
                    {statusFilter !== "all" && (
                      <Badge variant="secondary" className="text-xs">Status: {statusFilter}</Badge>
                    )}
                    {serviceFilter !== "all" && (
                      <Badge variant="secondary" className="text-xs">Service: {serviceFilter}</Badge>
                    )}
                  </div>
                </div>
              )}
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {filteredResults.map((result, index) => {
                  const successRate = calculateSuccessRate(result.summary.passed, result.summary.totalDataSets)
                  const isSelected = selectedResult?.summary.suiteName === result.summary.suiteName

                  return (
                    <Card
                      key={index}
                      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                        isSelected 
                          ? "ring-2 ring-blue-500 bg-blue-50 shadow-md" 
                          : "hover:bg-gray-50 shadow-sm"
                      }`}
                      onClick={() => setSelectedResult(result)}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="min-w-0 flex-1">
                              <h3 className="font-medium text-sm truncate text-gray-900">
                                {result.summary.suiteName}
                              </h3>
                              <div className="flex gap-1 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {result.summary.tags.serviceName}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {result.summary.tags.suiteType}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 ml-2">
                              {successRate === 100 ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : successRate >= 80 ? (
                                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500" />
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-xs text-gray-600">
                              <span>Success Rate</span>
                              <span className="font-medium">{successRate}%</span>
                            </div>
                            <Progress 
                              value={successRate} 
                              className={`h-2 ${
                                successRate === 100 ? "bg-green-100" :
                                successRate >= 80 ? "bg-yellow-100" : "bg-red-100"
                              }`}
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="text-center">
                              <div className="font-medium text-gray-900">{result.summary.totalDataSets}</div>
                              <div className="text-gray-500">Tests</div>
                            </div>
                            <div className="text-center">
                              <div className="font-medium text-green-600">{result.summary.passed}</div>
                              <div className="text-gray-500">Passed</div>
                            </div>
                            <div className="text-center">
                              <div className="font-medium text-red-600">{result.summary.failed}</div>
                              <div className="text-gray-500">Failed</div>
                            </div>
                          </div>

                          <div className="flex justify-between items-center text-xs text-gray-500">
                            <span>{formatExecutionTime(result.summary.executionTimeMs)}</span>
                            <span>{new Date(result.lastModified || 0).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}

                {filteredResults.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No test results found</p>
                    <p className="text-sm">Try adjusting your search or filters</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Enhanced Main Content */}
          <div className="flex-1 overflow-hidden">
            {selectedResult ? (
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 h-full flex flex-col">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">{selectedResult.summary.suiteName}</h2>
                    <Button variant="outline" onClick={() => exportResults(selectedResult)} className="hover:bg-gray-50">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>

                  {/* Enhanced Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-green-700">Success Rate</p>
                            <p className="text-2xl font-bold text-green-900">
                              {calculateSuccessRate(selectedResult.summary.passed, selectedResult.summary.totalDataSets)}%
                            </p>
                          </div>
                          <Award className="h-8 w-8 text-green-600" />
                        </div>
                        <Progress
                          value={calculateSuccessRate(selectedResult.summary.passed, selectedResult.summary.totalDataSets)}
                          className="mt-2 h-2 bg-green-200"
                        />
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-blue-700">Test Cases</p>
                            <p className="text-2xl font-bold text-blue-900">{selectedResult.summary.totalTestCases}</p>
                            <p className="text-xs text-blue-600">{selectedResult.summary.totalDataSets} data sets</p>
                          </div>
                          <FileText className="h-8 w-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-purple-700">Assertions</p>
                            <p className="text-2xl font-bold text-purple-900">{selectedResult.summary.totalAssertionsPassed}</p>
                            <p className="text-xs text-purple-600">{selectedResult.summary.totalAssertionsFailed} failed</p>
                          </div>
                          <Target className="h-8 w-8 text-purple-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-orange-700">Execution Time</p>
                            <p className="text-2xl font-bold text-orange-900">
                              {formatExecutionTime(selectedResult.summary.executionTimeMs)}
                            </p>
                          </div>
                          <Timer className="h-8 w-8 text-orange-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Tags */}
                  <div className="mt-4 flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-700">Tags:</span>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {selectedResult.summary.tags.serviceName}
                    </Badge>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                      {selectedResult.summary.tags.suiteType}
                    </Badge>
                    <span className="text-sm text-gray-500 ml-auto">
                      <Calendar className="h-4 w-4 inline mr-1" />
                      {new Date(selectedResult.lastModified || 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Test Results with Tabs */}
                <div className="flex-1 overflow-hidden">
                  <Tabs defaultValue="results" className="h-full flex flex-col">
                    <div className="px-6 pt-4">
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
                        <div className="space-y-4 pb-6">
                          {selectedResult.results.map((result, index) => (
                            <Card
                              key={index}
                              className={`border-l-4 ${
                                result.status === "PASS" ? "border-l-green-500 bg-green-50/30" : "border-l-red-500 bg-red-50/30"
                              } hover:shadow-md transition-shadow`}
                            >
                              <Collapsible>
                                <CollapsibleTrigger asChild>
                                  <CardHeader className="cursor-pointer hover:bg-gray-50/50 transition-colors">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        {getStatusIcon(result.status)}
                                        <div>
                                          <CardTitle className="text-base font-medium">{result.testCase}</CardTitle>
                                          <CardDescription className="text-sm">{result.dataSet}</CardDescription>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-4">
                                        <div className="text-right text-sm">
                                          <div className="flex items-center gap-2">
                                            <Badge className={getStatusColor(result.status)} variant="secondary">
                                              {result.status}
                                            </Badge>
                                            <span className="text-gray-500 font-mono">
                                              {formatExecutionTime(result.responseTimeMs)}
                                            </span>
                                          </div>
                                          <div className="text-xs text-gray-500 mt-1">
                                            <span className="text-green-600">✓ {result.assertionsPassed}</span>
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
                                        <AlertTriangle className="h-4 w-4 text-red-600" />
                                        <AlertDescription className="text-red-800">
                                          <div className="font-medium mb-2">Error Details:</div>
                                          <div className="text-sm space-y-1">
                                            {result.error.split(" | ").map((error, i) => (
                                              <div key={i} className="flex items-start gap-2">
                                                <span className="text-red-500 mt-0.5">•</span>
                                                <span>{error}</span>
                                              </div>
                                            ))}
                                          </div>
                                        </AlertDescription>
                                      </Alert>
                                    )}

                                    {result.responseBody && (
                                      <div className="mt-4">
                                        <h4 className="font-medium mb-3 text-red-800 flex items-center gap-2">
                                          <Activity className="h-4 w-4" />
                                          Response Body (Failed Test):
                                        </h4>
                                        <ScrollArea className="h-64 w-full border rounded-lg bg-gray-900">
                                          <pre className="p-4 text-xs font-mono whitespace-pre-wrap break-words">
                                            {typeof result.responseBody === "string" && isXmlContent(result.responseBody) ? (
                                              <code className="text-blue-300">
                                                {formatXmlContent(result.responseBody)}
                                              </code>
                                            ) : (
                                              <code className="text-green-300">
                                                {typeof result.responseBody === "string"
                                                  ? result.responseBody
                                                  : JSON.stringify(result.responseBody, null, 2)}
                                              </code>
                                            )}
                                          </pre>
                                        </ScrollArea>
                                      </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
                                      <div className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        <span className="text-sm font-medium">Assertions Passed:</span>
                                        <span className="text-green-600 font-bold">{result.assertionsPassed}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <XCircle className="h-4 w-4 text-red-500" />
                                        <span className="text-sm font-medium">Assertions Failed:</span>
                                        <span className="text-red-600 font-bold">{result.assertionsFailed}</span>
                                      </div>
                                    </div>
                                  </CardContent>
                                </CollapsibleContent>
                              </Collapsible>
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
    </div>
  )
}