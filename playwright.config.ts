import {
    defineConfig,
    devices,
    type PlaywrightTestConfig,
} from "@playwright/test";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
const config: PlaywrightTestConfig = {
    testDir: "./e2e",
    /* Run tests in files in parallel */
    fullyParallel: true,
    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env.CI,
    /* Retry on CI only */
    retries: process.env.CI ? 2 : 0,
    /* Opt out of parallel tests on CI. */
    workers: process.env.CI ? 1 : undefined,
    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: [["html"], ["list"], process.env.CI ? ["github"] : ["list"]],
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        /* Base URL to use in actions like `await page.goto('/')`. */
        baseURL:
            process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000",
        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: "on-first-retry",
        screenshot: "only-on-failure",
    },

    /* Configure projects for major browsers */
    projects: [
        // Client E2E tests - testing the Next.js frontend
        {
            name: "client",
            testDir: "./e2e/client",
            use: {
                ...devices["Desktop Chrome"],
                baseURL: process.env.CLIENT_URL || "http://localhost:3000",
            },
        },

        // Server API E2E tests - testing the NestJS backend
        {
            name: "server",
            testDir: "./e2e/server",
            use: {
                baseURL: process.env.SERVER_URL || "http://localhost:4000",
            },
        },

        // Browser-specific tests for client
        {
            name: "client-chromium",
            testDir: "./e2e/client",
            use: {
                ...devices["Desktop Chrome"],
                baseURL: process.env.CLIENT_URL || "http://localhost:3000",
            },
        },

        {
            name: "client-firefox",
            testDir: "./e2e/client",
            use: {
                ...devices["Desktop Firefox"],
                baseURL: process.env.CLIENT_URL || "http://localhost:3000",
            },
        },

        {
            name: "client-webkit",
            testDir: "./e2e/client",
            use: {
                ...devices["Desktop Safari"],
                baseURL: process.env.CLIENT_URL || "http://localhost:3000",
            },
        },

        // Mobile viewport tests
        {
            name: "client-mobile-chrome",
            testDir: "./e2e/client",
            use: {
                ...devices["Pixel 5"],
                baseURL: process.env.CLIENT_URL || "http://localhost:3000",
            },
        },

        {
            name: "client-mobile-safari",
            testDir: "./e2e/client",
            use: {
                ...devices["iPhone 12"],
                baseURL: process.env.CLIENT_URL || "http://localhost:3000",
            },
        },
    ],
};

// Add webServer only if not skipped
// To skip: SKIP_WEBSERVER=true pnpm test:e2e
if (!process.env.SKIP_WEBSERVER) {
    config.webServer = [
        {
            command: "pnpm --filter server start:dev",
            url: `${
                process.env.SERVER_URL || "http://localhost:4000"
            }/api/health/liveness`,
            reuseExistingServer: !process.env.CI,
            timeout: 120 * 1000,
            stdout: "pipe",
            stderr: "pipe",
            env: {
                ...process.env,
                NODE_ENV: process.env.NODE_ENV || "test",
            },
        },
        {
            command: "pnpm --filter client dev",
            url: process.env.CLIENT_URL || "http://localhost:3000",
            reuseExistingServer: !process.env.CI,
            timeout: 120 * 1000,
            stdout: "pipe",
            stderr: "pipe",
            env: {
                ...process.env,
                NODE_ENV: process.env.NODE_ENV || "test",
            },
        },
    ];
}

export default defineConfig(config);
