# 🔍 Keyword-Driven API Testing Framework

A powerful, flexible, and pluggable **API automation framework** built in **TypeScript**, using **Axios** and **JSON-driven test configuration**.  
Designed for **REST API testing**, it supports dynamic data, pre-processing, assertions, schema validation, and multi-suite execution.

TODO:
- SOAP API
- GraphQL
- Kafka Integration
- Database integration

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

| `type`             | Description                                                                |
| ------------------ | -------------------------------------------------------------------------- |
| `equals`           | Value is equal to expected                                                 |
| `notEquals`        | Value is not equal to expected                                             |
| `contains`         | Result contains substring or value                                         |
| `startsWith`       | Result string starts with expected value                                   |
| `endsWith`         | Result string ends with expected value                                     |
| `greaterThan`      | Result is greater than expected (numeric)                                  |
| `lessThan`         | Result is less than expected (numeric)                                     |
| `in`               | Result exists in an array of expected values                               |
| `notIn`            | Result does not exist in an array of expected values                       |
| `includesAll`      | Array result must include all specified values                             |
| `length`           | Checks length of array or string                                           |
| `size`             | Checks number of keys (if object) or elements (if array)                   |
| `type`             | Type of result matches (e.g., `"string"`, `"number"`)                      |
| `exists`           | Path exists                                                                |
| `regex`            | Regex pattern matches result                                               |
| `statusCode`       | Validates HTTP status code                                                 |
| `arrayObjectMatch` | Search array of objects for a field/value match and assert a sibling field |


````
"assertions": [
  { "type": "statusCode", "jsonPath": "$.", "expected": 200 },
  { "type": "equals", "jsonPath": "$.data.id", "expected": "abc123" },
  { "type": "notEquals", "jsonPath": "$.data.status", "expected": "error" },
  { "type": "contains", "jsonPath": "$.message", "expected": "success" },
  { "type": "startsWith", "jsonPath": "$.user.email", "expected": "test" },
  { "type": "greaterThan", "jsonPath": "$.data.age", "expected": 18 },
  { "type": "lessThan", "jsonPath": "$.data.age", "expected": 60 },
  { "type": "in", "jsonPath": "$.status", "expected": ["active", "pending"] },
  { "type": "includesAll", "jsonPath": "$.roles", "expected": ["admin", "editor"] },
  { "type": "length", "jsonPath": "$.items", "expected": 5 },
  { "type": "regex", "jsonPath": "$.email", "expected": "^[\\w-.]+@([\\w-]+\\.)+[\\w-]{2,4}$" },
  {
    "type": "arrayObjectMatch",
    "jsonPath": "$.data",
    "matchField": "name",
    "matchValue": "Company",
    "assertField": "value",
    "expected": "MBS"
  }
]

-------------------------
arrayObjectMatch is ideal when:
The array contains { name: "X", value: "Y" } objects
Element order is dynamic
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
- Array Object Match (for unordered arrays)
```html
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
Use stored variables in later requests as {{variableName}}.


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
