"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X, FileText, Database, CheckCircle, XCircle, Clock } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface TestCasesModalProps {
  suite: any
  isOpen: boolean
  onClose: () => void
}

export function TestCasesModal({ suite, isOpen, onClose }: TestCasesModalProps) {
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "passed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "running":
        return <Clock className="h-4 w-4 text-blue-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
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

  const getMethodColor = (method: string) => {
    switch (method?.toUpperCase()) {
      case "GET":
        return "bg-green-100 text-green-800"
      case "POST":
        return "bg-blue-100 text-blue-800"
      case "PUT":
        return "bg-yellow-100 text-yellow-800"
      case "PATCH":
        return "bg-orange-100 text-orange-800"
      case "DELETE":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Test Cases - {suite.suiteName}
          </DialogTitle>
          <DialogDescription>View all test cases and their test data for this suite</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 p-1">
            {suite.testCases && suite.testCases.length > 0 ? (
              suite.testCases.map((testCase: any, testCaseIndex: number) => (
                <Card key={testCaseIndex} className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {getStatusIcon(testCase.status)}
                          {testCase.name}
                        </CardTitle>
                        <CardDescription>
                          {testCase.testData?.length || 0} test data item{testCase.testData?.length !== 1 ? "s" : ""}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(testCase.status)}>{testCase.status}</Badge>
                    </div>
                  </CardHeader>

                  {testCase.testData && testCase.testData.length > 0 && (
                    <CardContent>
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm text-gray-700">Test Data:</h4>
                        {testCase.testData.map((testData: any, dataIndex: number) => (
                          <Card key={dataIndex} className="bg-gray-50">
                            <CardContent className="p-4">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <h5 className="font-medium text-sm">{testData.name}</h5>
                                  <div className="flex items-center gap-2">
                                    <Badge className={getMethodColor(testData.method)}>{testData.method}</Badge>
                                    <code className="text-xs bg-gray-200 px-2 py-1 rounded">{testData.endpoint}</code>
                                  </div>
                                </div>

                                {/* Headers */}
                                {testData.headers && Object.keys(testData.headers).length > 0 && (
                                  <div>
                                    <h6 className="text-xs font-medium text-gray-600 mb-1">Headers:</h6>
                                    <div className="grid grid-cols-2 gap-1 text-xs">
                                      {Object.entries(testData.headers).map(([key, value]) => (
                                        <div key={key} className="flex">
                                          <span className="font-medium text-gray-700">{key}:</span>
                                          <span className="ml-1 text-gray-600">{value as string}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Body */}
                                {testData.body && Object.keys(testData.body).length > 0 && (
                                  <div>
                                    <h6 className="text-xs font-medium text-gray-600 mb-1">Request Body:</h6>
                                    <pre className="text-xs bg-gray-200 p-2 rounded overflow-x-auto">
                                      {JSON.stringify(testData.body, null, 2)}
                                    </pre>
                                  </div>
                                )}

                                {/* Assertions */}
                                {testData.assertions && testData.assertions.length > 0 && (
                                  <div>
                                    <h6 className="text-xs font-medium text-gray-600 mb-1">
                                      Assertions ({testData.assertions.length}):
                                    </h6>
                                    <div className="space-y-1">
                                      {testData.assertions.map((assertion: any, assertionIndex: number) => (
                                        <div
                                          key={assertionIndex}
                                          className="text-xs bg-white p-2 rounded border flex items-center gap-2"
                                        >
                                          <Badge variant="outline" className="text-xs">
                                            {assertion.type}
                                          </Badge>
                                          {assertion.jsonPath && (
                                            <code className="bg-gray-100 px-1 rounded">{assertion.jsonPath}</code>
                                          )}
                                          {assertion.expected !== undefined && (
                                            <span className="text-gray-600">
                                              = <strong>{JSON.stringify(assertion.expected)}</strong>
                                            </span>
                                          )}
                                          {assertion.type === "arrayObjectMatch" && (
                                            <span className="text-gray-600 text-xs">
                                              [{assertion.matchField}={assertion.matchValue} → {assertion.assertField}]
                                            </span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Pre-process */}
                                {testData.preProcess && testData.preProcess.length > 0 && (
                                  <div>
                                    <h6 className="text-xs font-medium text-gray-600 mb-1">Pre-Process:</h6>
                                    <div className="space-y-1">
                                      {testData.preProcess.map((process: any, processIndex: number) => (
                                        <div key={processIndex} className="text-xs bg-blue-50 p-2 rounded">
                                          <code>
                                            {process.var} = {process.function}({process.args?.join(", ")})
                                          </code>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Store Variables */}
                                {testData.store && Object.keys(testData.store).length > 0 && (
                                  <div>
                                    <h6 className="text-xs font-medium text-gray-600 mb-1">Store Variables:</h6>
                                    <div className="grid grid-cols-2 gap-1 text-xs">
                                      {Object.entries(testData.store).map(([key, value]) => (
                                        <div key={key} className="flex">
                                          <span className="font-medium text-gray-700">{key}:</span>
                                          <code className="ml-1 text-gray-600 bg-gray-100 px-1 rounded">
                                            {value as string}
                                          </code>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  )}

                  {(!testCase.testData || testCase.testData.length === 0) && (
                    <CardContent>
                      <div className="text-center py-4 text-gray-500">
                        <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No test data defined for this test case</p>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No test cases found</p>
                <p className="text-sm">This test suite doesn't have any test cases defined yet.</p>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
