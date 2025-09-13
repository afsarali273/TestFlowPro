# 🔍 TestFlow Pro – Keyword-Driven API Automation Framework

A powerful and flexible API test automation tool built with **TypeScript**, supporting **REST**, **SOAP**, and **Database** testing using **JSON-driven test cases**. It is designed for scalable and maintainable testing with no-code authoring and UI support.

---

## ▶️ Demo Video

* [YouTube Part-1](https://www.youtube.com/watch?v=Jw-B24hmNhQ)
* [YouTube Part-2](https://www.youtube.com/watch?v=wWXK-iqgtTE)

---

## 🚀 Features

### Core Testing Features
* ✅ **Keyword-driven JSON test case authoring**
* ✅ **Data-driven execution** (within each test case)
* ✅ **Preprocessing hooks** (`faker`, `encrypt`, `authToken`, `dbQuery`, custom logic)
* ✅ **Variable injection & response chaining**
* ✅ **Schema validation** (inline or file-based)
* ✅ **JSONPath-based assertions**
* ✅ **REST & SOAP** API support
* ✅ **External body/response schema file support**
* ✅ **Suite tags** (`@serviceName`, `@suiteType`) with CLI filters
* ✅ **Environment config via `.env.*` files**
* ✅ **Parallel test suite execution**
* ✅ **Database integration** with MySQL, ODBC, DB2

### UI & Import Features
* ✅ **Test Designer UI** with professional slate color scheme
* ✅ **Multiple Import Options**: cURL, Swagger/OpenAPI, Postman, Bruno collections
* ✅ **Environment Variables Manager** - Edit .env files directly from UI
* ✅ **Test cURL Commands** - Execute and validate before importing
* ✅ **Real-time Import Preview** - See converted test suites before saving

### Reporting & Export
* ✅ **HTML/JSON reports with summaries**
* ✅ **Beautiful HTML Report Export** - Individual suites and complete runs
* ✅ **Response Body Capture** - Always stored for passed and failed tests
* ✅ **Test Result Details** - Complete execution information

---

## 🧪 Sample Suite JSON

```json
{
  "suiteName": "Bookstore API Suite",
  "baseUrl": "https://api.bookstore.com",
  "tags": [
    { "serviceName": "@BookService" },
    { "suiteType": "@regression" }
  ],
  "testCases": [
    {
      "name": "Create Book",
      "testData": [
        {
          "name": "Add Book",
          "method": "POST",
          "endpoint": "/books",
          "headers": { "Content-Type": "application/json" },
          "preProcess": [
            { "var": "randomISBN", "function": "faker.uuid" },
            { "var": "authToken", "function": "custom.authToken" }
          ],
          "body": {
            "title": "Clean Code",
            "author": "Robert C. Martin",
            "isbn": "{{randomISBN}}"
          },
          "assertions": [
            { "type": "statusCode", "expected": 201 },
            { "type": "exists", "jsonPath": "$.id" }
          ],
          "store": {
            "newBookId": "$.id"
          }
        }
      ]
    }
  ]
}
```

---

## 🔧 PreProcess Functions

```json
[
  { "var": "randomEmail", "function": "faker.email" },
  { "var": "encryptedPwd", "function": "encrypt", "args": ["P@ssw0rd"] },
  { "function": "dbQuery", "args": ["SELECT id, name FROM users LIMIT 1"], "db": "userDb", "mapTo": { "userId": "id", "userName": "name" } }
]
```

### ✅ Supported Functions

| Function           | Description                                                               |
| ------------------ | ------------------------------------------------------------------------- |
| `faker.email`      | Generates random email                                                    |
| `faker.uuid`       | Generates UUID                                                            |
| `faker.username`   | Generates username                                                        |
| `date.now`         | Current timestamp                                                         |
| `encrypt`          | AES-256 encrypts string                                                   |
| `custom.authToken` | Custom logic for token                                                    |
| `generateUser`     | Custom function returning multiple keys (use with `mapTo`)                |
| `dbQuery`          | SQL query to DB (MySQL/ODBC/DB2) with support for `mapTo` or single `var` |

---

## 📦 `mapTo` Usage Examples

### 🔹 dbQuery

```json
{
  "function": "dbQuery",
  "args": ["SELECT id, email FROM users WHERE id = 1"],
  "db": "userDb",
  "mapTo": {
    "userId": "id",
    "userEmail": "email"
  }
}
```

### 🔹 Custom Function

```json
{
  "function": "generateUser",
  "mapTo": {
    "userNameVar": "username",
    "userEmailVar": "email",
    "userUUIDVar": "uuid"
  }
}
```

Supports `{{variable}}` in `args`, auto-injected via variable store.

---

## 🛡 Assertion Types

| Type               | Description                                             |
| ------------------ | ------------------------------------------------------- |
| `equals`           | Strict equality                                         |
| `notEquals`        | Inverse equality                                        |
| `contains`         | Value contains expected                                 |
| `startsWith`       | Starts with value                                       |
| `endsWith`         | Ends with value                                         |
| `greaterThan`      | > expected                                              |
| `lessThan`         | < expected                                              |
| `in`               | Is one of the expected array                            |
| `notIn`            | Not in array                                            |
| `includesAll`      | Array includes all values                               |
| `length`           | Length of string/array                                  |
| `size`             | Size of array/object                                    |
| `type`             | Validates value type (e.g., string, number)             |
| `exists`           | Ensures JSONPath exists                                 |
| `regex`            | Regex pattern matches                                   |
| `statusCode`       | HTTP status code check                                  |
| `arrayObjectMatch` | Searches array of objects for match + sibling assertion |

---

## 📁 External Files Support

* ✅ `bodyFile`: `"bodyFile": "./payloads/login.json"`
* ✅ `responseSchemaFile`: `"responseSchemaFile": "./schemas/user-schema.json"`

---

## 🔗 Variable Injection & Storage

Inject `{{variable}}` in `endpoint`, `headers`, `body`.

```json
"store": {
  "userId": "$.id"
}
```

Advanced array-object matching:

```json
"store": [
  {
    "type": "arrayObjectMatch",
    "jsonPath": "$.data",
    "matchField": "name",
    "matchValue": "Company",
    "extractField": "value",
    "variableName": "companyName"
  }
]
```

---

## ⚙️ Environment Setup

`.env.qa`, `.env.dev`, etc.

```env
BASE_URL=https://api.example.com
PARALLEL_THREADS=4
```

Supports DB credentials via prefixed variables:

```env
DB_USERDB_TYPE=mysql
DB_USERDB_HOST=localhost
DB_USERDB_PORT=3306
DB_USERDB_USER=root
DB_USERDB_PASSWORD=secret
DB_USERDB_NAME=testflow
```

---

## 📊 Test Reports

### JSON Reports
* **Detailed Summaries**: Complete test execution statistics
* **Failed/Assertion Logs**: Detailed failure information
* **Response Bodies**: Always captured for both passed and failed tests
* **Execution Timing**: Performance metrics and duration tracking

### HTML Reports
* **Beautiful Export**: Professional HTML reports with styling
* **Individual Suites**: Export specific test suite results
* **Complete Runs**: Export entire test run with all suites
* **Shareable**: Easy to share with stakeholders and teams

---

## 📥 Import Options

### cURL Import
* **Test cURL Commands**: Execute cURL and see actual results before conversion
* **Smart Parsing**: Extracts method, headers, body, and URL automatically
* **Add to Existing**: Import into existing test suites or create new ones

### Swagger/OpenAPI Import
* **Multiple Input Methods**: URL, file upload, or paste JSON/YAML
* **Comprehensive Conversion**: Generates positive and negative test scenarios
* **Schema Validation**: Includes request/response schema validation

### Postman Collection Import
* **v2.1 Format Support**: Full Postman Collection v2.1 compatibility
* **Variables & Scripts**: Converts collection variables and test scripts
* **Folder Structure**: Maintains organization with nested folders

### Bruno Collection Import
* **File-based Collections**: Import .bru files and environment files
* **Folder Upload**: Upload entire Bruno collection directories
* **Environment Variables**: Automatic .env file parsing

---

## 🎨 UI Features

### Professional Interface
* **Slate Color Scheme**: Professional, eye-strain reducing design
* **Application Grouping**: Organize test suites by application
* **Grid/List Views**: Multiple viewing options for test suites
* **Folder Navigation**: Browse test suites by folder structure

### Environment Management
* **Visual Editor**: Edit .env.dev, .env.qa, .env.prod files directly
* **Add/Edit/Delete**: Full CRUD operations for environment variables
* **Multi-Environment**: Switch between different environments seamlessly

---

## 🧪 Running Tests

```bash
# Install dependencies
npm install

# Run tests
npx ts-node src/runner.ts

# Run filtered by tag
npx ts-node src/runner.ts --serviceName=@UserService --suiteType=@smoke

# Run Frontend UI (React)
cd frontend/TestEditor
npm install --legacy-peer-deps
npm run dev
```

### UI Access
* **Dashboard**: http://localhost:3000
* **Features**: Create, edit, run test suites with visual interface
* **Import**: Use UI to import from cURL, Swagger, Postman, Bruno
* **Environment**: Manage .env files through Settings menu

---

Want to contribute, build plugins, or explore GraphQL/Kafka next? Let’s connect!
