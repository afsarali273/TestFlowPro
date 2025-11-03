# 🎭 UI Testing Examples

Comprehensive examples for browser automation and UI testing with TestFlow Pro using Playwright.

---

## 📋 Table of Contents

1. [Basic UI Tests](#basic-ui-tests)
2. [Locator Strategies](#locator-strategies)
3. [Form Interactions](#form-interactions)
4. [Navigation & Waits](#navigation--waits)
5. [Assertions](#assertions)
6. [Variable Storage](#variable-storage)
7. [Custom Steps](#custom-steps)
8. [Advanced Scenarios](#advanced-scenarios)

---

## 🎯 Basic UI Tests

### Simple Navigation Test

```json
{
  "id": "basic-navigation",
  "suiteName": "Basic Navigation Test",
  "applicationName": "Sample Website",
  "type": "UI",
  "baseUrl": "",
  "testCases": [
    {
      "name": "Navigate to Homepage",
      "type": "UI",
      "testSteps": [
        {
          "id": "step-1",
          "keyword": "goto",
          "value": "https://example.com"
        },
        {
          "id": "step-2",
          "keyword": "assertTitle",
          "value": "Example Domain"
        },
        {
          "id": "step-3",
          "keyword": "assertVisible",
          "locator": {
            "strategy": "css",
            "value": "h1"
          }
        }
      ]
    }
  ]
}
```

### Click and Type Test

```json
{
  "testCases": [
    {
      "name": "Search Functionality",
      "type": "UI",
      "testSteps": [
        {
          "id": "step-1",
          "keyword": "goto",
          "value": "https://www.google.com"
        },
        {
          "id": "step-2",
          "keyword": "type",
          "locator": {
            "strategy": "css",
            "value": "input[name='q']"
          },
          "value": "TestFlow Pro"
        },
        {
          "id": "step-3",
          "keyword": "press",
          "value": "Enter"
        },
        {
          "id": "step-4",
          "keyword": "waitForSelector",
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

---

## 🎯 Locator Strategies

### 1. Role-Based Locators (Recommended)

```json
{
  "testSteps": [
    {
      "keyword": "click",
      "locator": {
        "strategy": "role",
        "value": "button",
        "options": {
          "name": "Submit"
        }
      }
    },
    {
      "keyword": "click",
      "locator": {
        "strategy": "role",
        "value": "link",
        "options": {
          "name": "Learn More"
        }
      }
    },
    {
      "keyword": "type",
      "locator": {
        "strategy": "role",
        "value": "textbox",
        "options": {
          "name": "Username"
        }
      },
      "value": "john.doe"
    }
  ]
}
```

### 2. Label-Based Locators

```json
{
  "testSteps": [
    {
      "keyword": "type",
      "locator": {
        "strategy": "label",
        "value": "Email Address"
      },
      "value": "john@example.com"
    },
    {
      "keyword": "type",
      "locator": {
        "strategy": "label",
        "value": "Password"
      },
      "value": "secret123"
    }
  ]
}
```

### 3. Text-Based Locators

```json
{
  "testSteps": [
    {
      "keyword": "click",
      "locator": {
        "strategy": "text",
        "value": "Sign In"
      }
    },
    {
      "keyword": "assertVisible",
      "locator": {
        "strategy": "text",
        "value": "Welcome back!"
      }
    }
  ]
}
```

### 4. Placeholder Locators

```json
{
  "testSteps": [
    {
      "keyword": "type",
      "locator": {
        "strategy": "placeholder",
        "value": "Enter your email"
      },
      "value": "user@example.com"
    }
  ]
}
```

### 5. Test ID Locators

```json
{
  "testSteps": [
    {
      "keyword": "click",
      "locator": {
        "strategy": "testId",
        "value": "submit-button"
      }
    },
    {
      "keyword": "assertVisible",
      "locator": {
        "strategy": "testId",
        "value": "success-message"
      }
    }
  ]
}
```

### 6. CSS Selectors

```json
{
  "testSteps": [
    {
      "keyword": "click",
      "locator": {
        "strategy": "css",
        "value": "#submit-btn"
      }
    },
    {
      "keyword": "type",
      "locator": {
        "strategy": "css",
        "value": "input[type='email']"
      },
      "value": "test@example.com"
    }
  ]
}
```

### 7. XPath Selectors

```json
{
  "testSteps": [
    {
      "keyword": "click",
      "locator": {
        "strategy": "xpath",
        "value": "//button[contains(text(), 'Submit')]"
      }
    }
  ]
}
```

---

## 📝 Form Interactions

### Complete Login Form

```json
{
  "testCases": [
    {
      "name": "User Login",
      "type": "UI",
      "testSteps": [
        {
          "id": "step-1",
          "keyword": "goto",
          "value": "https://example.com/login"
        },
        {
          "id": "step-2",
          "keyword": "type",
          "locator": {
            "strategy": "label",
            "value": "Username"
          },
          "value": "testuser"
        },
        {
          "id": "step-3",
          "keyword": "type",
          "locator": {
            "strategy": "label",
            "value": "Password"
          },
          "value": "password123"
        },
        {
          "id": "step-4",
          "keyword": "check",
          "locator": {
            "strategy": "label",
            "value": "Remember me"
          }
        },
        {
          "id": "step-5",
          "keyword": "click",
          "locator": {
            "strategy": "role",
            "value": "button",
            "options": {
              "name": "Sign In"
            }
          }
        },
        {
          "id": "step-6",
          "keyword": "assertUrl",
          "value": "https://example.com/dashboard"
        }
      ]
    }
  ]
}
```

### Dropdown Selection

```json
{
  "testSteps": [
    {
      "keyword": "selectOption",
      "locator": {
        "strategy": "label",
        "value": "Country"
      },
      "value": "United States"
    },
    {
      "keyword": "selectOption",
      "locator": {
        "strategy": "css",
        "value": "#state-select"
      },
      "value": "California"
    }
  ]
}
```

### Checkbox and Radio Buttons

```json
{
  "testSteps": [
    {
      "keyword": "check",
      "locator": {
        "strategy": "label",
        "value": "I agree to terms"
      }
    },
    {
      "keyword": "uncheck",
      "locator": {
        "strategy": "label",
        "value": "Subscribe to newsletter"
      }
    },
    {
      "keyword": "click",
      "locator": {
        "strategy": "role",
        "value": "radio",
        "options": {
          "name": "Male"
        }
      }
    }
  ]
}
```

### File Upload

```json
{
  "testSteps": [
    {
      "keyword": "uploadFile",
      "locator": {
        "strategy": "css",
        "value": "input[type='file']"
      },
      "value": "./files/document.pdf"
    }
  ]
}
```

---

## 🚦 Navigation & Waits

### Navigation Actions

```json
{
  "testSteps": [
    {
      "keyword": "goto",
      "value": "https://example.com"
    },
    {
      "keyword": "click",
      "locator": {
        "strategy": "text",
        "value": "About Us"
      }
    },
    {
      "keyword": "goBack"
    },
    {
      "keyword": "goForward"
    },
    {
      "keyword": "reload"
    }
  ]
}
```

### Wait Strategies

```json
{
  "testSteps": [
    {
      "keyword": "waitForSelector",
      "locator": {
        "strategy": "css",
        "value": ".loading-spinner"
      }
    },
    {
      "keyword": "waitForTimeout",
      "value": "2000"
    },
    {
      "keyword": "waitForElement",
      "locator": {
        "strategy": "testId",
        "value": "data-loaded"
      }
    },
    {
      "keyword": "waitForText",
      "locator": {
        "strategy": "css",
        "value": "#status"
      },
      "value": "Complete"
    }
  ]
}
```

---

## ✅ Assertions

### Visibility Assertions

```json
{
  "testSteps": [
    {
      "keyword": "assertVisible",
      "locator": {
        "strategy": "testId",
        "value": "welcome-message"
      }
    },
    {
      "keyword": "assertHidden",
      "locator": {
        "strategy": "css",
        "value": ".error-message"
      }
    }
  ]
}
```

### Text Assertions

```json
{
  "testSteps": [
    {
      "keyword": "assertText",
      "locator": {
        "strategy": "css",
        "value": "h1"
      },
      "value": "Welcome"
    },
    {
      "keyword": "assertContainsText",
      "locator": {
        "strategy": "css",
        "value": ".message"
      },
      "value": "success"
    },
    {
      "keyword": "assertHaveText",
      "locator": {
        "strategy": "role",
        "value": "heading"
      },
      "value": "Dashboard"
    }
  ]
}
```

### State Assertions

```json
{
  "testSteps": [
    {
      "keyword": "assertEnabled",
      "locator": {
        "strategy": "role",
        "value": "button",
        "options": {
          "name": "Submit"
        }
      }
    },
    {
      "keyword": "assertDisabled",
      "locator": {
        "strategy": "css",
        "value": "#save-button"
      }
    },
    {
      "keyword": "assertChecked",
      "locator": {
        "strategy": "label",
        "value": "Remember me"
      }
    }
  ]
}
```

### Count Assertions

```json
{
  "testSteps": [
    {
      "keyword": "assertCount",
      "locator": {
        "strategy": "css",
        "value": ".product-card"
      },
      "value": "10"
    },
    {
      "keyword": "assertHaveCount",
      "locator": {
        "strategy": "css",
        "value": "li"
      },
      "value": "5"
    }
  ]
}
```

### URL and Title Assertions

```json
{
  "testSteps": [
    {
      "keyword": "assertUrl",
      "value": "https://example.com/dashboard"
    },
    {
      "keyword": "assertTitle",
      "value": "Dashboard - Example App"
    }
  ]
}
```

---

## 💾 Variable Storage

### Store Text from Elements

```json
{
  "testSteps": [
    {
      "keyword": "getText",
      "locator": {
        "strategy": "css",
        "value": "#username"
      },
      "store": {
        "currentUser": "$text"
      }
    },
    {
      "keyword": "type",
      "locator": {
        "strategy": "css",
        "value": "#search"
      },
      "value": "{{currentUser}}"
    }
  ]
}
```

### Store Attributes

```json
{
  "testSteps": [
    {
      "keyword": "getAttribute",
      "locator": {
        "strategy": "css",
        "value": "#user-id"
      },
      "value": "data-id",
      "store": {
        "userId": "$attribute.data-id"
      }
    }
  ]
}
```

### Store URL and Title

```json
{
  "testSteps": [
    {
      "keyword": "getUrl",
      "store": {
        "currentUrl": "$url"
      }
    },
    {
      "keyword": "getTitle",
      "store": {
        "pageTitle": "$title"
      }
    }
  ]
}
```

### Local vs Global Storage

```json
{
  "testSteps": [
    {
      "keyword": "getText",
      "locator": {
        "strategy": "css",
        "value": "#temp-value"
      },
      "localStore": {
        "tempValue": "$text"
      }
    },
    {
      "keyword": "getText",
      "locator": {
        "strategy": "css",
        "value": "#user-id"
      },
      "store": {
        "userId": "$text"
      }
    }
  ]
}
```

---

## 🎨 Custom Steps

### Custom Page Object

```json
{
  "testSteps": [
    {
      "keyword": "customStep",
      "customFunction": {
        "function": "loginUser",
        "args": ["testuser", "password123"]
      }
    },
    {
      "keyword": "customStep",
      "customFunction": {
        "function": "navigateToSection",
        "args": ["Products"]
      }
    }
  ]
}
```

### Custom Code Execution

```json
{
  "testSteps": [
    {
      "keyword": "customCode",
      "customCode": "await page.evaluate(() => { window.scrollTo(0, document.body.scrollHeight); });"
    },
    {
      "keyword": "customCode",
      "customCode": "await page.waitForTimeout(1000);"
    }
  ]
}
```

---

## 🎓 Advanced Scenarios

### E-commerce Checkout Flow

```json
{
  "testCases": [
    {
      "name": "Complete Checkout Process",
      "type": "UI",
      "testSteps": [
        {
          "keyword": "goto",
          "value": "https://shop.example.com"
        },
        {
          "keyword": "type",
          "locator": {
            "strategy": "placeholder",
            "value": "Search products"
          },
          "value": "laptop"
        },
        {
          "keyword": "press",
          "value": "Enter"
        },
        {
          "keyword": "waitForSelector",
          "locator": {
            "strategy": "css",
            "value": ".product-card"
          }
        },
        {
          "keyword": "click",
          "locator": {
            "strategy": "css",
            "value": ".product-card:first-child .add-to-cart"
          }
        },
        {
          "keyword": "waitForText",
          "locator": {
            "strategy": "css",
            "value": ".cart-count"
          },
          "value": "1"
        },
        {
          "keyword": "click",
          "locator": {
            "strategy": "testId",
            "value": "cart-icon"
          }
        },
        {
          "keyword": "click",
          "locator": {
            "strategy": "role",
            "value": "button",
            "options": {
              "name": "Proceed to Checkout"
            }
          }
        },
        {
          "keyword": "type",
          "locator": {
            "strategy": "label",
            "value": "Full Name"
          },
          "value": "John Doe"
        },
        {
          "keyword": "type",
          "locator": {
            "strategy": "label",
            "value": "Email"
          },
          "value": "john@example.com"
        },
        {
          "keyword": "type",
          "locator": {
            "strategy": "label",
            "value": "Address"
          },
          "value": "123 Main St"
        },
        {
          "keyword": "selectOption",
          "locator": {
            "strategy": "label",
            "value": "Country"
          },
          "value": "United States"
        },
        {
          "keyword": "click",
          "locator": {
            "strategy": "role",
            "value": "button",
            "options": {
              "name": "Place Order"
            }
          }
        },
        {
          "keyword": "waitForSelector",
          "locator": {
            "strategy": "testId",
            "value": "order-confirmation"
          }
        },
        {
          "keyword": "assertVisible",
          "locator": {
            "strategy": "text",
            "value": "Order placed successfully"
          }
        },
        {
          "keyword": "getText",
          "locator": {
            "strategy": "testId",
            "value": "order-number"
          },
          "store": {
            "orderNumber": "$text"
          }
        }
      ]
    }
  ]
}
```

### Multi-Step Form with Validation

```json
{
  "testCases": [
    {
      "name": "Multi-Step Registration",
      "type": "UI",
      "testSteps": [
        {
          "keyword": "goto",
          "value": "https://example.com/register"
        },
        {
          "keyword": "type",
          "locator": {
            "strategy": "label",
            "value": "Email"
          },
          "value": "test@example.com"
        },
        {
          "keyword": "type",
          "locator": {
            "strategy": "label",
            "value": "Password"
          },
          "value": "SecurePass123!"
        },
        {
          "keyword": "click",
          "locator": {
            "strategy": "role",
            "value": "button",
            "options": {
              "name": "Next"
            }
          }
        },
        {
          "keyword": "waitForSelector",
          "locator": {
            "strategy": "testId",
            "value": "step-2"
          }
        },
        {
          "keyword": "type",
          "locator": {
            "strategy": "label",
            "value": "First Name"
          },
          "value": "John"
        },
        {
          "keyword": "type",
          "locator": {
            "strategy": "label",
            "value": "Last Name"
          },
          "value": "Doe"
        },
        {
          "keyword": "type",
          "locator": {
            "strategy": "label",
            "value": "Phone"
          },
          "value": "+1234567890"
        },
        {
          "keyword": "click",
          "locator": {
            "strategy": "role",
            "value": "button",
            "options": {
              "name": "Next"
            }
          }
        },
        {
          "keyword": "waitForSelector",
          "locator": {
            "strategy": "testId",
            "value": "step-3"
          }
        },
        {
          "keyword": "check",
          "locator": {
            "strategy": "label",
            "value": "I agree to terms and conditions"
          }
        },
        {
          "keyword": "click",
          "locator": {
            "strategy": "role",
            "value": "button",
            "options": {
              "name": "Complete Registration"
            }
          }
        },
        {
          "keyword": "assertVisible",
          "locator": {
            "strategy": "text",
            "value": "Registration successful"
          }
        }
      ]
    }
  ]
}
```

### Table Interactions

```json
{
  "testSteps": [
    {
      "keyword": "tableGetRowCount",
      "locator": {
        "strategy": "css",
        "value": "#users-table"
      },
      "store": {
        "rowCount": "$count"
      }
    },
    {
      "keyword": "tableClick",
      "locator": {
        "strategy": "css",
        "value": "#users-table"
      },
      "tableOperation": {
        "row": 1,
        "column": "Actions"
      }
    },
    {
      "keyword": "tableGetText",
      "locator": {
        "strategy": "css",
        "value": "#users-table"
      },
      "tableOperation": {
        "row": 0,
        "column": "Name"
      },
      "store": {
        "userName": "$text"
      }
    }
  ]
}
```

---

## 💡 Best Practices

### 1. Use Semantic Locators
```json
// ✅ Good - Accessible and maintainable
{
  "locator": {
    "strategy": "role",
    "value": "button",
    "options": { "name": "Submit" }
  }
}

// ❌ Bad - Fragile
{
  "locator": {
    "strategy": "css",
    "value": "body > div:nth-child(3) > button"
  }
}
```

### 2. Add Explicit Waits
```json
{
  "testSteps": [
    {
      "keyword": "click",
      "locator": { "strategy": "text", "value": "Load Data" }
    },
    {
      "keyword": "waitForSelector",
      "locator": { "strategy": "css", "value": ".data-loaded" }
    }
  ]
}
```

### 3. Store Important Values
```json
{
  "keyword": "getText",
  "locator": { "strategy": "testId", "value": "order-id" },
  "store": { "orderId": "$text" }
}
```

### 4. Use Test IDs
```html
<!-- In your application -->
<button data-testid="submit-button">Submit</button>
```

```json
{
  "locator": {
    "strategy": "testId",
    "value": "submit-button"
  }
}
```

### 5. Handle Dynamic Content
```json
{
  "testSteps": [
    {
      "keyword": "waitForElement",
      "locator": { "strategy": "css", "value": ".dynamic-content" }
    },
    {
      "keyword": "assertVisible",
      "locator": { "strategy": "css", "value": ".dynamic-content" }
    }
  ]
}
```

---

## 📚 Related Documentation

- [Variable Store](../features/variable-store.md)
- [Test Suite Editor](../ui-guide/test-suite-editor.md)
- [Custom Steps](../features/custom-steps.md)
- [CLI Execution](../cli-execution/command-line.md)

---

**Build robust UI tests with Playwright! 🎭**
