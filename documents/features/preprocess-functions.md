# 🔧 PreProcess Functions

PreProcess functions allow you to generate dynamic data, execute database queries, and run custom logic before test execution.

---

## 📋 Overview

PreProcess functions are executed before each test data execution, allowing you to:
- Generate random/fake data
- Execute database queries
- Encrypt/decrypt values
- Get timestamps
- Run custom functions
- Store results in variables

---

## 🎯 Basic Syntax

```json
{
  "preProcess": [
    {
      "var": "variableName",
      "function": "functionName",
      "args": ["arg1", "arg2"]
    }
  ]
}
```

---

## 📚 Available Functions

### 1. Faker Functions

Generate realistic fake data using Faker.js.

#### faker.email
```json
{
  "preProcess": [
    {
      "var": "userEmail",
      "function": "faker.email"
    }
  ]
}
```
**Output:** `john.doe@example.com`

#### faker.uuid
```json
{
  "preProcess": [
    {
      "var": "uniqueId",
      "function": "faker.uuid"
    }
  ]
}
```
**Output:** `550e8400-e29b-41d4-a716-446655440000`

#### faker.username
```json
{
  "preProcess": [
    {
      "var": "userName",
      "function": "faker.username"
    }
  ]
}
```
**Output:** `john_doe123`

#### faker.name
```json
{
  "preProcess": [
    {
      "var": "fullName",
      "function": "faker.name"
    }
  ]
}
```
**Output:** `John Doe`

#### faker.phone
```json
{
  "preProcess": [
    {
      "var": "phoneNumber",
      "function": "faker.phone"
    }
  ]
}
```
**Output:** `+1-555-123-4567`

#### faker.address
```json
{
  "preProcess": [
    {
      "var": "streetAddress",
      "function": "faker.address"
    }
  ]
}
```
**Output:** `123 Main Street`

#### faker.city
```json
{
  "preProcess": [
    {
      "var": "cityName",
      "function": "faker.city"
    }
  ]
}
```
**Output:** `New York`

#### faker.password
```json
{
  "preProcess": [
    {
      "var": "randomPassword",
      "function": "faker.password"
    }
  ]
}
```
**Output:** `aB3$xY9!mN2`

#### faker.company
```json
{
  "preProcess": [
    {
      "var": "companyName",
      "function": "faker.company"
    }
  ]
}
```
**Output:** `Acme Corporation`

---

### 2. Date/Time Functions

#### date.now
```json
{
  "preProcess": [
    {
      "var": "timestamp",
      "function": "date.now"
    }
  ]
}
```
**Output:** `1705334400000` (Unix timestamp in milliseconds)

**Usage Example:**
```json
{
  "preProcess": [
    {
      "var": "timestamp",
      "function": "date.now"
    }
  ],
  "body": {
    "createdAt": "{{timestamp}}",
    "name": "Test User"
  }
}
```

---

### 3. Encryption Functions

#### encrypt
Encrypts a string using AES-256-CTR encryption.

```json
{
  "preProcess": [
    {
      "var": "encryptedPassword",
      "function": "encrypt",
      "args": ["MySecretPassword123"]
    }
  ]
}
```

**With Variable Injection:**
```json
{
  "preProcess": [
    {
      "var": "plainPassword",
      "function": "faker.password"
    },
    {
      "var": "encryptedPassword",
      "function": "encrypt",
      "args": ["{{plainPassword}}"]
    }
  ]
}
```

---

### 4. Database Query Functions

#### dbQuery
Execute SQL queries and store results.

**Basic Query:**
```json
{
  "preProcess": [
    {
      "function": "dbQuery",
      "args": ["SELECT id, name, email FROM users WHERE role = 'admin' LIMIT 1"],
      "db": "userDb",
      "mapTo": {
        "adminId": "id",
        "adminName": "name",
        "adminEmail": "email"
      }
    }
  ]
}
```

**Single Value:**
```json
{
  "preProcess": [
    {
      "var": "userCount",
      "function": "dbQuery",
      "args": ["SELECT COUNT(*) as count FROM users"],
      "db": "userDb"
    }
  ]
}
```

**With Variable Injection:**
```json
{
  "preProcess": [
    {
      "function": "dbQuery",
      "args": ["SELECT * FROM users WHERE id = '{{userId}}'"],
      "db": "userDb",
      "mapTo": {
        "userName": "name",
        "userEmail": "email"
      }
    }
  ]
}
```

**Database Configuration:**
```env
# .env file
DB_USERDB_TYPE=mysql
DB_USERDB_HOST=localhost
DB_USERDB_PORT=3306
DB_USERDB_USER=root
DB_USERDB_PASSWORD=secret
DB_USERDB_NAME=testflow
```

---

### 5. Custom Functions

#### generateUser
Generates a user object with multiple fields.

```json
{
  "preProcess": [
    {
      "function": "generateUser",
      "mapTo": {
        "userName": "username",
        "userEmail": "email"
      }
    }
  ]
}
```

**Output Variables:**
- `userName`: Generated username
- `userEmail`: Generated email

---

### 6. getRandomData
Generate multiple random fields at once.

```json
{
  "preProcess": [
    {
      "function": "getRandomData",
      "args": ["name", "email", "phone", "address"],
      "mapTo": {
        "fullName": "name",
        "emailAddress": "email",
        "phoneNumber": "phone",
        "streetAddress": "address"
      }
    }
  ]
}
```

**Supported Fields:**
- `name` - Full name
- `email` - Email address
- `username` - Username
- `phone` - Phone number
- `address` - Street address
- `city` - City name
- `uuid` - UUID
- `password` - Random password
- `company` - Company name

---

## 🎨 Usage Examples

### Example 1: Create User with Random Data

```json
{
  "name": "Create Random User",
  "method": "POST",
  "endpoint": "/users",
  "preProcess": [
    {
      "var": "randomName",
      "function": "faker.name"
    },
    {
      "var": "randomEmail",
      "function": "faker.email"
    },
    {
      "var": "randomPhone",
      "function": "faker.phone"
    },
    {
      "var": "timestamp",
      "function": "date.now"
    }
  ],
  "body": {
    "name": "{{randomName}}",
    "email": "{{randomEmail}}",
    "phone": "{{randomPhone}}",
    "createdAt": "{{timestamp}}"
  },
  "store": {
    "userId": "$.id"
  }
}
```

### Example 2: Database-Driven Test

```json
{
  "name": "Update User from Database",
  "method": "PUT",
  "endpoint": "/users/{{dbUserId}}",
  "preProcess": [
    {
      "function": "dbQuery",
      "args": ["SELECT id, name, email FROM users WHERE status = 'active' LIMIT 1"],
      "db": "userDb",
      "mapTo": {
        "dbUserId": "id",
        "dbUserName": "name",
        "dbUserEmail": "email"
      }
    }
  ],
  "body": {
    "name": "{{dbUserName}} Updated",
    "email": "{{dbUserEmail}}"
  }
}
```

### Example 3: Encrypted Password

```json
{
  "name": "Create User with Encrypted Password",
  "method": "POST",
  "endpoint": "/users",
  "preProcess": [
    {
      "var": "randomEmail",
      "function": "faker.email"
    },
    {
      "var": "plainPassword",
      "function": "faker.password"
    },
    {
      "var": "encryptedPassword",
      "function": "encrypt",
      "args": ["{{plainPassword}}"]
    }
  ],
  "body": {
    "email": "{{randomEmail}}",
    "password": "{{encryptedPassword}}"
  }
}
```

### Example 4: Multiple PreProcess Steps

```json
{
  "name": "Complex User Creation",
  "method": "POST",
  "endpoint": "/users",
  "preProcess": [
    {
      "var": "uniqueId",
      "function": "faker.uuid"
    },
    {
      "var": "userName",
      "function": "faker.username"
    },
    {
      "var": "userEmail",
      "function": "faker.email"
    },
    {
      "var": "timestamp",
      "function": "date.now"
    },
    {
      "function": "dbQuery",
      "args": ["SELECT COUNT(*) as count FROM users"],
      "db": "userDb",
      "mapTo": {
        "userCount": "count"
      }
    }
  ],
  "body": {
    "id": "{{uniqueId}}",
    "username": "{{userName}}",
    "email": "{{userEmail}}",
    "createdAt": "{{timestamp}}",
    "sequenceNumber": "{{userCount}}"
  }
}
```

### Example 5: Conditional Data Generation

```json
{
  "testData": [
    {
      "name": "Create Admin User",
      "method": "POST",
      "endpoint": "/users",
      "preProcess": [
        {
          "var": "adminEmail",
          "function": "faker.email"
        },
        {
          "function": "dbQuery",
          "args": ["SELECT role_id FROM roles WHERE name = 'admin'"],
          "db": "userDb",
          "mapTo": {
            "adminRoleId": "role_id"
          }
        }
      ],
      "body": {
        "email": "{{adminEmail}}",
        "roleId": "{{adminRoleId}}",
        "permissions": ["read", "write", "delete"]
      }
    }
  ]
}
```

---

## 🔄 Variable Injection in PreProcess

PreProcess functions support variable injection in arguments:

```json
{
  "testData": [
    {
      "name": "Step 1: Get User ID",
      "method": "GET",
      "endpoint": "/users/search?name=John",
      "store": {
        "foundUserId": "$.id"
      }
    },
    {
      "name": "Step 2: Query User Details",
      "method": "GET",
      "endpoint": "/users/{{foundUserId}}",
      "preProcess": [
        {
          "function": "dbQuery",
          "args": ["SELECT * FROM user_preferences WHERE user_id = '{{foundUserId}}'"],
          "db": "userDb",
          "mapTo": {
            "userTheme": "theme",
            "userLanguage": "language"
          }
        }
      ]
    }
  ]
}
```

---

## 🎯 MapTo vs Var

### Using `var` (Single Value)

```json
{
  "preProcess": [
    {
      "var": "timestamp",
      "function": "date.now"
    }
  ]
}
```
**Result:** `timestamp` = `1705334400000`

### Using `mapTo` (Multiple Values)

```json
{
  "preProcess": [
    {
      "function": "generateUser",
      "mapTo": {
        "userName": "username",
        "userEmail": "email"
      }
    }
  ]
}
```
**Result:**
- `userName` = `john_doe`
- `userEmail` = `john@example.com`

### Auto-Mapping (No var or mapTo)

```json
{
  "preProcess": [
    {
      "function": "generateUser"
    }
  ]
}
```
**Result:** All returned keys become variables
- `username` = `john_doe`
- `email` = `john@example.com`

---

## 🔌 Creating Custom PreProcess Functions

### Add to preProcessor.ts

```typescript
// src/preProcessor.ts

case 'custom.myFunction':
    const [arg1, arg2] = injectedArgs;
    value = await myCustomFunction(arg1, arg2);
    break;
```

### Example Custom Function

```typescript
async function myCustomFunction(param1: string, param2: string) {
    // Your custom logic
    return {
        result1: `Processed ${param1}`,
        result2: `Processed ${param2}`
    };
}
```

### Usage

```json
{
  "preProcess": [
    {
      "function": "custom.myFunction",
      "args": ["value1", "value2"],
      "mapTo": {
        "output1": "result1",
        "output2": "result2"
      }
    }
  ]
}
```

---

## 💡 Best Practices

### 1. Use Descriptive Variable Names

```json
// ❌ Bad
{
  "var": "v1",
  "function": "faker.email"
}

// ✅ Good
{
  "var": "userEmail",
  "function": "faker.email"
}
```

### 2. Chain PreProcess Steps

```json
{
  "preProcess": [
    {
      "var": "plainPassword",
      "function": "faker.password"
    },
    {
      "var": "encryptedPassword",
      "function": "encrypt",
      "args": ["{{plainPassword}}"]
    }
  ]
}
```

### 3. Use Database Queries for Test Data

```json
{
  "preProcess": [
    {
      "function": "dbQuery",
      "args": ["SELECT * FROM test_data WHERE type = 'valid' LIMIT 1"],
      "db": "testDb",
      "mapTo": {
        "testUserId": "user_id",
        "testUserName": "name"
      }
    }
  ]
}
```

### 4. Generate Unique Identifiers

```json
{
  "preProcess": [
    {
      "var": "uniqueEmail",
      "function": "faker.email"
    },
    {
      "var": "timestamp",
      "function": "date.now"
    }
  ],
  "body": {
    "email": "test_{{timestamp}}_{{uniqueEmail}}"
  }
}
```

### 5. Reuse Variables Across Test Data

```json
{
  "testData": [
    {
      "name": "Create User",
      "preProcess": [
        {
          "var": "userEmail",
          "function": "faker.email"
        }
      ],
      "body": {
        "email": "{{userEmail}}"
      },
      "store": {
        "userId": "$.id"
      }
    },
    {
      "name": "Verify User",
      "endpoint": "/users/{{userId}}",
      "assertions": [
        {
          "type": "equals",
          "jsonPath": "$.email",
          "expected": "{{userEmail}}"
        }
      ]
    }
  ]
}
```

---

## 🐛 Troubleshooting

### Issue 1: Variable Not Found

**Problem:** PreProcess variable not available in request

**Solution:** Check variable name spelling and ensure preProcess runs before request

```json
{
  "preProcess": [
    {
      "var": "userEmail",  // ← Check spelling
      "function": "faker.email"
    }
  ],
  "body": {
    "email": "{{userEmail}}"  // ← Must match exactly
  }
}
```

### Issue 2: Database Query Fails

**Problem:** dbQuery returns no results

**Solution:** Verify database configuration and query

```env
# Check .env file
DB_USERDB_TYPE=mysql
DB_USERDB_HOST=localhost
DB_USERDB_PORT=3306
DB_USERDB_USER=root
DB_USERDB_PASSWORD=secret
DB_USERDB_NAME=testflow
```

### Issue 3: MapTo Not Working

**Problem:** Variables not created from mapTo

**Solution:** Ensure function returns object with expected keys

```json
{
  "function": "generateUser",
  "mapTo": {
    "userName": "username",  // ← Must match returned key
    "userEmail": "email"     // ← Must match returned key
  }
}
```

---

## 📚 Related Documentation

- [Variable Store](./variable-store.md) - Store and inject variables
- [Database Integration](./database-integration.md) - Database setup
- [API Testing Examples](../examples/api-testing.md) - Real-world examples
- [Custom Steps](./custom-steps.md) - Create custom functions

---

**Generate dynamic test data with PreProcess functions! 🔧**
