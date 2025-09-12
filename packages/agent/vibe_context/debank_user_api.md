---
description: The User API allows you to easily get user's assets information.
---

# User

## Get user used chain

#### Method

get

#### Path

/v1/user/used\_chain\_list

#### Parameters

* `id` : required, The user's address.

#### Returns

`Array` of `Object` - An object with following fields:

* `id` : `string` - The chain's id.
* `community_id` : `integer` - The community-identified id.
* `name` : `string` - The chain's name.
* `logo_url` : `string` URL of the chain's logo image. `null` if not available.
* `native_token_id` : `string` - The native token's id.
* `wrapped_token_id`: `string` - The address of the native token.
* `born_at`: `integer` -  Birth time of address in current chain.&#x20;

Request

{% tabs %}
{% tab title="Curl" %}
```bash
curl -X 'GET' \
  'https://pro-openapi.debank.com/v1/user/used_chain_list?id=0xcfeaead4947f0705a14ec42ac3d44129e1ef3ed5' \
  -H 'accept: application/json' -H 'AccessKey: YOUR_ACCESSKEY'
```
{% endtab %}
{% endtabs %}

Result

```json
[
  {
    "id": "boba",
    "community_id": 288,
    "name": "Boba",
    "native_token_id": "boba",
    "born_at": 1704711812,
    "logo_url": "https://static.debank.com/image/chain/logo_url/boba/e43d79cd8088ceb3ea3e4a240a75728f.png",
    "wrapped_token_id": "0xdeaddeaddeaddeaddeaddeaddeaddeaddead0000"
  }
]
```

## Get user chain balance

Return the balance of a given address.

#### Method

get

#### Path

/v1/user/chain\_balance

#### Parameters

* `chain_id` : required, chain id, eg: `eth`, `bsc`, `xdai`, [for more info](../chain#returns-1).
* `id` : required, The user's address.

#### Returns

* `usd_value` : `double` - The balance of the account.

Request

{% tabs %}
{% tab title="Curl" %}
```bash
curl -X 'GET' \
  'https://pro-openapi.debank.com/v1/user/chain_balance?id=0x5853ed4f26a3fcea565b3fbc698bb19cdf6deb85&chain_id=eth' \
  -H 'accept: application/json' -H 'AccessKey: YOUR_ACCESSKEY'
```
{% endtab %}
{% endtabs %}

Result

```json
{
  "usd_value": 11878.042297007945
}
```

## Get user protocol

Get one user's positions in the protocol

#### Method

get

#### Path

/v1/user/protocol

#### Parameters

* `protocol_id` : required, eg: `bsc_pancakeswap`, `curve`, `uniswap`, [for more info](../protocol#returns-1).
* `id` : required, user address

#### Returns

Return one user's positions from the protocol

* `id` : `string` - The protocol's id.
* `chain` : `string` - The chain's id.
* `name` : `string` - The protocol's name. `null` if not defined in the contract and not available from other sources.
* `logo_url` : `string` - URL of the protocol's logo image. `null` if not available.
* `site_url` : `string` - prioritize websites that can be interacted with, not official websites.
* `has_supported_portfolio` : `boolean` - Is the portfolio already supported.
* `portfolio_item_list` : `Array` of [`PortfolioItemObject`](../api-models/portfolioitemobject)

Request

{% tabs %}
{% tab title="Curl" %}
```bash
curl -X 'GET' \
  'https://pro-openapi.debank.com/v1/user/protocol?id=0x5853ed4f26a3fcea565b3fbc698bb19cdf6deb85&protocol_id=bsc_bdollar' \
  -H 'accept: application/json' -H 'AccessKey: YOUR_ACCESSKEY'
```
{% endtab %}
{% endtabs %}

Result

```json
{
  "id": "bsc_bdollar",
  "chain": "bsc",
  "name": "bDollar",
  "site_url": "https://bdollar.fi",
  "logo_url": "https://static.debank.com/image/project/logo_url/bsc_bdollar/1935d77ab964b7e65acfadb63080af24.png",
  "has_supported_portfolio": true,
  "tvl": 223306.13569669172,
  "portfolio_item_list": [
    {
      "stats": {
        "asset_usd_value": 0,
        "debt_usd_value": 0,
        "net_usd_value": 0
      },
      "update_at": 1639382999.514337,
      "name": "Farming",
      "detail_types": ["common"],
      "detail": {
        "supply_token_list": [
          {
            "id": "0x0d9319565be7f53cefe84ad201be3f40feae2740",
            "chain": "bsc",
            "name": "bDollar Share",
            "symbol": "sBDO",
            "display_symbol": null,
            "optimized_symbol": "sBDO",
            "decimals": 18,
            "logo_url": "https://static.debank.com/image/bsc_token/logo_url/0x0d9319565be7f53cefe84ad201be3f40feae2740/2e79004660a090bcad21432037b16e89.png",
            "protocol_id": "bsc_bdollar",
            "price": 0,
            "is_verified": true,
            "is_core": null,
            "is_wallet": false,
            "time_at": 1609152424,
            "amount": 0.01
          }
        ],
        "reward_token_list": [
          {
            "id": "0x190b589cf9fb8ddeabbfeae36a813ffb2a702454",
            "chain": "bsc",
            "name": "bDollar",
            "symbol": "BDO",
            "display_symbol": null,
            "optimized_symbol": "BDO",
            "decimals": 18,
            "logo_url": "https://static.debank.com/image/bsc_token/logo_url/0x190b589cf9fb8ddeabbfeae36a813ffb2a702454/316bf18e540d27f269b2260931a5fcdc.png",
            "protocol_id": "bsc_bdollar",
            "price": 0,
            "is_verified": true,
            "is_core": true,
            "is_wallet": true,
            "time_at": 1608808146,
            "amount": 4.023217983610902
          }
        ]
      },
      "proxy_detail": {}
    },
    {
      "stats": {
        "asset_usd_value": 6.914216886417625,
        "debt_usd_value": 0,
        "net_usd_value": 6.914216886417625
      },
      "update_at": 1639382999.565123,
      "name": "Farming",
      "detail_types": ["common"],
      "detail": {
        "supply_token_list": [
          {
            "id": "0x190b589cf9fb8ddeabbfeae36a813ffb2a702454",
            "chain": "bsc",
            "name": "bDollar",
            "symbol": "BDO",
            "display_symbol": null,
            "optimized_symbol": "BDO",
            "decimals": 18,
            "logo_url": "https://static.debank.com/image/bsc_token/logo_url/0x190b589cf9fb8ddeabbfeae36a813ffb2a702454/316bf18e540d27f269b2260931a5fcdc.png",
            "protocol_id": "bsc_bdollar",
            "price": 0,
            "is_verified": true,
            "is_core": true,
            "is_wallet": true,
            "time_at": 1608808146,
            "amount": 438.1464937799965
          },
          {
            "id": "0xe9e7cea3dedca5984780bafc599bd69add087d56",
            "chain": "bsc",
            "name": "BUSD Token",
            "symbol": "BUSD",
            "display_symbol": null,
            "optimized_symbol": "BUSD",
            "decimals": 18,
            "logo_url": "https://static.debank.com/image/bsc_token/logo_url/0xe9e7cea3dedca5984780bafc599bd69add087d56/f0825e572298822e7689fe81150a195d.png",
            "protocol_id": "",
            "price": 1,
            "is_verified": true,
            "is_core": true,
            "is_wallet": true,
            "time_at": 1599044503,
            "amount": 6.914216886417625
          }
        ],
        "reward_token_list": [
          {
            "id": "0x0d9319565be7f53cefe84ad201be3f40feae2740",
            "chain": "bsc",
            "name": "bDollar Share",
            "symbol": "sBDO",
            "display_symbol": null,
            "optimized_symbol": "sBDO",
            "decimals": 18,
            "logo_url": "https://static.debank.com/image/bsc_token/logo_url/0x0d9319565be7f53cefe84ad201be3f40feae2740/2e79004660a090bcad21432037b16e89.png",
            "protocol_id": "bsc_bdollar",
            "price": 0,
            "is_verified": true,
            "is_core": null,
            "is_wallet": false,
            "time_at": 1609152424,
            "amount": 0.025524980670816256
          }
        ]
      },
      "proxy_detail": {}
    }
  ]
}
```

## Get user complex protocol list

Get user's detail portfolios on a chain in the protocol. It's cached data, but in most cases can be treated as near real-time data within 1 minute. In the worst case, a 12-hour update is still guaranteed. if you want to use realtime data, refer to [Get user protocol](#get-user-protocol).

#### Method

get

#### Path

/v1/user/complex\_protocol\_list

#### Parameters

* `chain_id` : required, chain id, eg: `eth`, `bsc`, `xdai`, [for more info](../chain#returns-1).
* `id` : required, user address

#### Returns

Return user's positions list from all the protocols

Array of object:

* `id` : `string` - The protocol's id.
* `chain` : `string` - The chain's id.
* `name` : `string` - The protocol's name. `null` if not defined in the contract and not available from other sources.
* `logo_url` : `string` - URL of the protocol's logo image. `null` if not available.
* `site_url` : `string` - prioritize websites that can be interacted with, not official websites.
* `has_supported_portfolio` : `boolean` - Is the portfolio already supported.
* `portfolio_item_list` : `Array` of [`PortfolioItemObject`](../api-models/portfolioitemobject)

Request

{% tabs %}
{% tab title="Curl" %}
```bash
curl -X 'GET' \
  'https://pro-openapi.debank.com/v1/user/complex_protocol_list?id=0x5853ed4f26a3fcea565b3fbc698bb19cdf6deb85&chain_id=eth' \
  -H 'accept: application/json' -H 'AccessKey: YOUR_ACCESSKEY'
```
{% endtab %}
{% endtabs %}

Result

```json
[
  {
    "id": "0x",
    "chain": "eth",
    "name": "0x",
    "site_url": "https://0x.org",
    "logo_url": "https://static.debank.com/image/project/logo_url/0x/140b607264f4741133c35eb32c6bc314.png",
    "has_supported_portfolio": true,
    "tvl": 76569161.44038972,
    "portfolio_item_list": [
      {
        "stats": {
          "asset_usd_value": 1.2903149999999999,
          "debt_usd_value": 0,
          "net_usd_value": 1.2903149999999999
        },
        "update_at": 1639548824.1576676,
        "name": "Staked",
        "detail_types": ["common"],
        "detail": {
          "supply_token_list": [
            {
              "id": "0xe41d2489571d322189246dafa5ebde1f4699f498",
              "chain": "eth",
              "name": "0x Protocol Token",
              "symbol": "ZRX",
              "display_symbol": null,
              "optimized_symbol": "ZRX",
              "decimals": 18,
              "logo_url": "https://static.debank.com/image/eth_token/logo_url/0xe41d2489571d322189246dafa5ebde1f4699f498/6399b265ac056e5168a1144d39e5ab16.png",
              "protocol_id": "0x",
              "price": 0.7635,
              "is_verified": true,
              "is_core": true,
              "is_wallet": true,
              "time_at": 1502476756,
              "amount": 1.69
            }
          ]
        },
        "proxy_detail": {}
      }
    ]
  }
  // more...
]
```

## Get user complex protocol list on all supported chains

Get user detail portfolios on all supported chains in the protocol. It's cached data, but in most cases can be treated as near real-time data within 1 minute. In the worst case, a 12-hour update is still guaranteed. if you want to use realtime data, refer to [Get user protocol](#get-user-protocol).

#### Method

get

#### Path

/v1/user/all\_complex\_protocol\_list

#### Parameters

* `id` : required, user address
* `chain_ids` : optional, list of chain id, eg: eth, bsc, xdai, [for more info](../chain#returns-1).

#### Returns

Same format as the result returned by `/v1/user/complex_protocol_list`. [for more info](#get-user-complex-protocol-list).

#### Request Example

{% tabs %}
{% tab title="Curl" %}
```bash
curl -X GET "https://pro-openapi.debank.com/v1/user/all_complex_protocol_list?id=YOUR_ADDRESS&chain_ids=bsc,eth \
    -H "accept: application/json" -H 'AccessKey: YOUR_ACCESSKEY'
```
{% endtab %}
{% endtabs %}

## Get user simple protocol list

Get user's balance on a chain in the protocol. It's cached data, but in most cases can be treated as near real-time data within 1 minute. In the worst case, a 12-hour update is still guaranteed. if you want to use realtime data, refer to [Get user protocol](#get-user-protocol).

#### Method

get

#### Path

/v1/user/simple\_protocol\_list

#### Parameters

* `chain_id` : required, chain id, eg: `eth`, `bsc`, `xdai`, [for more info](../chain#returns-1).
* `id` : required, user address

#### Returns

return list of protocols with user assets.

`Array` of `Object` - An object with following fields:

* `id` : `string` - The protocol's id.
* `chain` : `string` - The chain's id.
* `name` : `string` - The protocol's name. `null` if not defined in the contract and not available from other sources.
* `logo_url` : `string` - URL of the protocol's logo image. `null` if not available.
* `site_url` : `string` - prioritize websites that can be interacted with, not official websites.
* `has_supported_portfolio` : `boolean` - Is the portfolio already supported.
* `net_usd_value` : `double` - The amount of the user's net assets in the protocol.
* `asset_usd_value` : `double` - The amount of the user's total assets in the protocol.
* `debt_usd_value` : `double` - The Debt USD value.

Request

{% tabs %}
{% tab title="Curl" %}
```bash
curl -X 'GET' \
  'https://pro-openapi.debank.com/v1/user/simple_protocol_list?id=0x5853ed4f26a3fcea565b3fbc698bb19cdf6deb85&chain_id=eth' \
  -H 'accept: application/json' -H 'AccessKey: YOUR_ACCESSKEY'
```
{% endtab %}
{% endtabs %}

Result

```json
[
  {
    "id": "uniswap3",
    "chain": "eth",
    "name": "Uniswap V3",
    "site_url": "https://app.uniswap.org",
    "logo_url": "https://static.debank.com/image/project/logo_url/uniswap3/87a541b3b83b041c8d12119e5a0d19f0.png",
    "has_supported_portfolio": true,
    "tvl": 3743030990.973852,
    "net_usd_value": 241.1066115236279,
    "asset_usd_value": 241.1066115236279,
    "debt_usd_value": 0
  },
  {
    "id": "compound",
    "chain": "eth",
    "name": "Compound",
    "site_url": "https://app.compound.finance",
    "logo_url": "https://static.debank.com/image/project/logo_url/compound/0b792243f1f68e9ed082f5a49ee6f21d.png",
    "has_supported_portfolio": true,
    "tvl": 12763095483.420198,
    "net_usd_value": 9.42968660318954,
    "asset_usd_value": 10.610932251963174,
    "debt_usd_value": 1.1812456487736345
  },
  {
    "id": "curve",
    "chain": "eth",
    "name": "Curve",
    "site_url": "https://curve.fi",
    "logo_url": "https://static.debank.com/image/project/logo_url/curve/aa991be165e771cff87ae61e2a61ef68.png",
    "has_supported_portfolio": true,
    "tvl": 17053767979.356224,
    "net_usd_value": 224.52344262613227,
    "asset_usd_value": 224.52344262613227,
    "debt_usd_value": 0
  }
  // more...
]
```

## Get user simple protocol list on all supported chains

Get user's balance on all supported chains in the protocol. It's cached data, but in most cases can be treated as near real-time data within 1 minute. In the worst case, a 12-hour update is still guaranteed. if you want to use realtime data, refer to [Get user protocol](#get-user-protocol).

#### Method

get

#### Path

/v1/user/all\_simple\_protocol\_list

#### Parameters

* `id` : required, user address
* `chain_ids` : optional, list of chain id, eg: eth, bsc, xdai, [for more info](../chain#returns-1).

#### Returns

Same format as the result returned by `/v1/user/simple_protocol_list`. [for more info](#get-user-simple-protocol-list).

#### Request Example

{% tabs %}
{% tab title="Curl" %}
```bash
curl -X GET "https://pro-openapi.debank.com/v1/user/all_simple_protocol_list?id=YOUR_ADDRESS&chain_ids=bsc,eth \
    -H "accept: application/json" -H 'AccessKey: YOUR_ACCESSKEY'
```
{% endtab %}
{% endtabs %}

## Get user token balance

#### Method

get

#### Path

/v1/user/token

#### Parameters

* `chain_id` : required, chain id, eg: `eth`, `bsc`, `xdai`, [for more info](../chain#returns-1).
* `id` : required, user address
* `token_id` : required, Ethereum Address or native token id

#### Returns

`Object` - An object with the following fields:

* `id` : `string` - The address of the token contract.
* `chain` : `string` - The chain's name.
* `name` : `string` - The token's name. `null` if not defined in the contract and not available from other sources.
* `symbol` : `string` - The token's symbol. `null` if not defined in the contract and not available from other sources.
* `display_symbol` : `string` - The token's displayed symbol. If two tokens have the same symbol, they are distinguished by `display_symbol` .
* `optimized_symbol` : `string` - For front-end display. `optimized_symbol || display_symbol || symbol`
* `decimals` : `integer` - The number of decimals of the token. `null` if not defined in the contract and not available from other sources.
* `logo_url` : `string` - URL of the token's logo image. `null` if not available.
* `is_verified`: `boolean` - Whether it has been verified.
* `is_core`:`boolean` - Whether or not to show as a common token in the wallet.
* `price`: `double` - USD price. Price of 0 means no data.
* `time_at` : `integer` - The timestamp when the current token was deployed on the blockchain.
* `amount` : `double` - The amount of user's token.
* `raw_amount` : `integer` - The raw amount of user's token.

Request

{% tabs %}
{% tab title="Curl" %}
```bash
curl -X 'GET' \
  'https://pro-openapi.debank.com/v1/user/token?id=0x5853ed4f26a3fcea565b3fbc698bb19cdf6deb85&chain_id=eth&token_id=0xdac17f958d2ee523a2206206994597c13d831ec7' \
  -H 'accept: application/json' -H 'AccessKey: YOUR_ACCESSKEY'
```
{% endtab %}
{% endtabs %}

Result

```json
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
  "amount": 5.512815,
  "raw_amount": 5512815
}
```

## Get user token list

Get user token balance

#### Method

get

#### Path

/v1/user/token\_list

#### Parameters

* `id` : required, user address
* `chain_id` : required, chain id, eg: `eth`, `bsc`, `xdai`, [for more info](../chain#returns-1).
* `is_all` : `boolean` - If true, all tokens are returned, including protocol-derived tokens, not-is-core tokens. default is true.

#### Returns

`Array` of `Object` - An object with following fields:

* `id` : `string` - The address of the token contract.
* `chain` : `string` - The chain's name.
* `name` : `string` - The token's name. `null` if not defined in the contract and not available from other sources.
* `symbol` : `string` - The token's symbol. `null` if not defined in the contract and not available from other sources.
* `display_symbol` : `string` - The token's displayed symbol. If two tokens have the same symbol, they are distinguished by `display_symbol` .
* `optimized_symbol` : `string` - For front-end display. `optimized_symbol || display_symbol || symbol`
* `decimals` : `integer` - The number of decimals of the token. `null` if not defined in the contract and not available from other sources.
* `logo_url` : `string` - URL of the token's logo image. `null` if not available.
* `is_core`:`boolean` - Whether or not to show as a common token in the wallet.
* `price`: `double` - USD price. Price of 0 means no data.
* `time_at` : `integer` - The timestamp when the current token was deployed on the blockchain.
* `amount` : `double` - The amount of user's token.
* `raw_amount` : `integer` - The raw amount of user's token.

Request

{% tabs %}
{% tab title="Curl" %}
```bash
curl -X 'GET' \
  'https://pro-openapi.debank.com/v1/user/token_list?id=0x5853ed4f26a3fcea565b3fbc698bb19cdf6deb85&chain_id=eth&is_all=false' \
  -H 'accept: application/json' -H 'AccessKey: YOUR_ACCESSKEY'
```
{% endtab %}
{% endtabs %}

Result

```json
[
  {
    "id": "0x0000000000004946c0e9f43f4dee607b0ef1fa1c",
    "chain": "eth",
    "name": "Chi Gastoken by 1inch",
    "symbol": "CHI",
    "display_symbol": null,
    "optimized_symbol": "CHI",
    "decimals": 0,
    "logo_url": "https://static.debank.com/image/eth_token/logo_url/0x0000000000004946c0e9f43f4dee607b0ef1fa1c/5d763d01aae3f0ac9a373564026cb620.png",
    "protocol_id": "1inch",
    "price": 0,
    "is_core": true,
    "is_wallet": true,
    "time_at": 1590352004,
    "amount": 3,
    "raw_amount": 3
  },
  {
    "id": "0x0000000000085d4780b73119b644ae5ecd22b376",
    "chain": "eth",
    "name": "TrueUSD",
    "symbol": "TUSD",
    "display_symbol": null,
    "optimized_symbol": "TUSD",
    "decimals": 18,
    "logo_url": "https://static.debank.com/image/eth_token/logo_url/0x0000000000085d4780b73119b644ae5ecd22b376/9fedba67e80a738c281bd0ba8e9f1c5e.png",
    "protocol_id": "",
    "price": 1,
    "is_core": true,
    "is_wallet": true,
    "time_at": 1546294558,
    "amount": 21.709487132565773,
    "raw_amount": 21709487132565774000
  }
  // more...
]
```

## Get a list of token balances on all supported chains

#### Method

get

#### Path

/v1/user/all\_token\_list

#### Parameters

* `id` : required, user address
* `is_all` : `boolean` - If true, all tokens are returned, including protocol-derived tokens, not-is-core tokens. . default is true.
* `chain_ids` : optional, list of chain id, eg: eth, bsc, xdai, [for more info](../chain#returns-1).

#### Returns

[for more info](#get-user-token-list).

## Get user nft list

Get user nft list

#### Method

get

#### Path

/v1/user/nft\_list

#### Parameters

* `id` : required, user address
* `chain_id` : required, chain id, eg: `eth`, `bsc`, `xdai`, [for more info](../chain#returns-1).
* `is_all` : `boolean` - If False, only tokens in verified collections are returned.

#### Returns

`Array` of `Object` - An object with following fields:

* `id` : `string` - Unique Id.
* `contract_id`: `string` - The address of the token contract.
* `inner_id` : `string` - The index id.
* `chain` : `string` - The chain's name.
* `name` : `string` - The nft's name.
* `description` : `string` - The nft's description.
* `content_type`: `string` - The nft's content type. eg: image\_url, video\_url, audio\_url
* `content` : `string` - The nft's content. `null` if not available.
* `detail_url`: `string` - refer to the nft's detail page
* `contract_name`: `string` - Contract name.
* `is_erc1155`:`boolean` - Whether it is erc1155.
* `amount` : `double` - The amount of nft, only valid in erc1155 contract.
* `protocol`: [for more info](../protocol#returns-1).
* `pay_token`: [for more info](../token#returns-1).
* `usd_price`: `double` - Latest Trading Price.
* `collection_id`: `string` - Collection id, the format is `{chain}:{contract_id}`.
* `attributes`: `Array` of the following Object
  * `trait_type` : `string` - attribute type
  * `value`: attribute value

Request

{% tabs %}
{% tab title="Curl" %}
```bash
curl -X 'GET' \
  'https://pro-openapi.debank.com/v1/user/nft_list?id=0x5853ed4f26a3fcea565b3fbc698bb19cdf6deb85&chain_id=eth' \
  -H 'accept: application/json'\
  -H 'AccessKey: YOUR_ACCESSKEY'
```
{% endtab %}
{% endtabs %}

Result

```json
[
  {
    "id": "defc948fbe6d3b138b49bf981e276f0b",
    "contract_id": "0x495f947276749ce646f68ac8c248420045cb7b5e",
    "inner_id": "55575360221028374465659771733000318579577403829328624053715758637886677712897",
    "chain": "eth",
    "name": "A New Era has begun",
    "description": "3 of 9\n\nOn February 8, 2021, one of the most influential men in the world decided to invest in Bitcoin. Elon Musk, owner of Tesl",
    "content_type": "image_url",
    "content": "https://lh3.googleusercontent.com/WQnK8JxSSPj5YIxegh9iaprMaMmv-JswrcnTp9Mi5PXKDWmigkOzTBBIAkhdXtLPe7EwIe6Q1gi2gdtLzV08d2y67rMVTHx0Ei0S",
    "detail_url": "https://opensea.io/assets/0x495f947276749ce646f68ac8c248420045cb7b5e/55575360221028374465659771733000318579577403829328624053715758637886677712897",
    "contract_name": "OpenSea Shared Storefront",
    "is_erc1155": true,
    "amount": 1,
    "protocol": {
      "id": "opensea",
      "chain": "eth",
      "name": "OpenSea",
      "site_url": "https://opensea.io",
      "logo_url": "https://static.debank.com/image/project/logo_url/opensea/4b23246fac2d4ce53bd8e8079844821c.png",
      "has_supported_portfolio": false,
      "tvl": 114295.77061458935
    },
    "pay_token": {
      "id": "eth",
      "chain": "eth",
      "name": "ETH",
      "symbol": "ETH",
      "display_symbol": null,
      "optimized_symbol": "ETH",
      "decimals": 18,
      "logo_url": "https://static.debank.com/image/token/logo_url/eth/935ae4e4d1d12d59a99717a24f2540b5.png",
      "protocol_id": "",
      "price": 2510.46,
      "is_verified": true,
      "is_core": true,
      "is_wallet": true,
      "time_at": 1628248886,
      "amount": 0.0178,
      "date_at": "2021-08-06"
    },
    "attributes": [
      {
        "trait_type": "Artist",
        "value": "SpaceTurtleShip"
      },
      {
        "trait_type": "Edition",
        "value": "1"
      }
    ],
    "usd_price": 51.492552,
    "collection_id": null
  }
]
```

## Get user nft list on all supported chain

#### Method

get

#### Path

/v1/user/all\_nft\_list

#### Parameters

* `id` : required, user address
* `is_all` : `boolean` - If true, all tokens are returned.
* `chain_ids` : optional, list of chain id, eg: eth, bsc, xdai, [for more info](../chain#returns-1).

#### Returns

[for more info](#get-user-history-list).

#### Request Example

{% tabs %}
{% tab title="Curl" %}
```bash
curl -X GET "https://pro-openapi.debank.com/v1/user/all_nft_list?id=YOUR_ADDRESS&chain_ids=bsc,eth \
    -H "accept: application/json" -H 'AccessKey: YOUR_ACCESSKEY'
```
{% endtab %}
{% endtabs %}

## Get user history list

Get user history list

#### Method

get

#### Path

/v1/user/history\_list

#### Parameters

* `id` : required, user address
* `chain_id` : required, chain id, eg: `eth`, `bsc`, `xdai`, [for more info](../chain#returns-1).
* `token_id`: token id, return the history list related to this token.
* `start_time`: timestamp, the returned history list are earlier than this time, if it's not provided, we will return the most recent n (default is 20) entries.&#x20;
* `page_count`: Number of entries returned, the maximum count is 20.

#### Returns

Request

{% tabs %}
{% tab title="Curl" %}
```bash
curl 'https://pro-openapi.debank.com/v1/user/history_list?id=0x5853ed4f26a3fcea565b3fbc698bb19cdf6deb85&chain_id=eth' \
  -H 'accept: application/json'\
  -H 'AccessKey: YOUR_ACCESSKEY'
```
{% endtab %}
{% endtabs %}

Result

An object with following fields:

* `cate_dict`: `dict` - Call type category (eg. `approve`, `receive`, `send`).
* `history_list`: Address's history transaction list.
  * `cate_id`: `string` - call type.
  * `chain`: `string` - chain id.
  * `id`: `string` - transaction hash.
  * `project_id`: `string` - project id which was interacted.
  * `sends`: `dict` - valid when cate\_id is `send`.
  * `receives`: `dict` - valid when cate\_id is `receive`.
  * `token_approve`: `dict` - valid when cate\_id is `approve`.
  * `time_at`: `integer` - timestamp.
  * `tx`: `dict` - The transaction's base info
  * `cex_id`: string - If the interaction address is the address of cex, otherwise it is null.&#x20;
* `project_dict`: `dict` - Projects which this address interacted.
* `token_dict`: `dict` - Tokens which this address interacted.
* `cex_dict`: `dict` - Cexs which this address interacted.

```json
{
  "cate_dict": {
    "approve": {
      "id": "approve",
      "name": "Authorize"
    },
    "receive": {
      "id": "receive",
      "name": "Receive"
    },
    "send": {
      "id": "send",
      "name": "Send"
    }
  },
  "history_list": [
    {
      "cate_id": "send",
      "chain": "eth",
      "id": "0x403d4d104637442ed98132157319b6a5771a402551c7a1f9a0cbebea201c9930",
      "project_id": null,
      "receives": [],
      "cex_id": "0x4c2e86c04e3829bc6808b9fc87f21350fde5e41c",
      "sends": [
        {
          "amount": 0.01,
          "to_addr": "0x4c2e86c04e3829bc6808b9fc87f21350fde5e41c",
          "token_id": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
        }
      ],
      "time_at": 1646634891,
      "token_approve": null,
      "tx": {
        "eth_gas_fee": 0.002296035,
        "from_addr": "0x5853ed4f26a3fcea565b3fbc698bb19cdf6deb85",
        "name": "transfer",
        "params": [],
        "status": 1,
        "to_addr": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        "usd_gas_fee": 5.82290548245,
        "value": 0
      }
    },
    {
      "cate_id": "approve",
      "chain": "eth",
      "id": "0x8e4245cc567905898b3148d43b9e73e543acdadd180ab7334a97377f9524ce03",
      "other_addr": "0xd07e86f68c7b9f9b215a3ca3e79e74bf94d6a847",
      "project_id": "daomaker",
      "receives": [],
      "sends": [],
      "time_at": 1641536066,
      "cex_id": null,
      "token_approve": {
        "spender": "0xd07e86f68c7b9f9b215a3ca3e79e74bf94d6a847",
        "token_id": "0x0f51bb10119727a7e5ea3538074fb341f56b09ad",
        "value": 1000000000000000
      },
      "tx": {
        "eth_gas_fee": 0.00603421,
        "from_addr": "0x5853ed4f26a3fcea565b3fbc698bb19cdf6deb85",
        "name": "approve",
        "params": [],
        "status": 1,
        "to_addr": "0x0f51bb10119727a7e5ea3538074fb341f56b09ad",
        "usd_gas_fee": 19.2814732656,
        "value": 0
      }
    }
  ],
  "cex_dict": {
      "0x4c2e86c04e3829bc6808b9fc87f21350fde5e41c": {
          "id": "binance",
          "is_vault": true,
          "logo_url": "https://static.debank.com/image/cex/logo_url/binance/cfa71c75835c750c186010fb19707859.png",
          "name": "Binance"
      }
  },
  "project_dict": {
    "zkswap": {
      "chain": "eth",
      "id": "zkswap",
      "logo_url": "https://static.debank.com/image/project/logo_url/zkswap/7686efb3683487e4f96b4c639854c06a.png",
      "name": "ZKSwap",
      "site_url": "https://zks.app"
    }
  },
  "token_dict": {
    "eth": {
      "chain": "eth",
      "decimals": 18,
      "display_symbol": null,
      "id": "eth",
      "is_core": true,
      "is_verified": true,
      "is_wallet": true,
      "logo_url": "https://static.debank.com/image/token/logo_url/eth/935ae4e4d1d12d59a99717a24f2540b5.png",
      "name": "ETH",
      "optimized_symbol": "ETH",
      "price": 2536.07,
      "protocol_id": "",
      "symbol": "ETH",
      "time_at": 1483200000
    }
  }
}
```

## Get user transaction history on all supported chains

#### Method

get

#### Path

/v1/user/all\_history\_list

#### Parameters

* `id` : required, user address
* `start_time`: timestamp, the returned history list are eariler than this time, if it's not provided, we will return the number of recent entries.
* `page_count`: Number of entries returned, the maximum count is 20.
* `chain_ids` : optional, list of chain id, eg: eth, bsc, xdai, [for more info](../chain#returns-1).

#### Returns

Same format as the result returned by `/v1/user/history_hist`. [for more info](#get-user-histroy-list).

## Get user token authorized list

Get user token authorized list

#### Method

get

#### Path

/v1/user/token\_authorized\_list

#### Parameters

* `id` : required, user address
* `chain_id` : required, chain id, eg: `eth`, `bsc`, `xdai`, [for more info](../chain#returns-1).

#### Returns

Request

{% tabs %}
{% tab title="Curl" %}
```bash
curl 'https://pro-openapi.debank.com/v1/user/token_authorized_list?id=0x5853ed4f26a3fcea565b3fbc698bb19cdf6deb85&chain_id=eth' \
  -H 'accept: application/json'\
  -H 'AccessKey: YOUR_ACCESSKEY'
```
{% endtab %}
{% endtabs %}

Result

`Array` of `Object` - An object with following fields:

* `id`: `string` - approved contract's id.
* `name`: `string` - approved contract's name.
* `symbol`: `string` - approved contract's symbol.
* `logo_url`: `string` - approved contract's logo url.
* `chain`: `string` - chain id.
* `price`: `double` - native token price of the chain.
* `balance`: `double` - address's balance of the chain.
* `spenders`: list of object with following fields.
  * `id`: `string` - spender's address.
  * `value`: `integer` - approved amount.
  * `exposure_usd`: `double` - exposure value with usd.
  * `protocol`: `dict` - spender's protocol info.
  * `is_contract`: `boolean` - whether spender is contract.
* `sum_exposure_usd`: `double` - total number of exposure value denominated in USD.
* `exposure_balance`: `double` - total number of exposure amount.

```json
[
  {
    "id": "0xc1330acbbce97cb9695b7ee161c0f95b875a8b0f",
    "name": "One Eth",
    "symbol": "ONE",
    "logo_url": "",
    "chain": "eth",
    "price": 2579.51594392348,
    "balance": 0.09901859967795691,
    "spenders": [
      {
        "id": "0x3bdf1977d87edad8e0617efcea958f6d43a4c30e",
        "value": 1.157920892373162e59,
        "exposure_usd": 255.4200566142662,
        "protocol": {
          "id": "onx",
          "name": "OnX",
          "logo_url": "https://static.debank.com/image/project/logo_url/onx/5880dc343af9d03cf46a52a2d0bb1929.png",
          "chain": "eth"
        },
        "is_contract": true,
        "is_open_source": true,
        "is_hacked": false,
        "is_abandoned": false
      },
      {
        "id": "0xc36442b4a4522e871399cd717abdd847ab11fe88",
        "value": 1.157920892373162e59,
        "exposure_usd": 255.4200566142662,
        "protocol": {
          "id": "uniswap3",
          "name": "Uniswap V3",
          "logo_url": "https://static.debank.com/image/project/logo_url/uniswap3/87a541b3b83b041c8d12119e5a0d19f0.png",
          "chain": "eth"
        },
        "is_contract": true,
        "is_open_source": true,
        "is_hacked": false,
        "is_abandoned": false
      }
    ],
    "sum_exposure_usd": 255.4200566142662,
    "exposure_balance": 0.09901859967795691
  }
]
```

## Get user nft authorized list

Get user nft authorized list

#### Method

get

#### Path

/v1/user/nft\_authorized\_list

#### Parameters

* `id` : required, user address
* `chain_id` : required, chain id, eg: `eth`, `bsc`, `xdai`, [for more info](../chain#returns-1).

#### Returns

Request

{% tabs %}
{% tab title="Curl" %}
```bash
curl 'https://pro-openapi.debank.com/v1/user/nft_authorized_list?id=0x5853ed4f26a3fcea565b3fbc698bb19cdf6deb85&chain_id=eth' \
  -H 'accept: application/json'\
  -H 'AccessKey: YOUR_ACCESSKEY'
```
{% endtab %}
{% endtabs %}

Result

* `tokens`: `list` - approved erc721 token list （approve single nft token）
  * `id`: `string` - approved nft's id.
  * `contract_id`: `string` - contract id
  * `inner_id`: `string` - nft's index id
  * `chain`: `string` - chain id.
  * `name`: `string` - nft's name.
  * `symbol`: `string` - contract's symbol.
  * `total_supply`: `integer` - total supply.
  * `description`: `string` - description
  * `content_type`: `string` - content type, eg. image\_url
  * `content`: `string` - content
  * `detail_url`: `string` - detail url
  * `contract_name`: `string` - contract's name
  * `is_erc1155`: `boolean` - is erc1155, default is empty
  * `is_erc721`: `boolean` - is erc721, default is empty
  * `amount`: `string` - approved amount
  * `spenders`: list of object with following fields.
    * `id`: `string` - spender's address.
    * `protocol`: `dict` - spender's protocol info.
* `contracts`: `list` - approved contract list (approve all)
  * `chain`: `string` - chain id.
  * `contract_name`: `string` - contract's name
  * `contract_id`: `string` - contract id
  * `is_erc1155`: `boolean` - is erc1155, default is empty
  * `is_erc721`: `boolean` - is erc721, default is empty
  * `amount`: `string` - approved amount
  * `spenders`: list of object with following fields.
    * `id`: `string` - spender's address.
    * `protocol`: `dict` - spender's protocol info.
* `total`: `string` - the amount of user nft tokens.

```json
{
  "tokens": [
    {
      "id": "cd99efdea729e09ef472755e8ed64353",
      "contract_id": "0xc36442b4a4522e871399cd717abdd847ab11fe88",
      "inner_id": "42307",
      "chain": "eth",
      "name": null,
      "symbol": "UNI-V3-POS",
      "description": null,
      "content_type": null,
      "content": null,
      "total_supply": 1,
      "detail_url": "https://opensea.io/assets/0xc36442b4a4522e871399cd717abdd847ab11fe88/42307",
      "contract_name": "Uniswap V3 Positions NFT-V1",
      "is_erc721": true,
      "amount": "1",
      "spender": {
        "id": "0x68924dbd6eb82bfe666b2e0403f4cd1cd6790c3f",
        "protocol": {
          "id": "fixedforex",
          "name": "Fixedforex",
          "logo_url": "https://static.debank.com/image/project/logo_url/fixedforex/5a8f4591da5aee468ab871f44924025e.png",
          "chain": "eth"
        }
      }
    }
  ],
  "contracts": [
    {
      "chain": "eth",
      "contract_name": "Uniswap V3 Positions NFT-V1",
      "contract_id": "0xc36442b4a4522e871399cd717abdd847ab11fe88",
      "is_erc721": true,
      "amount": "18",
      "spender": {
        "id": "0x461b154b688d5171934d70f991c17d719082710c",
        "protocol": {
          "id": "izumi",
          "name": "iZUMi Finance",
          "logo_url": "https://static.debank.com/image/project/logo_url/izumi/e1df9915834abea10d21f273949180b1.png",
          "chain": "eth"
        }
      }
    },
    {
      "chain": "eth",
      "contract_name": "Bushidos",
      "contract_id": "0xd2aad45015090f8d45ad78e456b58dd61fb7cd79",
      "is_erc721": true,
      "amount": "16",
      "spender": {
        "id": "0xf42aa99f011a1fa7cda90e5e98b277e306bca83e",
        "protocol": {
          "id": "looksrare",
          "name": "LooksRare",
          "logo_url": "https://static.debank.com/image/project/logo_url/looksrare/45d6664429880a23ba34359c45bab95e.png",
          "chain": "eth"
        }
      }
    },
    {
      "chain": "eth",
      "amount": "12",
      "is_erc1155": true,
      "contract_name": "",
      "spender": {
        "id": "0x5bd25d2f4f26bc82a34de016d34612a28a0cd492",
        "protocol": null
      },
      "contract_id": "0x9b1bfa5d13375e8e21fdcb0a5f965974f9dcfdd1"
    },
    {
      "chain": "eth",
      "contract_name": "Prime Ape Planet",
      "contract_id": "0x6632a9d63e142f17a668064d41a21193b49b41a0",
      "is_erc721": true,
      "amount": "6",
      "spender": {
        "id": "0x4e81d41af8a4f2ee72a07f422adc32e6a1e27bf8",
        "protocol": {
          "id": "opensea",
          "name": "OpenSea",
          "logo_url": "https://static.debank.com/image/project/logo_url/opensea/4b23246fac2d4ce53bd8e8079844821c.png",
          "chain": "eth"
        }
      }
    },
    {
      "chain": "eth",
      "contract_name": "Hashmasks",
      "contract_id": "0xc2c747e0f7004f9e8817db2ca4997657a7746928",
      "is_erc721": true,
      "amount": "2",
      "spender": {
        "id": "0x28e9162fc10bb3a7f98f44e90fa7273698fce360",
        "protocol": null
      }
    },
    {
      "chain": "eth",
      "contract_name": "sLoot",
      "contract_id": "0xb12f78434ae7d12ae548c51a5cb734ecc4536594",
      "is_erc721": true,
      "amount": "1",
      "spender": {
        "id": "0x4e81d41af8a4f2ee72a07f422adc32e6a1e27bf8",
        "protocol": {
          "id": "opensea",
          "name": "OpenSea",
          "logo_url": "https://static.debank.com/image/project/logo_url/opensea/4b23246fac2d4ce53bd8e8079844821c.png",
          "chain": "eth"
        }
      }
    },
    {
      "chain": "eth",
      "contract_name": "JPEG Cards",
      "contract_id": "0x83979584ec8c6d94d93f838a524049173deba6f4",
      "is_erc721": true,
      "amount": "0",
      "spender": {
        "id": "0x45c2d9f2553f4e1794e1b99b8e319ead8a066f81",
        "protocol": null
      }
    }
  ],
  "total": "56"
}
```

## Get user total balance on all supported chains

Get net assets on multiple chains, including tokens and protocols

#### Method

get

#### Path

/v1/user/total\_balance

#### Parameters

* `id` : required, user address

#### Returns

return the total net assets and the net assets of each chain.

`Object` - An object with following fields:

* `total_usd_value` : `double` - The price of all assets in a user's account.
* `chain_list` : `Array` of `Object` - An object with following fields:
  * `id` : `string` - The chain's id.
  * `community_id` : `integer` - The community-identified id.
  * `name` : `string` - The chain's name.
  * `logo_url` : `string` URL of the chain's logo image. `null` if not available.
  * `native_token_id` : `string` - The native token's id.
  * `wrapped_token_id`: `string` - The address of the native token.
  * `usd_value` : `double`- The price of user assets on this chain.

Request

{% tabs %}
{% tab title="Curl" %}
```bash
curl -X 'GET' \
  'https://pro-openapi.debank.com/v1/user/total_balance?id=0x5853ed4f26a3fcea565b3fbc698bb19cdf6deb85' \
  -H 'accept: application/json'\
  -H 'AccessKey: YOUR_ACCESSKEY'
```
{% endtab %}
{% endtabs %}

Result

```json
{
  "total_usd_value": 27654.142997146177,
  "chain_list": [
    {
      "id": "eth",
      "community_id": 1,
      "name": "Ethereum",
      "native_token_id": "eth",
      "logo_url": "https://static.debank.com/image/chain/logo_url/eth/42ba589cd077e7bdd97db6480b0ff61d.png",
      "wrapped_token_id": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
      "usd_value": 11937.702345945296
    },
    {
      "id": "bsc",
      "community_id": 56,
      "name": "BSC",
      "native_token_id": "bsc",
      "logo_url": "https://static.debank.com/image/chain/logo_url/bsc/7c87af7b52853145f6aa790d893763f1.png",
      "wrapped_token_id": "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
      "usd_value": 2279.5321187397594
    },
    {
      "id": "xdai",
      "community_id": 100,
      "name": "xDai",
      "native_token_id": "xdai",
      "logo_url": "https://static.debank.com/image/chain/logo_url/xdai/8b5320523b30bd57a388d1bcc775acd5.png",
      "wrapped_token_id": "0xe91d153e0b41518a2ce8dd3d7944fa863463a97d",
      "usd_value": 305.39078328786195
    },
    {
      "id": "matic",
      "community_id": 137,
      "name": "Polygon",
      "native_token_id": "matic",
      "logo_url": "https://static.debank.com/image/chain/logo_url/matic/d3d807aff1a13e9ba51a14ff153d6807.png",
      "wrapped_token_id": "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
      "usd_value": 1241.1293776554253
    },
    {
      "id": "ftm",
      "community_id": 250,
      "name": "Fantom",
      "native_token_id": "ftm",
      "logo_url": "https://static.debank.com/image/chain/logo_url/ftm/700fca32e0ee6811686d72b99cc67713.png",
      "wrapped_token_id": "0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83",
      "usd_value": 388.4508412244692
    },
    {
      "id": "okt",
      "community_id": 66,
      "name": "OEC",
      "native_token_id": "okt",
      "logo_url": "https://static.debank.com/image/chain/logo_url/okt/1228cd92320b3d33769bd08eecfb5391.png",
      "wrapped_token_id": "0x8f8526dbfd6e38e3d8307702ca8469bae6c56c15",
      "usd_value": 1051.8493580839101
    },
    {
      "id": "heco",
      "community_id": 128,
      "name": "HECO",
      "native_token_id": "heco",
      "logo_url": "https://static.debank.com/image/chain/logo_url/heco/db5152613c669e0cc8624d466d6c94ea.png",
      "wrapped_token_id": "0x5545153ccfca01fbd7dd11c0b23ba694d9509a6f",
      "usd_value": 85.54070337826396
    },
    {
      "id": "avax",
      "community_id": 43114,
      "name": "Avalanche",
      "native_token_id": "avax",
      "logo_url": "https://static.debank.com/image/chain/logo_url/avax/4d1649e8a0c7dec9de3491b81807d402.png",
      "wrapped_token_id": "0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7",
      "usd_value": 3251.9556287016276
    },
    {
      "id": "op",
      "community_id": 10,
      "name": "Optimism",
      "native_token_id": "op",
      "logo_url": "https://static.debank.com/image/chain/logo_url/op/01ae734fe781c9c2ae6a4cc7e9244056.png",
      "wrapped_token_id": "0x4200000000000000000000000000000000000006",
      "usd_value": 481.6603092427565
    },
    {
      "id": "arb",
      "community_id": 42161,
      "name": "Arbitrum",
      "native_token_id": "arb",
      "logo_url": "https://static.debank.com/image/chain/logo_url/arb/f6d1b236259654d531a1459b2bccaf64.png",
      "wrapped_token_id": "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
      "usd_value": 3394.648029286528
    },
    {
      "id": "celo",
      "community_id": 42220,
      "name": "Celo",
      "native_token_id": "0x471ece3750da237f93b8e339c536989b8978a438",
      "logo_url": "https://static.debank.com/image/chain/logo_url/celo/41da5c1d3c0945ae822a1f85f02c76cf.png",
      "wrapped_token_id": "",
      "usd_value": 162.94112590980387
    },
    {
      "id": "movr",
      "community_id": 1285,
      "name": "Moonriver",
      "native_token_id": "movr",
      "logo_url": "https://static.debank.com/image/chain/logo_url/movr/4b0de5a711b437f187c0d0f15cc0398b.png",
      "wrapped_token_id": "0xe3c7487eb01c74b73b7184d198c7fbf46b34e5af",
      "usd_value": 996.3205434639602
    },
    {
      "id": "cro",
      "community_id": 25,
      "name": "Cronos",
      "native_token_id": "cro",
      "logo_url": "https://static.debank.com/image/chain/logo_url/cro/44f784a1f4c0ea7d26d00acabfdf0028.png",
      "wrapped_token_id": "0x5c7f8a570d578ed84e63fdfa7b1ee72deae1ae23",
      "usd_value": 67.64405055936568
    },
    {
      "id": "boba",
      "community_id": 288,
      "name": "Boba",
      "native_token_id": "boba",
      "logo_url": "https://static.debank.com/image/chain/logo_url/boba/e43d79cd8088ceb3ea3e4a240a75728f.png",
      "wrapped_token_id": "0xdeaddeaddeaddeaddeaddeaddeaddeaddead0000",
      "usd_value": 2009.3777816671507
    }
  ]
}
```

## Get user 24-hour net curve on a single chain

Get net curve of user on a single chain

#### Method

get

#### Path

/v1/user/chain\_net\_curve

#### Parameters

* `id` : required, user address
* `chain_id` :  required, chain id, eg: `eth`, `bsc`, `xdai`, [for more info](../chain#returns-1).

#### Returns

return timestamp and the value of user at the timestamp.

`Array` of `Object` - An object with following fields:

* `timestamp` : `double` - The timestamp on the curve.
* `usd_value` : `double` - The price of all assets in a user's account at the timestamp.

Request

{% tabs %}
{% tab title="Curl" %}
```bash
curl -X 'GET' \
  'https://pro-openapi.debank.com/v1/user/chain_net_curve?id=0x5853ed4f26a3fcea565b3fbc698bb19cdf6deb85&chain_id=eth' \
  -H 'accept: application/json'\
  -H 'AccessKey: YOUR_ACCESSKEY'
```
{% endtab %}
{% endtabs %}

Result

```json
[
    {
        "timestamp": 1671012000,
        "usd_value": 333318.12768559786
    },
    {
        "timestamp": 1671012300,
        "usd_value": 333319.4193142207
    },
    {
        "timestamp": 1671012600,
        "usd_value": 332964.5462521421
    },
    {
        "timestamp": 1671012900,
        "usd_value": 332964.5462521421
    }
]
```

## Get user 24-hour net curve on all chains

Get net curve of user on chains

#### Method

get

#### Path

/v1/user/total\_net\_curve

#### Parameters

* `id` : required, user address
* `chain_ids` :  optional, chain id, eg: `eth`, `bsc`, `xdai`, [for more info](../chain#returns-1). All chains by default.

#### Returns

return timestamp and the value of user at the timestamp.

`Array` of `Object` - An object with following fields:

* `timestamp` : `double` - The timestamp on the curve.
* `usd_value` : `double` - The price of all assets in a user's account at the timestamp.

Request

{% tabs %}
{% tab title="Curl" %}
```bash
curl -X 'GET' \
  'https://pro-openapi.debank.com/v1/user/total_net_curve?id=0x5853ed4f26a3fcea565b3fbc698bb19cdf6deb85&chain_ids=eth,bsc' \
  -H 'accept: application/json'\
  -H 'AccessKey: YOUR_ACCESSKEY'
```
{% endtab %}
{% endtabs %}

Result

```json
[
    {
        "timestamp": 1671012000,
        "usd_value": 333318.12768559786
    },
    {
        "timestamp": 1671012300,
        "usd_value": 333319.4193142207
    },
    {
        "timestamp": 1671012600,
        "usd_value": 332964.5462521421
    },
    {
        "timestamp": 1671012900,
        "usd_value": 332964.5462521421
    }
]
```
