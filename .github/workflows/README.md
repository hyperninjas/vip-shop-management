# CI/CD Pipeline Documentation

## Overview

This CI/CD pipeline is optimized for a pnpm monorepo with Next.js (client) and NestJS (server) applications.

## Pipeline Stages

### 1. Lint
- Runs on every push and PR
- Lints both client and server code
- Fast feedback for code quality issues

### 2. Unit Tests
- Runs in parallel for client and server
- Uses Jest for both projects
- Generates coverage reports for server
- Uploads coverage to Codecov

### 3. E2E Tests

#### Server E2E Tests
- Sets up PostgreSQL service container
- Runs Prisma migrations
- Tests API endpoints with Playwright
- Uses real database connection

#### Client E2E Tests
- Tests Next.js frontend
- Runs Playwright tests across browsers
- Skips webServer (assumes servers are running or uses SKIP_WEBSERVER)

### 4. Security Scan
- Uses Snyk to scan for vulnerabilities
- Continues on error (non-blocking)
- Reports high-severity issues

### 5. Build
- Only runs if all tests pass
- Builds both client and server
- Generates Prisma client
- Uploads build artifacts

### 6. Build and Push Docker Images
- Only runs on push to main/develop branches
- Builds and pushes to GitHub Container Registry
- Uses Docker BuildKit cache for faster builds
- Tags images with branch, SHA, and semantic versioning

### 7. Deployment
- Staging: Deploys on push to `develop` branch
- Production: Deploys on push to `main` branch
- Requires manual deployment scripts

## Environment Variables

### Required Secrets
- `SNYK_TOKEN`: For security scanning (optional)
- `NEXT_PUBLIC_API_URL`: For client build (optional)
- `GITHUB_TOKEN`: Automatically provided by GitHub Actions

### Service Configuration
- PostgreSQL: Uses postgres:18-alpine for E2E tests
- Database: `testdb` with user `postgres` / password `postgres`

## Optimization Features

1. **Parallel Execution**: Unit tests run in parallel for client and server
2. **Caching**: pnpm cache, Docker BuildKit cache, and GitHub Actions cache
3. **Fail Fast**: Matrix jobs fail fast to save CI minutes
4. **Conditional Steps**: Only builds/pushes on main/develop branches
5. **Artifact Retention**: Test results kept for 30 days, builds for 7 days

## Customization

### Adding New Test Jobs
```yaml
test-new-feature:
  name: Test New Feature
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    # ... your steps
```

### Modifying Deployment
Update the `deploy-staging` and `deploy-production` jobs with your deployment commands:
- Kubernetes: `kubectl apply -f ...`
- Docker Compose: `docker-compose up -d`
- Custom scripts: `./scripts/deploy.sh`

### Adding Environments
Add new environment jobs following the pattern:
```yaml
deploy-preview:
  name: Deploy Preview
  needs: [build-and-push-images]
  if: github.event_name == 'pull_request'
  environment:
    name: preview-${{ github.event.pull_request.number }}
```

## Troubleshooting

### Tests Failing
- Check database connection for server E2E tests
- Verify environment variables are set
- Check Playwright browser installation

### Build Failures
- Ensure Prisma client is generated before build
- Check for missing dependencies
- Verify Dockerfile paths are correct

### Deployment Issues
- Verify environment secrets are configured
- Check deployment permissions
- Review deployment logs

## Best Practices

1. **Keep tests fast**: Unit tests should complete in < 5 minutes
2. **Use caching**: Leverage pnpm and Docker caches
3. **Fail early**: Run linting and unit tests before E2E
4. **Parallelize**: Run independent jobs in parallel
5. **Monitor**: Set up notifications for failed builds

