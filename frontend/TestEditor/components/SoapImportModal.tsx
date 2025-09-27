'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, Save, Download, AlertCircle, Plus, FileText, Play, Shield } from 'lucide-react';
import { SoapParser, SoapParseResult } from '../../../src/utils/soapParser';
import { TestSuite } from '../../../src/types';

interface SoapImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (testSuite: TestSuite) => void;
  onAddToExisting?: (suiteId: string, testCase: any) => void;
  existingSuites?: TestSuite[];
}

export const SoapImportModal: React.FC<SoapImportModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onAddToExisting,
  existingSuites = []
}) => {
  const [inputType, setInputType] = useState<'wsdl' | 'xml'>('xml');
  const [wsdlUrl, setWsdlUrl] = useState('');
  const [operation, setOperation] = useState('');
  const [xmlBody, setXmlBody] = useState('');
  const [serviceUrl, setServiceUrl] = useState('');
  const [soapAction, setSoapAction] = useState('');
  const [parseResult, setParseResult] = useState<SoapParseResult | null>(null);
  const [isFetchingWsdl, setIsFetchingWsdl] = useState(false);
  const [wsdlOperations, setWsdlOperations] = useState<string[]>([]);
  const [jsonOutput, setJsonOutput] = useState('');
  const [importMode, setImportMode] = useState<'new' | 'existing'>('new');
  const [selectedSuiteId, setSelectedSuiteId] = useState<string>('');
  const [savePath, setSavePath] = useState<string>('');
  const [testResult, setTestResult] = useState<any>(null);
  const [isTestingSoap, setIsTestingSoap] = useState(false);
  const [xpathQuery, setXpathQuery] = useState('');
  const [filteredResult, setFilteredResult] = useState<any>(null);
  const [assertions, setAssertions] = useState<any[]>([]);

  const handleFetchWsdl = async () => {
    if (!wsdlUrl.trim()) return;
    
    setIsFetchingWsdl(true);
    try {
      const response = await fetch('/api/fetch-wsdl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wsdlUrl })
      });
      
      const result = await response.json();
      if (result.operations) {
        setWsdlOperations(result.operations);
        if (result.operations.length > 0) {
          setOperation(result.operations[0]);
        }
      } else {
        setWsdlOperations([]);
      }
    } catch (error) {
      setWsdlOperations([]);
    } finally {
      setIsFetchingWsdl(false);
    }
  };

  const handleTestSoap = async () => {
    const soapRequest = inputType === 'wsdl' 
      ? { url: wsdlUrl.replace('?wsdl', ''), body: parseResult?.testSuite?.testCases[0]?.testData[0]?.body }
      : { url: serviceUrl, body: xmlBody, headers: soapAction ? { 'SOAPAction': `"${soapAction}"` } : {} };
    
    if (!soapRequest.url || !soapRequest.body) return;
    
    setIsTestingSoap(true);
    try {
      const response = await fetch('/api/test-soap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ soapRequest })
      });
      
      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      setTestResult({ error: 'Failed to execute SOAP request' });
    } finally {
      setIsTestingSoap(false);
    }
  };

  const handleXPathFilter = () => {
    if (!testResult?.data || !xpathQuery.trim()) {
      setFilteredResult(null);
      return;
    }

    try {
      // Simple XPath-like filtering for XML
      const xmlData = testResult.data;
      let result = xmlData;
      
      if (xpathQuery.includes('//')) {
        const tagName = xpathQuery.replace('//', '');
        const regex = new RegExp(`<${tagName}[^>]*>([^<]*)</${tagName}>`, 'g');
        const matches = [...xmlData.matchAll(regex)];
        result = matches.map(m => m[1]);
      } else if (xpathQuery.startsWith('/')) {
        const tagName = xpathQuery.replace('/', '');
        const regex = new RegExp(`<${tagName}[^>]*>([^<]*)</${tagName}>`);
        const match = xmlData.match(regex);
        result = match ? match[1] : null;
      }
      
      setFilteredResult(result);
    } catch (error) {
      setFilteredResult({ error: 'Invalid XPath expression' });
    }
  };

  const addAssertion = (type: string, expected?: any) => {
    if (!xpathQuery.trim()) return;
    
    const newAssertion = {
      type,
      xpathExpression: xpathQuery,
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
    let result: SoapParseResult;
    
    if (inputType === 'wsdl') {
      if (!wsdlUrl.trim() || !operation.trim()) return;
      result = SoapParser.parseFromWsdl(wsdlUrl, operation);
    } else {
      if (!xmlBody.trim() || !serviceUrl.trim()) return;
      result = SoapParser.parseFromXml(xmlBody, serviceUrl, soapAction);
    }
    
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
      a.download = `soap-import-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleReset = () => {
    setWsdlUrl('');
    setOperation('');
    setXmlBody('');
    setServiceUrl('');
    setSoapAction('');
    setParseResult(null);
    setJsonOutput('');
    setTestResult(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">🧼</span>
            SOAP to TestFlow Pro Converter
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-hidden">
          {/* Input Section */}
          <div className="flex flex-col space-y-4 overflow-y-auto pr-2">
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="inputType"
                  value="xml"
                  checked={inputType === 'xml'}
                  onChange={(e) => setInputType(e.target.value as 'xml')}
                />
                <span className="text-sm">XML Body</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="inputType"
                  value="wsdl"
                  checked={inputType === 'wsdl'}
                  onChange={(e) => setInputType(e.target.value as 'wsdl')}
                />
                <span className="text-sm">WSDL URL</span>
              </label>
            </div>

            {inputType === 'xml' ? (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Service URL:</label>
                  <Input
                    value={serviceUrl}
                    onChange={(e) => setServiceUrl(e.target.value)}
                    placeholder="https://api.example.com/soap"
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">SOAPAction (optional):</label>
                  <Input
                    value={soapAction}
                    onChange={(e) => setSoapAction(e.target.value)}
                    placeholder="urn:operation"
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">SOAP XML Body:</label>
                  <Textarea
                    value={xmlBody}
                    onChange={(e) => setXmlBody(e.target.value)}
                    placeholder="<?xml version='1.0'?>&#10;<soap:Envelope>&#10;  <soap:Body>&#10;    <!-- Your SOAP request -->&#10;  </soap:Body>&#10;</soap:Envelope>"
                    className="h-40 font-mono text-sm"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">WSDL URL:</label>
                  <div className="flex gap-2">
                    <Input
                      value={wsdlUrl}
                      onChange={(e) => setWsdlUrl(e.target.value)}
                      placeholder="https://api.example.com/service?wsdl"
                      className="text-sm flex-1"
                    />
                    <Button 
                      onClick={handleFetchWsdl} 
                      disabled={isFetchingWsdl || !wsdlUrl.trim()}
                      className="text-sm"
                    >
                      {isFetchingWsdl ? 'Fetching...' : 'Fetch WSDL'}
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Operation Name:</label>
                  {wsdlOperations.length > 0 ? (
                    <Select value={operation} onValueChange={setOperation}>
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="Select operation" />
                      </SelectTrigger>
                      <SelectContent>
                        {wsdlOperations.map((op) => (
                          <SelectItem key={op} value={op}>
                            {op}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={operation}
                      onChange={(e) => setOperation(e.target.value)}
                      placeholder="GetUserInfo"
                      className="text-sm"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Test Results */}
            {testResult && (
              <div className="p-3 bg-slate-50 rounded-lg space-y-3">
                <h4 className="font-medium text-sm">SOAP Response</h4>
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
                        <div className="font-medium text-sm mb-2">Response XML:</div>
                        <pre className="p-2 bg-white rounded text-xs max-h-32 overflow-auto border">
                          {testResult.data}
                        </pre>
                      </div>
                    )}
                    
                    {/* XPath Filter Section */}
                    <div className="border-t pt-3">
                      <div className="font-medium text-sm mb-2">XPath Filter:</div>
                      <div className="flex gap-2 mb-2">
                        <Input
                          value={xpathQuery}
                          onChange={(e) => setXpathQuery(e.target.value)}
                          placeholder="//result or /soap:Body/response"
                          className="text-xs h-8 flex-1"
                        />
                        <Button size="sm" onClick={handleXPathFilter} className="text-xs h-8">
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
                          
                          {!filteredResult?.error && xpathQuery && (
                            <div className="mt-2 flex gap-1 flex-wrap">
                              <Button size="sm" onClick={() => addAssertion('exists')} className="text-xs h-6">
                                + Exists
                              </Button>
                              <Button size="sm" onClick={() => addAssertion('contains', filteredResult)} className="text-xs h-6">
                                + Contains
                              </Button>
                              <Button size="sm" onClick={() => addAssertion('equals', filteredResult)} className="text-xs h-6">
                                + Equals
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-500 mt-1">
                        Examples: <code>//tagName</code> (find all), <code>/root/element</code> (specific path)
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleTestSoap} disabled={isTestingSoap}>
                <Play className="h-4 w-4 mr-1" />
                {isTestingSoap ? 'Testing...' : 'Test SOAP'}
              </Button>
              <Button onClick={handleParse}>
                Parse SOAP
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
                        <span className="font-mono">{assertion.xpathExpression}</span>
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