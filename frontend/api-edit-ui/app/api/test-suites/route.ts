import { type NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const testSuitePath = searchParams.get("path")

  if (!testSuitePath) {
    return NextResponse.json({ error: "Path parameter is required" }, { status: 400 })
  }

  try {
    // Check if the directory exists
    const stats = await fs.stat(testSuitePath)
    if (!stats.isDirectory()) {
      return NextResponse.json({ error: "Path is not a directory" }, { status: 400 })
    }

    // Read all JSON files from the directory
    const testSuites = await loadTestSuitesFromDirectory(testSuitePath)

    return NextResponse.json(testSuites)
  } catch (error) {
    console.error("Error loading test suites:", error)
    return NextResponse.json({ error: "Failed to load test suites from the specified path" }, { status: 500 })
  }
}

async function loadTestSuitesFromDirectory(dirPath: string): Promise<any[]> {
  const testSuites: any[] = []

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name)

      if (entry.isDirectory()) {
        // Recursively load from subdirectories
        const subSuites = await loadTestSuitesFromDirectory(fullPath)
        testSuites.push(...subSuites)
      } else if (entry.isFile() && entry.name.endsWith(".json")) {
        try {
          const fileContent = await fs.readFile(fullPath, "utf-8")
          const testSuite = JSON.parse(fileContent)

          // Add metadata
          testSuite.id = generateIdFromPath(fullPath)
          testSuite.filePath = fullPath
          testSuite.fileName = entry.name
          testSuite.lastModified = (await fs.stat(fullPath)).mtime

          // Validate basic structure
          if (testSuite.suiteName && testSuite.testCases) {
            testSuites.push(testSuite)
          } else {
            console.warn(`Invalid test suite structure in file: ${fullPath}`)
          }
        } catch (parseError) {
          console.error(`Error parsing JSON file ${fullPath}:`, parseError)
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error)
  }

  return testSuites
}

function generateIdFromPath(filePath: string): string {
  // Generate a consistent ID based on the file path
  return Buffer.from(filePath)
    .toString("base64")
    .replace(/[^a-zA-Z0-9]/g, "")
    .substring(0, 16)
}

export async function POST(request: NextRequest) {
  try {
    const { testSuite, filePath } = await request.json()

    if (!filePath) {
      return NextResponse.json({ error: "File path is required" }, { status: 400 })
    }

    // Write the test suite back to the file
    await fs.writeFile(filePath, JSON.stringify(testSuite, null, 2), "utf-8")

    return NextResponse.json({ success: true, message: "Test suite saved successfully" })
  } catch (error) {
    console.error("Error saving test suite:", error)
    return NextResponse.json({ error: "Failed to save test suite" }, { status: 500 })
  }
}
