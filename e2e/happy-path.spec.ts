import { expect, test } from '@playwright/test';

test('happy path works on an iPhone-sized viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await expect(page.locator('#page-today')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Your next practice' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Balanced plan' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('div[id^="category-"]')).toHaveCount(9);
  await page.getByRole('button', { name: 'Expand 8 Limbs of Yoga' }).click();

  const switches = page.locator('button[role="switch"]');
  await switches.nth(0).click();
  await switches.nth(1).click();
  await switches.nth(2).click();
  await expect(page.getByText('3/42 practices')).toBeVisible();

  await page.getByRole('button', { name: 'Dashboard' }).click();
  await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible();
  await expect(page.locator('.recharts-responsive-container').first()).toBeVisible();

  await page.getByRole('button', { name: 'Journal' }).click();
  await page.getByLabel('Free-form Notes').fill('A steady reflection from the happy path.');
  await page.getByLabel('Free-form Notes').press('Tab');
  await expect.poll(async () =>
    page.evaluate(() => {
      const journal = JSON.parse(localStorage.getItem('sadhana:journal') ?? '{}');
      return Object.values(journal).some((entry) =>
        typeof entry === 'object'
          && entry !== null
          && 'content' in entry
          && entry.content === 'A steady reflection from the happy path.'
      );
    })
  ).toBe(true);

  await page.reload();
  await page.getByRole('button', { name: 'Journal' }).click();
  await expect(page.getByLabel('Free-form Notes')).toHaveValue('A steady reflection from the happy path.');

  await page.getByRole('button', { name: 'History' }).click();
  await expect(page.getByRole('heading', { name: 'History', exact: true })).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Practice History' }).getByText('Yama', { exact: true }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: 'Data' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export JSON' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^sadhana-backup-\d{4}-\d{2}-\d{2}\.json$/);
});
