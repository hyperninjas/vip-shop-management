# CI/CD Pipeline - Complete Step-by-Step Guide

## 📋 What Happens When You Push Code

### **Phase 1: Code Quality & Testing (Runs in Parallel)**

#### **Job 1: Lint Code** ⚡ (Fast - ~2 minutes)
```
1. Checks out your code
2. Sets up pnpm 10.25.0
3. Sets up Node.js 20
4. Installs dependencies
5. Runs: pnpm lint (checks both client & server)
```
**Result**: ✅ Pass or ❌ Fail (blocks if fails)

---

#### **Job 2: Unit Tests** 🧪 (Parallel - ~5 minutes)
Runs **TWO** parallel jobs:
- **Client Unit Tests**: Jest tests for React/Next.js components
- **Server Unit Tests**: Jest tests for NestJS services/controllers

**For each:**
```
1. Checks out code
2. Sets up pnpm & Node.js
3. Installs dependencies
4. (Server only) Generates Prisma Client
5. Runs: pnpm test:client OR pnpm test:server
6. (Server only) Uploads coverage to Codecov
```
**Result**: ✅ Both must pass or ❌ Pipeline stops

---

#### **Job 3: Server E2E Tests** 🔌 (~8 minutes)
```
1. Starts PostgreSQL 18 container (test database)
2. Checks out code
3. Sets up pnpm & Node.js
4. Installs dependencies
5. Generates Prisma Client
6. Runs database migrations
7. Installs Playwright browsers
8. Runs: pnpm test:e2e:server (API endpoint tests)
9. Uploads test results
```
**Result**: ✅ Pass or ❌ Fail (blocks if fails)

---

#### **Job 4: Client E2E Tests** 🎭 (~10 minutes)
```
1. Checks out code
2. Sets up pnpm & Node.js
3. Installs dependencies
4. Installs Playwright browsers
5. Runs: SKIP_WEBSERVER=true pnpm test:e2e:client
   (Tests frontend - assumes servers running separately)
6. Uploads test results
```
**Result**: ✅ Pass or ❌ Fail (blocks if fails)

---

#### **Job 5: Security Scan** 🔒 (~3 minutes)
```
1. Checks out code
2. Runs Snyk vulnerability scan
```
**Result**: ⚠️ Warning (doesn't block - `continue-on-error: true`)

---

### **Phase 2: Build (Only if Phase 1 passes)**

#### **Job 6: Build Applications** 🏗️ (~10 minutes)
```
1. Checks out code
2. Sets up pnpm & Node.js
3. Installs dependencies
4. Generates Prisma Client
5. Runs: pnpm build (builds both client & server)
6. Uploads build artifacts (dist/ and .next/)
```
**Result**: ✅ Build artifacts ready

---

### **Phase 3: Docker Images (Only on push to main/develop)**

#### **Job 7: Build and Push Docker Images** 🐳 (~15 minutes)
Runs **TWO** parallel jobs (one for each service):
- **Server Image**: Builds `apps/server/Dockerfile`
- **Client Image**: Builds `apps/client/Dockerfile`

**For each:**
```
1. Checks out code
2. Sets up Docker Buildx
3. Logs into GitHub Container Registry (ghcr.io)
4. Extracts image metadata (tags, labels)
5. Builds Docker image with caching
6. Pushes to: ghcr.io/your-repo/server:latest
              ghcr.io/your-repo/client:latest
```
**Image Tags Created:**
- `main-latest` or `develop-latest` (branch name)
- `main-abc1234` (branch + commit SHA)
- `latest` (only on main branch)
- Semantic version tags (if you use versioning)

**Result**: ✅ Images pushed to registry

---

### **Phase 4: Deployment (Only if images built successfully)**

#### **Job 8a: Deploy to Staging** 🚀 (Only on `develop` branch)
```
1. Runs deployment commands
   (Currently just echo - YOU NEED TO ADD REAL COMMANDS)
```
**Result**: ✅ Deployed to staging

#### **Job 8b: Deploy to Production** 🚀 (Only on `main` branch)
```
1. Runs deployment commands
   (Currently just echo - YOU NEED TO ADD REAL COMMANDS)
```
**Result**: ✅ Deployed to production

---

## 🎯 What You Need to Do Next

### **Step 1: Commit and Push the Pipeline** ✅
```bash
git add .github/workflows/ci-cd.yml
git commit -m "feat: add CI/CD pipeline"
git push origin develop  # or main
```

### **Step 2: Verify Pipeline Runs** ✅
1. Go to GitHub → Your Repository
2. Click "Actions" tab
3. You should see "CI/CD Pipeline" running
4. Watch it execute each job

### **Step 3: Add Secrets (Optional but Recommended)** 🔐

Go to: **Settings → Secrets and variables → Actions**

Add these secrets if needed:
- `SNYK_TOKEN` - Only if you want security scanning (get from snyk.io)
- `NEXT_PUBLIC_API_URL` - Your API URL for client builds

**Note**: `GITHUB_TOKEN` is automatically provided by GitHub

---

## ⚙️ What Needs to Be Modified

### **1. Client E2E Tests - CRITICAL FIX** ⚠️

**Problem**: Client E2E tests use `SKIP_WEBSERVER=true`, meaning they expect servers to already be running.

**Current (Line 173):**
```yaml
- name: Run E2E tests (client)
  run: SKIP_WEBSERVER=true pnpm test:e2e:client
```

**Option A: Start Servers in CI** (Recommended)
```yaml
- name: Start server in background
  run: |
    pnpm --filter server start:dev &
    sleep 10  # Wait for server to start
  env:
    DATABASE_URL: postgresql://postgres:postgres@localhost:5432/testdb

- name: Start client in background
  run: |
    pnpm --filter client dev &
    sleep 15  # Wait for client to start

- name: Run E2E tests (client)
  run: pnpm test:e2e:client
  env:
    CLIENT_URL: http://localhost:3000
    SERVER_URL: http://localhost:4000
```

**Option B: Use Service Containers** (More complex but cleaner)
Add services section to `test-client-e2e` job similar to server E2E.

---

### **2. Deployment Commands - REQUIRED** 🚀

**Current (Lines 303-307 and 319-323):**
```yaml
- name: Deploy to staging
  run: |
    echo "Deploy to staging environment"
    # Add your deployment commands here
```

**Replace with your actual deployment method:**

#### **Option A: Docker Compose**
```yaml
- name: Deploy to staging
  run: |
    docker-compose -f docker-compose.staging.yml pull
    docker-compose -f docker-compose.staging.yml up -d
  env:
    DOCKER_COMPOSE_FILE: docker-compose.staging.yml
```

#### **Option B: Kubernetes**
```yaml
- name: Deploy to staging
  run: |
    kubectl set image deployment/server server=${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}-server:develop
    kubectl set image deployment/client client=${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}-client:develop
    kubectl rollout status deployment/server
    kubectl rollout status deployment/client
  env:
    KUBECONFIG: ${{ secrets.KUBECONFIG }}
```

#### **Option C: Custom Script**
```yaml
- name: Deploy to staging
  run: |
    chmod +x scripts/deploy.sh
    ./scripts/deploy.sh staging
  env:
    DEPLOY_TOKEN: ${{ secrets.DEPLOY_TOKEN }}
```

---

### **3. Update Environment URLs** 🌐

**Current (Lines 300 and 316):**
```yaml
url: https://staging.example.com  # Change this!
url: https://example.com  # Change this!
```

**Replace with your actual URLs:**
```yaml
url: https://staging.yourdomain.com
url: https://yourdomain.com
```

---

### **4. Database Migrations - VERIFY** ✅

**Current (Line 126):**
```yaml
- name: Run database migrations
  run: |
    cd apps/server
    pnpm exec prisma migrate deploy
```

**Verify this works** - If you use a different migration command, update it:
- `prisma migrate deploy` - For production migrations
- `prisma migrate dev` - For development (not recommended in CI)
- `prisma db push` - For prototyping (not recommended in CI)

---

### **5. Coverage Reports - OPTIONAL** 📊

**Current (Lines 73-80):**
```yaml
- name: Upload coverage reports
  uses: codecov/codecov-action@v4
```

**If you don't use Codecov:**
- Remove this step, OR
- Replace with your coverage service (Coveralls, SonarCloud, etc.)

---

### **6. Security Scan - OPTIONAL** 🔒

**Current (Lines 193-199):**
```yaml
- name: Run Snyk to check for vulnerabilities
  uses: snyk/actions/node@master
  env:
    SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

**If you don't use Snyk:**
- Remove the entire `security-scan` job, OR
- Replace with GitHub's Dependabot (already built-in)

---

## 📝 Quick Checklist

- [ ] Commit and push the pipeline file
- [ ] Verify pipeline runs successfully
- [ ] Fix client E2E tests (add server startup)
- [ ] Add real deployment commands
- [ ] Update environment URLs
- [ ] (Optional) Add SNYK_TOKEN secret
- [ ] (Optional) Configure Codecov
- [ ] Test on a feature branch first

---

## 🚨 Common Issues & Fixes

### Issue 1: "Client E2E tests fail - connection refused"
**Fix**: Add server startup steps (see modification #1 above)

### Issue 2: "Docker build fails - file not found"
**Fix**: Verify Dockerfile paths are correct:
- `apps/server/Dockerfile` ✅
- `apps/client/Dockerfile` ✅

### Issue 3: "Deployment fails - permission denied"
**Fix**: Add deployment secrets/permissions to GitHub Actions

### Issue 4: "Prisma migrations fail"
**Fix**: Ensure DATABASE_URL is set correctly in all steps

---

## 🎉 Success Criteria

Your pipeline is working correctly when:
1. ✅ All tests pass
2. ✅ Build completes successfully
3. ✅ Docker images are pushed to ghcr.io
4. ✅ Deployment runs (even if just echo for now)

---

## 📚 Next Steps After Setup

1. **Monitor**: Watch pipeline runs in GitHub Actions
2. **Optimize**: Add more caching if builds are slow
3. **Enhance**: Add notifications (Slack, email, etc.)
4. **Scale**: Add more environments (preview, QA, etc.)

