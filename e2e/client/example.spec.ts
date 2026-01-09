import { test, expect } from "@playwright/test";

test.describe("Client E2E Tests", () => {
    test("should load the homepage", async ({ page }) => {
        await page.goto("/");

        // Wait for the page to load
        await page.waitForLoadState("networkidle");

        // Verify page loaded
        await expect(page).toHaveTitle(/.*/);
    });

    test("should display increment button and count on homepage", async ({ page }) => {
        await page.goto("/");

        // Wait for content to load
        await page.waitForLoadState("networkidle");

        // Verify increment button is visible
        const incrementButton = page.getByRole("button", { name: /increment/i });
        await expect(incrementButton).toBeVisible();

        // Verify count display is visible with initial value
        const countDisplay = page.getByText(/count: 0/i);
        await expect(countDisplay).toBeVisible();
    });

    test("should increment count when button is clicked", async ({ page }) => {
        await page.goto("/");
        await page.waitForLoadState("networkidle");

        const incrementButton = page.getByRole("button", { name: /increment/i });
        const countDisplay = page.getByText(/count:/i);

        // Verify initial count is 0
        await expect(countDisplay).toContainText("Count: 0");

        // Click increment button
        await incrementButton.click();

        // Verify count increased to 1
        await expect(countDisplay).toContainText("Count: 1");
    });

    test("should increment count multiple times", async ({ page }) => {
        await page.goto("/");
        await page.waitForLoadState("networkidle");

        const incrementButton = page.getByRole("button", { name: /increment/i });
        const countDisplay = page.getByText(/count:/i);

        // Click multiple times
        await incrementButton.click();
        await incrementButton.click();
        await incrementButton.click();

        // Verify count is 3
        await expect(countDisplay).toContainText("Count: 3");
    });

    test("should maintain count state during page interaction", async ({ page }) => {
        await page.goto("/");
        await page.waitForLoadState("networkidle");

        const incrementButton = page.getByRole("button", { name: /increment/i });
        const countDisplay = page.getByText(/count:/i);

        // Increment to 2
        await incrementButton.click();
        await incrementButton.click();
        await expect(countDisplay).toContainText("Count: 2");

        // Increment again to 3
        await incrementButton.click();
        await expect(countDisplay).toContainText("Count: 3");
    });
});

