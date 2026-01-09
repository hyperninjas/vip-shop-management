# E2E Test Troubleshooting Guide

## Common Issues

### 1. "Process from config.webServer exited early"

This error occurs when the servers fail to start. Common causes:

#### Server Issues:

-   **Database not running**: The server requires a database connection

    ```bash
    # Start database (if using Docker)
    docker-compose up -d postgres

    # Or ensure your DATABASE_URL is correct
    ```

-   **Missing environment variables**: Server needs proper `.env` configuration

    ```bash
    # Check if .env file exists in apps/server/
    # Ensure DATABASE_URL, PORT, etc. are set
    ```

-   **Port already in use**: Another process is using port 4000
    ```bash
    # Check what's using the port
    lsof -i :4000
    # Kill the process or change PORT in .env
    ```

#### Client Issues:

-   **Port already in use**: Another process is using port 3000

    ```bash
    # Check what's using the port
    lsof -i :3000
    # Kill the process or change port
    ```

-   **Next.js build issues**: Client might have compilation errors
    ```bash
    # Try building manually first
    cd apps/client
    pnpm build
    ```

### 2. Manual Server Startup

If automatic server startup fails, you can start servers manually:

```bash
# Terminal 1: Start server
pnpm --filter server start:dev

# Terminal 2: Start client
pnpm --filter client dev

# Terminal 3: Run tests (servers already running)
SKIP_WEBSERVER=true pnpm test:e2e
```

Then update `playwright.config.ts` to skip webServer when `SKIP_WEBSERVER` is set.

### 3. Health Check Failures

The server health check uses `/api/health/liveness` which doesn't require database. If this fails:

1. Check server logs for errors
2. Verify the server is actually starting
3. Check if the port is correct
4. Verify environment variables

### 4. Database Connection Issues

If the server can't connect to the database:

```bash
# Check database is running
docker-compose ps

# Check DATABASE_URL format
# Should be: postgresql://user:password@host:port/database

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

## Debugging Tips

### Enable Verbose Logging

Update `playwright.config.ts`:

```typescript
webServer: [
    {
        command: "pnpm --filter server start:dev",
        url: "http://localhost:4000/api/health/liveness",
        stdout: "pipe", // Change from 'ignore' to see logs
        stderr: "pipe", // Change from 'ignore' to see errors
    },
];
```

### Run Tests with UI Mode

See what's happening in real-time:

```bash
pnpm test:e2e:ui
```

### Check Server Status Manually

```bash
# Test server health
curl http://localhost:4000/api/health/liveness

# Test client
curl http://localhost:3000
```

## Best Practices

1. **Start servers manually in development**: More control and better error visibility
2. **Use CI for automated testing**: Let CI handle server startup
3. **Check logs first**: Server stderr/stdout will show the actual error
4. **Verify environment**: Ensure all required env vars are set
5. **Database first**: Make sure database is running before starting server

## Quick Fixes

```bash
# 1. Kill processes on ports
lsof -ti:3000 | xargs kill -9
lsof -ti:4000 | xargs kill -9

# 2. Start fresh
pnpm install
pnpm --filter server prisma:generate

# 3. Start database
docker-compose up -d postgres

# 4. Run tests
pnpm test:e2e
```
