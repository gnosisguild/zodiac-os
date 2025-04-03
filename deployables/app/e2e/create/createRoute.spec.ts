import { href } from 'react-router'
import { expect, loadExtension, test } from '../utils'

test.describe('Create new account', () => {
  test('it is possible to create a new route', async ({ page }) => {
    await page.goto(href('/create'))

    const extension = await loadExtension(page)

    await page.getByRole('textbox', { name: 'Label' }).fill('New route')

    await page.getByRole('combobox', { name: 'Chain' }).click()
    await page.getByRole('option', { name: 'Gnosis' }).click()

    const address = '0xB1578ecfA1da7405821095Aa3612158926e6a72a'

    await page.getByRole('combobox', { name: 'Address' }).fill(address)
    await page.getByRole('option', { name: address }).click()

    await page.getByRole('button', { name: 'Create' }).click()

    await expect(extension.getByText('New route')).toBeInViewport()
  })
})
