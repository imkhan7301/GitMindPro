import { test, expect } from '@playwright/test';

test('home loads and analyze button visible', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Analyze a Repo' })).toBeVisible();
  await expect(page.getByPlaceholder("Paste your company's GitHub repo URL...")).toBeVisible();
});

test('landing hero is visible', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Understand Any Codebase/i })).toBeVisible();
});
