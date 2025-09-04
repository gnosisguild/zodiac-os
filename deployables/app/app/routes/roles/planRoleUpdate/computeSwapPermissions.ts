import { RoleActionAsset } from '@zodiac/db/schema'
import { Permission, encodeKey as encodeRoleKey } from 'zodiac-roles-sdk'
import { allowCowOrderSigning } from 'zodiac-roles-sdk/swaps'

export const computeSwapPermissions = (
  assets: RoleActionAsset[],
): Permission[] => {
  if (assets.length === 0) {
    return []
  }

  const permissions = allowCowOrderSigning({
    sell: assets
      .filter((asset) => asset.allowSell && asset.allowance == null)
      .map((asset) => asset.address),
    buy: assets
      .filter((asset) => asset.allowBuy && asset.allowance == null)
      .map((asset) => asset.address),
  })

  return [
    ...permissions,
    ...sellAndBuyWithAllowance(assets),
    ...sellWithAllowanceBuyWithoutAllowance(assets),
    ...sellWithoutAllowanceAndBuyWithAllowance(assets),
  ]
}

const sellAndBuyWithAllowance = (assets: RoleActionAsset[]) => {
  const sellAssets = assets.filter(
    (asset) => asset.allowSell && asset.allowance != null,
  )
  const buyAssets = assets.filter(
    (asset) => asset.allowBuy && asset.allowance != null,
  )

  return sellAssets.reduce<Permission[]>(
    (result, assetToSell) =>
      buyAssets.reduce<Permission[]>(
        (result, assetToBuy) => [
          ...result,
          ...allowCowOrderSigning({
            sell: [assetToSell.address],
            buy: [assetToBuy.address],
            sellAllowance: encodeRoleKey(assetToSell.allowanceKey),
            buyAllowance: encodeRoleKey(assetToBuy.allowanceKey),
          }),
        ],
        result,
      ),
    [],
  )
}

const sellWithAllowanceBuyWithoutAllowance = (
  assets: RoleActionAsset[],
): Permission[] => {
  const sellAssetsWithAllowance = assets.filter(
    (asset) => asset.allowSell && asset.allowance != null,
  )
  const buyAssetsWithoutAllowance = assets.filter(
    (asset) => asset.allowBuy && asset.allowance == null,
  )

  return sellAssetsWithAllowance.reduce<Permission[]>(
    (result, assetToSell) => [
      ...result,
      ...allowCowOrderSigning({
        sell: [assetToSell.address],
        sellAllowance: encodeRoleKey(assetToSell.allowanceKey),
        buy: buyAssetsWithoutAllowance.map((assetToBuy) => assetToBuy.address),
      }),
    ],
    [],
  )
}

const sellWithoutAllowanceAndBuyWithAllowance = (
  assets: RoleActionAsset[],
): Permission[] => {
  const sellAssetsWithoutAllowance = assets.filter(
    (asset) => asset.allowSell && asset.allowance == null,
  )
  const buyAssetsWithAllowance = assets.filter(
    (asset) => asset.allowBuy && asset.allowance != null,
  )

  return buyAssetsWithAllowance.reduce<Permission[]>(
    (result, assetToBuy) => [
      ...result,
      ...allowCowOrderSigning({
        buy: [assetToBuy.address],
        buyAllowance: encodeRoleKey(assetToBuy.allowanceKey),
        sell: sellAssetsWithoutAllowance.map(
          (assetToSell) => assetToSell.address,
        ),
      }),
    ],
    [],
  )
}
