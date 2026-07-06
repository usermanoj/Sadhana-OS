import { expect, test } from '@playwright/test';

test('settings data route survives page reload', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: 'Data' }).click();

  await expect(page).toHaveURL(/#\/settings\/data$/);
  await expect(page.getByRole('heading', { name: 'Data' })).toBeVisible();

  await page.reload();

  await expect(page).toHaveURL(/#\/settings\/data$/);
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Data' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Export JSON' })).toBeVisible();
});
