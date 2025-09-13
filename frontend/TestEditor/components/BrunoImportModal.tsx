'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Upload, FileText, Link } from 'lucide-react';

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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Import Bruno Collection
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="suiteName">Suite Name</Label>
            <Input
              id="suiteName"
              value={suiteName}
              onChange={(e) => setSuiteName(e.target.value)}
              placeholder="Enter suite name"
            />
          </div>

          <Tabs defaultValue="files" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="files" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload Files
              </TabsTrigger>
              <TabsTrigger value="folder" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Upload Folder
              </TabsTrigger>
            </TabsList>

            <TabsContent value="files" className="space-y-4">
              <div>
                <Label htmlFor="files">Select .bru files and environment files</Label>
                <Input
                  id="files"
                  type="file"
                  multiple
                  accept=".bru,.env"
                  onChange={handleFilesUpload}
                  className="mt-1"
                />
                <p className="text-sm text-slate-500 mt-1">
                  Select multiple .bru files and any .env files from your Bruno collection
                </p>
              </div>
            </TabsContent>

            <TabsContent value="folder" className="space-y-4">
              <div>
                <Label htmlFor="folder">Select Bruno collection folder</Label>
                <Input
                  id="folder"
                  type="file"
                  webkitdirectory=""
                  multiple
                  onChange={handleFolderUpload}
                  className="mt-1"
                />
                <p className="text-sm text-slate-500 mt-1">
                  Select the entire Bruno collection folder
                </p>
              </div>
            </TabsContent>
          </Tabs>

          {files.length > 0 && (
            <div className="bg-slate-50 p-3 rounded-lg">
              <h4 className="font-medium mb-2">Loaded Files ({files.length})</h4>
              <div className="text-sm text-slate-600 max-h-20 overflow-y-auto">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <FileText className="w-3 h-3" />
                    {file.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          {loading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto"></div>
              <p className="mt-2 text-slate-600">Parsing Bruno collection...</p>
            </div>
          )}

          {preview && (
            <div className="bg-slate-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Preview</h4>
              <div className="bg-white p-3 rounded border text-sm">
                <div className="mb-2">
                  <strong>Suite:</strong> {preview.suiteName}
                </div>
                <div className="mb-2">
                  <strong>Base URL:</strong> {preview.baseUrl}
                </div>
                <div className="mb-2">
                  <strong>Test Cases:</strong> {preview.testCases?.length || 0}
                </div>
                {preview.variables && Object.keys(preview.variables).length > 0 && (
                  <div className="mb-2">
                    <strong>Variables:</strong> {Object.keys(preview.variables).length}
                  </div>
                )}
                <details className="mt-2">
                  <summary className="cursor-pointer font-medium">View JSON</summary>
                  <pre className="mt-2 text-xs bg-slate-100 p-2 rounded overflow-x-auto">
                    {JSON.stringify(preview, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={!preview || loading}
            className="bg-slate-600 hover:bg-slate-700"
          >
            Import Collection
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}