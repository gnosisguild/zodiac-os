# PortfolioItemObject

* `stats` : `Object` - An object with following fields:
  * `asset_usd_value` : `double` - Asset USD value
  * `debt_usd_value` : `double` - Debt USD value
  * `net_usd_value` : `double` - Net asset USD value
* `update_at` : `double` - Update time, possibly from the cache, so the time is not the current value.
* `name` : `string` - The front end is displayed to the user to indicate the corresponding function. The value is one of :
  * `Yield` ,
  * `Deposit`,
    * Similar to Yield but without the daily income
    * Used in more complicated scenarios such as spot positions from DDEX and pools from Pooltogether
  * `Staked`,
    * Deposits and reward tokens are the same. E.g., You can deposit “CAKE” to get the "CAKE" rewards in PancakeSwap.
    * No unlock time
  * `Locked`,
    * Similar to "Staked" but with the unlock time
  * `Farming`,
    * Deposits and reward tokens are differnet
  * `Leveraged Farming` ,
  * `Lending`,
  * `Vesting`,
  * `Rewards`,
  * `Airdrop`
  * `Liquidity Pool`,
    * eg: Curve、Uniswap、1inch、DODO
  * `Options Seller`,
  * `Options Buyer`,
  * `Insurance Seller`,
  * `Insurance Buyer`,
  * `Investment`,
    * TokenSets
  * `Governance`,
  * `Perpetuals` .
  * `NFT Staked`
    * eg. Ape Stake
  * `NFT Liquidity Pool`
    * eg. sudoswap
  * `NFT Lending`
    * eg. BendDao
  * `NFT Fraction`
    * eg. NFTX
  * `NFT P2P Borrower`
  * `NFT P2P Lender`
* `detail_types` : `Array` of `string` - See below.
* `detail` : `Object` - An object with following fields:
  * `supply_token_list` : `Array` of `TokenObject`
  * `reward_token_list` : `Array` of `TokenObject`
  * `borrow_token_list` : `Array` of `TokenObject`
* `proxy_detail` : `Object` - If the field is not empty, the portfolio\_item is a position for the user's agency contract account. An object with following fields:
  * `project`: `Object` - An object with following fields:
    * `id` : `string` - Protocol's id.
    * `name` : `string` - Protocol's name.
    * `site_url` : `string` - Protocol's site url.
    * `logo_url` : `string` - Logo url.
  * `proxy_contract_id` : `string` - The proxy contract address
* `pool`: `Object` - An object with following fields:
  * `controller`: `string` - controller address of pool which the user interactive to.
  * `id`: `string` - Pool's unique id. For most case, it's the same as controller id, but if one controller address has several pools, the id will be used as a field to distinguish the pool. For example, one pool id in `sushiswap farming` can be expressed as `0xc2edad668740f1aa35e4d8f227fb8e17dca888cd:5`, the `5` is the index. You can call contract abi function `poolLength` to retrive the length of pools.
  * `chain`: `string` - Chain's id, eg. `arb`, `eth`, `bsc`
  * `project_id`: `string` - Protocol's id which the pool related to.
* `position_index`: `string` - Unique position id of the user in this pool. If the pool allow user have more than one position, "position\_index" will be available. othewise, there will be no this field.

## **About `detail_types`**

* May return multiple or zero
* Priority increases from left to right, i.e. the most detailed & best user experience types are on the rightmost end
* Typically the client uses the type that has been adapted & has the highest priority
* For multiple reasons, there are no types available on the client side, so only the lowest level of presentation is available to the user based on statistical fields (e.g. net worth)
  * Back-end implementation does not populate detail\_types (rare)
  * The backend fails the automated detection of the type field and removes the type from the detail\_types (rare)
  * A new type appears that has not yet been adapted by the client (more common)

## About the different types of Token

Token can be used in different scenarios (i.e. different detail\_types) with special fields in addition to the generic fields to meet specific needs, such as in the lending example above. A supply\_token in the supply\_token\_list will have an additional field

* amount - the amount of money deposited in the token The borrow\_token in the borrow\_token\_list will have an additional field
* amount - the amount of money borrowed by the token
* is\_collateral - whether the supply\_token can be collateralized.

## About detail\_type

A detail\_type definition consists of two parts

* The fields in detail
* the extended fields of the token in each token\_list

`detail_type` This value is one of `common` , `locked` , `lending` , `leveraged_farming` , `vesting` , `reward` , `options_seller` , `options_buyer`, `insurance_seller` , `insurance_buyer` ,  `perpetuals` ,  `nft_common` ,  `nft_lending`, `nft_fraction` . &#x20;

A \* identifies the field as required, otherwise it is optional. If the optional field has no value, then the field will not exist.

### **common - generic type**

e.g. uniswap2(Liquidity Pool), yearn2(Farm), pooltogether(Deposit) The corresponding names are in brackets, same as below

* \*`supply_token_list` - the value of the token
  * \*`amount`
* `reward_token_list` - reward token
  * \*`amount`
* `borrow_token_list` - debt token
  * \*`amount`
* `description` - description, e.g. Curve's liquidity pool will generally have the community-accepted name 3Pool

### **locked - locked position**

Example bsc\_ellipsis(Locked)

* \*`supply_token_list` - charge token
  * \*`amount`
* \*`unlock_at` - unlock time
* `reward_token_list` - reward token
  * \*`amount`
* `description` - description, e.g. Curve's liquidity pool will generally have the community accepted name 3Pool

```json
{
  "id": "fei",
  "chain": "eth",
  "name": "Fei Protocol",
  "site_url": "https://app.fei.money",
  "logo_url": "https://static.debank.com/image/project/logo_url/fei/422fd342a44237b70ae4107b93c2dd01.png",
  "has_supported_portfolio": true,
  "tvl": 428173039.709026,
  "portfolio_item_list": [
    {
      "stats": {
        "asset_usd_value": 40.2528,
        "debt_usd_value": 0,
        "net_usd_value": 40.2528
      },
      "update_at": 1639642969.2155075,
      "name": "Locked",
      "detail_types": ["locked"],
      "detail": {
        "supply_token_list": [
          {
            "id": "0xbffb152b9392e38cddc275d818a3db7fe364596b",
            "chain": "eth",
            "name": "Fei Genesis Group",
            "symbol": "FGEN",
            "display_symbol": null,
            "optimized_symbol": "FGEN",
            "decimals": 18,
            "logo_url": null,
            "protocol_id": "fei",
            "price": 4025.28,
            "is_verified": true,
            "is_core": true,
            "is_wallet": true,
            "time_at": 1616909486,
            "amount": 0.01
          }
        ],
        "unlock_at": 1617476353
      },
      "proxy_detail": {},
      "pool": {
        "controller": "0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9",
        "id": "0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9",
        "chain": "eth",
        "project_id": "aave2"
      }
    }
  ]
}
```

### **lending - the type of lending**

e.g. aave2(Lending), compound(Lending)

* \*`supply_token_list` - deposit token
  * \*`amount` - the amount of deposits
* \*`borrow_token_list` - borrowing token
  * \*`amount` - number of loans
* `reward_token_list` - reward token
  * `amount` - the amount of rewards
* \*`health_rate` - health factor

```json
{
  "id": "compound",
  "chain": "eth",
  "name": "Compound",
  "site_url": "https://app.compound.finance",
  "logo_url": "https://static.debank.com/image/project/logo_url/compound/0b792243f1f68e9ed082f5a49ee6f21d.png",
  "has_supported_portfolio": true,
  "tvl": 12763095483.420198,
  "portfolio_item_list": [
    {
      "stats": {
        "asset_usd_value": 3.1936420758652284,
        "debt_usd_value": 0.0000030267553188504803,
        "net_usd_value": 3.1936390491099096
      },
      "update_at": 1639643327.1661053,
      "name": "Lending",
      "detail_types": ["lending"],
      "detail": {
        "supply_token_list": [
          {
            "id": "0x6b175474e89094c44da98b954eedeac495271d0f",
            "chain": "eth",
            "name": "Dai Stablecoin",
            "symbol": "DAI",
            "display_symbol": null,
            "optimized_symbol": "DAI",
            "decimals": 18,
            "logo_url": "https://static.debank.com/image/eth_token/logo_url/0x6b175474e89094c44da98b954eedeac495271d0f/549c4205dbb199f1b8b03af783f35e71.png",
            "protocol_id": "makerdao",
            "price": 1,
            "is_verified": true,
            "is_core": true,
            "is_wallet": true,
            "time_at": 1573672677,
            "amount": 2.1778000124879227,
            "is_collateral": true
          },
          {
            "id": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
            "chain": "eth",
            "name": "USD Coin",
            "symbol": "USDC",
            "display_symbol": null,
            "optimized_symbol": "USDC",
            "decimals": 6,
            "logo_url": "https://static.debank.com/image/eth_token/logo_url/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48/adee072b10b0db7c5bd7a28dd4fbe96f.png",
            "protocol_id": "",
            "price": 1,
            "is_verified": true,
            "is_core": true,
            "is_wallet": true,
            "time_at": 1533324504,
            "amount": 1.0158420633773058,
            "is_collateral": true
          }
        ],
        "borrow_token_list": [
          {
            "id": "eth",
            "chain": "eth",
            "name": "ETH",
            "symbol": "ETH",
            "display_symbol": null,
            "optimized_symbol": "ETH",
            "decimals": 18,
            "logo_url": "https://static.debank.com/image/token/logo_url/eth/935ae4e4d1d12d59a99717a24f2540b5.png",
            "protocol_id": "",
            "price": 4021.66,
            "is_verified": true,
            "is_core": true,
            "is_wallet": true,
            "time_at": 1483200000,
            "amount": 7.52613428e-10
          }
        ],
        "health_rate": 844109.745105694
      },
      "proxy_detail": {}
    },
    {
      "stats": {
        "asset_usd_value": 0.20412694047971483,
        "debt_usd_value": 0,
        "net_usd_value": 0.20412694047971483
      },
      "update_at": 1639643327.1773217,
      "name": "Rewards",
      "detail_types": ["reward"],
      "detail": {
        "token_list": [
          {
            "id": "0xc00e94cb662c3520282e6f5717214004a7f26888",
            "chain": "eth",
            "name": "Compound",
            "symbol": "COMP",
            "display_symbol": null,
            "optimized_symbol": "COMP",
            "decimals": 18,
            "logo_url": "https://static.debank.com/image/eth_token/logo_url/0xc00e94cb662c3520282e6f5717214004a7f26888/dd174d3d7083fa027a433dc50edaf0bc.png",
            "protocol_id": "compound",
            "price": 194.64263022881642,
            "is_verified": true,
            "is_core": true,
            "is_wallet": true,
            "time_at": 1583280535,
            "amount": 0.001048726788369788
          }
        ]
      },
      "proxy_detail": {}
    },
    {
      "stats": {
        "asset_usd_value": 4.0234347279462925,
        "debt_usd_value": 0,
        "net_usd_value": 4.0234347279462925
      },
      "update_at": 1639643326.9171333,
      "name": "Lending",
      "detail_types": ["lending"],
      "detail": {
        "supply_token_list": [
          {
            "id": "eth",
            "chain": "eth",
            "name": "ETH",
            "symbol": "ETH",
            "display_symbol": null,
            "optimized_symbol": "ETH",
            "decimals": 18,
            "logo_url": "https://static.debank.com/image/token/logo_url/eth/935ae4e4d1d12d59a99717a24f2540b5.png",
            "protocol_id": "",
            "price": 4021.66,
            "is_verified": true,
            "is_core": true,
            "is_wallet": true,
            "time_at": 1483200000,
            "amount": 0.0010004412923882906,
            "is_collateral": true
          }
        ],
        "borrow_token_list": [],
        "health_rate": null
      },
      "proxy_detail": {
        "project": {
          "id": "instadapp",
          "name": "Instadapp",
          "site_url": "https://instadapp.io",
          "logo_url": "https://static.debank.com/image/project/logo_url/instadapp/0f6a25368dce3552364b43a29cbc1586.png"
        },
        "proxy_contract_id": "0x45593df3bfa53ee18baec198b9954f0b918cfc40"
      }
    },
    {
      "stats": {
        "asset_usd_value": 0.0011735055758092564,
        "debt_usd_value": 0,
        "net_usd_value": 0.0011735055758092564
      },
      "update_at": 1639643326.9288304,
      "name": "Rewards",
      "detail_types": ["reward"],
      "detail": {
        "token_list": [
          {
            "id": "0xc00e94cb662c3520282e6f5717214004a7f26888",
            "chain": "eth",
            "name": "Compound",
            "symbol": "COMP",
            "display_symbol": null,
            "optimized_symbol": "COMP",
            "decimals": 18,
            "logo_url": "https://static.debank.com/image/eth_token/logo_url/0xc00e94cb662c3520282e6f5717214004a7f26888/dd174d3d7083fa027a433dc50edaf0bc.png",
            "protocol_id": "compound",
            "price": 194.64263022881642,
            "is_verified": true,
            "is_core": true,
            "is_wallet": true,
            "time_at": 1583280535,
            "amount": 0.000006029026500668
          }
        ]
      },
      "proxy_detail": {
        "project": {
          "id": "instadapp",
          "name": "Instadapp",
          "site_url": "https://instadapp.io",
          "logo_url": "https://static.debank.com/image/project/logo_url/instadapp/0f6a25368dce3552364b43a29cbc1586.png"
        },
        "proxy_contract_id": "0x45593df3bfa53ee18baec198b9954f0b918cfc40"
      }
    },
    {
      "stats": {
        "asset_usd_value": 2.1289871979769353,
        "debt_usd_value": 1.3024714991314075,
        "net_usd_value": 0.8265156988455278
      },
      "update_at": 1639643327.0022216,
      "name": "Lending",
      "detail_types": ["lending"],
      "detail": {
        "supply_token_list": [
          {
            "id": "0x6b175474e89094c44da98b954eedeac495271d0f",
            "chain": "eth",
            "name": "Dai Stablecoin",
            "symbol": "DAI",
            "display_symbol": null,
            "optimized_symbol": "DAI",
            "decimals": 18,
            "logo_url": "https://static.debank.com/image/eth_token/logo_url/0x6b175474e89094c44da98b954eedeac495271d0f/549c4205dbb199f1b8b03af783f35e71.png",
            "protocol_id": "makerdao",
            "price": 1,
            "is_verified": true,
            "is_core": true,
            "is_wallet": true,
            "time_at": 1573672677,
            "amount": 2.1289871979769353,
            "is_collateral": true
          }
        ],
        "borrow_token_list": [
          {
            "id": "0x0d8775f648430679a709e98d2b0cb6250d2887ef",
            "chain": "eth",
            "name": "Basic Attention Token",
            "symbol": "BAT",
            "display_symbol": null,
            "optimized_symbol": "BAT",
            "decimals": 18,
            "logo_url": "https://static.debank.com/image/eth_token/logo_url/0x0d8775f648430679a709e98d2b0cb6250d2887ef/c5913bbde8a620ce2a47d8c4694e7dbb.png",
            "protocol_id": "",
            "price": 1.1651,
            "is_verified": true,
            "is_core": true,
            "is_wallet": true,
            "time_at": 1496083510,
            "amount": 1.117905329269082
          }
        ],
        "health_rate": 1.3076599061993848
      },
      "proxy_detail": {
        "project": {
          "id": "instadapp",
          "name": "Instadapp",
          "site_url": "https://instadapp.io",
          "logo_url": "https://static.debank.com/image/project/logo_url/instadapp/0f6a25368dce3552364b43a29cbc1586.png"
        },
        "proxy_contract_id": "0xecfcdfc4cf022e6e2cf390ae06bd1eee9ccb965d"
      }
    },
    {
      "stats": {
        "asset_usd_value": 0.09909788513640833,
        "debt_usd_value": 0,
        "net_usd_value": 0.09909788513640833
      },
      "update_at": 1639643327.0104644,
      "name": "Rewards",
      "detail_types": ["reward"],
      "detail": {
        "token_list": [
          {
            "id": "0xc00e94cb662c3520282e6f5717214004a7f26888",
            "chain": "eth",
            "name": "Compound",
            "symbol": "COMP",
            "display_symbol": null,
            "optimized_symbol": "COMP",
            "decimals": 18,
            "logo_url": "https://static.debank.com/image/eth_token/logo_url/0xc00e94cb662c3520282e6f5717214004a7f26888/dd174d3d7083fa027a433dc50edaf0bc.png",
            "protocol_id": "compound",
            "price": 194.64263022881642,
            "is_verified": true,
            "is_core": true,
            "is_wallet": true,
            "time_at": 1583280535,
            "amount": 0.000509127342863748
          }
        ]
      },
      "proxy_detail": {
        "project": {
          "id": "instadapp",
          "name": "Instadapp",
          "site_url": "https://instadapp.io",
          "logo_url": "https://static.debank.com/image/project/logo_url/instadapp/0f6a25368dce3552364b43a29cbc1586.png"
        },
        "proxy_contract_id": "0xecfcdfc4cf022e6e2cf390ae06bd1eee9ccb965d"
      }
    },
    {
      "stats": {
        "asset_usd_value": 1.0768181423571452,
        "debt_usd_value": 0,
        "net_usd_value": 1.0768181423571452
      },
      "update_at": 1639643327.0933123,
      "name": "Lending",
      "detail_types": ["lending"],
      "detail": {
        "supply_token_list": [
          {
            "id": "0x6b175474e89094c44da98b954eedeac495271d0f",
            "chain": "eth",
            "name": "Dai Stablecoin",
            "symbol": "DAI",
            "display_symbol": null,
            "optimized_symbol": "DAI",
            "decimals": 18,
            "logo_url": "https://static.debank.com/image/eth_token/logo_url/0x6b175474e89094c44da98b954eedeac495271d0f/549c4205dbb199f1b8b03af783f35e71.png",
            "protocol_id": "makerdao",
            "price": 1,
            "is_verified": true,
            "is_core": true,
            "is_wallet": true,
            "time_at": 1573672677,
            "amount": 1.0768181423571452,
            "is_collateral": false
          }
        ],
        "borrow_token_list": [],
        "health_rate": null
      },
      "proxy_detail": {
        "project": {
          "id": "makerdao",
          "name": "Maker",
          "site_url": "https://oasis.app",
          "logo_url": "https://static.debank.com/image/project/logo_url/makerdao/3821328c7c6d5ac4fc87e2c2e4d1c684.png"
        },
        "proxy_contract_id": "0x47b9a12e33ea26d583f56e7b53cabe89cc2a1212"
      }
    },
    {
      "stats": {
        "asset_usd_value": 0.04932694529757137,
        "debt_usd_value": 0,
        "net_usd_value": 0.04932694529757137
      },
      "update_at": 1639643327.1036785,
      "name": "Rewards",
      "detail_types": ["reward"],
      "detail": {
        "token_list": [
          {
            "id": "0xc00e94cb662c3520282e6f5717214004a7f26888",
            "chain": "eth",
            "name": "Compound",
            "symbol": "COMP",
            "display_symbol": null,
            "optimized_symbol": "COMP",
            "decimals": 18,
            "logo_url": "https://static.debank.com/image/eth_token/logo_url/0xc00e94cb662c3520282e6f5717214004a7f26888/dd174d3d7083fa027a433dc50edaf0bc.png",
            "protocol_id": "compound",
            "price": 194.64263022881642,
            "is_verified": true,
            "is_core": true,
            "is_wallet": true,
            "time_at": 1583280535,
            "amount": 0.00025342313366596
          }
        ]
      },
      "proxy_detail": {
        "project": {
          "id": "makerdao",
          "name": "Maker",
          "site_url": "https://oasis.app",
          "logo_url": "https://static.debank.com/image/project/logo_url/makerdao/3821328c7c6d5ac4fc87e2c2e4d1c684.png"
        },
        "proxy_contract_id": "0x47b9a12e33ea26d583f56e7b53cabe89cc2a1212"
      }
    }
  ]
}
```

### leveraged\_farming **- leveraged mining**

For example alpha (Farming)

* \*`supply_token_list` - deposit token
  * \*`amount` - amount of deposits
* \*`borrow_token_list` - borrow token
  * \*`amount` - amount of money borrowed
* \*`debt_ratio` - debt ratio

```json
{
  "id": "alpha2",
  "chain": "eth",
  "name": "Alpha Homora V2",
  "site_url": "https://homora-v2.alphafinance.io",
  "logo_url": "https://static.debank.com/image/project/logo_url/alpha2/07b6b9df8fdc9d29801cf461e14f8790.png",
  "has_supported_portfolio": true,
  "tvl": 0,
  "portfolio_item_list": [
    {
      "stats": {
        "asset_usd_value": 19.334538984053285,
        "debt_usd_value": 0,
        "net_usd_value": 19.334538984053285
      },
      "update_at": 1639643523.347684,
      "name": "Yield",
      "detail_types": ["common"],
      "detail": {
        "supply_token_list": [
          {
            "id": "0x514910771af9ca656af840dff83e8264ecf986ca",
            "chain": "eth",
            "name": "ChainLink Token",
            "symbol": "LINK",
            "display_symbol": null,
            "optimized_symbol": "LINK",
            "decimals": 18,
            "logo_url": "https://static.debank.com/image/eth_token/logo_url/0x514910771af9ca656af840dff83e8264ecf986ca/69425617db0ef93a7c21c4f9b81c7ca5.png",
            "protocol_id": "chainlink",
            "price": 19.7113,
            "is_verified": true,
            "is_core": true,
            "is_wallet": true,
            "time_at": 1505597189,
            "amount": 0.9808860391782015
          }
        ]
      },
      "proxy_detail": {}
    },
    {
      "stats": {
        "asset_usd_value": 10.138813052520218,
        "debt_usd_value": 0,
        "net_usd_value": 10.138813052520218
      },
      "update_at": 1639643523.368311,
      "name": "Yield",
      "detail_types": ["common"],
      "detail": {
        "supply_token_list": [
          {
            "id": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
            "chain": "eth",
            "name": "USD Coin",
            "symbol": "USDC",
            "display_symbol": null,
            "optimized_symbol": "USDC",
            "decimals": 6,
            "logo_url": "https://static.debank.com/image/eth_token/logo_url/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48/adee072b10b0db7c5bd7a28dd4fbe96f.png",
            "protocol_id": "",
            "price": 1,
            "is_verified": true,
            "is_core": true,
            "is_wallet": true,
            "time_at": 1533324504,
            "amount": 10.138813052520218
          }
        ]
      },
      "proxy_detail": {}
    },
    {
      "stats": {
        "asset_usd_value": 55.41834444961402,
        "debt_usd_value": 23.895761,
        "net_usd_value": 31.522583449614018
      },
      "update_at": 1639643523.4191692,
      "name": "Leveraged Farming",
      "detail_types": ["leveraged_farming"],
      "detail": {
        "debt_ratio": 0.4311886476819217,
        "supply_token_list": [
          {
            "id": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
            "chain": "eth",
            "name": "USD Coin",
            "symbol": "USDC",
            "display_symbol": null,
            "optimized_symbol": "USDC",
            "decimals": 6,
            "logo_url": "https://static.debank.com/image/eth_token/logo_url/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48/adee072b10b0db7c5bd7a28dd4fbe96f.png",
            "protocol_id": "",
            "price": 1,
            "is_verified": true,
            "is_core": true,
            "is_wallet": true,
            "time_at": 1533324504,
            "amount": 27.692826417425458
          },
          {
            "id": "0xdac17f958d2ee523a2206206994597c13d831ec7",
            "chain": "eth",
            "name": "Tether USD",
            "symbol": "USDT",
            "display_symbol": null,
            "optimized_symbol": "USDT",
            "decimals": 6,
            "logo_url": "https://static.debank.com/image/eth_token/logo_url/0xdac17f958d2ee523a2206206994597c13d831ec7/66eadee7b7bb16b75e02b570ab8d5c01.png",
            "protocol_id": "",
            "price": 1,
            "is_verified": true,
            "is_core": true,
            "is_wallet": true,
            "time_at": 1511829681,
            "amount": 27.72551803218856
          }
        ],
        "borrow_token_list": [
          {
            "id": "0xdac17f958d2ee523a2206206994597c13d831ec7",
            "chain": "eth",
            "name": "Tether USD",
            "symbol": "USDT",
            "display_symbol": null,
            "optimized_symbol": "USDT",
            "decimals": 6,
            "logo_url": "https://static.debank.com/image/eth_token/logo_url/0xdac17f958d2ee523a2206206994597c13d831ec7/66eadee7b7bb16b75e02b570ab8d5c01.png",
            "protocol_id": "",
            "price": 1,
            "is_verified": true,
            "is_core": true,
            "is_wallet": true,
            "time_at": 1511829681,
            "amount": 8.548689
          },
          {
            "id": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
            "chain": "eth",
            "name": "USD Coin",
            "symbol": "USDC",
            "display_symbol": null,
            "optimized_symbol": "USDC",
            "decimals": 6,
            "logo_url": "https://static.debank.com/image/eth_token/logo_url/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48/adee072b10b0db7c5bd7a28dd4fbe96f.png",
            "protocol_id": "",
            "price": 1,
            "is_verified": true,
            "is_core": true,
            "is_wallet": true,
            "time_at": 1533324504,
            "amount": 15.347072
          }
        ]
      },
      "proxy_detail": {}
    }
  ]
}
```

### **vesting - instalment release**

For example bzx2(Vesting)

* \*`token` - release token
  * \*`amount` - current total amount to be released
  * `claimable_amount` - the current number of claims available
* `daily_unlock_amount` - the number of releases per day
* `end_at` - release completion time

```json
{
  "id": "olympusdao",
  "chain": "eth",
  "name": "Olympus",
  "site_url": "https://app.olympusdao.finance",
  "logo_url": "https://static.debank.com/image/project/logo_url/olympusdao/7de5c458c4bcae136daa046eb4ef5b49.png",
  "has_supported_portfolio": true,
  "tvl": 3452083624.9747066,
  "portfolio_item_list": [
    {
      "stats": {
        "asset_usd_value": 462.72964044444984,
        "debt_usd_value": 0,
        "net_usd_value": 462.72964044444984
      },
      "update_at": 1639643755.5289097,
      "name": "Staked",
      "detail_types": ["common"],
      "detail": {
        "supply_token_list": [
          {
            "id": "0x383518188c0c6d7730d91b2c03a03c837814a899",
            "chain": "eth",
            "name": "Olympus",
            "symbol": "OHM",
            "display_symbol": null,
            "optimized_symbol": "OHM",
            "decimals": 9,
            "logo_url": "https://static.debank.com/image/eth_token/logo_url/0x383518188c0c6d7730d91b2c03a03c837814a899/0ad387f86fba0c16654cfb0f720df5d6.png",
            "protocol_id": "olympusdao",
            "price": 404.9456457553985,
            "is_verified": true,
            "is_core": true,
            "is_wallet": true,
            "time_at": 1616366920,
            "amount": 1.142695681
          }
        ]
      },
      "proxy_detail": {}
    },
    {
      "stats": {
        "asset_usd_value": 4.247140798170627,
        "debt_usd_value": 0,
        "net_usd_value": 4.247140798170627
      },
      "update_at": 1639643755.552204,
      "name": "Vesting",
      "detail_types": ["vesting"],
      "detail": {
        "token": {
          "id": "0x383518188c0c6d7730d91b2c03a03c837814a899",
          "chain": "eth",
          "name": "Olympus",
          "symbol": "OHM",
          "display_symbol": null,
          "optimized_symbol": "OHM",
          "decimals": 9,
          "logo_url": "https://static.debank.com/image/eth_token/logo_url/0x383518188c0c6d7730d91b2c03a03c837814a899/0ad387f86fba0c16654cfb0f720df5d6.png",
          "protocol_id": "olympusdao",
          "price": 404.9456457553985,
          "is_verified": true,
          "is_core": true,
          "is_wallet": true,
          "time_at": 1616366920,
          "amount": 0.010488175,
          "claimable_amount": 0.010488175
        }
      },
      "proxy_detail": {}
    }
  ]
}
```

### **reward - combined reward**

Example bxz2(Rewards)

* \*`token_list` - reward token
  * \*`amount`

```json
{
  "id": "bzx2",
  "chain": "eth",
  "name": "bZx",
  "site_url": "https://bzx.network",
  "logo_url": "https://static.debank.com/image/project/logo_url/bzx2/d6d212d2a62576e69030caa618271cb9.png",
  "has_supported_portfolio": true,
  "tvl": 18899312.906230893,
  "portfolio_item_list": [
    {
      "stats": {
        "asset_usd_value": 11.13610744580042,
        "debt_usd_value": 0,
        "net_usd_value": 11.13610744580042
      },
      "update_at": 1639643579.3529913,
      "name": "Lending",
      "detail_types": [
        "common"
      ],
      "detail": {
        "supply_token_list": [
          {
            "id": "0x6b175474e89094c44da98b954eedeac495271d0f",
            "chain": "eth",
            "name": "Dai Stablecoin",
            "symbol": "DAI",
            "display_symbol": null,
            "optimized_symbol": "DAI",
            "decimals": 18,
            "logo_url": "https://static.debank.com/image/eth_token/logo_url/0x6b175474e89094c44da98b954eedeac495271d0f/549c4205dbb199f1b8b03af783f35e71.png",
            "protocol_id": "makerdao",
            "price": 1,
            "is_verified": true,
            "is_core": true,
            "is_wallet": true,
            "time_at": 1573672677,
            "amount": 11.13610744580042
          }
        ]
      },
      "proxy_detail": {}
    },
    {
      "stats": {
        "asset_usd_value": 3.6990247350893855,
        "debt_usd_value": 0,
        "net_usd_value": 3.6990247350893855
      },
      "update_at": 1639643579.3705492,
      "name": "Rewards",
      "detail_types": [
        "reward"
      ],
      "detail": {
        "token_list": [
          {
            "id": "0xb72b31907c1c95f3650b64b2469e08edacee5e8f",
            "chain": "eth",
            "name": "bZx Vesting Token",
            "symbol": "vBZRX",
            "display_symbol": null,
            "optimized_symbol": "vBZRX",
            "decimals": 18,
            "logo_url": "https://static.debank.com/image/token/logo_url/0xb72b31907c1c95f3650b64b2469e08edacee5e8f/03ffd36c7ec2ffa954fa9ed3ac93790b.png",
            "protocol_id": "",
            "price": 0.2715782119251945,
            "is_verified": true,
            "is_core": false,
            "is_wallet": false,
            "time_at": 1594509894,
            "amount": 13.620476800650975
          }
        ]
      },
      "proxy_detail": {}
    }
  ]
}k
```

### **options\_seller - option seller**

* \*`type` - option type, Call or Put
* \*`collateral_token` - collateral
* \*`underlying_token` - the underlying asset
  * \*`amount` - the number of underlying
* \*`strike_token` - the token paid for the exercise of the option
  * \*`amount` - the number of tokens paid on exercise, divided by the number of underlying tokens, which gives the price
* \*`style` - American or European style option
* `exercise_start_at` - the time at which an exercise begins
* \*`exercise_end_at` - the time at which the exercise ends
* \*`is_auto_exercise` - whether the option is automatically exercised at expiry
* \*`exercise_profit` - the profit on the exercise of the option
* `usd_value` - the market price of the option

```json
{
  "id": "bsc_helmet",
  "chain": "bsc",
  "name": "Helmet",
  "site_url": "https://app.helmet.insure",
  "logo_url": "https://static.debank.com/image/project/logo_url/bsc_helmet/49d11226e17a2003e87b300677023f2d.png",
  "has_supported_portfolio": true,
  "tvl": 0,
  "portfolio_item_list": [
    {
      "stats": {
        "asset_usd_value": 96.12000003844801,
        "debt_usd_value": 0,
        "net_usd_value": 96.12000003844801
      },
      "update_at": 1639643880.1258543,
      "name": "Options Seller",
      "detail_types": ["options_seller"],
      "detail": {
        "type": "Put",
        "strike_token": {
          "id": "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
          "chain": "bsc",
          "name": "Wrapped BNB",
          "symbol": "WBNB",
          "display_symbol": null,
          "optimized_symbol": "WBNB",
          "decimals": 18,
          "logo_url": "https://static.debank.com/image/bsc_token/logo_url/0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c/142b5c2f8f2d184afd067e43f583d3e6.png",
          "protocol_id": "",
          "price": 534,
          "is_verified": true,
          "is_core": true,
          "is_wallet": true,
          "time_at": 1599119584,
          "amount": 0.180000000072
        },
        "underlying_token": {
          "id": "0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c",
          "chain": "bsc",
          "name": "BTCB Token",
          "symbol": "BTCB",
          "display_symbol": null,
          "optimized_symbol": "BTCB",
          "decimals": 18,
          "logo_url": "https://static.debank.com/image/bsc_token/logo_url/0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c/6f9302fa889419e4ce8745931d2e19bf.png",
          "protocol_id": "",
          "price": 48812.55,
          "is_verified": true,
          "is_core": true,
          "is_wallet": true,
          "time_at": 1599043687,
          "amount": 0.003
        },
        "collateral_token_list": [
          {
            "id": "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
            "chain": "bsc",
            "name": "Wrapped BNB",
            "symbol": "WBNB",
            "display_symbol": null,
            "optimized_symbol": "WBNB",
            "decimals": 18,
            "logo_url": "https://static.debank.com/image/bsc_token/logo_url/0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c/142b5c2f8f2d184afd067e43f583d3e6.png",
            "protocol_id": "",
            "price": 534,
            "is_verified": true,
            "is_core": true,
            "is_wallet": true,
            "time_at": 1599119584,
            "amount": 0.180000000072
          }
        ],
        "style": "American",
        "is_auto_exercise": false,
        "exercise_end_at": 1621612800,
        "exercise_profit": 0
      },
      "proxy_detail": {}
    },
    {
      "stats": {
        "asset_usd_value": 0.0037380000000000004,
        "debt_usd_value": 0.0033627494017792595,
        "net_usd_value": 0.0003752505982207409
      },
      "update_at": 1639643880.14022,
      "name": "Options Seller",
      "detail_types": ["options_seller"],
      "detail": {
        "type": "Put",
        "strike_token": {
          "id": "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
          "chain": "bsc",
          "name": "Wrapped BNB",
          "symbol": "WBNB",
          "display_symbol": null,
          "optimized_symbol": "WBNB",
          "decimals": 18,
          "logo_url": "https://static.debank.com/image/bsc_token/logo_url/0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c/142b5c2f8f2d184afd067e43f583d3e6.png",
          "protocol_id": "",
          "price": 534,
          "is_verified": true,
          "is_core": true,
          "is_wallet": true,
          "time_at": 1599119584,
          "amount": 0.000007
        },
        "underlying_token": {
          "id": "0x948d2a81086a075b3130bac19e4c6dee1d2e3fe8",
          "chain": "bsc",
          "name": "Helmet.insure Governance Token",
          "symbol": "Helmet",
          "display_symbol": null,
          "optimized_symbol": "Helmet",
          "decimals": 18,
          "logo_url": "https://static.debank.com/image/bsc_token/logo_url/0x948d2a81086a075b3130bac19e4c6dee1d2e3fe8/6767d678292dc57fc23acf11dd92ab21.png",
          "protocol_id": "bsc_helmet",
          "price": 0.10721445663449736,
          "is_verified": true,
          "is_core": true,
          "is_wallet": true,
          "time_at": 1608787453,
          "amount": 0.0035
        },
        "collateral_token_list": [
          {
            "id": "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
            "chain": "bsc",
            "name": "Wrapped BNB",
            "symbol": "WBNB",
            "display_symbol": null,
            "optimized_symbol": "WBNB",
            "decimals": 18,
            "logo_url": "https://static.debank.com/image/bsc_token/logo_url/0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c/142b5c2f8f2d184afd067e43f583d3e6.png",
            "protocol_id": "",
            "price": 534,
            "is_verified": true,
            "is_core": true,
            "is_wallet": true,
            "time_at": 1599119584,
            "amount": 0.000007
          }
        ],
        "style": "American",
        "is_auto_exercise": false,
        "exercise_end_at": 1621612800,
        "exercise_profit": 0.0033627494017792595
      },
      "proxy_detail": {}
    },
    {
      "stats": {
        "asset_usd_value": 0.005360722831724868,
        "debt_usd_value": 0,
        "net_usd_value": 0.005360722831724868
      },
      "update_at": 1639643880.1508927,
      "name": "Options Seller",
      "detail_types": ["options_seller"],
      "detail": {
        "type": "Call",
        "strike_token": {
          "id": "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
          "chain": "bsc",
          "name": "Wrapped BNB",
          "symbol": "WBNB",
          "display_symbol": null,
          "optimized_symbol": "WBNB",
          "decimals": 18,
          "logo_url": "https://static.debank.com/image/bsc_token/logo_url/0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c/142b5c2f8f2d184afd067e43f583d3e6.png",
          "protocol_id": "",
          "price": 534,
          "is_verified": true,
          "is_core": true,
          "is_wallet": true,
          "time_at": 1599119584,
          "amount": 0.0004
        },
        "underlying_token": {
          "id": "0x948d2a81086a075b3130bac19e4c6dee1d2e3fe8",
          "chain": "bsc",
          "name": "Helmet.insure Governance Token",
          "symbol": "Helmet",
          "display_symbol": null,
          "optimized_symbol": "Helmet",
          "decimals": 18,
          "logo_url": "https://static.debank.com/image/bsc_token/logo_url/0x948d2a81086a075b3130bac19e4c6dee1d2e3fe8/6767d678292dc57fc23acf11dd92ab21.png",
          "protocol_id": "bsc_helmet",
          "price": 0.10721445663449736,
          "is_verified": true,
          "is_core": true,
          "is_wallet": true,
          "time_at": 1608787453,
          "amount": 0.05
        },
        "collateral_token_list": [
          {
            "id": "0x948d2a81086a075b3130bac19e4c6dee1d2e3fe8",
            "chain": "bsc",
            "name": "Helmet.insure Governance Token",
            "symbol": "Helmet",
            "display_symbol": null,
            "optimized_symbol": "Helmet",
            "decimals": 18,
            "logo_url": "https://static.debank.com/image/bsc_token/logo_url/0x948d2a81086a075b3130bac19e4c6dee1d2e3fe8/6767d678292dc57fc23acf11dd92ab21.png",
            "protocol_id": "bsc_helmet",
            "price": 0.10721445663449736,
            "is_verified": true,
            "is_core": true,
            "is_wallet": true,
            "time_at": 1608787453,
            "amount": 0.05
          }
        ],
        "style": "American",
        "is_auto_exercise": false,
        "exercise_end_at": 1621612800,
        "exercise_profit": 0
      },
      "proxy_detail": {}
    }
  ]
}
```

### **options\_buyer - the buyer of the option**

Most of the fields are the same, but the collateral\_token field is missing compared to options\_buyer, and the algorithm for calculating net assets is also different

* \*`type` - the type of option, Call or Put
* \*`underlying_token` - the underlying asset
  * \*`amount` - the number of underlying
* \*`strike_token` - the token paid for the exercise
  * \*`amount` - the number of tokens paid for the strike, divided by the number of underlying tokens, which gives the price
* \*`style` - American or European style option
* `exercise_start_at` - the time at which an exercise begins
* \*`exercise_end_at` - the time at which the exercise ends
* \*`is_auto_exercise` - whether the option is automatically exercised at expiry
* \*`exercise_profit` - the profit on the exercise of the option
* `usd_value` - the market price of the right

### **insurance\_seller - the seller of the insurance**

* \*`description` - a text describing what the insurance is about
* \*`collateral_token` - the collateral
  * \*`amount`
* \*`usd_value` - the dollar value of an insurance position
* \*`expired_at` - the time of expiry

### **insurance\_buyer - the buyer of the insurance**

* \*`description` - a text describing what the insurance is about
* \*`usd_value` - the dollar value of the insurance position
* \*`expired_at` - the time of expiry

```json
{
  "id": "cover",
  "chain": "eth",
  "name": "COVER",
  "site_url": "https://app.coverprotocol.com",
  "logo_url": "https://static.debank.com/image/project/logo_url/cover/5cadde1971ba5bf25bc6c6227b4e62e6.png",
  "has_supported_portfolio": true,
  "tvl": 0,
  "portfolio_item_list": [
    {
      "stats": {
        "asset_usd_value": 0,
        "debt_usd_value": 0,
        "net_usd_value": 0
      },
      "update_at": 1639643983.9241874,
      "name": "Insurance Buyer",
      "detail_types": ["insurance_buyer"],
      "detail": {
        "usd_value": 0,
        "expired_at": 1622419200,
        "description": "Insurance for 9.86 DAI on BALANCER"
      },
      "proxy_detail": {}
    },
    {
      "stats": {
        "asset_usd_value": 0,
        "debt_usd_value": 0,
        "net_usd_value": 0
      },
      "update_at": 1639643983.9409096,
      "name": "Insurance Buyer",
      "detail_types": ["insurance_buyer"],
      "detail": {
        "usd_value": 0,
        "expired_at": 1622419200,
        "description": "Insurance for 0.0 DAI on AAVE"
      },
      "proxy_detail": {}
    },
    {
      "stats": {
        "asset_usd_value": 1.236012070630698,
        "debt_usd_value": 0,
        "net_usd_value": 1.236012070630698
      },
      "update_at": 1639643983.9796753,
      "name": "Insurance Seller",
      "detail_types": ["insurance_seller"],
      "detail": {
        "usd_value": 1.236012070630698,
        "expired_at": 1622419200,
        "collateral_token_list": [
          {
            "id": "0x6b175474e89094c44da98b954eedeac495271d0f",
            "chain": "eth",
            "name": "Dai Stablecoin",
            "symbol": "DAI",
            "display_symbol": null,
            "optimized_symbol": "DAI",
            "decimals": 18,
            "logo_url": "https://static.debank.com/image/eth_token/logo_url/0x6b175474e89094c44da98b954eedeac495271d0f/549c4205dbb199f1b8b03af783f35e71.png",
            "protocol_id": "makerdao",
            "price": 1,
            "is_verified": true,
            "is_core": true,
            "is_wallet": true,
            "time_at": 1573672677,
            "amount": 1.236012070630698
          }
        ],
        "description": "Insurance for 1.24 DAI on BALANCER"
      },
      "proxy_detail": {}
    },
    {
      "stats": {
        "asset_usd_value": 3.333947e-12,
        "debt_usd_value": 0,
        "net_usd_value": 3.333947e-12
      },
      "update_at": 1639643983.9978895,
      "name": "Insurance Seller",
      "detail_types": ["insurance_seller"],
      "detail": {
        "usd_value": 3.333947e-12,
        "expired_at": 1622419200,
        "collateral_token_list": [
          {
            "id": "0x6b175474e89094c44da98b954eedeac495271d0f",
            "chain": "eth",
            "name": "Dai Stablecoin",
            "symbol": "DAI",
            "display_symbol": null,
            "optimized_symbol": "DAI",
            "decimals": 18,
            "logo_url": "https://static.debank.com/image/eth_token/logo_url/0x6b175474e89094c44da98b954eedeac495271d0f/549c4205dbb199f1b8b03af783f35e71.png",
            "protocol_id": "makerdao",
            "price": 1,
            "is_verified": true,
            "is_core": true,
            "is_wallet": true,
            "time_at": 1573672677,
            "amount": 3.333947e-12
          }
        ],
        "description": "Insurance for 0.0 DAI on AAVE"
      },
      "proxy_detail": {}
    },
    {
      "stats": {
        "asset_usd_value": 3.211807343223864,
        "debt_usd_value": 0,
        "net_usd_value": 3.211807343223864
      },
      "update_at": 1639643984.0199816,
      "name": "Insurance Seller",
      "detail_types": ["insurance_seller"],
      "detail": {
        "usd_value": 3.211807343223864,
        "expired_at": 1622419200,
        "collateral_token_list": [
          {
            "id": "0x6b175474e89094c44da98b954eedeac495271d0f",
            "chain": "eth",
            "name": "Dai Stablecoin",
            "symbol": "DAI",
            "display_symbol": null,
            "optimized_symbol": "DAI",
            "decimals": 18,
            "logo_url": "https://static.debank.com/image/eth_token/logo_url/0x6b175474e89094c44da98b954eedeac495271d0f/549c4205dbb199f1b8b03af783f35e71.png",
            "protocol_id": "makerdao",
            "price": 1,
            "is_verified": true,
            "is_core": true,
            "is_wallet": true,
            "time_at": 1573672677,
            "amount": 3.211807343223864
          }
        ],
        "description": "Insurance for 3.21 DAI on PICKLE"
      },
      "proxy_detail": {}
    }
  ]
}
```

### **perpetuals - perpetual contracts**

Examples: yfx, perp

* \*`side` - enumerated values: Long/Short
* \*`base_token`
* \*`quote_token`
* \*`position_token` - position
  * \*`amount`
* \*`margin_token` - remaining margin
  * \*`amount`
* \*`margin_rate`
* \*`leverage` - leverage multiplier
* \*`daily_funding_rate` - 24h funding rate (positive or negative, negative means reduced assets)
* \*`entry_price` - the price at which a position is opened how many Quote per Base
* \*`mark_price` - marker price (market price) how many Quote per Base
* `liquidation_price` - liquidation price (strong parity price) how many Quote per Base

```json
{
        "id": "avax_mux",
        "chain": "avax",
        "name": "MUX",
        "site_url": "https://app.mux.network",
        "logo_url": "https://static.debank.com/image/project/logo_url/avax_mux/26f036f91f0c518b6cb168ff7e2041a6.png",
        "has_supported_portfolio": true,
        "tvl": 11753.774877741806,
        "portfolio_item_list": [
            {
                "stats": {
                    "asset_usd_value": 17426.887106807328,
                    "debt_usd_value": 15923.339920996936,
                    "net_usd_value": 1503.547185810392
                },
                "asset_dict": {
                    "0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e": 3980.501046807327,
                    "0xac80096d53c5965d9432592d28687c521472b9eb": 808.562,
                    "0xea4b1b0aa3c110c55f650d28159ce4ad43a4a58b": -15923.817635526
                },
                "asset_token_list": [
                    {
                        "id": "0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e",
                        "chain": "avax",
                        "name": "USD Coin",
                        "symbol": "USDC",
                        "display_symbol": null,
                        "optimized_symbol": "USDC",
                        "decimals": 6,
                        "logo_url": "https://static.debank.com/image/coin/logo_url/usdc/e87790bfe0b3f2ea855dc29069b38818.png",
                        "protocol_id": "",
                        "price": 1,
                        "is_verified": true,
                        "is_core": true,
                        "is_wallet": true,
                        "time_at": 1637802339,
                        "amount": 3980.501046807327
                    },
                    {
                        "id": "0xac80096d53c5965d9432592d28687c521472b9eb",
                        "chain": "avax",
                        "name": "AVAX mToken",
                        "symbol": "muxAVAX",
                        "display_symbol": null,
                        "optimized_symbol": "muxAVAX",
                        "decimals": 18,
                        "logo_url": null,
                        "protocol_id": "",
                        "price": 16.63,
                        "is_verified": true,
                        "is_core": false,
                        "is_wallet": false,
                        "time_at": 1650892126,
                        "amount": 808.562
                    },
                    {
                        "id": "0xea4b1b0aa3c110c55f650d28159ce4ad43a4a58b",
                        "chain": "avax",
                        "name": "USD mToken",
                        "symbol": "muxUSD",
                        "display_symbol": null,
                        "optimized_symbol": "muxUSD",
                        "decimals": 18,
                        "logo_url": null,
                        "protocol_id": "",
                        "price": 0.99997,
                        "is_verified": true,
                        "is_core": false,
                        "is_wallet": false,
                        "time_at": 1650884361,
                        "amount": -15923.817635526
                    }
                ],
                "update_at": 1682326888,
                "name": "Perpetuals",
                "detail_types": [
                    "perpetuals"
                ],
                "detail": {
                    "description": null,
                    "side": "Long",
                    "margin_token": {
                        "id": "0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e",
                        "chain": "avax",
                        "name": "USD Coin",
                        "symbol": "USDC",
                        "display_symbol": null,
                        "optimized_symbol": "USDC",
                        "decimals": 6,
                        "logo_url": "https://static.debank.com/image/coin/logo_url/usdc/e87790bfe0b3f2ea855dc29069b38818.png",
                        "protocol_id": "",
                        "price": 1,
                        "is_verified": true,
                        "is_core": true,
                        "is_wallet": true,
                        "time_at": 1637802339,
                        "amount": 3980.501046807327
                    },
                    "position_token": {
                        "id": "0xac80096d53c5965d9432592d28687c521472b9eb",
                        "chain": "avax",
                        "name": "AVAX mToken",
                        "symbol": "muxAVAX",
                        "display_symbol": null,
                        "optimized_symbol": "muxAVAX",
                        "decimals": 18,
                        "logo_url": null,
                        "protocol_id": "",
                        "price": 16.6295011,
                        "is_verified": true,
                        "is_core": false,
                        "is_wallet": false,
                        "time_at": 1650892126,
                        "amount": 808.5862575877276
                    },
                    "base_token": {
                        "id": "0xac80096d53c5965d9432592d28687c521472b9eb",
                        "chain": "avax",
                        "name": "AVAX mToken",
                        "symbol": "muxAVAX",
                        "display_symbol": null,
                        "optimized_symbol": "muxAVAX",
                        "decimals": 18,
                        "logo_url": null,
                        "protocol_id": "",
                        "price": 16.6295011,
                        "is_verified": true,
                        "is_core": false,
                        "is_wallet": false,
                        "time_at": 1650892126
                    },
                    "quote_token": {
                        "id": "0xea4b1b0aa3c110c55f650d28159ce4ad43a4a58b",
                        "chain": "avax",
                        "name": "USD mToken",
                        "symbol": "muxUSD",
                        "display_symbol": null,
                        "optimized_symbol": "muxUSD",
                        "decimals": 18,
                        "logo_url": null,
                        "protocol_id": "",
                        "price": 0.99997,
                        "is_verified": true,
                        "is_core": false,
                        "is_wallet": false,
                        "time_at": 1650884361
                    },
                    "daily_funding_rate": 0,
                    "entry_price": 19.69399704107539,
                    "mark_price": 16.63,
                    "liquidation_price": 14.919224164287257,
                    "margin_rate": 0.29599797142092815,
                    "pnl_usd_value": -2477.357252578736,
                    "leverage": 3.3784015316035245
                },
                "proxy_detail": {},
                "position_index": "0xac80096d_0xea4b1b0a_true_0xb97ef9ef",
                "pool": {
                    "id": "0x0ba2e492e8427fad51692ee8958ebf936bee1d84",
                    "chain": "avax",
                    "project_id": "avax_mux",
                    "adapter_id": "mux_perpetual",
                    "controller": "0x0ba2e492e8427fad51692ee8958ebf936bee1d84",
                    "index": null,
                    "time_at": 1651755728
                }
            }
        ]
    }
```

### **nft\_common  - common type for nft**

eg. apestake

* `supply_token_list`&#x20;
* `supply_nft_list`
* `reward_token_list`

```json
{
  "id": "apestake",
  "chain": "eth",
  "name": "apestake",
  "site_url": "https://perp.exchange",
  "logo_url": "https://static.debank.com/image/project/logo_url/perpetual/1fe40504248de93c36595e075b075894.png",
  "has_supported_portfolio": true,
  "tvl": 0,
  "portfolio_item_list" : [
    {
        "stats":{
            "asset_usd_value":18853.659120700366,
            "debt_usd_value":0,
            "net_usd_value":18853.659120700366
        },
        "asset_dict":{
            "0x4d224452801aced8b2f0aebe155379bb5d594381":4101.796188585759
        },
        "asset_token_list":[
            {
                "id":"0x4d224452801aced8b2f0aebe155379bb5d594381",
                "chain":"eth",
                "name":"ApeCoin",
                "symbol":"APE",
                "display_symbol":null,
                "optimized_symbol":"APE",
                "decimals":18,
                "logo_url":"https://static.debank.com/image/eth_token/logo_url/0x4d224452801aced8b2f0aebe155379bb5d594381/97b912e4874df863f530cedb07bfbf1c.png",
                "protocol_id":"apestake",
                "price":4.596439767818117,
                "is_verified":true,
                "is_core":true,
                "is_wallet":true,
                "time_at":1644845135,
                "amount":4101.796188585759
            }
        ],
        "update_at":1678263172.3292446,
        "name":"NFT Staked",
        "detail_types":[
            "nft_common"
        ],
        "detail":{
            "supply_token_list":[
                {
                    "id":"0x4d224452801aced8b2f0aebe155379bb5d594381",
                    "chain":"eth",
                    "name":"ApeCoin",
                    "symbol":"APE",
                    "display_symbol":null,
                    "optimized_symbol":"APE",
                    "decimals":18,
                    "logo_url":"https://static.debank.com/image/eth_token/logo_url/0x4d224452801aced8b2f0aebe155379bb5d594381/97b912e4874df863f530cedb07bfbf1c.png",
                    "protocol_id":"apestake",
                    "price":4.596439767818117,
                    "is_verified":true,
                    "is_core":true,
                    "is_wallet":true,
                    "time_at":1644845135,
                    "amount":4084
                }
            ],
            "reward_token_list":[
                {
                    "id":"0x4d224452801aced8b2f0aebe155379bb5d594381",
                    "chain":"eth",
                    "name":"ApeCoin",
                    "symbol":"APE",
                    "display_symbol":null,
                    "optimized_symbol":"APE",
                    "decimals":18,
                    "logo_url":"https://static.debank.com/image/eth_token/logo_url/0x4d224452801aced8b2f0aebe155379bb5d594381/97b912e4874df863f530cedb07bfbf1c.png",
                    "protocol_id":"apestake",
                    "price":4.596439767818117,
                    "is_verified":true,
                    "is_core":true,
                    "is_wallet":true,
                    "time_at":1644845135,
                    "amount":17.796188585759477
                }
            ],
            "description":"Mayc"
        },
        "proxy_detail":{

        },
        "pool":{
            "id":"0x5954ab967bc958940b7eb73ee84797dc8a2afbb9:nft_2",
            "chain":"eth",
            "project_id":"apestake",
            "adapter_id":"ape_nft_staked",
            "controller":"0x5954ab967bc958940b7eb73ee84797dc8a2afbb9",
            "index":"nft_2",
            "time_at":1670249963
        },
        "base":{
            "user_addr":"0x5a6f5477bdeb7801ba137a9f0dc39c0599bac994",
            "chain":"eth",
            "project_id":"apestake"
        }
    }
  ]    
```

### **nft\_lending  - the type of nft lending**

eg. sudoswap

* `supply_token_list`
* `borrow_token_list`
* `supply_nft_list`
* `health_rate`

```json
{
  "id": "sudoswap",
  "chain": "eth",
  "name": "sudoswap",
  "site_url": "https://perp.exchange",
  "logo_url": "https://static.debank.com/image/project/logo_url/perpetual/1fe40504248de93c36595e075b075894.png",
  "has_supported_portfolio": true,
  "tvl": 0,
  "portfolio_item_list" : [
    {
        "stats":{
            "asset_usd_value":24260.72834792133,
            "debt_usd_value":7025.229063420179,
            "net_usd_value":17235.49928450115
        },
        "asset_dict":{
            "eth":11.052789752658846
        },
        "asset_token_list":[
            {
                "id":"eth",
                "chain":"eth",
                "name":"ETH",
                "symbol":"ETH",
                "display_symbol":null,
                "optimized_symbol":"ETH",
                "decimals":18,
                "logo_url":"https://static.debank.com/image/token/logo_url/eth/935ae4e4d1d12d59a99717a24f2540b5.png",
                "protocol_id":"",
                "price":1559.38,
                "is_verified":true,
                "is_core":true,
                "is_wallet":true,
                "time_at":1483200000,
                "amount":11.052789752658846
            }
        ],
        "update_at":1678252610.664709,
        "name":"NFT Lending",
        "detail_types":[
            "nft_lending"
        ],
        "detail":{
            "supply_token_list":[
    
            ],
            "borrow_token_list":[
                {
                    "id":"eth",
                    "chain":"eth",
                    "name":"ETH",
                    "symbol":"ETH",
                    "display_symbol":null,
                    "optimized_symbol":"ETH",
                    "decimals":18,
                    "logo_url":"https://static.debank.com/image/token/logo_url/eth/935ae4e4d1d12d59a99717a24f2540b5.png",
                    "protocol_id":"",
                    "price":1559.38,
                    "is_verified":true,
                    "is_core":true,
                    "is_wallet":true,
                    "time_at":1483200000,
                    "amount":4.5051424690711555
                }
            ],
            "supply_nft_list":[
                {
                    "id":"382ca8e54f8b95a8ff9041d8a13ddbea",
                    "contract_id":"0x60e4d786628fea6478f785a6d7e704777c86a7c6",
                    "inner_id":"18505",
                    "name":"",
                    "content_url":"https://static.debank.com/image/eth_nft/local_url/382ca8e54f8b95a8ff9041d8a13ddbea/76949037c918928800d882d5942cfc35.png",
                    "thumbnail_url":"https://static.debank.com/image/eth_nft/thumbnail_url/382ca8e54f8b95a8ff9041d8a13ddbea/3a427a7743872aa0c91656c73806bd62.png",
                    "collection":{
                        "chain_id":"eth",
                        "id":"0x60e4d786628fea6478f785a6d7e704777c86a7c6",
                        "name":"MutantApeYachtClub",
                        "logo_url":"https://static.debank.com/image/eth_nft_collection/logo_url/0x60e4d786628fea6478f785a6d7e704777c86a7c6/bd9291345343899f2684b0e3697ed5ac.png",
                        "is_core":true,
                        "floor_price_token":{
                            "id":"eth",
                            "chain":"eth",
                            "name":"ETH",
                            "symbol":"ETH",
                            "display_symbol":null,
                            "optimized_symbol":"ETH",
                            "decimals":18,
                            "logo_url":"https://static.debank.com/image/token/logo_url/eth/935ae4e4d1d12d59a99717a24f2540b5.png",
                            "protocol_id":"",
                            "price":1559.38,
                            "is_verified":true,
                            "is_core":true,
                            "is_wallet":true,
                            "time_at":1483200000,
                            "amount":15.55793222173
                        }
                    },
                    "amount":1
                }
            ],
            "health_rate":2.762697486889935
        },
        "proxy_detail":{
    
        },
        "position_index":"0x60e4d786628fea6478f785a6d7e704777c86a7c6_18505",
        "pool":{
            "id":"0x70b97a0da65c15dfb0ffa02aee6fa36e507c2762:nft_lending",
            "chain":"eth",
            "project_id":"benddao",
            "adapter_id":"benddao_nft_lending",
            "controller":"0x70b97a0da65c15dfb0ffa02aee6fa36e507c2762",
            "index":"nft_lending",
            "time_at":1647694784
        },
        "base":{
            "user_addr":"0x7b33e1e381c9999d7e0109657e73132d4782e866",
            "chain":"eth",
            "project_id":"benddao"
        }
    }
  ]    
```

### **nft\_fraction  - the type of  nft fraction**

eg. NFTX

* `share_token` - fraction share token
* `collection` - collection info

```json
{
  "id": "nftx",
  "chain": "eth",
  "name": "nftx",
  "site_url": "https://perp.exchange",
  "logo_url": "https://static.debank.com/image/project/logo_url/perpetual/1fe40504248de93c36595e075b075894.png",
  "has_supported_portfolio": true,
  "tvl": 0,
  "portfolio_item_list" : [
    {
        "stats":{
            "asset_usd_value":4675.72884370185,
            "debt_usd_value":0,
            "net_usd_value":4675.72884370185
        },
        "asset_dict":{
            "0xabea7663c472648d674bd3403d94c858dfeef728":0.48875403755158325
        },
        "asset_token_list":[
            {
                "id":"0xabea7663c472648d674bd3403d94c858dfeef728",
                "chain":"eth",
                "name":"Pudgy Penguins",
                "symbol":"PUDGY",
                "display_symbol":null,
                "optimized_symbol":"PUDGY",
                "decimals":18,
                "logo_url":"https://static.debank.com/image/eth_token/logo_url/0xabea7663c472648d674bd3403d94c858dfeef728/6cbd01992d12266b0786215fedef36f1.png",
                "protocol_id":"nftx",
                "price":9566.629601926044,
                "is_verified":true,
                "is_core":true,
                "is_wallet":true,
                "time_at":1627958962,
                "amount":0.48875403755158325
            }
        ],
        "update_at":1678251602.952341,
        "name":"NFT Fraction",
        "detail_types":[
            "nft_fraction"
        ],
        "detail":{
            "share_token":{
                "id":"0xabea7663c472648d674bd3403d94c858dfeef728",
                "chain":"eth",
                "name":"Pudgy Penguins",
                "symbol":"PUDGY",
                "display_symbol":null,
                "optimized_symbol":"PUDGY",
                "decimals":18,
                "logo_url":"https://static.debank.com/image/eth_token/logo_url/0xabea7663c472648d674bd3403d94c858dfeef728/6cbd01992d12266b0786215fedef36f1.png",
                "protocol_id":"nftx",
                "price":9566.629601926044,
                "is_verified":true,
                "is_core":true,
                "is_wallet":true,
                "time_at":1627958962,
                "amount":0.48875403755158325
            },
            "collection":{
                "chain_id":"eth",
                "id":"0xbd3531da5cf5857e7cfaa92426877b022e612cf8",
                "name":"Pudgy Penguins",
                "logo_url":"https://static.debank.com/image/collection/logo_url/pudgypenguins/a4f2d05d2f0bde58c1a1a4ba51c2f523.png",
                "is_core":true,
                "amount":0.48875403755158325
            }
        },
        "proxy_detail":{
    
        },
        "pool":{
            "id":"0xabea7663c472648d674bd3403d94c858dfeef728",
            "chain":"eth",
            "project_id":"nftx",
            "adapter_id":"nftx_fraction",
            "controller":"0xabea7663c472648d674bd3403d94c858dfeef728",
            "index":null,
            "time_at":1627958962
        },
        "base":{
            "user_addr":"0xc6c2d5ee69745a1e9f2d1a06e0ef0788bd924302",
            "chain":"eth",
            "project_id":"nftx"
        }
    }
  ]    
```

### nft\_p2p\_borrower  **- the type of  nft p2p borrow**

* supply\_nft\_list
* borrow\_token\_list
* reward\_token\_list (optional)

```
{
  "id": "nftx",
  "chain": "eth",
  "name": "nftx",
  "site_url": "https://blur.io",
  "logo_url": "https://static.debank.com/image/project/logo_url/blur/36f14ae1fe633d1c58da060566bf695f.png",
  "has_supported_portfolio": true,
  "tvl": 0,
  "portfolio_item_list" : [
     {
        "stats": {
            "asset_usd_value": 0,
            "debt_usd_value": 23745.018699999997,
            "net_usd_value": 0
        },
        "asset_dict": {
            "eth": -12.79
        },
        "asset_token_list": [
            {
                "id": "eth",
                "chain": "eth",
                "name": "ETH",
                "symbol": "ETH",
                "display_symbol": null,
                "optimized_symbol": "ETH",
                "decimals": 18,
                "logo_url": "https://static.debank.com/image/token/logo_url/eth/935ae4e4d1d12d59a99717a24f2540b5.png",
                "protocol_id": "",
                "price": 1856.53,
                "is_verified": true,
                "is_scam": false,
                "is_core": true,
                "is_wallet": true,
                "time_at": 1483200000.0,
                "amount": -12.79
            }
        ],
        "update_at": 1683542341.865855,
        "name": "NFT P2P Borrower",
        "detail_types": [
            "nft_p2p_borrower"
        ],
        "detail": {
            "supply_token_list": [],
            "supply_nft_list": [
                {
                    "id": "b32e0e5c6d74b95767796a8817547076",
                    "contract_id": "0xed5af388653567af2f388e6224dc7c4b3241c544",
                    "inner_id": "7944",
                    "name": "Azuki #7944",
                    "content_url": "https://static.debank.com/image/eth_nft/local_url/b32e0e5c6d74b95767796a8817547076/39b48a71bd97e1e0c6801c73f4ca9266.png",
                    "thumbnail_url": "https://static.debank.com/image/eth_nft/thumbnail_url/b32e0e5c6d74b95767796a8817547076/33583cfb22824dcdeb80e1be8284be2d.png",
                    "collection": {
                        "chain_id": "eth",
                        "id": "0xed5af388653567af2f388e6224dc7c4b3241c544",
                        "name": "Azuki",
                        "symbol": "AZUKI",
                        "logo_url": "https://static.debank.com/image/nft_collection/logo_url/azuki/f5ef01d96aeb4371ded0815e07ab08af.png",
                        "is_core": true
                    },
                    "amount": 1
                }
            ],
            "borrow_token_list": [
                {
                    "id": "eth",
                    "chain": "eth",
                    "name": "ETH",
                    "symbol": "ETH",
                    "display_symbol": null,
                    "optimized_symbol": "ETH",
                    "decimals": 18,
                    "logo_url": "https://static.debank.com/image/token/logo_url/eth/935ae4e4d1d12d59a99717a24f2540b5.png",
                    "protocol_id": "",
                    "price": 1856.53,
                    "is_verified": true,
                    "is_scam": false,
                    "is_core": true,
                    "is_wallet": true,
                    "time_at": 1483200000.0,
                    "amount": 12.79
                }
            ]
        },
        "proxy_detail": {},
        "position_index": "1798",
        "pool": {
            "id": "0x29469395eaf6f95920e59f858042f0e28d98a20b:borrower",
            "chain": "eth",
            "project_id": "blur",
            "adapter_id": "blur_nft_p2p_borrower",
            "controller": "0x29469395eaf6f95920e59f858042f0e28d98a20b",
            "index": "borrower",
            "time_at": 1682909963
        },
        "base": {
            "user_addr": "0x5f1ee29361206f1a129e808736f11598356c6031",
            "chain": "eth",
            "project_id": "blur"
        }
    }
  ]    
```

### nft\_p2p\_lender  **- the type of  nft p2p lend**

* supply\_token\_list
* nft\_list
* reward\_token\_list (optional)

```
{
  "id": "blur",
  "chain": "eth",
  "name": "nftx",
  "site_url": "https://blur.io",
  "logo_url": "https://static.debank.com/image/project/logo_url/blur/36f14ae1fe633d1c58da060566bf695f.png",
  "has_supported_portfolio": true,
  "tvl": 0,
  "portfolio_item_list" : [
     {
        "stats": {
            "asset_usd_value": 23750.518399999997,
            "debt_usd_value": 0,
            "net_usd_value": 23750.518399999997
        },
        "asset_dict": {
            "eth": 12.79
        },
        "asset_token_list": [
            {
                "id": "eth",
                "chain": "eth",
                "name": "ETH",
                "symbol": "ETH",
                "display_symbol": null,
                "optimized_symbol": "ETH",
                "decimals": 18,
                "logo_url": "https://static.debank.com/image/token/logo_url/eth/935ae4e4d1d12d59a99717a24f2540b5.png",
                "protocol_id": "",
                "price": 1856.96,
                "is_verified": true,
                "is_scam": false,
                "is_core": true,
                "is_wallet": true,
                "time_at": 1483200000.0,
                "amount": 12.79
            }
        ],
        "update_at": 1683542411.9610286,
        "name": "NFT P2P Lender",
        "detail_types": [
            "nft_p2p_lender"
        ],
        "detail": {
            "supply_token_list": [
                {
                    "id": "eth",
                    "chain": "eth",
                    "name": "ETH",
                    "symbol": "ETH",
                    "display_symbol": null,
                    "optimized_symbol": "ETH",
                    "decimals": 18,
                    "logo_url": "https://static.debank.com/image/token/logo_url/eth/935ae4e4d1d12d59a99717a24f2540b5.png",
                    "protocol_id": "",
                    "price": 1856.96,
                    "is_verified": true,
                    "is_scam": false,
                    "is_core": true,
                    "is_wallet": true,
                    "time_at": 1483200000.0,
                    "amount": 12.79
                }
            ],
            "nft_list": [
                {
                    "id": "b32e0e5c6d74b95767796a8817547076",
                    "contract_id": "0xed5af388653567af2f388e6224dc7c4b3241c544",
                    "inner_id": "7944",
                    "name": "Azuki #7944",
                    "content_url": "https://static.debank.com/image/eth_nft/local_url/b32e0e5c6d74b95767796a8817547076/39b48a71bd97e1e0c6801c73f4ca9266.png",
                    "thumbnail_url": "https://static.debank.com/image/eth_nft/thumbnail_url/b32e0e5c6d74b95767796a8817547076/33583cfb22824dcdeb80e1be8284be2d.png",
                    "collection": {
                        "chain_id": "eth",
                        "id": "0xed5af388653567af2f388e6224dc7c4b3241c544",
                        "name": "Azuki",
                        "symbol": "AZUKI",
                        "logo_url": "https://static.debank.com/image/nft_collection/logo_url/azuki/f5ef01d96aeb4371ded0815e07ab08af.png",
                        "is_core": true
                    },
                    "amount": 1
                }
            ]
        },
        "proxy_detail": {},
        "position_index": "1798",
        "pool": {
            "id": "0x29469395eaf6f95920e59f858042f0e28d98a20b:lender",
            "chain": "eth",
            "project_id": "blur",
            "adapter_id": "blur_nft_p2p_lender",
            "controller": "0x29469395eaf6f95920e59f858042f0e28d98a20b",
            "index": "lender",
            "time_at": 1682909963
        },
        "base": {
            "user_addr": "0xbccf9025a0e2f6aad7e18972d754aaca38a4f847",
            "chain": "eth",
            "project_id": "blur"
        }
    }
  ]    
```