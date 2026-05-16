import { expect, test } from '@playwright/test';

test('exported JSON can be imported after local data is cleared', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: 'Add Category' }).click();
  await page.getByLabel('Category name').fill('Import Marker');
  await page.getByRole('button', { name: 'Save Category' }).click();
  await expect(page.getByText('Import Marker')).toBeVisible();

  await page.getByRole('button', { name: 'Data' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export JSON' }).click();
  const download = await downloadPromise;
  const backupPath = await download.path();
  expect(backupPath).toBeTruthy();

  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByText('Import Marker')).toHaveCount(0);

  await page.getByRole('button', { name: 'Data' }).click();
  await page.getByLabel('Import JSON file').setInputFiles(backupPath!);
  await expect(page.getByRole('dialog', { name: 'Import summary' })).toBeVisible();
  await page.getByRole('button', { name: 'Overwrite' }).click();
  await expect(page.getByText('JSON backup imported.')).toBeVisible();

  await page.getByRole('button', { name: 'Today' }).click();
  await expect(page.getByText('Import Marker')).toBeVisible();

  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: 'Audit Log' }).click();
  await expect(page.getByText('Imported JSON backup with overwrite mode')).toBeVisible();
});
