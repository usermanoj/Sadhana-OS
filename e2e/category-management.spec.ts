import { expect, test } from '@playwright/test';

test('category archive and restore flow stays usable on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: 'Add Category' }).click();
  await page.getByLabel('Category name').fill('Breath Practice');
  await page.getByRole('button', { name: 'Save Category' }).click();
  await expect(page.getByText('Breath Practice')).toBeVisible();

  await page.getByRole('button', { name: 'Edit Breath Practice' }).click();
  await page.getByLabel('New practice name').fill('Morning breath');
  await page.getByRole('button', { name: 'Add Practice' }).click();
  await page.getByLabel('New practice name').fill('Evening breath');
  await page.getByRole('button', { name: 'Add Practice' }).click();
  await expect(page.getByText('Morning breath')).toBeVisible();
  await expect(page.getByText('Evening breath')).toBeVisible();

  await page.getByRole('button', { name: 'Cancel' }).click();
  await page.getByRole('button', { name: 'Today' }).click();
  await expect(page.getByText('Breath Practice')).toBeVisible();

  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: 'Archive Breath Practice' }).click();
  await page.getByRole('button', { name: 'Today' }).click();
  await expect(page.getByText('Breath Practice')).toBeHidden();

  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: 'Restore Breath Practice' }).click();
  await page.getByRole('button', { name: 'Today' }).click();
  await expect(page.getByText('Breath Practice')).toBeVisible();

  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: 'Audit Log' }).click();
  await expect(page.getByText('Created category "Breath Practice"')).toBeVisible();
  await expect(page.getByText('Archived category "Breath Practice"')).toBeVisible();
  await expect(page.getByText('Restored category "Breath Practice"')).toBeVisible();
});
