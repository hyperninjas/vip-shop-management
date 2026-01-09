# E2E Tests

This directory contains end-to-end tests for both the client and server applications using Playwright.

## Structure

```
e2e/
├── client/          # Frontend E2E tests (Next.js)
├── server/          # Backend API E2E tests (NestJS)
└── README.md        # This file
```

## Running Tests

### All E2E Tests
```bash
pnpm test:e2e
```

### Client E2E Tests Only
```bash
pnpm test:e2e:client
```

### Server E2E Tests Only
```bash
pnpm test:e2e:server
```

### With UI Mode
```bash
pnpm test:e2e:ui
```

### Debug Mode
```bash
pnpm test:e2e:debug
```

## Configuration

Tests are configured in `playwright.config.ts` at the root of the monorepo.

### Environment Variables

- `CLIENT_URL`: Base URL for the client application (default: `http://localhost:3000`)
- `SERVER_URL`: Base URL for the server application (default: `http://localhost:4000`)
- `PLAYWRIGHT_TEST_BASE_URL`: Base URL for tests (default: `http://localhost:3000`)
- `CI`: Set to `true` in CI environments to enable retries and other CI-specific settings

## Best Practices

1. **Test Isolation**: Each test should be independent and not rely on other tests
2. **Clean State**: Use fixtures or setup/teardown hooks to ensure clean state
3. **Selectors**: Prefer data-testid attributes for stable selectors
4. **Wait Strategies**: Use Playwright's auto-waiting features instead of manual waits
5. **Page Object Model**: Consider using Page Object Model for complex pages

## Writing Tests

### Client Tests Example
```typescript
import { test, expect } from '@playwright/test';

test('should display user dashboard', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
});
```

### Server API Tests Example
```typescript
import { test, expect } from '@playwright/test';

test('should return user data', async ({ request }) => {
  const response = await request.get('/api/users/1');
  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  expect(data).toHaveProperty('id');
});
```

