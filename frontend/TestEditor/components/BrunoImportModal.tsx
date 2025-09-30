'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Upload, FileText, Link, Folder, CheckCircle, Code } from 'lucide-react';

interface BrunoImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (suite: any) => void;
}

export default function BrunoImportModal({ isOpen, onClose, onImport }: BrunoImportModalProps) {
  const [suiteName, setSuiteName] = useState('Bruno Collection');
  const [files, setFiles] = useState<{ name: string; content: string }[]>([]);
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFilesUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(event.target.files || []);
    
    Promise.all(
      uploadedFiles.map(file => 
        new Promise<{ name: string; content: string }>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve({
            name: file.name,
            content: e.target?.result as string
          });
          reader.readAsText(file);
        })
      )
    ).then(fileContents => {
      setFiles(fileContents);
      generatePreview(fileContents);
    });
  };

  const handleFolderUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(event.target.files || []);
    
    Promise.all(
      uploadedFiles.map(file => 
        new Promise<{ name: string; content: string }>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve({
            name: file.webkitRelativePath || file.name,
            content: e.target?.result as string
          });
          reader.readAsText(file);
        })
      )
    ).then(fileContents => {
      setFiles(fileContents);
      generatePreview(fileContents);
    });
  };

  const generatePreview = async (fileContents: { name: string; content: string }[]) => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/parse-bruno', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: fileContents, suiteName })
      });

      if (!response.ok) {
        throw new Error('Failed to parse Bruno collection');
      }

      const result = await response.json();
      setPreview(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse collection');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = () => {
    if (preview) {
      onImport(preview);
      onClose();
      resetForm();
    }
  };

  const resetForm = () => {
    setSuiteName('Bruno Collection');
    setFiles([]);
    setPreview(null);
    setError('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[95vh] flex flex-col bg-gradient-to-br from-white via-slate-50/50 to-purple-50/30 border-0 shadow-2xl overflow-hidden" style={{zIndex: 9999}}>
        <DialogHeader className="pb-6 border-b border-slate-200/50">
          <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Bruno Collection Importer
              </div>
              <div className="text-sm font-normal text-slate-600 mt-1">
                Import Bruno API collections to TestFlow Pro test suites
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col pt-6 overflow-hidden space-y-6">
          <div className="space-y-4 p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                <Code className="h-4 w-4 text-purple-600" />
              </div>
              <Label className="text-lg font-semibold text-slate-800">Collection Configuration</Label>
            </div>
            
            <div>
              <Label htmlFor="suiteName" className="text-sm font-medium text-slate-700">Suite Name</Label>
              <Input
                id="suiteName"
                value={suiteName}
                onChange={(e) => setSuiteName(e.target.value)}
                placeholder="Enter suite name"
                className="mt-2 bg-white/70 backdrop-blur-sm border-slate-200 focus:bg-white transition-all duration-300"
              />
            </div>
          </div>

          <Tabs defaultValue="files" className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2 bg-white/70 backdrop-blur-sm border border-slate-200 shadow-lg mb-6">
              <TabsTrigger value="files" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md">
                <Upload className="w-4 h-4" />
                Upload Files
              </TabsTrigger>
              <TabsTrigger value="folder" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md">
                <Folder className="w-4 h-4" />
                Upload Folder
              </TabsTrigger>
            </TabsList>

            <TabsContent value="files" className="flex-1 space-y-6">
              <div className="space-y-4 p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-lg">
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4 text-slate-600" />
                  <Label className="text-sm font-medium text-slate-700">Select Bruno Files</Label>
                </div>
                
                <div className="border-2 border-dashed border-purple-300 bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-8 text-center hover:border-purple-400 hover:bg-purple-50 transition-all duration-300">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-sm font-medium text-slate-800 mb-2">
                    Drop your Bruno files here
                  </p>
                  <Input
                    id="files"
                    type="file"
                    multiple
                    accept=".bru,.env"
                    onChange={handleFilesUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('files')?.click()}
                    className="bg-white/70 backdrop-blur-sm border-purple-200 hover:bg-white hover:border-purple-300 hover:scale-105 transition-all duration-300"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Files
                  </Button>
                  <p className="text-xs text-slate-500 mt-3">
                    Select multiple .bru files and any .env files from your Bruno collection
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="folder" className="flex-1 space-y-6">
              <div className="space-y-4 p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-lg">
                <div className="flex items-center gap-2">
                  <Folder className="h-4 w-4 text-slate-600" />
                  <Label className="text-sm font-medium text-slate-700">Select Collection Folder</Label>
                </div>
                
                <div className="border-2 border-dashed border-purple-300 bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-8 text-center hover:border-purple-400 hover:bg-purple-50 transition-all duration-300">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg">
                    <Folder className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-sm font-medium text-slate-800 mb-2">
                    Drop your Bruno collection folder here
                  </p>
                  <Input
                    id="folder"
                    type="file"
                    webkitdirectory=""
                    multiple
                    onChange={handleFolderUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('folder')?.click()}
                    className="bg-white/70 backdrop-blur-sm border-purple-200 hover:bg-white hover:border-purple-300 hover:scale-105 transition-all duration-300"
                  >
                    <Folder className="h-4 w-4 mr-2" />
                    Choose Folder
                  </Button>
                  <p className="text-xs text-slate-500 mt-3">
                    Select the entire Bruno collection folder
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {files.length > 0 && (
            <div className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                <h4 className="font-semibold text-lg text-slate-800">Loaded Files ({files.length})</h4>
              </div>
              <div className="bg-white/60 rounded-xl p-4 max-h-32 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-slate-600 p-2 bg-white/50 rounded-lg">
                      <FileText className="w-3 h-3 text-purple-500" />
                      <span className="truncate">{file.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-2xl shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">!</span>
                </div>
                <div className="text-red-700 font-medium">{error}</div>
              </div>
            </div>
          )}

          {loading && (
            <div className="p-8 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-lg text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg animate-pulse">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-slate-700 font-medium">Parsing Bruno collection...</p>
              <p className="text-slate-500 text-sm mt-1">Converting requests to TestFlow Pro format</p>
            </div>
          )}

          {preview && (
            <div className="p-6 bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-emerald-800">
                    Collection Parsed Successfully!
                  </h4>
                  <p className="text-sm text-emerald-600">Ready to import into TestFlow Pro</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center p-3 bg-white/60 rounded-xl">
                  <div className="text-2xl font-bold text-slate-800">{preview.testCases?.length || 0}</div>
                  <div className="text-xs text-slate-600">Test Cases</div>
                </div>
                <div className="text-center p-3 bg-white/60 rounded-xl">
                  <div className="text-2xl font-bold text-slate-800">{preview.baseUrl ? '1' : '0'}</div>
                  <div className="text-xs text-slate-600">Base URL</div>
                </div>
                <div className="text-center p-3 bg-white/60 rounded-xl">
                  <div className="text-2xl font-bold text-slate-800">{preview.variables ? Object.keys(preview.variables).length : 0}</div>
                  <div className="text-xs text-slate-600">Variables</div>
                </div>
                <div className="text-center p-3 bg-white/60 rounded-xl">
                  <div className="text-2xl font-bold text-slate-800">API</div>
                  <div className="text-xs text-slate-600">Suite Type</div>
                </div>
              </div>
              
              <details className="bg-white/60 rounded-xl p-4">
                <summary className="cursor-pointer font-medium text-slate-800 hover:text-slate-600 transition-colors">
                  View Generated JSON
                </summary>
                <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden shadow-lg bg-white/50 backdrop-blur-sm">
                  <div className="h-8 bg-gradient-to-r from-slate-800 to-slate-900 flex items-center px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                    <div className="flex-1 text-center text-white text-xs font-medium">TestFlow Pro JSON</div>
                  </div>
                  <pre className="p-4 text-xs bg-slate-900 text-green-400 overflow-x-auto max-h-64 leading-relaxed">
                    {JSON.stringify(preview, null, 2)}
                  </pre>
                </div>
              </details>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-slate-200/50">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="h-11 px-6 bg-white/70 backdrop-blur-sm border-slate-200 hover:bg-slate-50 hover:scale-105 transition-all duration-300"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={!preview || loading}
            className="h-11 px-6 bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText className="h-4 w-4 mr-2" />
            Import Collection
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}