import { expect, test } from "@playwright/test";

test.describe("Server API E2E Tests", () => {
    const baseURL = process.env.SERVER_URL || "http://localhost:4000";

    test("health check endpoint should return 200", async ({ request }) => {
        const response = await request.get(`${baseURL}/api/health`);

        expect(response.status()).toBe(200);
        const body = await response.json();

        // The health check endpoint returns a nested structure
        expect(body).toHaveProperty("data");
        expect(body.data).toHaveProperty("status");
        expect(body.data.status).toBe("ok");
        expect(body).toHaveProperty("success");
        expect(body.success).toBe(true);
    });

    test("API should handle errors gracefully", async ({ request }) => {
        // Example: Test a non-existent endpoint
        const response = await request.get(`${baseURL}/api/non-existent`);

        // Adjust based on your API's error handling
        expect([404, 400, 500]).toContain(response.status());
    });

    test("API should return proper content type", async ({ request }) => {
        const response = await request.get(`${baseURL}/api/health`);

        expect(response.status()).toBe(200);
        const contentType = response.headers()["content-type"];
        expect(contentType).toContain("application/json");
    });

    test("liveness endpoint should return simple status", async ({
        request,
    }) => {
        const response = await request.get(`${baseURL}/api/health/liveness`);

        expect(response.status()).toBe(200);
        const body = await response.json();

        // Liveness endpoint also returns a nested structure (wrapped by NestJS)
        expect(body).toHaveProperty("data");
        expect(body.data).toHaveProperty("status");
        expect(body.data.status).toBe("ok");
        expect(body.data).toHaveProperty("timestamp");
        expect(body).toHaveProperty("success");
        expect(body.success).toBe(true);
    });

    // Add more API tests here
    // Example: Authentication, CRUD operations, etc.
});
