"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  FileText,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Download,
  Upload,
  Settings,
  BarChart3,
} from "lucide-react"
import { TestSuiteEditor } from "@/components/test-suite-editor"
import { TestSuiteRunner } from "@/components/test-suite-runner"
import { TestResultsDashboard } from "@/components/test-results-dashboard"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface TestSuite {
  id: string
  suiteName: string
  status: string
  tags: Array<{ serviceName?: string; suiteType?: string }>
  testCases: Array<{
    name: string
    status: string
    testData: Array<any>
  }>
}

export default function APITestFramework() {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([])
  const [selectedSuite, setSelectedSuite] = useState<TestSuite | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()
  const [testSuitePath, setTestSuitePath] = useState<string>("")
  const [isPathConfigOpen, setIsPathConfigOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Add new state for framework configuration and results dashboard
  const [frameworkPath, setFrameworkPath] = useState<string>("")
  const [isFrameworkConfigOpen, setIsFrameworkConfigOpen] = useState(false)
  const [showResultsDashboard, setShowResultsDashboard] = useState(false)

  // Load sample data on mount
  useEffect(() => {
    // Check if paths are configured
    const savedPath = localStorage.getItem("testSuitePath")
    const savedFrameworkPath = localStorage.getItem("frameworkPath")

    if (savedPath) {
      setTestSuitePath(savedPath)
      loadTestSuitesFromPath(savedPath)
    } else {
      setIsPathConfigOpen(true)
    }

    if (savedFrameworkPath) {
      setFrameworkPath(savedFrameworkPath)
    }
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "passed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "running":
        return <Play className="h-4 w-4 text-blue-500" />
      default:
        return <Pause className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "passed":
        return "bg-green-100 text-green-800"
      case "failed":
        return "bg-red-100 text-red-800"
      case "running":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleCreateSuite = () => {
    const newSuite: TestSuite = {
      id: Date.now().toString(),
      suiteName: "New Test Suite",
      status: "Not Started",
      tags: [],
      testCases: [],
    }
    setSelectedSuite(newSuite)
    setIsEditing(true)
  }

  const handleEditSuite = (suite: TestSuite) => {
    setSelectedSuite(suite)
    setIsEditing(true)
  }

  const handleDeleteSuite = (suiteId: string) => {
    setTestSuites((prev) => prev.filter((suite) => suite.id !== suiteId))
    toast({
      title: "Test Suite Deleted",
      description: "The test suite has been successfully deleted.",
    })
  }

  const handleSaveSuite = (suite: TestSuite) => {
    if (testSuites.find((s) => s.id === suite.id)) {
      setTestSuites((prev) => prev.map((s) => (s.id === suite.id ? suite : s)))
    } else {
      setTestSuites((prev) => [...prev, suite])
    }
    setIsEditing(false)
    setSelectedSuite(null)
    toast({
      title: "Test Suite Saved",
      description: "The test suite has been successfully saved.",
    })
  }

  const handleRunSuite = (suite: TestSuite) => {
    setSelectedSuite(suite)
    setIsRunning(true)
  }

  const handleExportSuite = (suite: TestSuite) => {
    const dataStr = JSON.stringify(suite, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)
    const exportFileDefaultName = `${suite.suiteName.replace(/\s+/g, "_")}.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  const handleImportSuite = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const importedSuite = JSON.parse(e.target?.result as string)
          importedSuite.id = Date.now().toString()
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

  const loadTestSuitesFromPath = async (path: string) => {
    setIsLoading(true)
    try {
      // In a real implementation, this would call your backend API
      // For now, we'll simulate loading from the path
      addLog(`Loading test suites from path: ${path}`)

      // Simulate API call to get JSON files from the directory
      const response = await fetch(`/api/test-suites?path=${encodeURIComponent(path)}`)
      if (response.ok) {
        const suites = await response.json()
        setTestSuites(suites)
        addLog(`Loaded ${suites.length} test suites`)
      } else {
        throw new Error("Failed to load test suites")
      }
    } catch (error) {
      toast({
        title: "Error Loading Test Suites",
        description: "Failed to load test suites from the specified path. Please check the path and try again.",
        variant: "destructive",
      })
      addLog(`Error loading test suites: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Add framework configuration handler
  const handleFrameworkPathSave = (path: string) => {
    setFrameworkPath(path)
    localStorage.setItem("frameworkPath", path)
    setIsFrameworkConfigOpen(false)
  }

  const handlePathSave = (path: string) => {
    setTestSuitePath(path)
    localStorage.setItem("testSuitePath", path)
    setIsPathConfigOpen(false)
    loadTestSuitesFromPath(path)
  }

  const handlePathChange = () => {
    setIsPathConfigOpen(true)
  }

  const addLog = (message: string) => {
    console.log(message) // For now, just log to console
  }

  const filteredSuites = testSuites.filter(
    (suite) =>
      suite.suiteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      suite.tags.some(
        (tag) =>
          tag.serviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tag.suiteType?.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
  )

  if (showResultsDashboard) {
    return <TestResultsDashboard onClose={() => setShowResultsDashboard(false)} />
  }

  if (isPathConfigOpen) {
    return (
      <PathConfigModal
        onSave={handlePathSave}
        onCancel={() => setIsPathConfigOpen(false)}
        currentPath={testSuitePath}
      />
    )
  }

  if (isEditing && selectedSuite) {
    return (
      <TestSuiteEditor
        suite={selectedSuite}
        onSave={handleSaveSuite}
        onCancel={() => {
          setIsEditing(false)
          setSelectedSuite(null)
        }}
      />
    )
  }

  if (isRunning && selectedSuite) {
    return (
      <TestSuiteRunner
        suite={selectedSuite}
        onClose={() => {
          setIsRunning(false)
          setSelectedSuite(null)
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">API Test Framework</h1>
            <div className="flex items-center gap-2 mt-2">
              <p className="text-gray-600">Manage and execute your API test suites</p>
              {testSuitePath && (
                <Badge variant="outline" className="text-xs">
                  Path: {testSuitePath}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowResultsDashboard(true)}>
              <BarChart3 className="h-4 w-4 mr-2" />
              View Results
            </Button>
            <Button variant="outline" onClick={() => setIsFrameworkConfigOpen(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Framework Path
            </Button>
            <Button variant="outline" onClick={handlePathChange}>
              <Settings className="h-4 w-4 mr-2" />
              Test Suites Path
            </Button>
            <div className="relative">
              <Input type="file" accept=".json" onChange={handleImportSuite} className="hidden" id="import-file" />
              <Button variant="outline" onClick={() => document.getElementById("import-file")?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Import Suite
              </Button>
            </div>
            <Button onClick={handleCreateSuite}>
              <Plus className="h-4 w-4 mr-2" />
              New Test Suite
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <Input
            placeholder="Search test suites..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSuites.map((suite) => (
            <Card key={suite.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <CardTitle className="text-lg">{suite.suiteName}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(suite.status)}
                    <Badge className={getStatusColor(suite.status)}>{suite.status}</Badge>
                  </div>
                </div>
                <CardDescription>
                  {suite.testCases.length} test case{suite.testCases.length !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-1">
                    {suite.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag.serviceName || tag.suiteType}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEditSuite(suite)}>
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleExportSuite(suite)}>
                        <Download className="h-3 w-3 mr-1" />
                        Export
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleRunSuite(suite)} disabled={suite.testCases.length === 0}>
                        <Play className="h-3 w-3 mr-1" />
                        Run
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteSuite(suite.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredSuites.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No test suites found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm
                ? "No test suites match your search criteria."
                : "Get started by creating your first test suite."}
            </p>
            {!searchTerm && (
              <Button onClick={handleCreateSuite}>
                <Plus className="h-4 w-4 mr-2" />
                Create Test Suite
              </Button>
            )}
          </div>
        )}
      </div>
      {isFrameworkConfigOpen && (
        <FrameworkConfigModalComponent
          onSave={handleFrameworkPathSave}
          onCancel={() => setIsFrameworkConfigOpen(false)}
          currentPath={frameworkPath}
        />
      )}
    </div>
  )
}

interface PathConfigModalProps {
  onSave: (path: string) => void
  onCancel: () => void
  currentPath?: string
}

const PathConfigModal: React.FC<PathConfigModalProps> = ({ onSave, onCancel, currentPath }) => {
  const [path, setPath] = useState(currentPath || "")

  return (
    <Dialog open onOpenChange={() => onCancel()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Configure Test Suite Path</DialogTitle>
          <DialogDescription>Enter the path to the directory containing your test suite JSON files.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="path" className="text-right">
              Path
            </label>
            <Input id="path" value={path} className="col-span-3" onChange={(e) => setPath(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={() => onSave(path)}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface FrameworkConfigModalProps {
  onSave: (path: string) => void
  onCancel: () => void
  currentPath?: string
}

const FrameworkConfigModalComponent: React.FC<FrameworkConfigModalProps> = ({ onSave, onCancel, currentPath }) => {
  const [path, setPath] = useState(currentPath || "")

  return (
    <Dialog open onOpenChange={() => onCancel()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Configure Framework Path</DialogTitle>
          <DialogDescription>Enter the path to the directory containing your test framework files.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="path" className="text-right">
              Path
            </label>
            <Input id="path" value={path} className="col-span-3" onChange={(e) => setPath(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={() => onSave(path)}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
