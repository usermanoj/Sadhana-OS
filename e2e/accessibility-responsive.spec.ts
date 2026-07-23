import { expect, test } from '@playwright/test';

const qaViewports = [
  { name: 'compact mobile', width: 390, height: 844, expectsMobileNav: true },
  { name: 'large mobile', width: 430, height: 932, expectsMobileNav: true },
  { name: 'tablet', width: 768, height: 1024, expectsMobileNav: true },
  { name: 'desktop', width: 1440, height: 900, expectsMobileNav: false },
];

for (const viewport of qaViewports) {
  test(`shell remains readable without horizontal overflow on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await expect(page.locator('#main-content')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Today', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Your next practice' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Today' })).toHaveCount(1);

    if (viewport.expectsMobileNav) {
      await expect(page.locator('#bottom-tab-bar')).toBeVisible();
      await expect(page.locator('#sidebar')).toBeHidden();
    } else {
      await expect(page.locator('#bottom-tab-bar')).toBeHidden();
      await expect(page.locator('#sidebar')).toBeVisible();
    }

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));

    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
  });
}

test('keyboard users can skip directly to main content and move across primary navigation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  const skipLink = page.getByRole('link', { name: 'Skip to main content' });
  await skipLink.focus();
  await expect(skipLink).toBeFocused();

  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();

  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');

  const focusedLabel = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
  expect(focusedLabel).toBeTruthy();
});
