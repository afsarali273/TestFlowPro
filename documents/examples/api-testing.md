# 🚀 API Testing Examples

Comprehensive examples for REST and SOAP API testing with TestFlow Pro.

---

## 📋 Table of Contents

1. [Basic REST API Tests](#basic-rest-api-tests)
2. [Authentication Patterns](#authentication-patterns)
3. [CRUD Operations](#crud-operations)
4. [Data-Driven Testing](#data-driven-testing)
5. [Schema Validation](#schema-validation)
6. [Error Handling](#error-handling)
7. [SOAP API Testing](#soap-api-testing)
8. [Advanced Scenarios](#advanced-scenarios)

---

## 🎯 Basic REST API Tests

### Simple GET Request

```json
{
  "id": "simple-get-test",
  "suiteName": "Basic API Tests",
  "applicationName": "Sample API",
  "type": "API",
  "baseUrl": "https://api.example.com",
  "testCases": [
    {
      "name": "Get User by ID",
      "type": "REST",
      "testData": [
        {
          "name": "Fetch User 123",
          "method": "GET",
          "endpoint": "/users/123",
          "headers": {
            "Content-Type": "application/json"
          },
          "assertions": [
            {
              "type": "statusCode",
              "expected": 200
            },
            {
              "type": "equals",
              "jsonPath": "$.id",
              "expected": "123"
            },
            {
              "type": "exists",
              "jsonPath": "$.name"
            }
          ]
        }
      ]
    }
  ]
}
```

### POST Request with Body

```json
{
  "name": "Create New User",
  "type": "REST",
  "testData": [
    {
      "name": "Create User - Valid Data",
      "method": "POST",
      "endpoint": "/users",
      "headers": {
        "Content-Type": "application/json"
      },
      "body": {
        "name": "John Doe",
        "email": "john.doe@example.com",
        "age": 30,
        "role": "user"
      },
      "assertions": [
        {
          "type": "statusCode",
          "expected": 201
        },
        {
          "type": "exists",
          "jsonPath": "$.id"
        },
        {
          "type": "equals",
          "jsonPath": "$.name",
          "expected": "John Doe"
        }
      ],
      "store": {
        "newUserId": "$.id"
      }
    }
  ]
}
```

### PUT Request (Update)

```json
{
  "name": "Update User",
  "type": "REST",
  "testData": [
    {
      "name": "Update User Name",
      "method": "PUT",
      "endpoint": "/users/{{newUserId}}",
      "headers": {
        "Content-Type": "application/json"
      },
      "body": {
        "name": "John Doe Updated",
        "email": "john.doe@example.com"
      },
      "assertions": [
        {
          "type": "statusCode",
          "expected": 200
        },
        {
          "type": "equals",
          "jsonPath": "$.name",
          "expected": "John Doe Updated"
        }
      ]
    }
  ]
}
```

### DELETE Request

```json
{
  "name": "Delete User",
  "type": "REST",
  "testData": [
    {
      "name": "Delete User by ID",
      "method": "DELETE",
      "endpoint": "/users/{{newUserId}}",
      "assertions": [
        {
          "type": "statusCode",
          "expected": 204
        }
      ]
    }
  ]
}
```

---

## 🔐 Authentication Patterns

### Bearer Token Authentication

```json
{
  "testCases": [
    {
      "name": "Authentication Flow",
      "type": "REST",
      "testData": [
        {
          "name": "Login",
          "method": "POST",
          "endpoint": "/auth/login",
          "body": {
            "username": "admin",
            "password": "secret123"
          },
          "assertions": [
            {
              "type": "statusCode",
              "expected": 200
            },
            {
              "type": "exists",
              "jsonPath": "$.token"
            }
          ],
          "store": {
            "authToken": "$.token",
            "refreshToken": "$.refreshToken"
          }
        },
        {
          "name": "Access Protected Resource",
          "method": "GET",
          "endpoint": "/api/protected/users",
          "headers": {
            "Authorization": "Bearer {{authToken}}"
          },
          "assertions": [
            {
              "type": "statusCode",
              "expected": 200
            }
          ]
        }
      ]
    }
  ]
}
```

### API Key Authentication

```json
{
  "name": "API Key Auth",
  "testData": [
    {
      "name": "Get Data with API Key",
      "method": "GET",
      "endpoint": "/api/data",
      "headers": {
        "X-API-Key": "your-api-key-here",
        "Content-Type": "application/json"
      },
      "assertions": [
        {
          "type": "statusCode",
          "expected": 200
        }
      ]
    }
  ]
}
```

### Basic Authentication

```json
{
  "name": "Basic Auth",
  "testData": [
    {
      "name": "Access with Basic Auth",
      "method": "GET",
      "endpoint": "/api/secure",
      "headers": {
        "Authorization": "Basic dXNlcm5hbWU6cGFzc3dvcmQ="
      },
      "assertions": [
        {
          "type": "statusCode",
          "expected": 200
        }
      ]
    }
  ]
}
```

### Cookie-Based Authentication

```json
{
  "testData": [
    {
      "name": "Login and Get Session",
      "method": "POST",
      "endpoint": "/login",
      "body": {
        "username": "user",
        "password": "pass"
      },
      "store": {
        "sessionId": "$cookies.JSESSIONID",
        "csrfToken": "$cookies.XSRF-TOKEN"
      }
    },
    {
      "name": "Use Session Cookie",
      "method": "GET",
      "endpoint": "/api/profile",
      "cookies": {
        "JSESSIONID": "{{sessionId}}"
      },
      "headers": {
        "X-CSRF-TOKEN": "{{csrfToken}}"
      }
    }
  ]
}
```

---

## 📦 CRUD Operations

### Complete User CRUD Suite

```json
{
  "id": "user-crud-suite",
  "suiteName": "User CRUD Operations",
  "applicationName": "User Management API",
  "type": "API",
  "baseUrl": "https://api.example.com",
  "tags": [
    { "serviceName": "@UserService" },
    { "suiteType": "@smoke" }
  ],
  "testCases": [
    {
      "name": "User CRUD Workflow",
      "type": "REST",
      "testData": [
        {
          "name": "1. Create User",
          "method": "POST",
          "endpoint": "/users",
          "preProcess": [
            {
              "var": "randomEmail",
              "function": "faker.email"
            },
            {
              "var": "randomName",
              "function": "faker.name"
            }
          ],
          "body": {
            "name": "{{randomName}}",
            "email": "{{randomEmail}}",
            "age": 25,
            "role": "user"
          },
          "assertions": [
            {
              "type": "statusCode",
              "expected": 201
            },
            {
              "type": "exists",
              "jsonPath": "$.id"
            },
            {
              "type": "equals",
              "jsonPath": "$.email",
              "expected": "{{randomEmail}}"
            }
          ],
          "store": {
            "userId": "$.id",
            "userName": "$.name"
          }
        },
        {
          "name": "2. Read User",
          "method": "GET",
          "endpoint": "/users/{{userId}}",
          "assertions": [
            {
              "type": "statusCode",
              "expected": 200
            },
            {
              "type": "equals",
              "jsonPath": "$.id",
              "expected": "{{userId}}"
            },
            {
              "type": "equals",
              "jsonPath": "$.name",
              "expected": "{{userName}}"
            }
          ]
        },
        {
          "name": "3. Update User",
          "method": "PUT",
          "endpoint": "/users/{{userId}}",
          "body": {
            "name": "{{userName}} Updated",
            "age": 26
          },
          "assertions": [
            {
              "type": "statusCode",
              "expected": 200
            },
            {
              "type": "contains",
              "jsonPath": "$.name",
              "expected": "Updated"
            }
          ]
        },
        {
          "name": "4. Verify Update",
          "method": "GET",
          "endpoint": "/users/{{userId}}",
          "assertions": [
            {
              "type": "statusCode",
              "expected": 200
            },
            {
              "type": "equals",
              "jsonPath": "$.age",
              "expected": 26
            }
          ]
        },
        {
          "name": "5. Delete User",
          "method": "DELETE",
          "endpoint": "/users/{{userId}}",
          "assertions": [
            {
              "type": "statusCode",
              "expected": 204
            }
          ]
        },
        {
          "name": "6. Verify Deletion",
          "method": "GET",
          "endpoint": "/users/{{userId}}",
          "assertions": [
            {
              "type": "statusCode",
              "expected": 404
            }
          ]
        }
      ]
    }
  ]
}
```

---

## 📊 Data-Driven Testing

### Using CSV Data Source

**data.csv:**
```csv
name,email,age,role
John Doe,john@example.com,30,admin
Jane Smith,jane@example.com,25,user
Bob Johnson,bob@example.com,35,moderator
```

**Test Suite:**
```json
{
  "testCases": [
    {
      "name": "Create Multiple Users",
      "type": "REST",
      "parameters": {
        "enabled": true,
        "dataSource": {
          "type": "csv",
          "filePath": "./data.csv"
        }
      },
      "method": "POST",
      "endpoint": "/users",
      "body": {
        "name": "{{name}}",
        "email": "{{email}}",
        "age": "{{age}}",
        "role": "{{role}}"
      },
      "assertions": [
        {
          "type": "statusCode",
          "expected": 201
        },
        {
          "type": "equals",
          "jsonPath": "$.email",
          "expected": "{{email}}"
        }
      ]
    }
  ]
}
```

### Using JSON Data Source

**users.json:**
```json
[
  {
    "name": "Alice Brown",
    "email": "alice@example.com",
    "age": 28,
    "role": "admin"
  },
  {
    "name": "Charlie Davis",
    "email": "charlie@example.com",
    "age": 32,
    "role": "user"
  }
]
```

**Test Suite:**
```json
{
  "testCases": [
    {
      "name": "Create Users from JSON",
      "type": "REST",
      "parameters": {
        "enabled": true,
        "dataSource": {
          "type": "json",
          "filePath": "./users.json"
        }
      },
      "method": "POST",
      "endpoint": "/users",
      "body": {
        "name": "{{name}}",
        "email": "{{email}}",
        "age": "{{age}}",
        "role": "{{role}}"
      }
    }
  ]
}
```

### Using Inline Data

```json
{
  "testCases": [
    {
      "name": "Test Multiple Scenarios",
      "type": "REST",
      "parameters": {
        "enabled": true,
        "dataSource": {
          "type": "inline",
          "data": [
            { "userId": "1", "expectedName": "John" },
            { "userId": "2", "expectedName": "Jane" },
            { "userId": "3", "expectedName": "Bob" }
          ]
        }
      },
      "method": "GET",
      "endpoint": "/users/{{userId}}",
      "assertions": [
        {
          "type": "equals",
          "jsonPath": "$.name",
          "expected": "{{expectedName}}"
        }
      ]
    }
  ]
}
```

---

## ✅ Schema Validation

### Inline Schema

```json
{
  "name": "Validate User Response",
  "method": "GET",
  "endpoint": "/users/123",
  "responseSchema": {
    "type": "object",
    "required": ["id", "name", "email"],
    "properties": {
      "id": { "type": "string" },
      "name": { "type": "string" },
      "email": { "type": "string", "format": "email" },
      "age": { "type": "number", "minimum": 0 },
      "role": { "type": "string", "enum": ["admin", "user", "moderator"] }
    }
  }
}
```

### External Schema File

**schemas/user-schema.json:**
```json
{
  "type": "object",
  "required": ["id", "name", "email"],
  "properties": {
    "id": { "type": "string" },
    "name": { "type": "string", "minLength": 1 },
    "email": { "type": "string", "format": "email" },
    "age": { "type": "number", "minimum": 0, "maximum": 150 },
    "createdAt": { "type": "string", "format": "date-time" }
  }
}
```

**Test Suite:**
```json
{
  "name": "Validate with External Schema",
  "method": "GET",
  "endpoint": "/users/123",
  "responseSchemaFile": "./schemas/user-schema.json"
}
```

---

## ⚠️ Error Handling

### Testing Error Responses

```json
{
  "testCases": [
    {
      "name": "Error Scenarios",
      "type": "REST",
      "testData": [
        {
          "name": "Not Found - 404",
          "method": "GET",
          "endpoint": "/users/99999",
          "assertions": [
            {
              "type": "statusCode",
              "expected": 404
            },
            {
              "type": "exists",
              "jsonPath": "$.error"
            },
            {
              "type": "contains",
              "jsonPath": "$.error.message",
              "expected": "not found"
            }
          ]
        },
        {
          "name": "Bad Request - 400",
          "method": "POST",
          "endpoint": "/users",
          "body": {
            "name": "",
            "email": "invalid-email"
          },
          "assertions": [
            {
              "type": "statusCode",
              "expected": 400
            },
            {
              "type": "exists",
              "jsonPath": "$.errors"
            }
          ]
        },
        {
          "name": "Unauthorized - 401",
          "method": "GET",
          "endpoint": "/api/protected",
          "assertions": [
            {
              "type": "statusCode",
              "expected": 401
            }
          ]
        },
        {
          "name": "Forbidden - 403",
          "method": "DELETE",
          "endpoint": "/admin/users/123",
          "headers": {
            "Authorization": "Bearer {{userToken}}"
          },
          "assertions": [
            {
              "type": "statusCode",
              "expected": 403
            }
          ]
        }
      ]
    }
  ]
}
```

---

## 🧼 SOAP API Testing

### Basic SOAP Request

```json
{
  "id": "soap-calculator",
  "suiteName": "SOAP Calculator Tests",
  "applicationName": "Calculator Service",
  "type": "API",
  "baseUrl": "http://www.dneonline.com",
  "testCases": [
    {
      "name": "Add Numbers",
      "type": "SOAP",
      "testData": [
        {
          "name": "Add 10 + 5",
          "method": "POST",
          "endpoint": "/calculator.asmx",
          "headers": {
            "Content-Type": "text/xml; charset=utf-8",
            "SOAPAction": "http://tempuri.org/Add"
          },
          "body": "<?xml version=\"1.0\" encoding=\"utf-8\"?><soap:Envelope xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\"><soap:Body><Add xmlns=\"http://tempuri.org/\"><intA>10</intA><intB>5</intB></Add></soap:Body></soap:Envelope>",
          "assertions": [
            {
              "type": "statusCode",
              "expected": 200
            },
            {
              "type": "exists",
              "xpathExpression": "//AddResult"
            },
            {
              "type": "equals",
              "xpathExpression": "//AddResult",
              "expected": "15"
            }
          ]
        }
      ]
    }
  ]
}
```

### SOAP with External Body File

**bodies/add-request.xml:**
```xml
<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <Add xmlns="http://tempuri.org/">
      <intA>{{numberA}}</intA>
      <intB>{{numberB}}</intB>
    </Add>
  </soap:Body>
</soap:Envelope>
```

**Test Suite:**
```json
{
  "name": "Add with Variables",
  "type": "SOAP",
  "testData": [
    {
      "name": "Add Dynamic Numbers",
      "method": "POST",
      "endpoint": "/calculator.asmx",
      "headers": {
        "Content-Type": "text/xml; charset=utf-8",
        "SOAPAction": "http://tempuri.org/Add"
      },
      "bodyFile": "./bodies/add-request.xml",
      "preProcess": [
        {
          "var": "numberA",
          "function": "custom.randomNumber",
          "args": [1, 100]
        },
        {
          "var": "numberB",
          "function": "custom.randomNumber",
          "args": [1, 100]
        }
      ],
      "store": {
        "result": "//AddResult"
      }
    }
  ]
}
```

---

## 🎓 Advanced Scenarios

### Chained API Calls with Dependencies

```json
{
  "testCases": [
    {
      "name": "Setup User",
      "type": "REST",
      "priority": 1,
      "testData": [
        {
          "name": "Create Test User",
          "method": "POST",
          "endpoint": "/users",
          "body": {
            "name": "Test User",
            "email": "test@example.com"
          },
          "store": {
            "testUserId": "$.id"
          }
        }
      ]
    },
    {
      "name": "Create Order",
      "type": "REST",
      "priority": 2,
      "dependsOn": ["Setup User"],
      "testData": [
        {
          "name": "Create Order for User",
          "method": "POST",
          "endpoint": "/orders",
          "body": {
            "userId": "{{testUserId}}",
            "items": [
              { "productId": "123", "quantity": 2 }
            ]
          },
          "store": {
            "orderId": "$.id"
          }
        }
      ]
    },
    {
      "name": "Process Payment",
      "type": "REST",
      "priority": 3,
      "dependsOn": ["Create Order"],
      "testData": [
        {
          "name": "Pay for Order",
          "method": "POST",
          "endpoint": "/payments",
          "body": {
            "orderId": "{{orderId}}",
            "amount": 100.00,
            "method": "credit_card"
          }
        }
      ]
    }
  ]
}
```

### Array Assertions

```json
{
  "name": "Test Array Response",
  "method": "GET",
  "endpoint": "/users",
  "assertions": [
    {
      "type": "statusCode",
      "expected": 200
    },
    {
      "type": "type",
      "jsonPath": "$",
      "expected": "array"
    },
    {
      "type": "greaterThan",
      "jsonPath": "$.length",
      "expected": 0
    },
    {
      "type": "arrayObjectMatch",
      "jsonPath": "$",
      "matchField": "role",
      "matchValue": "admin",
      "assertField": "permissions",
      "expected": ["read", "write", "delete"]
    }
  ]
}
```

### Database Integration

```json
{
  "testData": [
    {
      "name": "Create User and Verify in DB",
      "method": "POST",
      "endpoint": "/users",
      "preProcess": [
        {
          "function": "dbQuery",
          "args": ["SELECT COUNT(*) as count FROM users"],
          "db": "userDb",
          "mapTo": {
            "initialCount": "count"
          }
        }
      ],
      "body": {
        "name": "DB Test User",
        "email": "dbtest@example.com"
      },
      "store": {
        "newUserId": "$.id"
      }
    },
    {
      "name": "Verify User in Database",
      "method": "GET",
      "endpoint": "/users/{{newUserId}}",
      "preProcess": [
        {
          "function": "dbQuery",
          "args": ["SELECT * FROM users WHERE id = '{{newUserId}}'"],
          "db": "userDb",
          "mapTo": {
            "dbUserName": "name",
            "dbUserEmail": "email"
          }
        }
      ],
      "assertions": [
        {
          "type": "equals",
          "jsonPath": "$.name",
          "expected": "{{dbUserName}}"
        }
      ]
    }
  ]
}
```

---

## 🎯 Best Practices

### 1. Use Tags for Organization
```json
{
  "tags": [
    { "serviceName": "@UserService" },
    { "suiteType": "@smoke" },
    { "priority": "@high" }
  ]
}
```

### 2. Enable/Disable Tests
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

### 3. Use PreProcess for Dynamic Data
```json
{
  "preProcess": [
    { "var": "timestamp", "function": "date.now" },
    { "var": "uuid", "function": "faker.uuid" },
    { "var": "email", "function": "faker.email" }
  ]
}
```

### 4. Store Important Values
```json
{
  "store": {
    "userId": "$.id",
    "authToken": "$.token",
    "createdAt": "$.timestamp"
  }
}
```

### 5. Comprehensive Assertions
```json
{
  "assertions": [
    { "type": "statusCode", "expected": 200 },
    { "type": "exists", "jsonPath": "$.id" },
    { "type": "type", "jsonPath": "$.age", "expected": "number" },
    { "type": "regex", "jsonPath": "$.email", "expected": "^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$" }
  ]
}
```

---

## 📚 Related Documentation

- [Variable Store](../features/variable-store.md)
- [PreProcess Functions](../features/preprocess-functions.md)
- [Assertions](../features/assertions.md)
- [CLI Execution](../cli-execution/command-line.md)

---

**Start building powerful API tests today! 🚀**
