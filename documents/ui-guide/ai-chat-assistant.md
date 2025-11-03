# 🤖 AI Chat Assistant

Complete guide to the AI-powered test generation assistant in TestFlow Pro.

---

## 📋 Overview

The AI Chat Assistant is an intelligent test generation tool that helps you create comprehensive test suites using natural language, cURL commands, Swagger specifications, and UI descriptions.

![AI Chat Modal](../pic/ai-chat-modal.png)

---

## 🚀 Accessing the AI Assistant

### Floating Chat Icon

Located at the bottom-right corner of the dashboard:
- **Animated Icon**: Purple-blue gradient with sparkle effects
- **Notification Badge**: Shows "AI" indicator
- **Hover Tooltip**: "AI Test Generator"
- **Click**: Opens the AI Chat modal

---

## 🎯 Key Features

### 1. **Multiple AI Providers**

#### Ollama (Local AI)
- **Type**: Local AI instance
- **Pros**: Privacy, no API costs, offline capability
- **Setup**: Requires Ollama installation
- **Icon**: 🏠 Home icon

#### GitHub Copilot (Cloud AI)
- **Type**: Cloud AI service
- **Pros**: Advanced AI capabilities, no local setup
- **Authentication**: OAuth or Personal Access Token
- **Icon**: 🔗 Link icon
- **Status Indicator**: Green dot when authenticated

### 2. **Generation Tools**

#### 💬 AI Chat
- **Purpose**: Natural language test generation
- **Input**: Describe your API endpoints or UI flows
- **Output**: Complete test suites with assertions

#### 🔗 cURL Import
- **Purpose**: Convert cURL commands to test suites
- **Features**:
  - Test cURL before conversion
  - View API response
  - JSONPath filtering
  - Generate test suite

#### 📋 Swagger/OpenAPI
- **Purpose**: Import API specifications
- **Formats**: JSON, YAML
- **Features**:
  - File upload or paste
  - Comprehensive endpoint coverage
  - Positive and negative scenarios
  - Schema validation

#### 🎭 UI Steps
- **Purpose**: Generate UI automation tests
- **Input**: Describe UI interactions
- **Output**: Playwright test steps with selectors

#### 🎬 Record (Playwright Codegen)
- **Purpose**: Record browser interactions
- **Features**:
  - Visual element selection
  - Auto-generated selectors
  - Network request capture
  - Screenshot comparisons

---

## 🔐 GitHub Copilot Authentication

### OAuth Flow (Recommended)

1. **Click "OAuth Login"** button
2. **Device Code Display**: Shows unique code (e.g., `ABCD-1234`)
3. **Open GitHub**: Automatically opens authentication page
4. **Enter Code**: Input the displayed code on GitHub
5. **Authorize**: Grant permissions to TestFlow Pro
6. **Auto-Detection**: Status updates automatically when authenticated

### Manual Token Method

1. **Click "Manual Token"** button
2. **Generate Token**: Create Personal Access Token on GitHub
   - Go to: Settings → Developer settings → Personal access tokens
   - Scopes needed: `copilot`, `user:email`
3. **Enter Token**: Paste token in input field
4. **Save**: Token stored securely

### Re-Authentication

If authentication expires or needs refresh:
1. Click **Settings** icon in header
2. Select **Re-authenticate**
3. Follow OAuth flow again

---

## 💬 AI Chat Mode

### Starting a Conversation

**Example Prompts:**
```
"Create API tests for user login with email and password"

"Generate UI tests for e-commerce checkout flow"

"Test REST endpoints for CRUD operations on users"

"Create tests for authentication with JWT tokens"
```

### Quick Start Examples

Click on suggested prompts:
- "Create API tests for user login"
- "Generate UI tests for checkout flow"
- "Test REST endpoints with validation"

### Chat Features

- **Message History**: Scrollable conversation
- **Timestamps**: Each message timestamped
- **Loading Indicator**: Animated while AI generates
- **Auto-Scroll**: Automatically scrolls to latest message

---

## 🔗 cURL Import Mode

### Step 1: Paste cURL Command

```bash
curl -X POST https://api.example.com/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer token123" \
  -d '{"name":"John Doe","email":"john@example.com"}'
```

### Step 2: Test cURL (Optional)

- **Click "Test cURL"** button
- **View Response**:
  - Status code
  - Response time
  - Response body
  - Headers

### Step 3: JSONPath Filtering (Optional)

**Filter Response Data:**
```
$.data[0].id
$.users[*].name
$..email
```

**Features:**
- Real-time filtering
- Preview filtered results
- Use in assertions

### Step 4: Generate Test Suite

- **Click "Generate Test Suite"** button
- **AI Processing**: Converts cURL to test format
- **Output**: Complete test suite with:
  - Method and endpoint
  - Headers
  - Request body
  - Assertions
  - Variable storage

---

## 📋 Swagger/OpenAPI Import

### Upload File

1. **Click "Upload File"** button
2. **Select File**: Choose `.json`, `.yaml`, or `.yml`
3. **Auto-Load**: Content loaded automatically

### Paste Specification

**Paste JSON or YAML:**
```yaml
openapi: 3.0.0
info:
  title: User API
  version: 1.0.0
paths:
  /users:
    get:
      summary: Get all users
      responses:
        '200':
          description: Success
```

### Generate Test Suite

**Click "Generate Test Suite from Swagger"**

**Generated Components:**
- Test cases for each endpoint
- Request/response schemas
- Positive test scenarios
- Negative test scenarios (400, 401, 404, etc.)
- Parameter validation
- Authentication tests

### Tips

- ✅ Supports both JSON and YAML
- ✅ Generates comprehensive coverage
- ✅ Includes schema validation
- ✅ Creates multiple test scenarios

---

## 🎭 UI Steps Generation

### Describe UI Interactions

**Example Input:**
```
1. Navigate to login page at https://example.com/login
2. Enter username "testuser" in the username field
3. Enter password "password123" in the password field
4. Click the "Login" button
5. Verify dashboard is displayed
6. Check that user profile shows "testuser"
7. Click logout button
8. Verify redirect to login page
```

### Best Practices

**Be Specific:**
- ✅ "Click the blue 'Submit' button in the footer"
- ❌ "Click submit"

**Include Expected Outcomes:**
- ✅ "Verify success message appears"
- ❌ "Submit form"

**Mention Data:**
- ✅ "Enter 'john@example.com' in email field"
- ❌ "Enter email"

**Describe Validations:**
- ✅ "Assert error message contains 'Invalid credentials'"
- ❌ "Check for error"

### Generated Features

**Output Includes:**
- Playwright automation steps
- Element selectors (role, label, text, CSS)
- Page navigation
- Assertions and validations
- Variable storage
- Wait conditions

---

## 🎬 Playwright Codegen (Record Mode)

### How It Works

**Step 1: Enter URL**
```
https://example.com
```

**Step 2: Start Recording**
- Click **"Start Playwright Codegen"**
- Browser opens with Playwright Inspector
- Inspector shows recording panel

**Step 3: Perform Actions**
- Click elements
- Type text
- Navigate pages
- Fill forms
- Select options

**Step 4: Copy Generated Code**
- Code appears in Inspector
- Copy Playwright code
- Paste in UI Steps tab

**Step 5: Convert to TestFlow**
- Use AI Chat or UI Steps
- Convert Playwright code to TestFlow format
- Save as test suite

### Features

**Visual Selection:**
- Click elements to record
- Hover highlights elements
- Auto-generates selectors

**Auto-Generated Selectors:**
- Role-based (accessible)
- Text-based
- CSS selectors
- XPath (fallback)

**Network Capture:**
- Records API calls
- Captures responses
- Includes timing

**Screenshots:**
- Visual regression testing
- Before/after comparisons
- Element screenshots

### Pro Tips

- 🎯 Record multiple scenarios
- ✅ Use assertions for validation
- 🔄 Test different user flows
- ⚠️ Include error scenarios
- 📸 Capture screenshots at key points

---

## ⚙️ Generation Options

### Test Cases Only Mode

**Enable Checkbox:**
- ✅ "Test Cases Only"
- Generates test cases without suite wrapper
- Useful for adding to existing suites

**Output:**
```json
[
  {
    "name": "Test Case 1",
    "type": "REST",
    "testData": [...]
  }
]
```

**Use Cases:**
- Adding to existing suite
- Merging multiple generations
- Custom suite structure

---

## 📊 Generated Test Suite Preview

### Preview Panel

**Always Visible When Generated:**
- Located at bottom of modal
- Animated slide-in effect
- Emerald/green gradient background

### Information Displayed

**Header:**
- Suite name or "Generated Test Cases"
- Type badge (API/UI)
- Action buttons

**Content:**
- JSON preview (scrollable)
- Syntax highlighted
- 200 lines visible

### Actions

**Copy JSON:**
- Copies to clipboard
- Shows "Copied!" confirmation
- Includes full or test cases only

**Save Suite:**
- Opens save dialog
- Choose location
- Set filename
- Saves to filesystem

---

## 💾 Saving Test Suites

### Save Dialog

**Fields:**
1. **Save Location**: Directory path
   - Default: Last used location
   - Example: `/Users/username/TestFlowPro/testSuites`

2. **File Name**: JSON filename
   - Auto-generated from suite name
   - Example: `User_Login_Tests.json`

**Buttons:**
- **Save**: Saves to specified location
- **Cancel**: Closes dialog

### Auto-Refresh

After saving:
- Dashboard automatically refreshes
- New suite appears in list
- Success notification shown

---

## 🎨 UI Features

### Modern Design

**Color Scheme:**
- Purple-blue gradient header
- Slate sidebar
- White content area
- Emerald success indicators

**Animations:**
- Floating chat icon
- Ripple effects
- Smooth transitions
- Slide-in panels
- Bounce effects

### Visual Indicators

**Loading States:**
- Spinning bot icon
- Animated dots
- Progress messages
- "AI is crafting..." text

**Status Badges:**
- API/UI type badges
- Authentication status
- Provider selection
- Generation options

### Responsive Layout

**Sections:**
- Fixed header (gradient)
- Left sidebar (320px)
- Main content (flexible)
- Preview panel (bottom)

**Scrolling:**
- Chat messages scroll
- Content areas scroll
- Preview scrolls independently

---

## 🔧 Advanced Features

### Variable Injection

**In Prompts:**
```
"Create tests using {{baseUrl}} and {{authToken}}"
```

**In Generated Tests:**
- Automatically includes variable placeholders
- Uses stored variables
- Supports chaining

### Multi-Step Generation

**Workflow:**
1. Generate base suite
2. Add test cases
3. Refine with chat
4. Test and iterate

### Context Awareness

**AI Remembers:**
- Previous messages
- Generated suites
- User preferences
- Common patterns

---

## 💡 Tips & Best Practices

### 1. Clear Descriptions

**Good:**
```
"Create API tests for user registration with email validation,
password strength check, and duplicate email detection"
```

**Bad:**
```
"Make user tests"
```

### 2. Specify Details

**Include:**
- Endpoint URLs
- HTTP methods
- Request/response formats
- Expected status codes
- Validation rules

### 3. Use Examples

**Provide Sample Data:**
```
"Test user creation with:
- Valid: {name: 'John', email: 'john@example.com'}
- Invalid: {name: '', email: 'invalid'}
- Duplicate: existing email"
```

### 4. Iterate and Refine

**Process:**
1. Generate initial suite
2. Review output
3. Ask for modifications
4. Refine specific parts
5. Save final version

### 5. Combine Tools

**Workflow:**
- Use cURL for quick API tests
- Use Swagger for comprehensive coverage
- Use UI Steps for browser automation
- Use Chat for custom scenarios

---

## 🐛 Troubleshooting

### AI Not Responding

**Solutions:**
1. Check provider selection
2. Verify authentication (GitHub Copilot)
3. Check Ollama is running (Local)
4. Refresh page
5. Clear chat and retry

### Authentication Failed

**GitHub Copilot:**
1. Re-authenticate
2. Check token permissions
3. Verify subscription status
4. Try manual token method

### Generation Errors

**Common Issues:**
1. Invalid input format
2. Missing required fields
3. Quota exceeded (GitHub)
4. Network timeout

**Solutions:**
- Simplify prompt
- Check input format
- Switch providers
- Retry generation

### Preview Not Showing

**Check:**
1. Generation completed
2. Valid JSON output
3. No parsing errors
4. Scroll to bottom

---

## 📚 Examples

### Example 1: API Test Generation

**Prompt:**
```
Create comprehensive API tests for a user management system with:
- POST /users - Create user
- GET /users/:id - Get user by ID
- PUT /users/:id - Update user
- DELETE /users/:id - Delete user

Include authentication, validation, and error scenarios.
```

**Output:**
- Complete test suite
- All CRUD operations
- Authentication headers
- Positive/negative tests
- Assertions for each scenario

### Example 2: UI Test Generation

**Prompt:**
```
Generate UI tests for e-commerce checkout:
1. Add product to cart
2. View cart
3. Proceed to checkout
4. Enter shipping information
5. Select payment method
6. Review order
7. Place order
8. Verify confirmation
```

**Output:**
- Playwright test steps
- Element selectors
- Form interactions
- Navigation flow
- Order validation

### Example 3: cURL Conversion

**Input:**
```bash
curl -X POST https://api.example.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret"}'
```

**Output:**
```json
{
  "name": "User Login",
  "method": "POST",
  "endpoint": "/auth/login",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "email": "user@example.com",
    "password": "secret"
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
    "authToken": "$.token"
  }
}
```

---

## 🔗 Related Documentation

- [Dashboard Overview](./dashboard.md)
- [Test Suite Editor](./test-suite-editor.md)
- [Import Options](./import-options.md)
- [API Testing Examples](../examples/api-testing.md)
- [UI Testing Examples](../examples/ui-testing.md)

---

## 🎯 Keyboard Shortcuts

- `Enter` - Send message (in chat input)
- `Esc` - Close modal
- `Ctrl/Cmd + K` - Focus input
- `Ctrl/Cmd + R` - Reset chat

---

**Generate tests faster with AI assistance! 🤖✨**
