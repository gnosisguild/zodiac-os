import { expect, getExtensionPage, test } from '../utils'

test.describe('Launch route', () => {
  test('it opens the pilot panel with the correct account and is ready to record transactions', async ({
    page,
  }) => {
    // Create a mock callback URL that we can check was called
    const callbackUrl = 'https://example.com/callback'

    // Navigate to the launch route with a test account and callback
    await page.goto(
      `/offline/launch/eth:0x1234123412341234123412341234123412341234/TestAccount?callback=${encodeURIComponent(callbackUrl)}`,
    )

    // Check that we're on the launch page with the correct account info
    await expect(page.getByRole('textbox', { name: 'Account' })).toHaveValue(
      '0x1234123412341234123412341234123412341234',
    )

    // Click the Launch button to open the pilot panel
    await page.getByRole('button', { name: 'Launch' }).click()

    // Wait for the extension to open and show the ad-hoc route
    await expect(page.getByText('Connected', { exact: true })).toBeInViewport()
    const extension = await getExtensionPage(page)
    await expect(extension.getByText('TestAccount')).toBeInViewport()

    // Check that we're recording transactions (the extension should show this state)
    await expect(
      extension.getByRole('heading', { name: 'Recording transactions' }),
    ).toBeInViewport()
  })
})
