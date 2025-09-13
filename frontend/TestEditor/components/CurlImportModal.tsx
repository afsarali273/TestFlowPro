'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, Save, Download, AlertCircle, Plus, FileText, Play } from 'lucide-react';
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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">🔄</span>
            cURL to TestFlow Pro Converter
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[70vh]">
          {/* Input Section */}
          <div className="flex flex-col space-y-4">
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
                <div className="p-3 bg-slate-50 rounded-lg space-y-2">
                  <h4 className="font-medium text-sm">Test Results</h4>
                  {testResult.error ? (
                    <div className="text-red-600 text-sm">{testResult.error}</div>
                  ) : (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className={testResult.status < 400 ? 'text-green-600' : 'text-red-600'}>
                          {testResult.status} {testResult.statusText}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Time:</span>
                        <span>{testResult.responseTime}ms</span>
                      </div>
                      {testResult.response && (
                        <div>
                          <span className="font-medium">Response:</span>
                          <pre className="mt-1 p-2 bg-white rounded text-xs max-h-40 overflow-auto">
                            {typeof testResult.response === 'string' 
                              ? testResult.response 
                              : JSON.stringify(testResult.response, null, 2)}
                          </pre>
                        </div>
                      )}
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
          <div className="flex flex-col space-y-4">
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