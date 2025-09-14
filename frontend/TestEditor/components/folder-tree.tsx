"use client"

import { useState, useEffect } from "react"
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileText } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { TestSuite } from "@/types/test-suite"

interface FolderNode {
  name: string
  path: string
  isFolder: boolean
  children: FolderNode[]
  suites: TestSuite[]
}

interface FolderTreeProps {
  testSuites: TestSuite[]
  activeTab: 'all' | 'ui' | 'api'
  onFolderSelect: (folderPath: string, suites: TestSuite[]) => void
  selectedFolder: string | null
  searchTerm?: string
}

export function FolderTree({ testSuites, activeTab, onFolderSelect, selectedFolder, searchTerm = '' }: FolderTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [folderTree, setFolderTree] = useState<FolderNode | null>(null)

  useEffect(() => {
    buildFolderTree()
  }, [testSuites, activeTab, searchTerm])

  const buildFolderTree = () => {
    const filteredSuites = testSuites.filter(suite => {
      // Tab filter
      let matchesTab = true
      if (activeTab === 'ui') matchesTab = suite.type === 'UI'
      else if (activeTab === 'api') matchesTab = suite.type !== 'UI'
      
      // Search filter
      let matchesSearch = true
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        matchesSearch = 
          suite.suiteName.toLowerCase().includes(searchLower) ||
          (suite.fileName && suite.fileName.toLowerCase().includes(searchLower)) ||
          (suite.tags && suite.tags.some(tag => 
            Object.values(tag).some(value => 
              value.toString().toLowerCase().includes(searchLower)
            )
          )) ||
          suite.testCases.some(tc => 
            tc.name.toLowerCase().includes(searchLower) ||
            (tc.testData && tc.testData.some(td => td.name.toLowerCase().includes(searchLower))) ||
            (tc.testSteps && tc.testSteps.some(ts => ts.keyword.toLowerCase().includes(searchLower)))
          )
      }
      
      return matchesTab && matchesSearch
    })

    const root: FolderNode = {
      name: 'Test Suites',
      path: '',
      isFolder: true,
      children: [],
      suites: []
    }

    filteredSuites.forEach(suite => {
      if (!suite.filePath) return

      const fullPath = suite.filePath
      const testSuitesIndex = fullPath.indexOf('testSuites')
      
      if (testSuitesIndex === -1) {
        root.suites.push(suite)
        return
      }
      
      const pathAfterTestSuites = fullPath.substring(testSuitesIndex + 'testSuites'.length)
      const pathParts = pathAfterTestSuites.split('/').filter(part => part)
      
      let currentNode = root

      if (pathParts.length === 0) {
        root.suites.push(suite)
      } else {
        pathParts.forEach((part, index) => {
          const isLastPart = index === pathParts.length - 1
          const currentPath = pathParts.slice(0, index + 1).join('/')

          if (isLastPart && part.endsWith('.json')) {
            currentNode.suites.push(suite)
          } else {
            let childNode = currentNode.children.find(child => child.name === part)
            
            if (!childNode) {
              childNode = {
                name: part,
                path: currentPath,
                isFolder: true,
                children: [],
                suites: []
              }
              currentNode.children.push(childNode)
            }
            
            currentNode = childNode
          }
        })
      }
    })

    const sortAndFilterNode = (node: FolderNode): FolderNode | null => {
      const validChildren = node.children
        .map(child => sortAndFilterNode(child))
        .filter((child): child is FolderNode => child !== null)
        .sort((a, b) => a.name.localeCompare(b.name))
      
      const filteredSuites = node.suites.filter(suite => {
        if (activeTab === 'all') return true
        if (activeTab === 'ui') return suite.type === 'UI'
        if (activeTab === 'api') return suite.type !== 'UI'
        return true
      })
      
      if (validChildren.length === 0 && filteredSuites.length === 0 && node.path !== '') {
        return null
      }
      
      const getAllSuites = (n: FolderNode): TestSuite[] => {
        const childSuites = n.children.flatMap(getAllSuites)
        return [...n.suites, ...childSuites]
      }
      
      const allSuites = getAllSuites({ ...node, children: validChildren, suites: filteredSuites })
        .filter((suite, index, arr) => arr.findIndex(s => s.id === suite.id) === index)
      
      return {
        ...node,
        children: validChildren,
        suites: allSuites
      }
    }

    const processedRoot = sortAndFilterNode(root)
    setFolderTree(processedRoot)
    setExpandedFolders(new Set(['']))
  }

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(path)) {
        newSet.delete(path)
      } else {
        newSet.add(path)
      }
      return newSet
    })
  }

  const handleFolderClick = (node: FolderNode) => {
    if (node.isFolder) {
      toggleFolder(node.path)
      onFolderSelect(node.path, node.suites)
    }
  }

  const renderNode = (node: FolderNode, depth: number = 0) => {
    const isExpanded = expandedFolders.has(node.path)
    const isSelected = selectedFolder === node.path
    const suiteCount = node.suites.length
    const hasChildren = node.children.length > 0

    return (
      <div key={node.path} className="relative">
        <div
          className={`group relative flex items-center gap-3 py-2.5 px-3 cursor-pointer rounded-xl transition-all duration-200 hover:shadow-sm ${
            isSelected 
              ? 'bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-300 shadow-sm' 
              : 'hover:bg-slate-50/80'
          }`}
          style={{ marginLeft: `${depth * 20}px` }}
          onClick={() => handleFolderClick(node)}
        >
          <div className="flex items-center justify-center w-5 h-5">
            {node.isFolder && hasChildren ? (
              <div className={`transition-transform duration-200 ${
                isExpanded ? 'rotate-90' : 'rotate-0'
              }`}>
                <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-slate-700" />
              </div>
            ) : (
              <div className="w-4 h-4" />
            )}
          </div>
          
          <div className="flex items-center justify-center w-6 h-6">
            {node.isFolder ? (
              <div className={`p-1 rounded-lg transition-all duration-200 ${
                isExpanded 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-500'
              }`}>
                {isExpanded ? (
                  <FolderOpen className="h-4 w-4" />
                ) : (
                  <Folder className="h-4 w-4" />
                )}
              </div>
            ) : (
              <div className="p-1 rounded-lg bg-emerald-100 text-emerald-600">
                <FileText className="h-4 w-4" />
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium transition-colors duration-200 whitespace-nowrap ${
              isSelected 
                ? 'text-slate-800' 
                : 'text-slate-700 group-hover:text-slate-900'
            }`}>
              {node.name}
            </span>
            {suiteCount > 0 && (
              <div className={`px-2 py-0.5 rounded-full text-xs font-medium transition-all duration-200 ${
                isSelected
                  ? 'bg-slate-200 text-slate-700'
                  : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
              }`}>
                {suiteCount}
              </div>
            )}
          </div>
        </div>

        {node.isFolder && isExpanded && (
          <>
            {node.children.map(child => 
              renderNode(child, depth + 1)
            )}
            {node.suites.filter(suite => {
              if (!suite.filePath) return false
              const testSuitesIndex = suite.filePath.indexOf('testSuites')
              if (testSuitesIndex === -1) return false
              const pathAfterTestSuites = suite.filePath.substring(testSuitesIndex + 'testSuites'.length)
              const pathParts = pathAfterTestSuites.split('/').filter(part => part)
              const expectedDepth = node.path ? node.path.split('/').length : 0
              const isDirectFile = pathParts.length === expectedDepth + 1 && pathParts[pathParts.length - 1].endsWith('.json')
              
              if (!isDirectFile) return false
              if (activeTab === 'all') return true
              if (activeTab === 'ui') return suite.type === 'UI'
              if (activeTab === 'api') return suite.type !== 'UI'
              return true
            }).map(suite => (
              <div
                key={`file-${suite.id}`}
                className="group relative flex items-center gap-3 py-2 px-3 cursor-pointer rounded-xl transition-all duration-200 hover:bg-slate-50/80 hover:shadow-sm"
                style={{ marginLeft: `${(depth + 1) * 20}px` }}
                onClick={() => onFolderSelect(node.path, [suite])}
              >
                <div className="w-5 h-5" />
                <div className="flex items-center justify-center w-6 h-6">
                  <div className={`p-1 rounded-lg transition-all duration-200 ${
                    suite.type === 'UI' 
                      ? 'bg-purple-100 text-purple-600' 
                      : 'bg-emerald-100 text-emerald-600'
                  }`}>
                    <FileText className="h-4 w-4" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600 group-hover:text-slate-800 transition-colors duration-200 whitespace-nowrap">
                    {suite.fileName || suite.filePath?.split('/').pop() || 'Unknown file'}
                  </span>
                  <div className={`px-1.5 py-0.5 rounded text-xs font-medium transition-all duration-200 ${
                    suite.type === 'UI'
                      ? 'bg-purple-100 text-purple-700 group-hover:bg-purple-200'
                      : 'bg-emerald-100 text-emerald-700 group-hover:bg-emerald-200'
                  }`}>
                    {suite.type === 'UI' ? 'UI' : 'API'}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    )
  }

  if (!folderTree) {
    return (
      <div className="p-4 text-center text-gray-500">
        <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Loading folder structure...</p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto">
      <div className="p-3 min-w-max" style={{ minWidth: '500px' }}>
        <div className="mb-4 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-slate-100">
              <Folder className="h-4 w-4 text-slate-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Test Suites</h3>
          </div>
          <p className="text-xs text-slate-500 ml-7">
            {activeTab === 'all' ? 'All test suites' : 
             activeTab === 'ui' ? 'UI test suites only' : 
             'API test suites only'}
          </p>
        </div>
        
        {folderTree.children.length === 0 && folderTree.suites.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No test suites found</p>
          </div>
        ) : (
          <div className="space-y-1 min-w-max">
            {renderNode(folderTree)}
          </div>
        )}
      </div>
    </div>
  )
}