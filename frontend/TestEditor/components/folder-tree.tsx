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
}

export function FolderTree({ testSuites, activeTab, onFolderSelect, selectedFolder }: FolderTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [folderTree, setFolderTree] = useState<FolderNode | null>(null)

  useEffect(() => {
    buildFolderTree()
  }, [testSuites, activeTab])

  const buildFolderTree = () => {
    const filteredSuites = testSuites.filter(suite => {
      if (activeTab === 'all') return true
      if (activeTab === 'ui') return suite.type === 'UI'
      if (activeTab === 'api') return suite.type !== 'UI' // Everything that's not UI is considered API
      return true
    })

    const root: FolderNode = {
      name: 'testData',
      path: '',
      isFolder: true,
      children: [],
      suites: []
    }

    filteredSuites.forEach(suite => {
      if (!suite.filePath) return

      // Find testData in the path and only use parts after it
      const fullPath = suite.filePath
      const testDataIndex = fullPath.indexOf('testData')
      
      if (testDataIndex === -1) {
        // If no testData folder found, add to root
        root.suites.push(suite)
        return
      }
      
      // Get path after testData/
      const pathAfterTestData = fullPath.substring(testDataIndex + 'testData'.length)
      const pathParts = pathAfterTestData.split('/').filter(part => part)
      
      let currentNode = root

      if (pathParts.length === 0) {
        // File is directly in testData folder
        root.suites.push(suite)
      } else {
        pathParts.forEach((part, index) => {
          const isLastPart = index === pathParts.length - 1
          const currentPath = pathParts.slice(0, index + 1).join('/')

          if (isLastPart && part.endsWith('.json')) {
            // This is a file, add suite to current folder
            currentNode.suites.push(suite)
          } else {
            // This is a folder
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

    // Sort folders, filter empty ones, and add suite counts
    const sortAndFilterNode = (node: FolderNode): FolderNode | null => {
      // First, recursively process children
      const validChildren = node.children
        .map(child => sortAndFilterNode(child))
        .filter((child): child is FolderNode => child !== null)
        .sort((a, b) => a.name.localeCompare(b.name))
      
      // Filter suites based on active tab
      const filteredSuites = node.suites.filter(suite => {
        if (activeTab === 'all') return true
        if (activeTab === 'ui') return suite.type === 'UI'
        if (activeTab === 'api') return suite.type !== 'UI' // Everything that's not UI is considered API
        return true
      })
      
      // If this node has no valid children and no filtered suites, return null (hide it)
      if (validChildren.length === 0 && filteredSuites.length === 0 && node.path !== '') {
        return null
      }
      
      // Add suites from child folders to parent for easy access
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

    // Auto-expand root
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

    return (
      <div key={node.path}>
        <div
          className={`flex items-center gap-2 py-2 px-3 cursor-pointer hover:bg-gray-100 rounded-lg transition-colors ${
            isSelected ? 'bg-blue-50 border border-blue-200' : ''
          }`}
          style={{ paddingLeft: `${depth * 16 + 12}px` }}
          onClick={() => handleFolderClick(node)}
        >
          {node.isFolder && node.children.length > 0 && (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500 flex-shrink-0" />
            )
          )}
          
          {node.isFolder ? (
            isExpanded ? (
              <FolderOpen className="h-4 w-4 text-blue-500 flex-shrink-0" />
            ) : (
              <Folder className="h-4 w-4 text-blue-500 flex-shrink-0" />
            )
          ) : (
            <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
          )}
          
          <div className="flex-1 min-w-0 overflow-x-scroll max-w-[180px]" style={{scrollbarWidth: 'thin'}}>
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap block">
              {node.name}
            </span>
          </div>
          
          {suiteCount > 0 && (
            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full flex-shrink-0">
              {suiteCount}
            </span>
          )}
        </div>

        {node.isFolder && isExpanded && (
          <>
            {/* Render child folders first */}
            {node.children.map(child => 
              renderNode(child, depth + 1)
            )}
            {/* Then render direct files */}
            {node.suites.filter(suite => {
              // Only show suites that are directly in this folder (not in subfolders)
              if (!suite.filePath) return false
              const testDataIndex = suite.filePath.indexOf('testData')
              if (testDataIndex === -1) return false
              const pathAfterTestData = suite.filePath.substring(testDataIndex + 'testData'.length)
              const pathParts = pathAfterTestData.split('/').filter(part => part)
              const expectedDepth = node.path ? node.path.split('/').length : 0
              const isDirectFile = pathParts.length === expectedDepth + 1 && pathParts[pathParts.length - 1].endsWith('.json')
              
              // Filter by active tab
              if (!isDirectFile) return false
              if (activeTab === 'all') return true
              if (activeTab === 'ui') return suite.type === 'UI'
              if (activeTab === 'api') return suite.type !== 'UI' // Everything that's not UI is considered API
              return true
            }).map(suite => (
              <div
                key={`file-${suite.id}`}
                className="flex items-center gap-2 py-2 px-3 cursor-pointer hover:bg-gray-100 rounded-lg transition-colors"
                style={{ paddingLeft: `${(depth + 1) * 16 + 12}px` }}
                onClick={() => onFolderSelect(node.path, [suite])}
              >
                <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <div className="flex-1 min-w-0 overflow-x-scroll max-w-[180px]" style={{scrollbarWidth: 'thin'}}>
                  <span className="text-sm text-gray-600 whitespace-nowrap block">
                    {suite.fileName || suite.filePath?.split('/').pop() || 'Unknown file'}
                  </span>
                </div>
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full flex-shrink-0">
                  {suite.type === 'UI' ? 'UI' : 'API'}
                </span>
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
    <ScrollArea className="h-full">
      <div className="p-3">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Folder Structure</h3>
          <p className="text-xs text-gray-500">
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
          <div className="space-y-1">
            {renderNode(folderTree)}
          </div>
        )}
      </div>
    </ScrollArea>
  )
}