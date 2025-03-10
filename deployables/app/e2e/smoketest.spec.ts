import { expect, loadExtension, test } from './utils'

test('connection to companion app', async ({ page }) => {
  await page.goto('/create')

  await loadExtension(page)

  await expect(
    page.getByRole('heading', { name: 'New Account' }),
  ).toBeInViewport()
})
