'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, Save, Download, AlertCircle, Plus, FileText, Play, Shield } from 'lucide-react';
import { CurlParser, CurlParseResult } from '../../../src/utils/curlParser';
import { TestSuite } from '../../../src/types';

interface CurlImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (testSuite: TestSuite) => void;
  onAddToExisting?: (suiteId: string, testCase: any) => void;
  existingSuites?: TestSuite[];
}

export const CurlImportModal: React.FC<CurlImportModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onAddToExisting,
  existingSuites = []
}) => {
  const [curlInput, setCurlInput] = useState('');
  const [parseResult, setParseResult] = useState<CurlParseResult | null>(null);
  const [jsonOutput, setJsonOutput] = useState('');
  const [importMode, setImportMode] = useState<'new' | 'existing'>('new');
  const [selectedSuiteId, setSelectedSuiteId] = useState<string>('');
  const [savePath, setSavePath] = useState<string>('');
  const [testResult, setTestResult] = useState<any>(null);
  const [isTestingCurl, setIsTestingCurl] = useState(false);
  const [jsonPath, setJsonPath] = useState('');
  const [filteredResult, setFilteredResult] = useState<any>(null);
  const [assertions, setAssertions] = useState<any[]>([]);

  const handleTestCurl = async () => {
    if (!curlInput.trim()) return;
    
    setIsTestingCurl(true);
    try {
      const response = await fetch('/api/test-curl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ curlCommand: curlInput })
      });
      
      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      setTestResult({ error: 'Failed to execute cURL command' });
    } finally {
      setIsTestingCurl(false);
    }
  };

  const handleJsonPathFilter = () => {
    if (!testResult?.data || !jsonPath.trim()) {
      setFilteredResult(null);
      return;
    }

    try {
      // Simple JSONPath implementation for basic queries
      const data = testResult.data;
      let result = data;
      
      if (jsonPath === '$') {
        result = data;
      } else if (jsonPath.startsWith('$.')) {
        const path = jsonPath.substring(2);
        const parts = path.split('.');
        
        for (const part of parts) {
          if (part.includes('[') && part.includes(']')) {
            const [key, indexStr] = part.split('[');
            const index = parseInt(indexStr.replace(']', ''));
            result = key ? result[key][index] : result[index];
          } else {
            result = result[part];
          }
          if (result === undefined) break;
        }
      }
      
      setFilteredResult(result);
    } catch (error) {
      setFilteredResult({ error: 'Invalid JSONPath expression' });
    }
  };

  const addAssertion = (type: string, expected?: any) => {
    if (!jsonPath.trim()) return;
    
    const newAssertion = {
      type,
      jsonPath,
      ...(expected !== undefined && { expected })
    };
    
    setAssertions(prev => [...prev, newAssertion]);
  };

  const removeAssertion = (index: number) => {
    setAssertions(prev => prev.filter((_, i) => i !== index));
  };

  const updateTestSuiteWithAssertions = () => {
    if (!parseResult?.testSuite || assertions.length === 0) return;
    
    const updatedSuite = { ...parseResult.testSuite };
    if (updatedSuite.testCases[0]?.testData[0]) {
      updatedSuite.testCases[0].testData[0].assertions = [
        ...(updatedSuite.testCases[0].testData[0].assertions || []),
        ...assertions
      ];
    }
    
    setJsonOutput(JSON.stringify(updatedSuite, null, 2));
    setParseResult({ ...parseResult, testSuite: updatedSuite });
    setAssertions([]);
  };

  const handleParse = () => {
    if (!curlInput.trim()) return;
    
    const result = CurlParser.parse(curlInput);
    setParseResult(result);
    
    if (result.success && result.testSuite) {
      setJsonOutput(JSON.stringify(result.testSuite, null, 2));
    } else {
      setJsonOutput('');
    }
  };

  const handleCopy = async () => {
    if (jsonOutput) {
      await navigator.clipboard.writeText(jsonOutput);
    }
  };

  const handleSave = () => {
    if (!parseResult?.success || !parseResult.testSuite) return;
    
    if (importMode === 'new' && onSave) {
      const completeTestSuite = {
        ...parseResult.testSuite,
        status: 'Not Started',
        ...(savePath && { filePath: savePath })
      };
      onSave(completeTestSuite);
      onClose();
    } else if (importMode === 'existing' && onAddToExisting && selectedSuiteId) {
      const testCase = parseResult.testSuite.testCases[0];
      onAddToExisting(selectedSuiteId, testCase);
      onClose();
    }
  };

  const handleDownload = () => {
    if (jsonOutput) {
      const blob = new Blob([jsonOutput], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `curl-import-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleReset = () => {
    setCurlInput('');
    setParseResult(null);
    setJsonOutput('');
    setTestResult(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">🔄</span>
            cURL to TestFlow Pro Converter
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-hidden">
          {/* Input Section */}
          <div className="flex flex-col space-y-4 overflow-y-auto pr-2">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Paste your cURL command:
              </label>
              <Textarea
                value={curlInput}
                onChange={(e) => setCurlInput(e.target.value)}
                placeholder="curl -X GET 'https://api.example.com/users' -H 'Authorization: Bearer token'"
                className="h-32 font-mono text-sm"
              />
            </div>
            
            <div className="space-y-4">
              {/* Test Results */}
              {testResult && (
                <div className="p-3 bg-slate-50 rounded-lg space-y-3">
                  <h4 className="font-medium text-sm">API Response</h4>
                  {testResult.error ? (
                    <div className="text-red-600 text-sm">{testResult.error}</div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Status: <span className={testResult.status < 400 ? 'text-green-600' : 'text-red-600'}>{testResult.status}</span></span>
                        <span>Time: {testResult.time}ms</span>
                      </div>
                      
                      {testResult.data && (
                        <div>
                          <div className="font-medium text-sm mb-2">Response Data:</div>
                          <pre className="p-2 bg-white rounded text-xs max-h-32 overflow-auto border">
                            {JSON.stringify(testResult.data, null, 2)}
                          </pre>
                        </div>
                      )}
                      
                      {/* JSONPath Filter Section */}
                      <div className="border-t pt-3">
                        <div className="font-medium text-sm mb-2">JSONPath Filter:</div>
                        <div className="flex gap-2 mb-2">
                          <Input
                            value={jsonPath}
                            onChange={(e) => setJsonPath(e.target.value)}
                            placeholder="$.data[0].name or $..id"
                            className="text-xs h-8 flex-1"
                          />
                          <Button size="sm" onClick={handleJsonPathFilter} className="text-xs h-8">
                            Filter
                          </Button>
                        </div>
                        
                        {filteredResult !== null && (
                          <div>
                            <div className="text-xs text-gray-600 mb-1">Filtered Result:</div>
                            <pre className="p-2 bg-white rounded text-xs max-h-24 overflow-auto border">
                              {filteredResult?.error 
                                ? filteredResult.error 
                                : JSON.stringify(filteredResult, null, 2)}
                            </pre>
                            
                            {!filteredResult?.error && jsonPath && (
                              <div className="mt-2 flex gap-1 flex-wrap">
                                <Button size="sm" onClick={() => addAssertion('exists')} className="text-xs h-6">
                                  + Exists
                                </Button>
                                <Button size="sm" onClick={() => addAssertion('equals', filteredResult)} className="text-xs h-6">
                                  + Equals
                                </Button>
                                <Button size="sm" onClick={() => addAssertion('contains', filteredResult)} className="text-xs h-6">
                                  + Contains
                                </Button>
                                <Button size="sm" onClick={() => addAssertion('type', typeof filteredResult)} className="text-xs h-6">
                                  + Type
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="text-xs text-gray-500 mt-1">
                          Examples: <code>$</code> (root), <code>$.data</code> (data field), <code>$.items[0]</code> (first item)
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleTestCurl} disabled={isTestingCurl || !curlInput.trim()}>
                  <Play className="h-4 w-4 mr-1" />
                  {isTestingCurl ? 'Testing...' : 'Test cURL'}
                </Button>
                <Button onClick={handleParse} disabled={!curlInput.trim()}>
                  Parse cURL
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  Reset
                </Button>
              </div>
              
              {/* Assertions Section */}
              {assertions.length > 0 && (
                <div className="p-3 bg-green-50 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Added Assertions ({assertions.length})</h4>
                    <Button size="sm" onClick={updateTestSuiteWithAssertions} className="text-xs">
                      <Shield className="h-3 w-3 mr-1" />
                      Apply to Suite
                    </Button>
                  </div>
                  <div className="space-y-1">
                    {assertions.map((assertion, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-white rounded text-xs">
                        <div>
                          <span className="font-mono">{assertion.jsonPath}</span>
                          <span className="mx-2 text-gray-500">{assertion.type}</span>
                          {assertion.expected !== undefined && (
                            <span className="text-blue-600">{JSON.stringify(assertion.expected)}</span>
                          )}
                        </div>
                        <Button size="sm" variant="outline" onClick={() => removeAssertion(index)} className="h-5 w-5 p-0">
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {parseResult?.success && (
                <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-sm">Import Options:</h4>
                  
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="importMode"
                        value="new"
                        checked={importMode === 'new'}
                        onChange={(e) => setImportMode(e.target.value as 'new')}
                        className="w-4 h-4"
                      />
                      <Plus className="h-4 w-4" />
                      <span className="text-sm">Create New Suite</span>
                    </label>
                    
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="importMode"
                        value="existing"
                        checked={importMode === 'existing'}
                        onChange={(e) => setImportMode(e.target.value as 'existing')}
                        className="w-4 h-4"
                      />
                      <FileText className="h-4 w-4" />
                      <span className="text-sm">Add to Existing Suite</span>
                    </label>
                  </div>
                  
                  {importMode === 'new' && (
                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Save Path (optional):
                      </label>
                      <Input
                        value={savePath}
                        onChange={(e) => setSavePath(e.target.value)}
                        placeholder="/path/to/save/suite.json"
                        className="text-sm"
                      />
                    </div>
                  )}
                  
                  {importMode === 'existing' && (
                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Select Existing Suite:
                      </label>
                      <Select value={selectedSuiteId} onValueChange={setSelectedSuiteId}>
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Choose a test suite" />
                        </SelectTrigger>
                        <SelectContent>
                          {existingSuites.filter(s => s.type === 'API').map((suite) => (
                            <SelectItem key={suite.id} value={suite.id}>
                              {suite.suiteName} ({suite.testCases.length} cases)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}
            </div>

            {parseResult?.error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-700">{parseResult.error}</span>
              </div>
            )}
          </div>

          {/* Output Section */}
          <div className="flex flex-col space-y-4 overflow-y-auto pr-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                Generated TestFlow Pro JSON:
              </label>
              {jsonOutput && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="flex items-center gap-1"
                  >
                    <Copy className="h-3 w-3" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    className="flex items-center gap-1"
                  >
                    <Download className="h-3 w-3" />
                    Download
                  </Button>
                  {(onSave || onAddToExisting) && (
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={
                        (importMode === 'new' && !onSave) ||
                        (importMode === 'existing' && (!onAddToExisting || !selectedSuiteId))
                      }
                      className="flex items-center gap-1"
                    >
                      <Save className="h-3 w-3" />
                      {importMode === 'new' ? 'Create Suite' : 'Add Test Case'}
                    </Button>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex-1 border rounded-md overflow-hidden">
              <pre className="h-full overflow-auto p-4 text-xs font-mono bg-gray-50">
                {jsonOutput || 'Parsed JSON will appear here...'}
              </pre>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};