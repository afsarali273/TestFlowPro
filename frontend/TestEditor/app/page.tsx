"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Plus, FileText, Play, Edit, Trash2, BarChart3, Eye, Settings, Upload, Zap, Globe, PlayCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { TestSuiteEditor } from "@/components/test-suite-editor"
import { TestSuiteRunner } from "@/components/test-suite-runner"
import { TestResultsDashboard } from "@/components/test-results-dashboard"
import { TestCasesModal } from "@/components/test-cases-modal"
import { PathConfigModal } from "@/components/path-config-modal"
import { FrameworkConfigModal } from "@/components/framework-config-modal"
import { SuiteRunnerModal } from "@/components/suite-runner-modal"
import { RunAllSuitesModal } from "@/components/run-all-suites-modal"

interface TestSuite {
  id: string
  suiteName: string
  baseUrl?: string
  status: string
  tags: Array<{ serviceName?: string; suiteType?: string }>
  testCases: Array<any>
  filePath?: string
  fileName?: string
}

export default function APITestFramework() {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([])
  const [selectedSuite, setSelectedSuite] = useState<TestSuite | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [showResultsDashboard, setShowResultsDashboard] = useState(false)
  const [showTestCasesModal, setShowTestCasesModal] = useState(false)
  const [showSuiteRunnerModal, setShowSuiteRunnerModal] = useState(false)
  const [showRunAllSuitesModal, setShowRunAllSuitesModal] = useState(false)

  // Add path configuration states
  const [testSuitePath, setTestSuitePath] = useState<string>("")
  const [frameworkPath, setFrameworkPath] = useState<string>("")
  const [isPathConfigOpen, setIsPathConfigOpen] = useState(false)
  const [isFrameworkConfigOpen, setIsFrameworkConfigOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { toast } = useToast()

  // Load paths and test suites on mount
  useEffect(() => {
    const savedPath = localStorage.getItem("testSuitePath")
    const savedFrameworkPath = localStorage.getItem("frameworkPath")

    if (savedPath) {
      setTestSuitePath(savedPath)
      loadTestSuitesFromPath(savedPath)
    } else {
      // Only show path config modal on client side
      if (typeof window !== "undefined") {
        setIsPathConfigOpen(true)
      }
    }

    if (savedFrameworkPath) {
      setFrameworkPath(savedFrameworkPath)
    }
  }, [])

  // Update the loadTestSuitesFromPath function to handle IDs more consistently
  const loadTestSuitesFromPath = async (path: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/test-suites?path=${encodeURIComponent(path)}`)
      if (response.ok) {
        const suites = await response.json()

        // Ensure all suites have unique IDs using a more deterministic approach
        const uniqueSuites = suites.map((suite: TestSuite, index: number) => ({
          ...suite,
          id: suite.id || `suite_${suite.suiteName.replace(/[^a-zA-Z0-9]/g, "_")}_${index}`,
        }))

        setTestSuites(uniqueSuites)
        toast({
          title: "Test Suites Loaded",
          description: `Loaded ${uniqueSuites.length} test suites from ${path}`,
        })
      } else {
        throw new Error("Failed to load test suites")
      }
    } catch (error) {
      toast({
        title: "Error Loading Test Suites",
        description: "Failed to load test suites from the specified path. Please check the path and try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Add path configuration handlers
  const handlePathSave = (path: string) => {
    setTestSuitePath(path)
    localStorage.setItem("testSuitePath", path)
    setIsPathConfigOpen(false)
    loadTestSuitesFromPath(path)
  }

  const handleFrameworkPathSave = (path: string) => {
    setFrameworkPath(path)
    localStorage.setItem("frameworkPath", path)
    setIsFrameworkConfigOpen(false)
  }

  // Update the handleImportSuite function
  const handleImportSuite = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const importedSuite = JSON.parse(e.target?.result as string)
          // Generate deterministic ID for imported suite
          const timestamp = Date.now()
          importedSuite.id = `imported_${importedSuite.suiteName.replace(/[^a-zA-Z0-9]/g, "_")}_${timestamp}`
          setTestSuites((prev) => [...prev, importedSuite])
          toast({
            title: "Test Suite Imported",
            description: "The test suite has been successfully imported.",
          })
        } catch (error) {
          toast({
            title: "Import Error",
            description: "Failed to import test suite. Please check the JSON format.",
            variant: "destructive",
          })
        }
      }
      reader.readAsText(file)
    }
  }

  /* --------------------------- helpers ------------------------------ */
  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      passed: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      running: "bg-blue-100 text-blue-800",
    }
    return map[status.toLowerCase()] || "bg-gray-100 text-gray-800"
  }

  /* --------------------------- handlers ----------------------------- */
  // Update the handleCreateSuite function to use a more deterministic ID
  const handleCreateSuite = () => {
    const timestamp = Date.now()
    const newId = `new_suite_${timestamp}`
    setSelectedSuite({
      id: newId,
      suiteName: "New Suite",
      baseUrl: "",
      status: "Not Started",
      tags: [],
      testCases: [],
    })
    setIsEditing(true)
  }

  const handleSaveSuite = async (suite: TestSuite) => {
    // Update the local state
    setTestSuites((prev) => {
      const exists = prev.find((s) => s.id === suite.id)
      return exists ? prev.map((s) => (s.id === suite.id ? suite : s)) : [...prev, suite]
    })

    setIsEditing(false)
    setSelectedSuite(null)

    // Refresh the test suites from the file system to ensure consistency
    if (testSuitePath) {
      await loadTestSuitesFromPath(testSuitePath)
    }

    toast({
      title: "Test Suite Saved",
      description: suite.filePath
        ? `Test suite saved to ${suite.fileName || "file"}`
        : "Test suite has been successfully saved.",
    })
  }

  const handleDeleteSuite = (suite: TestSuite) => {
    if (confirm(`Delete test-suite "${suite.suiteName}"? This action cannot be undone.`)) {
      setTestSuites((prev) => prev.filter((s) => s.id !== suite.id))
      toast({
        title: "Test Suite Deleted",
        description: "The test suite has been successfully deleted.",
      })
    }
  }

  const handleRunSuite = (suite: TestSuite) => {
    setSelectedSuite(suite)
    setShowSuiteRunnerModal(true)
  }

  // Filter suites with unique check
  const filteredSuites = testSuites
    .filter((s) => s.suiteName.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(
      (suite, index, self) => index === self.findIndex((s) => s.id === suite.id), // Remove any remaining duplicates
    )

  /* ------------------------------------------------------------------ */

  if (isEditing && selectedSuite) {
    return <TestSuiteEditor suite={selectedSuite} onSave={handleSaveSuite} onCancel={() => setIsEditing(false)} />
  }

  if (isRunning && selectedSuite) {
    return <TestSuiteRunner suite={selectedSuite} onClose={() => setIsRunning(false)} />
  }

  if (showResultsDashboard) {
    return <TestResultsDashboard onClose={() => setShowResultsDashboard(false)} />
  }

  return (
    <>
      {/* ------------ Main Page ------------- */}
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Header Section */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              {/* Logo and Title Section */}
              <div className="flex items-center space-x-4">
                {/* Company Logo */}
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                  <Zap className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    TestFlow Pro
                  </h1>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-gray-600 font-medium">Advanced API Test Automation Platform</p>
                    {testSuitePath && (
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                        📁 {testSuitePath.split("/").pop() || testSuitePath}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowResultsDashboard(true)}
                  className="h-10 px-4 border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </Button>

                <div className="flex items-center space-x-2 bg-gray-50 rounded-lg p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsFrameworkConfigOpen(true)}
                    className="h-8 px-3 hover:bg-white hover:shadow-sm transition-all duration-200"
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    Framework
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsPathConfigOpen(true)}
                    className="h-8 px-3 hover:bg-white hover:shadow-sm transition-all duration-200"
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    Suites Path
                  </Button>
                </div>

                <div className="h-6 w-px bg-gray-300"></div>

                <div className="relative">
                  <Input type="file" accept=".json" onChange={handleImportSuite} className="hidden" id="import-file" />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById("import-file")?.click()}
                    className="h-10 px-4 border-gray-300 hover:border-green-400 hover:bg-green-50 transition-all duration-200"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </Button>
                </div>

                <Button
                  onClick={handleCreateSuite}
                  className="h-10 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Test Suite
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Search and Stats Section */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Input
                  placeholder="Search test suites..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-80 h-11 pl-4 pr-4 border-gray-300 focus:border-blue-500 focus:ring-blue-500 shadow-sm"
                />
              </div>
              {filteredSuites.length > 0 && (
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    {filteredSuites.length} suite{filteredSuites.length !== 1 ? "s" : ""}
                  </span>
                  <span className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    {filteredSuites.reduce((acc, suite) => acc + suite.testCases.length, 0)} test cases
                  </span>
                </div>
              )}
            </div>

            {/* Run All Suites Button - Moved here */}
            <Button
              variant="outline"
              onClick={() => setShowRunAllSuitesModal(true)}
              disabled={!frameworkPath}
              className="h-11 px-6 border-gray-300 hover:border-green-400 hover:bg-green-50 transition-all duration-200 shadow-sm"
              title={!frameworkPath ? "Configure framework path first" : "Run all test suites"}
            >
              <PlayCircle className="h-4 w-4 mr-2" />
              Run All Suites
            </Button>
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-gray-600 font-medium">Loading test suites...</p>
            </div>
          )}

          {/* Suite grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSuites.map((suite) => (
              <Card
                key={suite.id}
                className="group hover:shadow-xl transition-all duration-300 border-0 shadow-md bg-white/80 backdrop-blur-sm hover:bg-white"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-sm group-hover:shadow-md transition-shadow duration-300">
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-700 transition-colors duration-200">
                          {suite.suiteName}
                        </CardTitle>
                        <CardDescription className="text-sm text-gray-600 mt-1">
                          {suite.testCases.length} test case{suite.testCases.length !== 1 ? "s" : ""}
                          {suite.fileName && (
                            <span className="block text-xs text-gray-500 mt-1">📄 {suite.fileName}</span>
                          )}
                          {suite.baseUrl && (
                            <span className="flex items-center text-xs text-blue-600 mt-1">
                              <Globe className="h-3 w-3 mr-1 flex-shrink-0" />
                              <span className="break-all">{suite.baseUrl}</span>
                            </span>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className={`${getStatusBadge(suite.status)} font-medium px-3 py-1 flex-shrink-0`}>
                      {suite.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                      {suite.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors duration-200"
                        >
                          {tag.serviceName || tag.suiteType}
                        </Badge>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedSuite(suite)
                            setIsEditing(true)
                          }}
                          className="h-8 px-3 border-gray-300 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedSuite(suite)
                            setShowTestCasesModal(true)
                          }}
                          className="h-8 px-3 border-gray-300 hover:border-green-400 hover:bg-green-50 hover:text-green-700 transition-all duration-200"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleRunSuite(suite)}
                          disabled={!frameworkPath || !suite.filePath}
                          className="h-8 px-3 bg-green-600 hover:bg-green-700 text-white transition-all duration-200"
                          title={
                            !frameworkPath
                              ? "Configure framework path first"
                              : !suite.filePath
                                ? "Save the suite first"
                                : "Run test suite"
                          }
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Run
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteSuite(suite)}
                          className="h-8 px-2 border-red-300 hover:border-red-400 hover:bg-red-50 hover:text-red-700 transition-all duration-200"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty state */}
          {!isLoading && filteredSuites.length === 0 && (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl mb-6">
                <FileText className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {searchTerm ? "No matching test suites" : "No test suites found"}
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {searchTerm
                  ? "Try adjusting your search criteria or browse all available test suites."
                  : "Get started by creating your first test suite or configuring a test suite path to load existing suites."}
              </p>
              {!searchTerm && (
                <div className="flex items-center justify-center space-x-4">
                  <Button
                    onClick={handleCreateSuite}
                    className="h-11 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Test Suite
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsPathConfigOpen(true)}
                    className="h-11 px-6 border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Configure Path
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ------------ Test-cases modal ------------- */}
      {selectedSuite && (
        <TestCasesModal
          suite={selectedSuite}
          isOpen={showTestCasesModal}
          onClose={() => {
            setShowTestCasesModal(false)
            setSelectedSuite(null)
          }}
        />
      )}

      {/* ------------ Suite Runner Modal ------------- */}
      {selectedSuite && (
        <SuiteRunnerModal
          suite={selectedSuite}
          isOpen={showSuiteRunnerModal}
          onClose={() => {
            setShowSuiteRunnerModal(false)
            setSelectedSuite(null)
          }}
        />
      )}

      {/* ------------ Run All Suites Modal ------------- */}
      <RunAllSuitesModal
        isOpen={showRunAllSuitesModal}
        onClose={() => setShowRunAllSuitesModal(false)}
      />

      {/* ------------ Path Configuration Modals ------------- */}
      {isPathConfigOpen && (
        <PathConfigModal
          onSave={handlePathSave}
          onCancel={() => setIsPathConfigOpen(false)}
          currentPath={testSuitePath}
        />
      )}

      {isFrameworkConfigOpen && (
        <FrameworkConfigModal
          onSave={handleFrameworkPathSave}
          onCancel={() => setIsFrameworkConfigOpen(false)}
          currentPath={frameworkPath}
        />
      )}
    </>
  )
}