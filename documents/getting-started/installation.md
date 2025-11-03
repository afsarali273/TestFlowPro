# 📦 Installation Guide

This guide will help you set up TestFlow Pro on your local machine.

---

## 📋 Prerequisites

Before installing TestFlow Pro, ensure you have the following installed:

### Required Software
- **Node.js** (v18.0.0 or higher)
- **npm** (v8.0.0 or higher) or **yarn**
- **Git** (for cloning the repository)

### Optional (for specific features)
- **MySQL** (for database testing)
- **ODBC Driver** (for ODBC database connections)
- **DB2 Client** (for DB2 database testing)

---

## 🚀 Installation Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd TestFlowPro
```

### 2. Install Backend Dependencies

```bash
npm install
```

This will install all required dependencies including:
- TypeScript
- Playwright
- Axios
- Faker.js
- Database drivers (MySQL, ODBC)
- And more...

### 3. Install Frontend Dependencies

```bash
cd frontend/TestEditor
npm install --legacy-peer-deps
```

**Note:** The `--legacy-peer-deps` flag is required due to peer dependency conflicts in some packages.

### 4. Verify Installation

Run a test to verify everything is set up correctly:

```bash
# From project root
npm test
```

---

## 🔧 Configuration

### Environment Files

Create environment-specific configuration files:

```bash
# Base configuration
touch .env

# Environment-specific configs
touch .env.dev
touch .env.qa
touch .env.prod
```

### Sample .env Configuration

```env
# Base URL for API tests
BASE_URL=https://api.example.com

# Parallel execution threads
PARALLEL_THREADS=4

# Test timeout (milliseconds)
TEST_TIMEOUT=30000

# Browser settings for UI tests
HEADLESS=true
BROWSER=chromium

# Database configuration (optional)
DB_USERDB_TYPE=mysql
DB_USERDB_HOST=localhost
DB_USERDB_PORT=3306
DB_USERDB_USER=root
DB_USERDB_PASSWORD=secret
DB_USERDB_NAME=testflow
```

### Environment-Specific Overrides

**`.env.qa`**
```env
BASE_URL=https://qa-api.example.com
HEADLESS=false
```

**`.env.prod`**
```env
BASE_URL=https://api.example.com
HEADLESS=true
PARALLEL_THREADS=8
```

---

## 🗂️ Directory Structure

After installation, your project structure should look like this:

```
TestFlowPro/
├── src/                      # Backend source code
│   ├── runner/              # Test execution engine
│   ├── utils/               # Utility functions
│   ├── db/                  # Database clients
│   ├── custom-steps/        # Custom step handlers
│   └── page-objects/        # Page object models
├── frontend/                # Frontend UI
│   └── TestEditor/         # React-based test editor
├── testSuites/             # Test suite JSON files
├── reports/                # Test execution reports
├── documents/              # Documentation
├── .github/                # GitHub Actions workflows
├── .env                    # Environment configuration
└── package.json            # Project dependencies
```

---

## 🎯 Quick Verification

### Run Sample Tests

```bash
# Run all test suites
npm test

# Run specific test suite
npx ts-node src/runner.ts --file="./testSuites/API_Test_Suite_for_Object_Endpoint.json"
```

### Start Frontend UI

```bash
cd frontend/TestEditor
npm run dev
```

Access the UI at: **http://localhost:3000**

### Generate HTML Reports

```bash
npm run report:html
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. **Node Version Mismatch**
```bash
# Check Node version
node --version

# Use nvm to switch versions
nvm install 18
nvm use 18
```

#### 2. **Playwright Browser Installation**
```bash
# Install Playwright browsers
npx playwright install
```

#### 3. **Database Connection Issues**
- Verify database credentials in `.env` file
- Ensure database server is running
- Check firewall settings

#### 4. **Frontend Build Errors**
```bash
# Clear cache and reinstall
cd frontend/TestEditor
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

#### 5. **Permission Issues (macOS/Linux)**
```bash
# Fix permissions
chmod +x src/runner.ts
```

---

## 🔄 Updating TestFlow Pro

To update to the latest version:

```bash
# Pull latest changes
git pull origin main

# Update backend dependencies
npm install

# Update frontend dependencies
cd frontend/TestEditor
npm install --legacy-peer-deps
```

---

## 🌐 Network Configuration

### Proxy Settings

If you're behind a corporate proxy:

```bash
# Set npm proxy
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080

# Set environment variables
export HTTP_PROXY=http://proxy.company.com:8080
export HTTPS_PROXY=http://proxy.company.com:8080
```

### SSL Certificate Issues

```bash
# Disable SSL verification (not recommended for production)
npm config set strict-ssl false
```

---

## ✅ Next Steps

After successful installation:

1. 📖 Read the [Quick Start Guide](./quick-start.md)
2. 🏗️ Understand the [Project Structure](./project-structure.md)
3. 📝 Create your first [API Test](../examples/api-testing.md)
4. 🎨 Explore the [UI Dashboard](../ui-guide/dashboard.md)

---

## 📞 Support

If you encounter any issues during installation:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Review existing GitHub issues
3. Create a new issue with detailed error logs

---

**Installation Complete! Ready to start testing! 🎉**
