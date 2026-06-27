import { test, expect } from '@playwright/test'

const ADMIN_EMAIL = process.env.USER1_EMAIL ?? 'admin@test.com'
const ADMIN_PASSWORD = process.env.USER1_PASSWORD ?? 'admin-pass'

test.describe('Login', () => {
  test('redirect to /login when unauthenticated', async ({ page }) => {
    await page.goto('/recetas')
    await expect(page).toHaveURL(/\/login/)
  })

  test('shows error on wrong credentials', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#email', 'wrong@example.com')
    await page.fill('#password', 'wrongpass')
    await page.click('button[type="submit"]')
    await expect(page.locator('p.text-destructive')).toBeVisible()
  })

  test('logs in with valid credentials and redirects to /recetas', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#email', ADMIN_EMAIL)
    await page.fill('#password', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/recetas/, { timeout: 10_000 })
    await expect(page.locator('h2')).toContainText('Recetas')
  })

  test('logout redirects to /login', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('#email', ADMIN_EMAIL)
    await page.fill('#password', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/recetas/)

    // Logout via API
    await page.request.post('/api/auth/logout')
    await page.goto('/recetas')
    await expect(page).toHaveURL(/\/login/)
  })
})
