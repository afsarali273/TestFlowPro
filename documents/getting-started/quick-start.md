# 🚀 Quick Start Guide

Get up and running with TestFlow Pro in 10 minutes!

---

## ⚡ 5-Minute Setup

### Step 1: Install Dependencies (2 minutes)

```bash
# Clone and navigate to project
cd TestFlowPro

# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend/TestEditor
npm install --legacy-peer-deps
cd ../..
```

### Step 2: Configure Environment (1 minute)

Create `.env` file in project root:

```bash
# Create .env file
cat > .env << EOF
BASE_URL=https://api.restful-api.dev
PARALLEL_THREADS=4
HEADLESS=true
BROWSER=chromium
EOF
```

### Step 3: Verify Installation (2 minutes)

```bash
# Run a sample test
npx ts-node src/runner.ts --file="./testSuites/API_Test_Suite_for_Object_Endpoint.json"

# Generate HTML report
npm run report:html
```

---

## 📝 Your First API Test (5 minutes)

### Create Test Suite File

Create `testSuites/my-first-test.json`:

```json
{
  "id": "my-first-test",
  "suiteName": "My First API Test",
  "applicationName": "Sample API",
  "type": "API",
  "baseUrl": "https://jsonplaceholder.typicode.com",
  "tags": [
    { "serviceName": "@MyService" },
    { "suiteType": "@smoke" }
  ],
  "testCases": [
    {
      "name": "Get User",
      "type": "REST",
      "testData": [
        {
          "name": "Fetch User 1",
          "method": "GET",
          "endpoint": "/users/1",
          "headers": {
            "Content-Type": "application/json"
          },
          "assertions": [
            {
              "type": "statusCode",
              "expected": 200
            },
            {
              "type": "exists",
              "jsonPath": "$.id"
            },
            {
              "type": "equals",
              "jsonPath": "$.id",
              "expected": 1
            }
          ],
          "store": {
            "userId": "$.id",
            "userName": "$.name"
          }
        }
      ]
    }
  ]
}
```

### Run Your Test

```bash
npx ts-node src/runner.ts --file="./testSuites/my-first-test.json"
```

### Expected Output

```
🎯 EXECUTING TEST SUITE
Suite: My First API Test
Type: API
Base URL: https://jsonplaceholder.typicode.com
Test Cases: 1

🔧 API TEST CASE: Get User

📡 TEST DATA: Fetch User 1
🌐 REQUEST DETAILS
  Method: GET
  URL: https://jsonplaceholder.typicode.com/users/1
  Type: REST

✅ Request completed with status 200

📥 RESPONSE
  Status: 200
  Time: 245ms

🔍 RUNNING ASSERTIONS
✅ statusCode assertion passed
✅ exists assertion ($.id) passed
✅ equals assertion ($.id) passed

💾 STORING GLOBAL VARIABLES
✅ Global variables stored: userId, userName

✅ Test Passed!
```

---

## 🎨 Your First UI Test (5 minutes)

### Create UI Test Suite

Create `testSuites/my-first-ui-test.json`:

```json
{
  "id": "my-first-ui-test",
  "suiteName": "My First UI Test",
  "applicationName": "Sample Website",
  "type": "UI",
  "baseUrl": "",
  "testCases": [
    {
      "name": "Google Search",
      "type": "UI",
      "testSteps": [
        {
          "id": "step-1",
          "keyword": "goto",
          "value": "https://www.google.com"
        },
        {
          "id": "step-2",
          "keyword": "assertTitle",
          "value": "Google"
        },
        {
          "id": "step-3",
          "keyword": "type",
          "locator": {
            "strategy": "css",
            "value": "textarea[name='q']"
          },
          "value": "TestFlow Pro"
        },
        {
          "id": "step-4",
          "keyword": "press",
          "value": "Enter"
        },
        {
          "id": "step-5",
          "keyword": "waitForSelector",
          "locator": {
            "strategy": "css",
            "value": "#search"
          }
        },
        {
          "id": "step-6",
          "keyword": "assertVisible",
          "locator": {
            "strategy": "css",
            "value": "#search"
          }
        }
      ]
    }
  ]
}
```

### Run UI Test

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run the test
npx ts-node src/runner.ts --file="./testSuites/my-first-ui-test.json"
```

---

## 🎯 Using the UI Dashboard

### Start the Dashboard

```bash
cd frontend/TestEditor
npm run dev
```

Access at: **http://localhost:3000**

### Create Test via UI

1. **Click "+ New Suite"** button
2. **Fill in details:**
   - Suite Name: "My Dashboard Test"
   - Application: "Sample App"
   - Type: API
   - Base URL: "https://jsonplaceholder.typicode.com"
3. **Add Test Case:**
   - Click "Add Test Case"
   - Name: "Get Posts"
   - Type: REST
4. **Add Test Data:**
   - Click "Add Test Data"
   - Name: "Fetch All Posts"
   - Method: GET
   - Endpoint: /posts
5. **Add Assertions:**
   - Type: statusCode, Expected: 200
   - Type: type, JSONPath: $, Expected: array
6. **Save Suite**

### Run from Dashboard

1. Find your suite in the grid
2. Click ▶️ **Run** button
3. Monitor execution in modal
4. View results when complete

---

## 📊 View Test Results

### JSON Reports

```bash
# Reports are saved in reports/ directory
ls -la reports/

# View latest report
cat reports/result-*.json | jq
```

### HTML Reports

```bash
# Generate HTML reports
npm run report:html

# Open in browser
open reports/*.html
```

---

## 🎓 Next Steps

### Learn Core Concepts

1. **[Variable Store](../features/variable-store.md)** - Store and reuse values
2. **[PreProcess Functions](../features/preprocess-functions.md)** - Generate dynamic data
3. **[Assertions](../features/assertions.md)** - Validate responses
4. **[Tags & Filtering](../features/tags-filtering.md)** - Organize tests

### Explore Examples

1. **[API Testing Examples](../examples/api-testing.md)** - REST & SOAP
2. **[UI Testing Examples](../examples/ui-testing.md)** - Browser automation
3. **[Advanced Scenarios](../examples/advanced-scenarios.md)** - Complex workflows

### Set Up CI/CD

1. **[GitHub Actions](../ci-cd/github-actions.md)** - Automate with GitHub
2. **[Azure DevOps](../ci-cd/azure-devops.md)** - Integrate with ADO

---

## 💡 Quick Tips

### 1. Use Tags for Organization

```json
{
  "tags": [
    { "serviceName": "@UserService" },
    { "suiteType": "@smoke" }
  ]
}
```

Run specific tags:
```bash
npx ts-node src/runner.ts --serviceName="@UserService" --suiteType="@smoke"
```

### 2. Store Important Values

```json
{
  "store": {
    "userId": "$.id",
    "authToken": "$.token"
  }
}
```

Use in next request:
```json
{
  "endpoint": "/users/{{userId}}",
  "headers": {
    "Authorization": "Bearer {{authToken}}"
  }
}
```

### 3. Use PreProcess for Dynamic Data

```json
{
  "preProcess": [
    {
      "var": "randomEmail",
      "function": "faker.email"
    },
    {
      "var": "timestamp",
      "function": "date.now"
    }
  ],
  "body": {
    "email": "{{randomEmail}}",
    "createdAt": "{{timestamp}}"
  }
}
```

### 4. Enable/Disable Tests

```json
{
  "testCases": [
    {
      "name": "Flaky Test",
      "enabled": false,
      "testData": [...]
    }
  ]
}
```

### 5. Use Test Dependencies

```json
{
  "testCases": [
    {
      "name": "Create User",
      "priority": 1,
      "testData": [...]
    },
    {
      "name": "Update User",
      "priority": 2,
      "dependsOn": ["Create User"],
      "testData": [...]
    }
  ]
}
```

---

## 🐛 Common Issues

### Issue 1: Module Not Found

```bash
# Solution: Install dependencies
npm install
```

### Issue 2: Playwright Browsers Missing

```bash
# Solution: Install browsers
npx playwright install
```

### Issue 3: Port 3000 Already in Use

```bash
# Solution: Kill process or use different port
lsof -ti:3000 | xargs kill -9

# Or change port in frontend/TestEditor/package.json
"dev": "next dev -p 3001"
```

### Issue 4: Environment Variables Not Loading

```bash
# Solution: Check .env file exists
ls -la .env

# Verify content
cat .env
```

---

## 📚 Helpful Commands

### Run Tests

```bash
# All tests
npm test

# Specific file
npx ts-node src/runner.ts --file="./testSuites/suite.json"

# By tags
npx ts-node src/runner.ts --serviceName="@UserService"

# By application
npx ts-node src/runner.ts --applicationName="Bookstore"

# By type
npx ts-node src/runner.ts --testType="API"
```

### Generate Reports

```bash
# HTML reports
npm run report:html

# View reports
ls -la reports/
```

### Start UI

```bash
# Frontend dashboard
cd frontend/TestEditor && npm run dev

# Access at http://localhost:3000
```

---

## 🎯 What's Next?

### Beginner Path
1. ✅ Complete Quick Start (You are here!)
2. 📖 Read [Test Suite Structure](../features/test-suite-structure.md)
3. 🧪 Try [API Testing Examples](../examples/api-testing.md)
4. 🎨 Explore [UI Dashboard](../ui-guide/dashboard.md)

### Intermediate Path
1. 💾 Master [Variable Store](../features/variable-store.md)
2. 🔧 Learn [PreProcess Functions](../features/preprocess-functions.md)
3. ✅ Understand [Assertions](../features/assertions.md)
4. 📊 Set up [Data-Driven Testing](../features/data-driven-testing.md)

### Advanced Path
1. 🔗 Implement [Test Dependencies](../features/test-dependencies.md)
2. 🗄️ Integrate [Database Testing](../features/database-integration.md)
3. 🔄 Set up [CI/CD](../ci-cd/github-actions.md)
4. 🎓 Build [Advanced Scenarios](../examples/advanced-scenarios.md)

---

## 🆘 Need Help?

- 📖 Check [Full Documentation](../README.md)
- 🐛 Report issues on GitHub
- 💬 Join community discussions
- 📧 Contact support

---

**You're ready to start testing! 🚀**
