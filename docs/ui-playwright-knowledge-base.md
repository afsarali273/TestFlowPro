# UI Testing Knowledge Base - Playwright to TestFlowPro JSON

This knowledge base is specifically for **UI testing** using Playwright. It provides conversion patterns from Playwright code to TestFlowPro JSON format.

## Locator Strategies (UI Only)

### Role-based Locators
```javascript
// Playwright
await page.getByRole('button').click();
```
```json
// TestFlowPro JSON
{
  "keyword": "click",
  "locator": {
    "strategy": "role",
    "value": "button"
  }
}
```

### Text-based Locators
```javascript
// Playwright
await page.getByText('Sign up').click();
```
```json
// TestFlowPro JSON
{
  "keyword": "click",
  "locator": {
    "strategy": "text",
    "value": "Sign up"
  }
}
```

### Label-based Locators
```javascript
// Playwright
await page.getByLabel('Email').fill('test@example.com');
```
```json
// TestFlowPro JSON
{
  "keyword": "fill",
  "locator": {
    "strategy": "label",
    "value": "Email"
  },
  "value": "test@example.com"
}
```

## UI Keywords Only

- `click`, `fill`, `check`, `uncheck`, `select`, `hover`, `press`
- `goto`, `waitForTimeout`, `screenshot`
- `assertVisible`, `assertHidden`, `assertHaveText`, `assertHaveCount`

## Filter Patterns (UI Only)

### hasText Filter
```javascript
// Playwright
await page.getByRole('button').filter({ hasText: 'Save' }).click();
```
```json
// TestFlowPro JSON
{
  "keyword": "click",
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

### has Filter (Nested Locator)
```javascript
// Playwright
await page.getByRole('listitem').filter({ has: page.getByRole('button', { name: 'Delete' }) }).click();
```
```json
// TestFlowPro JSON
{
  "keyword": "click",
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

## Conversion Rules (UI Only)

1. **Locator Strategy Mapping**:
   - `getByRole` → `"strategy": "role"`
   - `getByText` → `"strategy": "text"`
   - `getByLabel` → `"strategy": "label"`
   - `getByTestId` → `"strategy": "testId"`
   - `getByPlaceholder` → `"strategy": "placeholder"`
   - `locator` → `"strategy": "css"` or `"strategy": "xpath"`

2. **Action Mapping**:
   - `.click()` → `"keyword": "click"`
   - `.fill(value)` → `"keyword": "fill", "value": value`
   - `.check()` → `"keyword": "check"`
   - `.selectOption(value)` → `"keyword": "select", "value": value`

3. **Assertion Mapping**:
   - `expect().toBeVisible()` → `"keyword": "assertVisible"`
   - `expect().toHaveText(text)` → `"keyword": "assertHaveText", "value": text`
   - `expect().toHaveCount(count)` → `"keyword": "assertHaveCount", "value": count`

## Complex UI Scenarios

### Multi-step Form
```javascript
// Playwright
await page.goto('https://example.com/form');
await page.getByLabel('First Name').fill('John');
await page.getByRole('button', { name: 'Submit' }).click();
```

```json
// TestFlowPro JSON
[
  {
    "keyword": "goto",
    "value": "https://example.com/form"
  },
  {
    "keyword": "fill",
    "locator": {
      "strategy": "label",
      "value": "First Name"
    },
    "value": "John"
  },
  {
    "keyword": "click",
    "locator": {
      "strategy": "role",
      "value": "button",
      "options": {
        "name": "Submit"
      }
    }
  }
]
```

## Important Notes

- This knowledge base is **UI testing specific** - do not apply these patterns to API testing
- All examples use Playwright locators and UI interactions
- Filters and options are specific to DOM element selection
- Keywords are focused on browser automation actions