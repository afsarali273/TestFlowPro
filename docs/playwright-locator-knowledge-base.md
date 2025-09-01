# Playwright Locator to JSON Conversion Knowledge Base

## JSON Schema Definition

```typescript
interface LocatorOptions {
    name?: string | RegExp
    exact?: boolean
    checked?: boolean
    expanded?: boolean
    pressed?: boolean
    selected?: boolean
    level?: number
    hasText?: string | RegExp
    hasNotText?: string | RegExp
}

interface FilterDefinition {
    type: "hasText" | "has" | "hasNot"
    value?: string // For hasText type
    locator?: LocatorDefinition // For has/hasNot types
}

interface LocatorDefinition {
    strategy: "role" | "label" | "text" | "placeholder" | "altText" | "title" | "testId" | "css" | "xpath"
    value: string
    options?: LocatorOptions
    filter?: FilterDefinition
}

interface TestStep {
    id: string
    keyword: TestStepKeyword
    locator?: LocatorDefinition
    value?: string
    options?: any
}
```

## Basic Locator Conversions

### Role-based Locators
```javascript
// Playwright Code
page.getByRole('button')
page.getByRole('link')
page.getByRole('textbox')

// JSON Conversion
{
  "locator": {
    "strategy": "role",
    "value": "button"
  }
}
```

### Text-based Locators
```javascript
// Playwright Code
page.getByText('Sign up')
page.getByLabel('Email')
page.getByPlaceholder('Enter email')

// JSON Conversion
{
  "locator": {
    "strategy": "text",
    "value": "Sign up"
  }
}
```

### Test ID Locators
```javascript
// Playwright Code
page.getByTestId('submit-button')

// JSON Conversion
{
  "locator": {
    "strategy": "testId",
    "value": "submit-button"
  }
}
```

### CSS/XPath Locators
```javascript
// Playwright Code
page.locator('.btn-primary')
page.locator('xpath=//button[@class="submit"]')

// JSON Conversion
{
  "locator": {
    "strategy": "css",
    "value": ".btn-primary"
  }
}
```

## Locator Options Conversions

### Name Option
```javascript
// Playwright Code
page.getByRole('button', { name: 'Subscribe' })
page.getByRole('button', { name: /submit/i })

// JSON Conversion
{
  "locator": {
    "strategy": "role",
    "value": "button",
    "options": {
      "name": "Subscribe"
    }
  }
}
```

### Exact Match Option
```javascript
// Playwright Code
page.getByText('Sign up', { exact: true })

// JSON Conversion
{
  "locator": {
    "strategy": "text",
    "value": "Sign up",
    "options": {
      "exact": true
    }
  }
}
```

### HasText Option
```javascript
// Playwright Code
page.getByRole('button', { hasText: 'Save' })

// JSON Conversion
{
  "locator": {
    "strategy": "role",
    "value": "button",
    "options": {
      "hasText": "Save"
    }
  }
}
```

### Multiple Options
```javascript
// Playwright Code
page.getByRole('button', { name: 'Submit', exact: true, hasText: 'Save' })

// JSON Conversion
{
  "locator": {
    "strategy": "role",
    "value": "button",
    "options": {
      "name": "Submit",
      "exact": true,
      "hasText": "Save"
    }
  }
}
```

## Filter Conversions

### HasText Filter
```javascript
// Playwright Code
page.getByRole('button').filter({ hasText: 'Save' })
page.locator('div').filter({ hasText: /product/i })

// JSON Conversion
{
  "locator": {
    "strategy": "role",
    "value": "button",
    "filter": {
      "type": "hasText",
      "value": "Save"
    }
  }
}
```

### Has Filter (Child Locator)
```javascript
// Playwright Code
page.getByRole('listitem').filter({ has: page.getByRole('button') })
page.getByRole('listitem').filter({ has: page.getByRole('button', { name: 'Delete' }) })

// JSON Conversion
{
  "locator": {
    "strategy": "role",
    "value": "listitem",
    "filter": {
      "type": "has",
      "locator": {
        "strategy": "role",
        "value": "button",
        "options": {
          "name": "Delete"
        }
      }
    }
  }
}
```

### HasNot Filter (Negative Child Locator)
```javascript
// Playwright Code
page.getByRole('button').filter({ hasNot: page.getByText('Disabled') })

// JSON Conversion
{
  "locator": {
    "strategy": "role",
    "value": "button",
    "filter": {
      "type": "hasNot",
      "locator": {
        "strategy": "text",
        "value": "Disabled"
      }
    }
  }
}
```

## Complex Nested Examples

### Complex Filter with Options
```javascript
// Playwright Code
page.getByRole('listitem').filter({ has: page.getByRole('button', { name: 'Say goodbye' }) })

// JSON Conversion
{
  "locator": {
    "strategy": "role",
    "value": "listitem",
    "filter": {
      "type": "has",
      "locator": {
        "strategy": "role",
        "value": "button",
        "options": {
          "name": "Say goodbye"
        }
      }
    }
  }
}
```

### Multiple Filters (Chained)
```javascript
// Playwright Code
page.getByRole('row').filter({ hasText: 'Product' }).filter({ has: page.getByRole('button', { name: 'Edit' }) })

// JSON Conversion (First filter only - chaining requires multiple steps)
{
  "locator": {
    "strategy": "role",
    "value": "row",
    "filter": {
      "type": "hasText",
      "value": "Product"
    }
  }
}
```

## Action Conversions

### Click Actions - CORRECT STRUCTURE
```javascript
// Playwright Code
await page.getByRole('button', { name: 'Submit' }).click()

// CORRECT JSON Conversion - options INSIDE locator
{
  "id": "step1",
  "keyword": "click",
  "locator": {
    "strategy": "role",
    "value": "button",
    "options": {
      "name": "Submit"
    }
  }
}

// WRONG - options outside locator
{
  "id": "step1",
  "keyword": "click",
  "locator": {
    "strategy": "role",
    "value": "button"
  },
  "options": {
    "name": "Submit"
  }
}
```

### Fill Actions
```javascript
// Playwright Code
await page.getByLabel('Email').fill('user@example.com')

// JSON Conversion
{
  "id": "step2",
  "keyword": "fill",
  "locator": {
    "strategy": "label",
    "value": "Email"
  },
  "value": "user@example.com"
}
```

### Assertion Actions
```javascript
// Playwright Code
await expect(page.getByText('Welcome')).toBeVisible()
await expect(page.getByRole('button')).toHaveText('Submit')

// JSON Conversion
{
  "id": "step3",
  "keyword": "assertVisible",
  "locator": {
    "strategy": "text",
    "value": "Welcome"
  }
}
```

## Conversion Patterns

### Pattern 1: Basic Locator
```
Input: page.getByRole('button')
Output: { "strategy": "role", "value": "button" }
```

### Pattern 2: Locator with Options
```
Input: page.getByRole('button', { name: 'Submit' })
Output: { "strategy": "role", "value": "button", "options": { "name": "Submit" } }
```

### Pattern 3: Locator with Filter
```
Input: page.getByRole('button').filter({ hasText: 'Save' })
Output: { "strategy": "role", "value": "button", "filter": { "type": "hasText", "value": "Save" } }
```

### Pattern 4: Complex Nested Filter
```
Input: page.getByRole('listitem').filter({ has: page.getByRole('button', { name: 'Delete' }) })
Output: { 
  "strategy": "role", 
  "value": "listitem", 
  "filter": { 
    "type": "has", 
    "locator": { 
      "strategy": "role", 
      "value": "button", 
      "options": { "name": "Delete" } 
    } 
  } 
}
```

## Regex Patterns for Conversion

### Extract Role Locator
```regex
page\.getByRole\('([^']+)'(?:,\s*\{([^}]+)\})?\)
```

### Extract Filter
```regex
\.filter\(\{\s*([^:]+):\s*([^}]+)\s*\}\)
```

### Extract Options
```regex
\{\s*([^:]+):\s*'([^']+)'\s*\}
```

## Common Codegen Patterns

### Simple Click
```javascript
await page.getByRole('button', { name: 'Sign up' }).click();
```
→ `{ "keyword": "click", "locator": { "strategy": "role", "value": "button", "options": { "name": "Sign up" } } }`

### Form Fill
```javascript
await page.getByLabel('Email').fill('test@example.com');
```
→ `{ "keyword": "fill", "locator": { "strategy": "label", "value": "Email" }, "value": "test@example.com" }`

### Complex Selection
```javascript
await page.getByRole('row').filter({ hasText: 'John' }).getByRole('button', { name: 'Edit' }).click();
```
→ Multiple steps with intermediate locators

This knowledge base provides comprehensive patterns for converting any Playwright codegen output to the appropriate JSON structure for TestFlowPro.