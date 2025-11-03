# 🔄 GitHub Actions Integration

Complete guide to integrating TestFlow Pro with GitHub Actions for CI/CD automation.

---

## 📋 Overview

TestFlow Pro includes pre-configured GitHub Actions workflows for automated test execution:

1. **Run Tests by Tags** - Filter tests by service name and suite type
2. **Run Tests by Application** - Filter tests by application name and test type
3. **Run Tests Matrix** - Execute tests across multiple environments

---

## 🚀 Quick Start

### 1. Workflow Files Location

All workflows are located in `.github/workflows/`:

```
.github/
└── workflows/
    ├── run-tests-by-tags.yml
    ├── run-tests-by-application.yml
    └── run-tests-matrix.yml
```

### 2. Triggering Workflows

All workflows use **manual triggers** (`workflow_dispatch`) for controlled execution.

**To trigger a workflow:**
1. Go to your GitHub repository
2. Click on **Actions** tab
3. Select the workflow from the left sidebar
4. Click **Run workflow** button
5. Fill in the required inputs
6. Click **Run workflow**

---

## 🏷️ Workflow 1: Run Tests by Tags

### Purpose
Execute tests filtered by service name and suite type tags.

### Workflow File
`.github/workflows/run-tests-by-tags.yml`

### Input Parameters

| Parameter | Description | Required | Default | Options |
|-----------|-------------|----------|---------|---------|
| `serviceName` | Service tag (e.g., @UserService) | No | - | Any string |
| `suiteType` | Suite type tag (e.g., @smoke) | No | - | Any string |
| `environment` | Target environment | Yes | qa | dev, qa, prod |

### Usage Examples

#### Example 1: Run Smoke Tests

```yaml
# Manual trigger inputs:
serviceName: ""
suiteType: "@smoke"
environment: "qa"
```

#### Example 2: Run Tests for Specific Service

```yaml
# Manual trigger inputs:
serviceName: "@UserService"
suiteType: ""
environment: "qa"
```

#### Example 3: Run Service-Specific Smoke Tests

```yaml
# Manual trigger inputs:
serviceName: "@PaymentService"
suiteType: "@smoke"
environment: "prod"
```

### Workflow Configuration

```yaml
name: Run Tests by Tags

on:
  workflow_dispatch:
    inputs:
      serviceName:
        description: 'Service Name Tag (e.g., @UserService)'
        required: false
        type: string
      suiteType:
        description: 'Suite Type Tag (e.g., @smoke, @regression)'
        required: false
        type: string
      environment:
        description: 'Environment to run tests against'
        required: true
        default: 'qa'
        type: choice
        options:
          - dev
          - qa
          - prod

jobs:
  run-tests:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '23.8.0'
          cache: 'npm'

      - name: Install dependencies
        run: npm install

      - name: Run tests with tags
        env:
          ENV: ${{ github.event.inputs.environment }}
        run: |
          ARGS=""
          if [ ! -z "${{ github.event.inputs.serviceName }}" ]; then
            ARGS="$ARGS --serviceName='${{ github.event.inputs.serviceName }}'"
          fi
          if [ ! -z "${{ github.event.inputs.suiteType }}" ]; then
            ARGS="$ARGS --suiteType='${{ github.event.inputs.suiteType }}'"
          fi
          echo "Running tests with args: $ARGS on environment: $ENV"
          npx ts-node src/runner.ts $ARGS

      - name: Generate HTML reports
        if: always()
        run: npm run report:html

      - name: Upload test reports
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-reports-tags-${{ github.event.inputs.environment }}
          path: reports/
          retention-days: 30

      - name: Upload HTML reports
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: html-reports-tags-${{ github.event.inputs.environment }}
          path: '**/*.html'
          retention-days: 30
```

---

## 📱 Workflow 2: Run Tests by Application

### Purpose
Execute tests filtered by application name and test type.

### Workflow File
`.github/workflows/run-tests-by-application.yml`

### Input Parameters

| Parameter | Description | Required | Default | Options |
|-----------|-------------|----------|---------|---------|
| `applicationName` | Application name | Yes | - | Any string |
| `testType` | Type of tests to run | No | - | API, UI |
| `environment` | Target environment | Yes | qa | dev, qa, prod |

### Usage Examples

#### Example 1: Run All Tests for Application

```yaml
# Manual trigger inputs:
applicationName: "Bookstore Application"
testType: ""
environment: "qa"
```

#### Example 2: Run Only API Tests

```yaml
# Manual trigger inputs:
applicationName: "E-commerce Platform"
testType: "API"
environment: "prod"
```

#### Example 3: Run Only UI Tests

```yaml
# Manual trigger inputs:
applicationName: "Admin Portal"
testType: "UI"
environment: "qa"
```

### Workflow Configuration

```yaml
name: Run Tests by Application

on:
  workflow_dispatch:
    inputs:
      applicationName:
        description: 'Application Name'
        required: true
        type: string
      testType:
        description: 'Test Type (API or UI)'
        required: false
        type: choice
        options:
          - ''
          - API
          - UI
      environment:
        description: 'Environment to run tests against'
        required: true
        default: 'qa'
        type: choice
        options:
          - dev
          - qa
          - prod

jobs:
  run-tests:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '23.8.0'
          cache: 'npm'

      - name: Install dependencies
        run: npm install

      - name: Install Playwright browsers
        if: github.event.inputs.testType == 'UI'
        run: npx playwright install --with-deps

      - name: Run tests by application
        env:
          ENV: ${{ github.event.inputs.environment }}
        run: |
          ARGS="--applicationName='${{ github.event.inputs.applicationName }}'"
          if [ ! -z "${{ github.event.inputs.testType }}" ]; then
            ARGS="$ARGS --testType='${{ github.event.inputs.testType }}'"
          fi
          echo "Running tests with args: $ARGS on environment: $ENV"
          npx ts-node src/runner.ts $ARGS

      - name: Generate HTML reports
        if: always()
        run: npm run report:html

      - name: Upload test reports
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-reports-app-${{ github.event.inputs.environment }}
          path: reports/
          retention-days: 30
```

---

## 🔄 Workflow 3: Run Tests Matrix

### Purpose
Execute tests across multiple environments, test types, and tags simultaneously.

### Workflow File
`.github/workflows/run-tests-matrix.yml`

### Input Parameters

| Parameter | Description | Required | Default | Example |
|-----------|-------------|----------|---------|---------|
| `environments` | Comma-separated environments | Yes | qa | dev,qa,prod |
| `testTypes` | Comma-separated test types | No | - | API,UI |
| `tags` | Comma-separated tags | No | - | @smoke,@regression |

### Usage Examples

#### Example 1: Run Across Multiple Environments

```yaml
# Manual trigger inputs:
environments: "dev,qa,prod"
testTypes: "API"
tags: "@smoke"
```

#### Example 2: Run Different Test Types

```yaml
# Manual trigger inputs:
environments: "qa"
testTypes: "API,UI"
tags: "@regression"
```

#### Example 3: Full Matrix Execution

```yaml
# Manual trigger inputs:
environments: "qa,prod"
testTypes: "API,UI"
tags: "@smoke,@regression"
```

### Workflow Configuration

```yaml
name: Run Tests Matrix

on:
  workflow_dispatch:
    inputs:
      environments:
        description: 'Environments (comma-separated: dev,qa,prod)'
        required: true
        default: 'qa'
        type: string
      testTypes:
        description: 'Test Types (comma-separated: API,UI)'
        required: false
        type: string
      tags:
        description: 'Tags (comma-separated: @smoke,@regression)'
        required: false
        type: string

jobs:
  prepare-matrix:
    runs-on: ubuntu-latest
    outputs:
      matrix: ${{ steps.set-matrix.outputs.matrix }}
    steps:
      - name: Set matrix
        id: set-matrix
        run: |
          ENVS="${{ github.event.inputs.environments }}"
          TYPES="${{ github.event.inputs.testTypes }}"
          TAGS="${{ github.event.inputs.tags }}"
          
          # Build matrix JSON
          echo "matrix={\"environment\":[\"${ENVS//,/\",\"}\"],\"testType\":[\"${TYPES//,/\",\"}\"],\"tag\":[\"${TAGS//,/\",\"}\"]}" >> $GITHUB_OUTPUT

  run-tests:
    needs: prepare-matrix
    runs-on: ubuntu-latest
    strategy:
      matrix: ${{fromJson(needs.prepare-matrix.outputs.matrix)}}
      fail-fast: false

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '23.8.0'
          cache: 'npm'

      - name: Install dependencies
        run: npm install

      - name: Run tests
        env:
          ENV: ${{ matrix.environment }}
        run: |
          ARGS=""
          if [ ! -z "${{ matrix.testType }}" ]; then
            ARGS="$ARGS --testType='${{ matrix.testType }}'"
          fi
          if [ ! -z "${{ matrix.tag }}" ]; then
            ARGS="$ARGS --suiteType='${{ matrix.tag }}'"
          fi
          npx ts-node src/runner.ts $ARGS

      - name: Generate HTML reports
        if: always()
        run: npm run report:html

      - name: Upload reports
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: reports-${{ matrix.environment }}-${{ matrix.testType }}-${{ matrix.tag }}
          path: reports/
          retention-days: 30
```

---

## 🔐 Environment Variables & Secrets

### Setting Up Secrets

1. Go to repository **Settings**
2. Navigate to **Secrets and variables** → **Actions**
3. Click **New repository secret**

### Common Secrets

```yaml
# API Keys
API_KEY: ${{ secrets.API_KEY }}

# Database Credentials
DB_HOST: ${{ secrets.DB_HOST }}
DB_USER: ${{ secrets.DB_USER }}
DB_PASSWORD: ${{ secrets.DB_PASSWORD }}

# Authentication
AUTH_TOKEN: ${{ secrets.AUTH_TOKEN }}
```

### Using Secrets in Workflows

```yaml
- name: Run tests with secrets
  env:
    ENV: ${{ github.event.inputs.environment }}
    API_KEY: ${{ secrets.API_KEY }}
    DB_PASSWORD: ${{ secrets.DB_PASSWORD }}
  run: npx ts-node src/runner.ts
```

---

## 📊 Viewing Test Results

### Accessing Artifacts

1. Go to **Actions** tab
2. Click on the workflow run
3. Scroll to **Artifacts** section
4. Download reports

### Artifact Types

- **test-reports-*** - JSON reports with detailed results
- **html-reports-*** - Beautiful HTML reports for viewing

---

## 🔔 Notifications

### Slack Integration

Add Slack notification step:

```yaml
- name: Notify Slack
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: 'Test execution completed'
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Email Notifications

Configure in repository settings:
1. Go to **Settings** → **Notifications**
2. Enable email notifications for workflow runs

---

## 🎯 Advanced Configurations

### Scheduled Runs

Add schedule trigger to run tests automatically:

```yaml
on:
  workflow_dispatch:
    # ... manual trigger inputs
  schedule:
    # Run every day at 2 AM UTC
    - cron: '0 2 * * *'
```

### Pull Request Triggers

Run tests on pull requests:

```yaml
on:
  workflow_dispatch:
    # ... manual trigger inputs
  pull_request:
    branches: [ main, develop ]
```

### Conditional Execution

Run specific tests based on changed files:

```yaml
- name: Check changed files
  id: changed-files
  uses: tj-actions/changed-files@v40
  with:
    files: |
      src/**
      testSuites/**

- name: Run tests if files changed
  if: steps.changed-files.outputs.any_changed == 'true'
  run: npx ts-node src/runner.ts
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. **Workflow Not Appearing**
- Check workflow file syntax
- Ensure file is in `.github/workflows/`
- Verify YAML indentation

#### 2. **Tests Failing in CI but Passing Locally**
- Check environment variables
- Verify Node.js version matches
- Ensure all dependencies are installed

#### 3. **Playwright Browser Issues**
```yaml
- name: Install Playwright browsers
  run: npx playwright install --with-deps
```

#### 4. **Timeout Issues**
```yaml
- name: Run tests
  timeout-minutes: 30  # Increase timeout
  run: npx ts-node src/runner.ts
```

---

## 📈 Best Practices

### 1. Use Matrix for Multiple Environments

```yaml
strategy:
  matrix:
    environment: [dev, qa, prod]
    testType: [API, UI]
```

### 2. Always Upload Artifacts

```yaml
- name: Upload reports
  if: always()  # Upload even if tests fail
  uses: actions/upload-artifact@v4
```

### 3. Cache Dependencies

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '23.8.0'
    cache: 'npm'  # Cache npm dependencies
```

### 4. Use Descriptive Artifact Names

```yaml
with:
  name: test-reports-${{ matrix.environment }}-${{ github.run_number }}
```

### 5. Set Retention Days

```yaml
with:
  retention-days: 30  # Keep artifacts for 30 days
```

---

## 📚 Complete Example Workflow

### Comprehensive Test Execution

```yaml
name: Comprehensive Test Suite

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment'
        required: true
        default: 'qa'
        type: choice
        options: [dev, qa, prod]
      testScope:
        description: 'Test Scope'
        required: true
        type: choice
        options: [smoke, regression, full]

jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 60

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '23.8.0'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run smoke tests
        if: github.event.inputs.testScope == 'smoke'
        env:
          ENV: ${{ github.event.inputs.environment }}
        run: npx ts-node src/runner.ts --suiteType="@smoke"

      - name: Run regression tests
        if: github.event.inputs.testScope == 'regression'
        env:
          ENV: ${{ github.event.inputs.environment }}
        run: npx ts-node src/runner.ts --suiteType="@regression"

      - name: Run all tests
        if: github.event.inputs.testScope == 'full'
        env:
          ENV: ${{ github.event.inputs.environment }}
        run: npx ts-node src/runner.ts

      - name: Generate HTML reports
        if: always()
        run: npm run report:html

      - name: Upload JSON reports
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: json-reports-${{ github.event.inputs.environment }}-${{ github.run_number }}
          path: reports/*.json
          retention-days: 30

      - name: Upload HTML reports
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: html-reports-${{ github.event.inputs.environment }}-${{ github.run_number }}
          path: reports/*.html
          retention-days: 30

      - name: Publish test results
        if: always()
        uses: EnricoMi/publish-unit-test-result-action@v2
        with:
          files: reports/*.json

      - name: Comment PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '✅ Tests completed! Check artifacts for reports.'
            })
```

---

## 🔗 Related Documentation

- [Command Line Usage](../cli-execution/command-line.md)
- [Azure DevOps Integration](./azure-devops.md)
- [Environment Configuration](./environment-config.md)

---

**Automate your testing with GitHub Actions! 🚀**
