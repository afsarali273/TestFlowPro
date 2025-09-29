"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Play, Plus } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

interface AssertionGeneratorProps {
  isOpen: boolean
  onClose: () => void
  onAddAssertions: (assertions: any[]) => void
  testCaseType?: string
  baseUrl?: string
  initialData?: {
    method?: string
    endpoint?: string
    headers?: Record<string, string>
    body?: any
  }
}

export function AssertionGenerator({ 
  isOpen, 
  onClose, 
  onAddAssertions, 
  testCaseType = "REST",
  baseUrl = "",
  initialData 
}: AssertionGeneratorProps) {
  const [method, setMethod] = useState(initialData?.method || "GET")
  const [currentBaseUrl, setCurrentBaseUrl] = useState(baseUrl || "")
  const [endpoint, setEndpoint] = useState(initialData?.endpoint || "")

  // Update baseUrl when prop changes or modal opens
  useEffect(() => {
    if (isOpen) {
      // Try to get base URL from local storage first, then fall back to prop
      const storedBaseUrl = localStorage.getItem('suiteBaseUrl')
      const effectiveBaseUrl = storedBaseUrl || baseUrl || ""
      console.log("AssertionGenerator - stored baseUrl:", storedBaseUrl)
      console.log("AssertionGenerator - prop baseUrl:", baseUrl)
      console.log("AssertionGenerator - using baseUrl:", effectiveBaseUrl)
      setCurrentBaseUrl(effectiveBaseUrl)
    }
  }, [baseUrl, isOpen])
  const [headers, setHeaders] = useState(initialData?.headers || {})
  const [body, setBody] = useState(JSON.stringify(initialData?.body || {}, null, 2))
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState<any>(null)
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set())
  const [pathFilter, setPathFilter] = useState("")
  const [pathAssertions, setPathAssertions] = useState<Record<string, {type: string, expected: any}>>({})

  const handleTestApi = async () => {
    setIsLoading(true)
    try {
      const testBody = method !== "GET" ? JSON.parse(body || "{}") : undefined
      
      const res = await fetch("/api/test-api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method,
          endpoint: currentBaseUrl + endpoint,
          headers,
          body: testBody
        })
      })

      const result = await res.json()
      setResponse(result)
    } catch (error) {
      console.error("API test failed:", error)
      setResponse({ error: "Failed to test API" })
    } finally {
      setIsLoading(false)
    }
  }

  const extractJsonPaths = (obj: any, prefix = "$"): string[] => {
    const paths: string[] = []
    
    if (obj && typeof obj === "object") {
      if (Array.isArray(obj)) {
        paths.push(prefix)
        if (obj.length > 0) {
          const itemPaths = extractJsonPaths(obj[0], `${prefix}[0]`)
          paths.push(...itemPaths)
        }
      } else {
        Object.keys(obj).forEach(key => {
          const newPath = `${prefix}.${key}`
          paths.push(newPath)
          const nestedPaths = extractJsonPaths(obj[key], newPath)
          paths.push(...nestedPaths)
        })
      }
    } else {
      paths.push(prefix)
    }
    
    return [...new Set(paths)]
  }

  const generateAssertions = () => {
    const assertions: any[] = []
    
    // Add status code assertion
    if (response?.status) {
      assertions.push({
        id: `assertion_${Date.now()}_status`,
        type: "statusCode",
        expected: response.status
      })
    }

    // Add selected path assertions
    selectedPaths.forEach(path => {
      const pathAssertion = pathAssertions[path]
      if (pathAssertion) {
        const assertion: any = {
          id: `assertion_${Date.now()}_${path.replace(/[^a-zA-Z0-9]/g, "_")}`,
          type: pathAssertion.type,
          jsonPath: path
        }
        
        // Add expected value for assertion types that need it
        if (pathAssertion.type !== "exists") {
          assertion.expected = pathAssertion.expected
        }
        
        assertions.push(assertion)
      }
    })

    onAddAssertions(assertions)
    onClose()
  }

  const getValueByPath = (obj: any, path: string): any => {
    try {
      const keys = path.replace("$.", "").split(".")
      let current = obj
      for (const key of keys) {
        if (key.includes("[") && key.includes("]")) {
          const [arrayKey, indexStr] = key.split("[")
          const index = parseInt(indexStr.replace("]", ""))
          current = current[arrayKey]?.[index]
        } else {
          current = current?.[key]
        }
      }
      return current
    } catch {
      return undefined
    }
  }

  const togglePath = (path: string) => {
    const newSelected = new Set(selectedPaths)
    if (newSelected.has(path)) {
      newSelected.delete(path)
      const newAssertions = { ...pathAssertions }
      delete newAssertions[path]
      setPathAssertions(newAssertions)
    } else {
      newSelected.add(path)
      // Auto-suggest assertion type and expected value
      const value = getValueByPath(response?.data, path)
      const suggestion = suggestAssertion(value)
      setPathAssertions(prev => ({
        ...prev,
        [path]: suggestion
      }))
    }
    setSelectedPaths(newSelected)
  }

  const suggestAssertion = (value: any) => {
    if (value === null || value === undefined) {
      return { type: "exists", expected: "" }
    }
    if (typeof value === "string") {
      if (value.includes("@")) {
        return { type: "contains", expected: "@" }
      }
      return { type: "equals", expected: value }
    }
    if (typeof value === "number") {
      return { type: "equals", expected: value }
    }
    if (typeof value === "boolean") {
      return { type: "equals", expected: value }
    }
    if (Array.isArray(value)) {
      return { type: "length", expected: value.length }
    }
    return { type: "exists", expected: "" }
  }

  const updatePathAssertion = (path: string, field: string, value: any) => {
    setPathAssertions(prev => ({
      ...prev,
      [path]: {
        ...prev[path],
        [field]: value
      }
    }))
  }

  const jsonPaths = response?.data ? extractJsonPaths(response.data) : []
  const filteredPaths = jsonPaths.filter(path => 
    path.toLowerCase().includes(pathFilter.toLowerCase())
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Auto-Generate Assertions</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Base URL</Label>
              <Input 
                value={currentBaseUrl} 
                onChange={(e) => setCurrentBaseUrl(e.target.value)}
                placeholder="https://api.example.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Method</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Endpoint</Label>
                <Input 
                  value={endpoint} 
                  onChange={(e) => setEndpoint(e.target.value)}
                  placeholder="/api/endpoint"
                />
              </div>
            </div>

            {method !== "GET" && (
              <div>
                <Label>Request Body (JSON)</Label>
                <Textarea 
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={6}
                  placeholder="{}"
                />
              </div>
            )}

            <Button onClick={handleTestApi} disabled={isLoading || !endpoint}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              Test API
            </Button>
          </div>

          <div className="space-y-4">
            {response && (
              <>
                <div>
                  <Label>Response Status: {response.status}</Label>
                  <Textarea 
                    value={JSON.stringify(response.data, null, 2)}
                    readOnly
                    rows={8}
                    className="font-mono text-sm"
                  />
                </div>

                {jsonPaths.length > 0 && (
                  <div>
                    <Label>Select Paths for Assertions</Label>
                    <Input 
                      placeholder="Filter paths (e.g., id, user, email)..."
                      value={pathFilter}
                      onChange={(e) => setPathFilter(e.target.value)}
                      className="mb-2 text-sm"
                    />
                    <div className="max-h-60 overflow-y-auto border rounded p-2 space-y-2">
                      {filteredPaths.map((path, index) => {
                        const value = getValueByPath(response.data, path)
                        const isSelected = selectedPaths.has(path)
                        const pathAssertion = pathAssertions[path]
                        
                        return (
                          <div key={`${path}-${index}`} className="border rounded p-2 bg-gray-50">
                            <div className="flex items-center space-x-2 mb-2">
                              <Checkbox 
                                checked={isSelected}
                                onCheckedChange={() => togglePath(path)}
                              />
                              <span className="text-sm font-mono flex-1">{path}</span>
                              <span className="text-xs text-gray-500">
                                {JSON.stringify(value)}
                              </span>
                            </div>
                            
                            {isSelected && (
                              <div className="grid grid-cols-2 gap-2 ml-6">
                                <Select 
                                  value={pathAssertion?.type || "exists"} 
                                  onValueChange={(type) => updatePathAssertion(path, "type", type)}
                                >
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="equals">Equals</SelectItem>
                                    <SelectItem value="notEquals">Not Equals</SelectItem>
                                    <SelectItem value="contains">Contains</SelectItem>
                                    <SelectItem value="startsWith">Starts With</SelectItem>
                                    <SelectItem value="endsWith">Ends With</SelectItem>
                                    <SelectItem value="greaterThan">Greater Than</SelectItem>
                                    <SelectItem value="lessThan">Less Than</SelectItem>
                                    <SelectItem value="length">Length</SelectItem>
                                    <SelectItem value="type">Type</SelectItem>
                                    <SelectItem value="exists">Exists</SelectItem>
                                    <SelectItem value="regex">Regex</SelectItem>
                                  </SelectContent>
                                </Select>
                                
                                {pathAssertion?.type !== "exists" && (
                                  <Input 
                                    placeholder="Expected value"
                                    value={pathAssertion?.expected || ""}
                                    onChange={(e) => updatePathAssertion(path, "expected", e.target.value)}
                                    className="h-8 text-xs"
                                  />
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                      {filteredPaths.length === 0 && pathFilter && (
                        <div className="text-center py-2 text-gray-500 text-sm">
                          No paths match "{pathFilter}"
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={generateAssertions} 
            disabled={!response || selectedPaths.size === 0}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add {selectedPaths.size} Assertion{selectedPaths.size !== 1 ? 's' : ''}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}