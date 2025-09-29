# 🚀 TestFlow Pro - Installation Guide

## Prerequisites

### Required Software
- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **Git** ([Download](https://git-scm.com/download/win))

### System Requirements
- **OS**: Windows 10/11 (64-bit), macOS, or Linux
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 2GB free space

## Installation Steps

### 1. Clone Repository
```bash
git clone https://github.com/your-repo/TestFlowPro.git
cd TestFlowPro
```

### 2. Install Backend Dependencies
```bash
npm install
```

### 3. Install Playwright Browsers
```bash
npx playwright install
```

### 4. Install Frontend Dependencies
```bash
cd frontend/TestEditor
npm install --legacy-peer-deps
cd ../..
```

### 5. Setup Environment (Optional)
```bash
# Create .env file in root directory
echo "BASE_URL=https://your-api.com" > .env
echo "PARALLEL_THREADS=4" >> .env
```

## Running the Application

### Start Frontend UI
```bash
cd frontend/TestEditor
npm run dev
```
Access UI at: http://localhost:3000

### Run Tests via CLI
```bash
# Run all tests
npx ts-node src/runner.ts

# Run specific suite
npx ts-node src/runner.ts --file="./testSuites/example.json"

# Run by application
npx ts-node src/runner.ts --applicationName="MyApp"
```

## Verification

### Test Installation
```bash
# Check Node.js
node --version

# Check TypeScript
npx tsc --version

# Test Playwright
npx playwright --version

# Run sample test
npx ts-node src/runner.ts --file="./testSuites/sample.json"
```

## Troubleshooting

### Common Issues

**Node.js version error:**
```bash
# Update Node.js to 18.x or higher
```

**Playwright browser installation fails:**
```bash
# Manual browser install
npx playwright install chromium
```

**Frontend dependencies error:**
```bash
# Clear cache and reinstall
cd frontend/TestEditor
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

**Permission errors (Windows):**
```cmd
# Run as Administrator
```

### Database Setup (Optional)

**MySQL:**
```env
DB_USERDB_TYPE=mysql
DB_USERDB_HOST=localhost
DB_USERDB_PORT=3306
DB_USERDB_USER=root
DB_USERDB_PASSWORD=password
DB_USERDB_NAME=testdb
```

## Quick Start

1. **Create your first test suite** using the UI at http://localhost:3000
2. **Import existing tests** from Postman, cURL, or Swagger
3. **Run tests** via CLI or UI
4. **View reports** in HTML format

## Support

- **Documentation**: See main README.md
- **Issues**: Create GitHub issue
- **Examples**: Check `/testSuites` folder

---

✅ **Installation Complete!** You're ready to start testing with TestFlow Pro.