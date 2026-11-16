import { expect, test } from '@playwright/test';

interface HealthBody {
  data: { database: string };
}

test('health endpoint reports the database as up', async ({ request }) => {
  const response = await request.get('/api/v1/health');
  expect(response.ok()).toBe(true);
  const body = (await response.json()) as HealthBody;
  expect(body.data.database).toBe('up');
});

test('dashboard shows the headline KPIs and freshness', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Business overview' })).toBeVisible();
  await expect(page.getByRole('term').filter({ hasText: 'Gross merchandise value' })).toBeVisible();
  await expect(page.getByText('Average order value').first()).toBeVisible();
  await expect(page.getByText('Data through')).toBeVisible();
});

test('dashboard draws the Brazil state map with a metric switch', async ({ page }) => {
  await page.goto('/');
  const states = page.getByRole('region', { name: 'Customer states' });
  await expect(states.getByRole('radiogroup', { name: 'Map metric' })).toBeVisible();
  await expect(states.locator('figure svg path')).toHaveCount(27);
  await expect(states.getByText(/by state, stronger color is higher/)).toBeVisible();
});

test('products page lists the catalog', async ({ page }) => {
  await page.goto('/products');
  await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'New product' })).toBeVisible();
  await expect(page.getByRole('table')).toBeVisible();
  await expect(page.getByText(/products? in the catalog view/)).toBeVisible();
});

test('the old explore link opens the assistant, the only chat', async ({ page }) => {
  await page.goto('/explore');
  await expect(page).toHaveURL(/\/assistant$/);
  await expect(page.getByRole('heading', { name: 'Assistant' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Explore' })).toHaveCount(0);
});

test('assistant page offers suggestions and a composer', async ({ page }) => {
  await page.goto('/assistant');
  await expect(page.getByRole('heading', { name: 'Assistant' })).toBeVisible();
  await expect(page.getByLabel('Message for the assistant')).toBeVisible();
  await expect(page.getByRole('button', { name: /Find active products/ })).toBeVisible();
});
