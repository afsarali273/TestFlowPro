# 🤖 MCP (Model Context Protocol) Integration

TestFlow Pro integrates with MCP to enable AI-powered browser automation using natural language instructions.

## 🚀 Quick Setup

```bash
# Install Playwright MCP server globally
npm install -g @playwright/mcp

# Test MCP configuration
npm run test:mcp

# Install Playwright browsers (if needed)
npx playwright install
```

## 🔧 How It Works

1. **Natural Language Input**: Write test steps in plain English
2. **AI Parsing**: AI converts instructions to MCP tool calls
3. **Browser Automation**: Playwright executes actions via MCP
4. **Test Generation**: Actions converted to TestFlow Pro JSON format

## 📝 Example Usage

### Input (Natural Language):
```
Navigate to https://example.com/login
Click on email field
Type "user@example.com"
Click on password field
Type "password123"
Click login button
Wait for dashboard to appear
Take screenshot
```

### Output (TestFlow Pro JSON):
```json
{
  "suiteName": "MCP Generated UI Test Suite",
  "type": "UI",
  "testCases": [{
    "name": "MCP Recorded Test Case",
    "testData": [{
      "name": "Browser Automation Recording",
      "uiSteps": [
        { "keyword": "goto", "target": "https://example.com/login" },
        { "keyword": "click", "locator": "input[type=\"email\"]" },
        { "keyword": "type", "locator": "input[type=\"email\"]", "target": "user@example.com" },
        { "keyword": "click", "locator": "input[type=\"password\"]" },
        { "keyword": "type", "locator": "input[type=\"password\"]", "target": "password123" },
        { "keyword": "click", "locator": "button:has-text(\"Login\")" },
        { "keyword": "waitFor", "locator": "[data-testid*=\"dashboard\"]" },
        { "keyword": "screenshot", "target": "screenshot.png" }
      ]
    }]
  }]
}
```

## 🛠 Available MCP Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `playwright/goto` | Navigate to URL | `url` |
| `playwright/click` | Click element | `selector` |
| `playwright/fill` | Fill input field | `selector`, `value` |
| `playwright/press` | Press keyboard key | `key` |
| `playwright/waitForSelector` | Wait for element | `selector` |
| `playwright/screenshot` | Take screenshot | `path` (optional) |
| `playwright/getText` | Get text content | `selector` |
| `playwright/hover` | Hover over element | `selector` |

## 🎯 Smart Selector Mapping

The AI automatically maps natural language to appropriate selectors:

- **Email fields**: `input[type="email"], input[name*="email"]`
- **Password fields**: `input[type="password"], input[name*="password"]`
- **Login buttons**: `button:has-text("Login"), button:has-text("Sign in")`
- **Search inputs**: `input[name*="search"], input[placeholder*="search"]`

## 🔍 Troubleshooting

### MCP Server Not Found
```bash
# Reinstall MCP server
npm uninstall -g @playwright/mcp
npm install -g @playwright/mcp
```

### Browser Not Opening
```bash
# Install browsers
npx playwright install

# Check headless mode in config
export PLAYWRIGHT_HEADLESS=false
```

### Tool Not Found Errors
```bash
# Verify MCP configuration
cat mcp.config.json

# Test MCP connection
npm run test:mcp
```

## 📊 Configuration Files

- **`mcp.config.json`**: MCP server and tool definitions
- **`test-mcp.js`**: MCP connection test script
- **Frontend MCP Route**: `/api/mcp-record`

## 🚦 Status Indicators

- 🟢 **Recording**: MCP automation in progress
- 🔵 **Processing**: Converting actions to test suite
- ✅ **Complete**: Test suite generated successfully
- ❌ **Error**: Check console for MCP connection issues

## 🔗 Integration Points

1. **AI Chat Component**: Natural language input interface
2. **MCP Route**: Backend MCP server communication
3. **Test Suite Generator**: Converts MCP actions to TestFlow format
4. **UI Runner**: Executes generated UI test suites

---

**Next Steps**: Try the MCP tab in the AI Chat interface and describe your test scenario in natural language!