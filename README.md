# 🔍 Keyword-Driven API Testing Framework

A powerful, flexible, and pluggable **API automation framework** built in **TypeScript**, using **Axios** and **JSON-driven test configuration**.  
Designed for **REST API testing**, it supports dynamic data, pre-processing, assertions, schema validation, and multi-suite execution.

---

## 🚀 Features

- ✅ **Keyword-driven architecture**
- ✅ Test cases driven entirely by **JSON files**
- ✅ **Data-driven** test cases within each suite
- ✅ Powerful **variable injection and response chaining**
- ✅ **Pre-processing hooks** (e.g., faker, encryption, custom token)
- ✅ External **bodyFile** and **responseSchemaFile** support
- ✅ **JSONPath-based assertions**
- ✅ **JSON Schema validation** (inline and file-based)
- ✅ Suite-level **tags** (e.g., `@serviceName`, `@suiteType`)
- ✅ **Parallel execution** for suites
- ✅ **.env support** for environment management
- ✅ **Command-line filters** (by tag)
- ✅ **JSON reports** with summary and optional response bodies

---

## 🏗 Project Structure

````
project-root/
├── src/
│ ├── executor.ts
│ ├── preProcessor.ts
│ ├── utils/
│ │ ├── variableStore.ts
│ │ ├── envManager.ts
│ │ └── assertUtils.ts
│ ├── reporter.ts
│ └── types.ts
├── test-suites/
│ └── my-suite.json
├── schemas/
│ └── user-details-schema.json
├── .env
├── report.json
└── index.ts
````


---

## 🧪 Sample Suite JSON

```json
{
  "suiteName": "UserService Login Tests",
  "tags": [
    { "serviceName": "@UserService" },
    { "suiteType": "@smoke" }
  ],
  "baseUrl": "https://api.example.com",
  "testCases": [
    {
      "name": "Login and Get Profile",
      "testData": [
        {
          "name": "Valid Credentials",
          "method": "POST",
          "endpoint": "/login",
          "headers": {
            "Content-Type": "application/json"
          },
          "body": {
            "username": "admin",
            "password": "admin123"
          },
          "store": {
            "authToken": "$.token"
          },
          "assertions": [
            { "statusCode": 200 },
            { "jsonPath": "$.token", "expectedType": "string" }
          ]
        },
        {
          "name": "Fetch Profile with Token",
          "method": "GET",
          "endpoint": "/me",
          "headers": {
            "Authorization": "Bearer ${authToken}"
          },
          "assertions": [
            { "statusCode": 200 },
            { "jsonPath": "$.user", "expectedValue": "admin" }
          ],
          "responseSchemaFile": "./schemas/user-details-schema.json"
        }
      ]
    }
  ]
}
```
# 🧰 PreProcess Functions

````
"preProcess": [
{ "var": "randomEmail", "function": "faker.email" },
{ "var": "encryptedPassword", "function": "encrypt", "args": ["P@ssword"] },
{ "var": "authToken", "function": "custom.authToken" }
]
````

## ✅ Supported Pre-Processing Functions:

| Function           | Output Description               |
| ------------------ | -------------------------------- |
| `faker.email`      | Generates a random email         |
| `faker.uuid`       | Generates UUID                   |
| `faker.username`   | Generates a fake username        |
| `date.now`         | Current timestamp                |
| `encrypt`          | AES-256 encryption of string     |
| `custom.authToken` | Generates token via custom logic |

## 🛡 Assertions

````
"assertions": [
{ "statusCode": 200 },
{ "jsonPath": "$.user.email", "expectedValue": "${randomEmail}" },
{ "jsonPath": "$.data.items", "expectedType": "array" }
]
````

- statusCode: Validate HTTP status 
- jsonPath + expectedValue: Validate value
- jsonPath + expectedType: Validate data type
- Additional ideas: expectedLength, contains, etc.

## 📁 External Files Support

✅ bodyFile <br>
"bodyFile": "./payloads/login-body.json"

✅ responseSchemaFile <br>
"responseSchemaFile": "./schemas/user-response-schema.json"

## 🔗 Variable Injection & Storage

- Inject values like ${authToken}, ${randomEmail} into endpoint, headers, body
- Chain values across test cases using "store" field:
```
"store": {
"userId": "$.id"
}
```

## ⚙️ Environment Configuration (.env)

```
BASE_URL=https://api.example.com
PARALLEL_THREADS=4
```

📊 JSON Report Format (report.json)


🚀 Running Tests

```shell
Install dependencies
npm install
# Run tests in parallel mode
npx ts-node src/runner.ts 

# Run tests with CLI tag filters
npx ts-node src/runner.ts --serviceName=@UserService --suiteType=@smoke

```

## ✅ Test Case Use Cases Covered

| Scenario                               | Supported |
| -------------------------------------- | --------- |
| Basic GET/POST with assertions         | ✅         |
| Request body from external JSON file   | ✅         |
| Token chaining between tests           | ✅         |
| Dynamic variable generation (faker)    | ✅         |
| AES encryption before API call         | ✅         |
| Custom function for auth token         | ✅         |
| JSONPath assertions with expected type | ✅         |
| Schema validation (inline + external)  | ✅         |
| Suite-level metadata and CLI filters   | ✅         |
| Response body stored in report (fail)  | ✅         |
| Parallel suite execution               | ✅         |
