# 💻 Command Line Execution

Complete guide to running TestFlow Pro tests from the command line without the UI.

---

## 🎯 Basic Usage

### Run All Test Suites

```bash
npx ts-node src/runner.ts
```

This will:
- Discover all test suites in `testSuites/` directory
- Execute them in parallel (based on `PARALLEL_THREADS` setting)
- Generate JSON reports in `reports/` directory

---

## 📁 File-Based Execution

### Run Specific Test Suite

```bash
# Relative path
npx ts-node src/runner.ts --file="./testSuites/API_Test_Suite.json"

# Absolute path
npx ts-node src/runner.ts --file="/Users/username/TestFlowPro/testSuites/API_Test_Suite.json"
```

### Run Multiple Specific Suites

```bash
# Run suite 1
npx ts-node src/runner.ts --file="./testSuites/suite1.json"

# Run suite 2
npx ts-node src/runner.ts --file="./testSuites/suite2.json"
```

---

## 🏷️ Tag-Based Filtering

### Filter by Service Name

```bash
# Run all tests tagged with @UserService
npx ts-node src/runner.ts --serviceName="@UserService"

# Run all tests tagged with @PaymentService
npx ts-node src/runner.ts --serviceName="@PaymentService"
```

### Filter by Suite Type

```bash
# Run smoke tests
npx ts-node src/runner.ts --suiteType="@smoke"

# Run regression tests
npx ts-node src/runner.ts --suiteType="@regression"

# Run integration tests
npx ts-node src/runner.ts --suiteType="@integration"
```

### Combine Multiple Tags

```bash
# Run smoke tests for UserService
npx ts-node src/runner.ts --serviceName="@UserService" --suiteType="@smoke"

# Run regression tests for PaymentService
npx ts-node src/runner.ts --serviceName="@PaymentService" --suiteType="@regression"
```

---

## 📱 Application-Based Filtering

### Filter by Application Name

```bash
# Run tests for specific application
npx ts-node src/runner.ts --applicationName="Bookstore Application"

# Run tests for another application
npx ts-node src/runner.ts --applicationName="E-commerce Platform"
```

### Combine with Test Type

```bash
# Run only API tests for Bookstore
npx ts-node src/runner.ts --applicationName="Bookstore Application" --testType="API"

# Run only UI tests for E-commerce
npx ts-node src/runner.ts --applicationName="E-commerce Platform" --testType="UI"
```

---

## 🎭 Test Type Filtering

### Run Only API Tests

```bash
npx ts-node src/runner.ts --testType="API"
```

### Run Only UI Tests

```bash
npx ts-node src/runner.ts --testType="UI"
```

### Combine with Other Filters

```bash
# API smoke tests
npx ts-node src/runner.ts --testType="API" --suiteType="@smoke"

# UI regression tests
npx ts-node src/runner.ts --testType="UI" --suiteType="@regression"
```

---

## 🎯 Granular Execution

### Target Syntax

```
--target="<suite-id>:<suite-name> > <test-case-id>:<test-case-name> > <data-index>:<data-name>"
```

### Run Specific Test Case

```bash
npx ts-node src/runner.ts --target="suite-001:Bookstore Suite > tc-001:Create Book"
```

### Run Specific Test Data

```bash
npx ts-node src/runner.ts --target="suite-001:Bookstore Suite > tc-001:Create Book > 0:Add Valid Book"
```

### Examples

```bash
# Run single test case
npx ts-node src/runner.ts \
  --target="API_Test_Suite_for_Object_Endpoint_L1VzZXJz:API Test Suite for Object Endpoint > tc_1759048255078_eavgsafxu:Get Object by ID"

# Run specific test data within a test case
npx ts-node src/runner.ts \
  --target="API_Test_Suite_for_Object_Endpoint_L1VzZXJz:API Test Suite for Object Endpoint > tc_1759048255078_eavgsafxu:Get Object by ID > 0:Fetch Object with ID 8"
```

---

## 🌍 Environment Configuration

### Set Environment

```bash
# Run with QA environment
ENV=qa npx ts-node src/runner.ts

# Run with Production environment
ENV=prod npx ts-node src/runner.ts

# Run with Development environment
ENV=dev npx ts-node src/runner.ts
```

### Environment File Loading

TestFlow Pro automatically loads environment files in this order:
1. `.env` (base configuration)
2. `.env.<ENV>` (environment-specific overrides)

**Example:**
```bash
# Loads .env and .env.qa
ENV=qa npx ts-node src/runner.ts --suiteType="@smoke"
```

---

## 🔄 Combined Filtering Examples

### Example 1: Smoke Tests for User Service in QA

```bash
ENV=qa npx ts-node src/runner.ts \
  --serviceName="@UserService" \
  --suiteType="@smoke"
```

### Example 2: API Regression Tests for Bookstore

```bash
npx ts-node src/runner.ts \
  --applicationName="Bookstore Application" \
  --testType="API" \
  --suiteType="@regression"
```

### Example 3: All Tests for Payment Service

```bash
npx ts-node src/runner.ts \
  --serviceName="@PaymentService"
```

### Example 4: UI Tests in Production

```bash
ENV=prod npx ts-node src/runner.ts \
  --testType="UI" \
  --suiteType="@smoke"
```

---

## 📊 Report Generation

### Generate HTML Reports

After test execution, generate HTML reports:

```bash
npm run report:html
```

This will:
- Read all JSON reports from `reports/` directory
- Generate beautiful HTML reports
- Save them alongside JSON reports

### Custom Report Location

```bash
# Set custom report directory
REPORT_DIR=./custom-reports npm run report:html
```

---

## ⚙️ Configuration Options

### Parallel Execution

Control the number of parallel threads:

```bash
# In .env file
PARALLEL_THREADS=4
```

```bash
# Or set via environment variable
PARALLEL_THREADS=8 npx ts-node src/runner.ts
```

### Test Timeout

Set test timeout (milliseconds):

```bash
# In .env file
TEST_TIMEOUT=30000
```

### Browser Settings (UI Tests)

```bash
# In .env file
HEADLESS=true
BROWSER=chromium
SLOW_MO=0
```

---

## 🔍 Debugging

### Verbose Output

```bash
# Enable debug logging
DEBUG=true npx ts-node src/runner.ts
```

### Run Single Test for Debugging

```bash
# Run specific test with detailed output
npx ts-node src/runner.ts \
  --file="./testSuites/debug-test.json" \
  --target="suite-id:Suite Name > tc-id:Test Case Name"
```

### Headless Mode (UI Tests)

```bash
# Run UI tests with visible browser
HEADLESS=false npx ts-node src/runner.ts --testType="UI"
```

---

## 📝 NPM Scripts

### Predefined Scripts

Add these to your `package.json`:

```json
{
  "scripts": {
    "test": "npx ts-node src/runner.ts",
    "test:smoke": "npx ts-node src/runner.ts --suiteType=@smoke",
    "test:regression": "npx ts-node src/runner.ts --suiteType=@regression",
    "test:api": "npx ts-node src/runner.ts --testType=API",
    "test:ui": "npx ts-node src/runner.ts --testType=UI",
    "test:qa": "ENV=qa npx ts-node src/runner.ts",
    "test:prod": "ENV=prod npx ts-node src/runner.ts --suiteType=@smoke",
    "report:html": "npx ts-node src/generateHtmlReport.ts"
  }
}
```

### Usage

```bash
# Run smoke tests
npm run test:smoke

# Run API tests
npm run test:api

# Run tests in QA environment
npm run test:qa

# Generate HTML reports
npm run report:html
```

---

## 🎨 Output Examples

### Successful Execution

```
🎯 EXECUTING TEST SUITE
Suite: API Test Suite for Object Endpoint
Type: API
Base URL: https://api.restful-api.dev
Test Cases: 3

🔄 EXECUTION ORDER
  Get Object by ID → Non-Existent Object → Invalid Endpoint

🔧 API TEST CASE: Get Object by ID

📡 TEST DATA: Fetch Object with ID 8
🌐 REQUEST DETAILS
  Method: GET
  URL: https://api.restful-api.dev/objects/8
  Type: REST

📡 Request: GET https://api.restful-api.dev/objects/8
✅ Request completed with status 200

📥 RESPONSE
  Status: 200
  Time: 245ms

🔍 RUNNING ASSERTIONS
✅ statusCode assertion passed
✅ equals assertion ($.name) passed
✅ equals assertion ($.data.Strap Colour) passed

💾 STORING GLOBAL VARIABLES
✅ Global variables stored: userId, userName

📊 Execution completed. Run ID: run-2025-01-15-10-30-45
```

### Failed Test

```
❌ API TEST CASE: Get Object by ID

📡 TEST DATA: Fetch Object with ID 8
🌐 REQUEST DETAILS
  Method: GET
  URL: https://api.restful-api.dev/objects/8

📥 ERROR RESPONSE
  Status: 404
  Time: 123ms

🔍 RUNNING ASSERTIONS
❌ statusCode assertion failed: Expected 200, got 404
❌ equals assertion ($.name) failed: Path not found

📊 Test Failed
  Assertions Passed: 0
  Assertions Failed: 2
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. **Module Not Found**
```bash
# Install dependencies
npm install
```

#### 2. **Test Suite Not Found**
```bash
# Check file path
ls -la testSuites/

# Use absolute path
npx ts-node src/runner.ts --file="/full/path/to/suite.json"
```

#### 3. **Environment Variables Not Loading**
```bash
# Check .env file exists
ls -la .env*

# Verify environment variable
echo $ENV
```

#### 4. **Playwright Browsers Not Installed**
```bash
# Install Playwright browsers
npx playwright install
```

#### 5. **Permission Denied**
```bash
# Fix permissions (macOS/Linux)
chmod +x src/runner.ts
```

---

## 📊 Exit Codes

TestFlow Pro uses standard exit codes:

- `0` - All tests passed
- `1` - One or more tests failed or error occurred

**Usage in CI/CD:**
```bash
npx ts-node src/runner.ts --suiteType="@smoke"
if [ $? -eq 0 ]; then
  echo "Tests passed!"
else
  echo "Tests failed!"
  exit 1
fi
```

---

## 🔗 Related Documentation

- [Filtering Options](./filtering.md) - Detailed filtering guide
- [Granular Execution](./granular-execution.md) - Target-based execution
- [Reports](./reports.md) - Report generation and analysis
- [CI/CD Integration](../ci-cd/github-actions.md) - Automate test execution

---

## 💡 Tips & Best Practices

### 1. Use Tags Consistently
```json
{
  "tags": [
    { "serviceName": "@UserService" },
    { "suiteType": "@smoke" }
  ]
}
```

### 2. Create NPM Scripts for Common Tasks
```json
{
  "scripts": {
    "test:critical": "npx ts-node src/runner.ts --suiteType=@critical",
    "test:nightly": "npx ts-node src/runner.ts --suiteType=@regression"
  }
}
```

### 3. Use Environment Files
```bash
# .env.qa
BASE_URL=https://qa-api.example.com
PARALLEL_THREADS=4

# .env.prod
BASE_URL=https://api.example.com
PARALLEL_THREADS=8
```

### 4. Combine Filters for Precision
```bash
# Run only critical API smoke tests
npx ts-node src/runner.ts \
  --testType="API" \
  --suiteType="@smoke" \
  --serviceName="@CriticalService"
```

### 5. Generate Reports After Every Run
```bash
# Run tests and generate reports
npx ts-node src/runner.ts && npm run report:html
```

---

**Master command-line execution for powerful automation! 🚀**
