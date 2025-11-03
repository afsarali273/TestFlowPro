# 🔷 Azure DevOps Integration

Complete guide to integrating TestFlow Pro with Azure DevOps Pipelines for CI/CD automation.

---

## 📋 Overview

TestFlow Pro can be seamlessly integrated with Azure DevOps (ADO) for automated test execution in your CI/CD pipelines.

---

## 🚀 Quick Setup

### Prerequisites

1. Azure DevOps account and project
2. Repository with TestFlow Pro
3. Azure Pipelines enabled
4. Service connections configured (if needed)

---

## 📝 Basic Pipeline Configuration

### Create Pipeline File

Create `azure-pipelines.yml` in repository root:

```yaml
trigger:
  branches:
    include:
      - main
      - develop

pool:
  vmImage: 'ubuntu-latest'

variables:
  nodeVersion: '23.8.0'
  ENV: 'qa'

stages:
  - stage: Test
    displayName: 'Run Tests'
    jobs:
      - job: APITests
        displayName: 'API Test Execution'
        steps:
          - task: NodeTool@0
            displayName: 'Install Node.js'
            inputs:
              versionSpec: $(nodeVersion)

          - script: npm install
            displayName: 'Install Dependencies'

          - script: npx ts-node src/runner.ts --testType="API"
            displayName: 'Run API Tests'
            env:
              ENV: $(ENV)

          - script: npm run report:html
            displayName: 'Generate HTML Reports'
            condition: always()

          - task: PublishTestResults@2
            displayName: 'Publish Test Results'
            condition: always()
            inputs:
              testResultsFormat: 'JUnit'
              testResultsFiles: 'reports/*.json'
              mergeTestResults: true
              testRunTitle: 'API Tests - $(ENV)'

          - task: PublishBuildArtifacts@1
            displayName: 'Publish Reports'
            condition: always()
            inputs:
              PathtoPublish: 'reports'
              ArtifactName: 'test-reports'
```

---

## 🏷️ Tag-Based Pipeline

### Pipeline with Tag Filtering

```yaml
trigger: none  # Manual trigger only

parameters:
  - name: serviceName
    displayName: 'Service Name Tag'
    type: string
    default: ''
    values:
      - ''
      - '@UserService'
      - '@PaymentService'
      - '@OrderService'

  - name: suiteType
    displayName: 'Suite Type'
    type: string
    default: '@smoke'
    values:
      - '@smoke'
      - '@regression'
      - '@integration'

  - name: environment
    displayName: 'Environment'
    type: string
    default: 'qa'
    values:
      - dev
      - qa
      - uat
      - prod

pool:
  vmImage: 'ubuntu-latest'

variables:
  nodeVersion: '23.8.0'

stages:
  - stage: Test
    displayName: 'Run Tests by Tags'
    jobs:
      - job: ExecuteTests
        displayName: 'Execute Test Suite'
        steps:
          - task: NodeTool@0
            displayName: 'Install Node.js'
            inputs:
              versionSpec: $(nodeVersion)

          - script: npm ci
            displayName: 'Install Dependencies'

          - script: |
              ARGS=""
              if [ ! -z "${{ parameters.serviceName }}" ]; then
                ARGS="$ARGS --serviceName='${{ parameters.serviceName }}'"
              fi
              if [ ! -z "${{ parameters.suiteType }}" ]; then
                ARGS="$ARGS --suiteType='${{ parameters.suiteType }}'"
              fi
              echo "Running tests with args: $ARGS"
              npx ts-node src/runner.ts $ARGS
            displayName: 'Run Tests'
            env:
              ENV: ${{ parameters.environment }}

          - script: npm run report:html
            displayName: 'Generate HTML Reports'
            condition: always()

          - task: PublishTestResults@2
            displayName: 'Publish Test Results'
            condition: always()
            inputs:
              testResultsFormat: 'JUnit'
              testResultsFiles: 'reports/*.json'
              testRunTitle: 'Tests - ${{ parameters.environment }}'

          - task: PublishBuildArtifacts@1
            displayName: 'Publish JSON Reports'
            condition: always()
            inputs:
              PathtoPublish: 'reports'
              ArtifactName: 'json-reports-${{ parameters.environment }}'

          - task: PublishBuildArtifacts@1
            displayName: 'Publish HTML Reports'
            condition: always()
            inputs:
              PathtoPublish: 'reports'
              ArtifactName: 'html-reports-${{ parameters.environment }}'
              publishLocation: 'Container'
```

---

## 📱 Application-Based Pipeline

### Filter by Application Name

```yaml
trigger: none

parameters:
  - name: applicationName
    displayName: 'Application Name'
    type: string
    default: 'Bookstore Application'

  - name: testType
    displayName: 'Test Type'
    type: string
    default: ''
    values:
      - ''
      - 'API'
      - 'UI'

  - name: environment
    displayName: 'Environment'
    type: string
    default: 'qa'
    values:
      - dev
      - qa
      - prod

pool:
  vmImage: 'ubuntu-latest'

variables:
  nodeVersion: '23.8.0'

stages:
  - stage: Test
    displayName: 'Run Application Tests'
    jobs:
      - job: ExecuteTests
        displayName: 'Execute Tests for ${{ parameters.applicationName }}'
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: $(nodeVersion)

          - script: npm ci
            displayName: 'Install Dependencies'

          - script: npx playwright install --with-deps
            displayName: 'Install Playwright Browsers'
            condition: eq('${{ parameters.testType }}', 'UI')

          - script: |
              ARGS="--applicationName='${{ parameters.applicationName }}'"
              if [ ! -z "${{ parameters.testType }}" ]; then
                ARGS="$ARGS --testType='${{ parameters.testType }}'"
              fi
              npx ts-node src/runner.ts $ARGS
            displayName: 'Run Tests'
            env:
              ENV: ${{ parameters.environment }}

          - script: npm run report:html
            displayName: 'Generate Reports'
            condition: always()

          - task: PublishTestResults@2
            condition: always()
            inputs:
              testResultsFormat: 'JUnit'
              testResultsFiles: 'reports/*.json'
              testRunTitle: '${{ parameters.applicationName }} - ${{ parameters.environment }}'

          - task: PublishBuildArtifacts@1
            condition: always()
            inputs:
              PathtoPublish: 'reports'
              ArtifactName: 'reports-${{ parameters.applicationName }}'
```

---

## 🔄 Multi-Environment Pipeline

### Matrix Strategy

```yaml
trigger: none

parameters:
  - name: environments
    displayName: 'Environments to Test'
    type: object
    default:
      - dev
      - qa
      - prod

  - name: testTypes
    displayName: 'Test Types'
    type: object
    default:
      - API
      - UI

pool:
  vmImage: 'ubuntu-latest'

variables:
  nodeVersion: '23.8.0'

stages:
  - stage: Test
    displayName: 'Multi-Environment Testing'
    jobs:
      - ${{ each env in parameters.environments }}:
          - ${{ each type in parameters.testTypes }}:
              - job: Test_${{ env }}_${{ type }}
                displayName: 'Test ${{ type }} on ${{ env }}'
                steps:
                  - task: NodeTool@0
                    inputs:
                      versionSpec: $(nodeVersion)

                  - script: npm ci
                    displayName: 'Install Dependencies'

                  - script: npx playwright install --with-deps
                    displayName: 'Install Playwright'
                    condition: eq('${{ type }}', 'UI')

                  - script: npx ts-node src/runner.ts --testType="${{ type }}"
                    displayName: 'Run ${{ type }} Tests'
                    env:
                      ENV: ${{ env }}

                  - script: npm run report:html
                    displayName: 'Generate Reports'
                    condition: always()

                  - task: PublishTestResults@2
                    condition: always()
                    inputs:
                      testResultsFormat: 'JUnit'
                      testResultsFiles: 'reports/*.json'
                      testRunTitle: '${{ type }} Tests - ${{ env }}'

                  - task: PublishBuildArtifacts@1
                    condition: always()
                    inputs:
                      PathtoPublish: 'reports'
                      ArtifactName: 'reports-${{ env }}-${{ type }}'
```

---

## 🔐 Using Variables & Secrets

### Variable Groups

1. Go to **Pipelines** → **Library**
2. Create variable group: `TestFlow-QA`
3. Add variables:
   - `BASE_URL`: https://qa-api.example.com
   - `API_KEY`: (mark as secret)
   - `DB_PASSWORD`: (mark as secret)

### Use in Pipeline

```yaml
variables:
  - group: TestFlow-QA

stages:
  - stage: Test
    jobs:
      - job: RunTests
        steps:
          - script: npx ts-node src/runner.ts
            env:
              ENV: qa
              BASE_URL: $(BASE_URL)
              API_KEY: $(API_KEY)
              DB_PASSWORD: $(DB_PASSWORD)
```

---

## 📊 Scheduled Runs

### Nightly Test Execution

```yaml
trigger: none

schedules:
  - cron: '0 2 * * *'  # 2 AM UTC daily
    displayName: 'Nightly Regression Tests'
    branches:
      include:
        - main
    always: true

pool:
  vmImage: 'ubuntu-latest'

stages:
  - stage: NightlyTests
    displayName: 'Nightly Regression'
    jobs:
      - job: RegressionTests
        displayName: 'Run Regression Suite'
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: '23.8.0'

          - script: npm ci
            displayName: 'Install Dependencies'

          - script: npx ts-node src/runner.ts --suiteType="@regression"
            displayName: 'Run Regression Tests'
            env:
              ENV: qa

          - script: npm run report:html
            displayName: 'Generate Reports'
            condition: always()

          - task: PublishTestResults@2
            condition: always()
            inputs:
              testResultsFormat: 'JUnit'
              testResultsFiles: 'reports/*.json'
              testRunTitle: 'Nightly Regression - $(Build.BuildNumber)'

          - task: PublishBuildArtifacts@1
            condition: always()
            inputs:
              PathtoPublish: 'reports'
              ArtifactName: 'nightly-reports-$(Build.BuildNumber)'
```

---

## 🔔 Notifications

### Email Notifications

Add to pipeline:

```yaml
- task: SendEmail@1
  displayName: 'Send Test Results Email'
  condition: always()
  inputs:
    To: 'team@example.com'
    From: 'devops@example.com'
    Subject: 'Test Results - $(Build.BuildNumber)'
    Body: |
      Test execution completed.
      
      Build: $(Build.BuildNumber)
      Status: $(Agent.JobStatus)
      Environment: $(ENV)
      
      View reports: $(System.TeamFoundationCollectionUri)$(System.TeamProject)/_build/results?buildId=$(Build.BuildId)
```

### Slack Notifications

```yaml
- task: SlackNotification@1
  displayName: 'Notify Slack'
  condition: always()
  inputs:
    SlackApiToken: '$(SlackToken)'
    MessageAuthor: 'Azure DevOps'
    Channel: '#test-results'
    Message: |
      Test execution completed
      Status: $(Agent.JobStatus)
      Build: $(Build.BuildNumber)
```

---

## 🎯 Pull Request Validation

### PR Pipeline

```yaml
trigger: none

pr:
  branches:
    include:
      - main
      - develop
  paths:
    include:
      - src/**
      - testSuites/**

pool:
  vmImage: 'ubuntu-latest'

stages:
  - stage: PRValidation
    displayName: 'PR Validation'
    jobs:
      - job: SmokeTests
        displayName: 'Run Smoke Tests'
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: '23.8.0'

          - script: npm ci
            displayName: 'Install Dependencies'

          - script: npx ts-node src/runner.ts --suiteType="@smoke"
            displayName: 'Run Smoke Tests'
            env:
              ENV: dev

          - script: npm run report:html
            displayName: 'Generate Reports'
            condition: always()

          - task: PublishTestResults@2
            condition: always()
            inputs:
              testResultsFormat: 'JUnit'
              testResultsFiles: 'reports/*.json'
              testRunTitle: 'PR Smoke Tests'

          - script: |
              if [ $(Agent.JobStatus) == "Succeeded" ]; then
                echo "##vso[task.complete result=Succeeded;]All tests passed"
              else
                echo "##vso[task.complete result=Failed;]Some tests failed"
                exit 1
              fi
            displayName: 'Validate Results'
```

---

## 📈 Advanced Configurations

### Parallel Execution

```yaml
strategy:
  parallel: 4

steps:
  - script: npx ts-node src/runner.ts --file="./testSuites/suite-$(System.JobPositionInPhase).json"
    displayName: 'Run Test Suite $(System.JobPositionInPhase)'
```

### Conditional Execution

```yaml
- script: npx ts-node src/runner.ts --testType="UI"
  displayName: 'Run UI Tests'
  condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
```

### Retry on Failure

```yaml
- script: npx ts-node src/runner.ts
  displayName: 'Run Tests'
  retryCountOnTaskFailure: 2
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. **Node Version Mismatch**

```yaml
- task: NodeTool@0
  inputs:
    versionSpec: '23.8.0'  # Specify exact version
```

#### 2. **Playwright Installation Fails**

```yaml
- script: |
    npx playwright install --with-deps chromium
  displayName: 'Install Playwright'
```

#### 3. **Environment Variables Not Loading**

```yaml
- script: |
    echo "ENV=$ENV"
    echo "BASE_URL=$BASE_URL"
    npx ts-node src/runner.ts
  env:
    ENV: $(environment)
    BASE_URL: $(baseUrl)
```

#### 4. **Artifacts Not Publishing**

```yaml
- task: PublishBuildArtifacts@1
  condition: always()  # Publish even if tests fail
  inputs:
    PathtoPublish: 'reports'
    ArtifactName: 'test-reports'
    publishLocation: 'Container'
```

---

## 📊 Complete Example Pipeline

### Comprehensive CI/CD Pipeline

```yaml
trigger:
  branches:
    include:
      - main
      - develop

pr:
  branches:
    include:
      - main

parameters:
  - name: runFullSuite
    displayName: 'Run Full Test Suite'
    type: boolean
    default: false

pool:
  vmImage: 'ubuntu-latest'

variables:
  - group: TestFlow-Variables
  - name: nodeVersion
    value: '23.8.0'

stages:
  # Stage 1: Smoke Tests (Always)
  - stage: SmokeTests
    displayName: 'Smoke Tests'
    jobs:
      - job: RunSmokeTests
        displayName: 'Execute Smoke Tests'
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: $(nodeVersion)

          - script: npm ci
            displayName: 'Install Dependencies'

          - script: npx ts-node src/runner.ts --suiteType="@smoke"
            displayName: 'Run Smoke Tests'
            env:
              ENV: qa

          - script: npm run report:html
            displayName: 'Generate Reports'
            condition: always()

          - task: PublishTestResults@2
            condition: always()
            inputs:
              testResultsFormat: 'JUnit'
              testResultsFiles: 'reports/*.json'
              testRunTitle: 'Smoke Tests'

          - task: PublishBuildArtifacts@1
            condition: always()
            inputs:
              PathtoPublish: 'reports'
              ArtifactName: 'smoke-test-reports'

  # Stage 2: Regression Tests (Conditional)
  - stage: RegressionTests
    displayName: 'Regression Tests'
    dependsOn: SmokeTests
    condition: and(succeeded(), eq('${{ parameters.runFullSuite }}', true))
    jobs:
      - job: RunRegressionTests
        displayName: 'Execute Regression Tests'
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: $(nodeVersion)

          - script: npm ci
            displayName: 'Install Dependencies'

          - script: npx playwright install --with-deps
            displayName: 'Install Playwright'

          - script: npx ts-node src/runner.ts --suiteType="@regression"
            displayName: 'Run Regression Tests'
            env:
              ENV: qa

          - script: npm run report:html
            displayName: 'Generate Reports'
            condition: always()

          - task: PublishTestResults@2
            condition: always()
            inputs:
              testResultsFormat: 'JUnit'
              testResultsFiles: 'reports/*.json'
              testRunTitle: 'Regression Tests'

          - task: PublishBuildArtifacts@1
            condition: always()
            inputs:
              PathtoPublish: 'reports'
              ArtifactName: 'regression-test-reports'

  # Stage 3: Notifications
  - stage: Notify
    displayName: 'Send Notifications'
    dependsOn:
      - SmokeTests
      - RegressionTests
    condition: always()
    jobs:
      - job: SendNotifications
        displayName: 'Send Test Results'
        steps:
          - task: SendEmail@1
            inputs:
              To: 'team@example.com'
              Subject: 'Test Results - Build $(Build.BuildNumber)'
              Body: |
                Test execution completed.
                
                Smoke Tests: $(stageDependencies.SmokeTests.RunSmokeTests.result)
                Regression Tests: $(stageDependencies.RegressionTests.RunRegressionTests.result)
                
                View results: $(System.TeamFoundationCollectionUri)$(System.TeamProject)/_build/results?buildId=$(Build.BuildId)
```

---

## 🔗 Related Documentation

- [GitHub Actions Integration](./github-actions.md)
- [Command Line Usage](../cli-execution/command-line.md)
- [Environment Configuration](./environment-config.md)

---

**Automate your testing with Azure DevOps! 🔷**
