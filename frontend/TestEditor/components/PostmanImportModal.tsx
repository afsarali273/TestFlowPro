'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, Save, Download, AlertCircle, Plus, FileText, Upload, Link } from 'lucide-react';
import { PostmanParser, PostmanParseResult } from '../../../src/utils/postmanParser';
import { TestSuite } from '../../../src/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PostmanImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (testSuite: TestSuite) => void;
  onAddToExisting?: (suiteId: string, testCase: any) => void;
  existingSuites?: TestSuite[];
}

export const PostmanImportModal: React.FC<PostmanImportModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onAddToExisting,
  existingSuites = []
}) => {
  const [collectionInput, setCollectionInput] = useState('');
  const [collectionUrl, setCollectionUrl] = useState('');
  const [parseResult, setParseResult] = useState<PostmanParseResult | null>(null);
  const [jsonOutput, setJsonOutput] = useState('');
  const [importMode, setImportMode] = useState<'new' | 'existing'>('new');
  const [selectedSuiteId, setSelectedSuiteId] = useState<string>('');
  const [savePath, setSavePath] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setCollectionInput(content);
      };
      reader.readAsText(file);
    }
  };

  const handleUrlImport = async () => {
    if (!collectionUrl.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(collectionUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch collection: ${response.statusText}`);
      }
      const collection = await response.json();
      setCollectionInput(JSON.stringify(collection, null, 2));
    } catch (error) {
      setParseResult({ success: false, error: (error as Error).message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleParse = () => {
    if (!collectionInput.trim()) return;
    
    const result = PostmanParser.parse(collectionInput);
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
      // Add all test cases from the collection
      parseResult.testSuite.testCases.forEach(testCase => {
        onAddToExisting(selectedSuiteId, testCase);
      });
      onClose();
    }
  };

  const handleDownload = () => {
    if (jsonOutput) {
      const blob = new Blob([jsonOutput], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `postman-import-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleReset = () => {
    setCollectionInput('');
    setCollectionUrl('');
    setParseResult(null);
    setJsonOutput('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">📮</span>
            Postman Collection Importer
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[70vh]">
          {/* Input Section */}
          <div className="flex flex-col space-y-4">
            <Tabs defaultValue="paste" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="paste">Paste JSON</TabsTrigger>
                <TabsTrigger value="file">Upload File</TabsTrigger>
                <TabsTrigger value="url">From URL</TabsTrigger>
              </TabsList>
              
              <TabsContent value="paste" className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Paste Postman Collection JSON:
                  </label>
                  <Textarea
                    value={collectionInput}
                    onChange={(e) => setCollectionInput(e.target.value)}
                    placeholder='{"info": {"name": "My API Collection"}, "item": [...]}'
                    className="h-32 font-mono text-sm"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="file" className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Upload Postman Collection File:
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600 mb-2">
                      Click to upload or drag and drop
                    </p>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('file-upload')?.click()}
                    >
                      Choose File
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="url" className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Postman Collection URL:
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={collectionUrl}
                      onChange={(e) => setCollectionUrl(e.target.value)}
                      placeholder="https://api.postman.com/collections/..."
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleUrlImport} 
                      disabled={isLoading || !collectionUrl.trim()}
                    >
                      <Link className="h-4 w-4 mr-1" />
                      {isLoading ? 'Loading...' : 'Import'}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Use Postman API URL or public collection link
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex gap-2">
              <Button onClick={handleParse} disabled={!collectionInput.trim()}>
                Parse Collection
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
                      {importMode === 'new' ? 'Create Suite' : 'Add Test Cases'}
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

            {parseResult?.success && parseResult.testSuite && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <h4 className="font-medium text-sm text-green-800 mb-2">
                  ✅ Collection Parsed Successfully
                </h4>
                <div className="text-xs text-green-700 space-y-1">
                  <div>Suite: {parseResult.testSuite.suiteName}</div>
                  <div>Test Cases: {parseResult.testSuite.testCases.length}</div>
                  <div>
                    Total Tests: {parseResult.testSuite.testCases.reduce(
                      (sum, tc) => sum + tc.testData.length, 0
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};