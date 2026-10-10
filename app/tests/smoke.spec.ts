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
  await expect(page.getByText('Gross merchandise value')).toBeVisible();
  await expect(page.getByText('Average order value')).toBeVisible();
  await expect(page.getByText('Data through')).toBeVisible();
});

test('products page lists the catalog', async ({ page }) => {
  await page.goto('/products');
  await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'New product' })).toBeVisible();
  await expect(page.getByRole('table')).toBeVisible();
  await expect(page.getByText(/products? in the catalog view/)).toBeVisible();
});

test('explore page offers Genie questions', async ({ page }) => {
  await page.goto('/explore');
  await expect(page.getByRole('heading', { name: 'Explore' })).toBeVisible();
  await expect(page.getByLabel('Question for Genie')).toBeVisible();
});

test('assistant page offers suggestions and a composer', async ({ page }) => {
  await page.goto('/assistant');
  await expect(page.getByRole('heading', { name: 'Assistant' })).toBeVisible();
  await expect(page.getByLabel('Message for the assistant')).toBeVisible();
  await expect(page.getByRole('button', { name: /Find active products/ })).toBeVisible();
});
