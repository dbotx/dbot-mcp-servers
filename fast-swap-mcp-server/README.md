[English](./README.md) | [中文](./README.zh-CN.md)

# Professional Multi-Chain DEX Trading MCP Server

Fast Swap MCP Server - Supports quickly initiating token buy/sell tasks, querying transaction results, and managing take-profit/stop-loss tasks.

Powered by DBot - [www.dbotx.com](https://www.dbotx.com)

## 🚀 Features

Here is a summary of the features:

- 🚀 **Fast Trading**: Supports multi-chain fast buy/sell transactions (Solana, Ethereum, Base, BSC, Tron).
- 💼 **Multi-Wallet Support**: Supports trading with multiple wallets simultaneously.
- 📊 **Order Query**: Query transaction order status and details.
- 📈 **Take-Profit/Stop-Loss**: Manage take-profit and stop-loss tasks.

## Quick Start

Here is how to use it:

Add to your MCP client configuration:

**Example:**
```json
{
  "mcpServers": {
    "fast-swap": {
      "command": "npx",
      "args": ["-y", "@dbotx/fast-swap-mcp-server@latest"],
      "env": {
        "DBOT_API_KEY": "your-api-key",
        "DBOT_WALLET_ID": "your-wallet-id"
      }
    }
  }
}
```
**Get your api-key and wallet-id at [www.dbotx.com](https://www.dbotx.com)**

## 📚 Typical Scenarios

- **Quick Buy**:
  - "Help me buy token {{token_address}} on Solana for 0.001 SOL."
- **Quick Sell**:
  - "Help me sell 50% of my position in token {{token_address}} on Solana."
- **Buy and Set Take-Profit/Stop-Loss**:
  - "Help me buy token {{token_address}} on Solana for 0.001 SOL, sell 60% when the price rises by 80%, and sell 80% when it falls by 30%."
- **Modify Take-Profit/Stop-Loss**:
  - "Help me change the stop-loss order to sell 100% of the position."
- **Manage Take-Profit/Stop-Loss**:
  - "Help me disable the take-profit order."
  - "Help me enable the take-profit order."
  - "Help me delete the take-profit order."

## 🌱 Environment Variables

Here are the environment variables explained:

### Required Environment Variables
- `DBOT_API_KEY`: DBot API key (required)
- `DBOT_WALLET_ID`: Default wallet ID (required)

### Optional Default Parameter Configuration
- You can change the configuration according to the examples. If not changed, the default configuration will be used.
- The default configuration can be obtained by talking to the LLM, for example, "Tell me the default configuration for the fast swap tool."
- All environment variable defaults can be overridden during the conversation. For example, if the system's default is to enable anti-sandwich mode, you can request to override it by saying, "Buy..., please disable anti-sandwich mode."

#### Basic Configuration
- `DBOT_CHAIN`: Default chain type (solana/ethereum/base/bsc/tron)
- `DBOT_CUSTOM_FEE_AND_TIP`: Whether to use custom fees (true/false)
- `DBOT_PRIORITY_FEE`: Priority fee, e.g., "0.0001"
- `DBOT_GAS_FEE_DELTA`: Gas fee increment, e.g., 5
- `DBOT_MAX_FEE_PER_GAS`: Maximum gas fee, e.g., 100
- `DBOT_JITO_ENABLED`: Whether to enable anti-sandwich mode (true/false)
- `DBOT_JITO_TIP`: Anti-sandwich tip, e.g., 0.001
- `DBOT_MAX_SLIPPAGE`: Maximum slippage (0.00-1.00), e.g., 0.1
- `DBOT_CONCURRENT_NODES`: Number of concurrent nodes (1-3), e.g., 2
- `DBOT_RETRIES`: Number of retries (0-10), e.g., 1

**Example:**
```json
{
  "env": {
    "DBOT_API_KEY": "your-api-key",
    "DBOT_WALLET_ID": "your-wallet-id",
    "DBOT_CHAIN": "solana",
    "DBOT_CUSTOM_FEE_AND_TIP": "true",
    "DBOT_PRIORITY_FEE": "0.0002",
    "DBOT_GAS_FEE_DELTA": "5",
    "DBOT_MAX_FEE_PER_GAS": "100",
    "DBOT_JITO_ENABLED": "true",
    "DBOT_JITO_TIP": "0.001",
    "DBOT_MAX_SLIPPAGE": "0.1",
    "DBOT_CONCURRENT_NODES": "2",
    "DBOT_RETRIES": "1"
  }
}
```

#### Trading Configuration
- `DBOT_AMOUNT_OR_PERCENT`: Default trade amount or percentage, e.g., 0.001
- `DBOT_MIGRATE_SELL_PERCENT`: Migration sell percentage (0.00-1.00), e.g., 1.0
- `DBOT_MIN_DEV_SELL_PERCENT`: Minimum developer sell percentage (0.00-1.00), e.g., 0.5
- `DBOT_DEV_SELL_PERCENT`: Developer sell percentage (0.00-1.00), e.g., 1.0

**Example:**
```json
{
  "env": {
    "DBOT_API_KEY": "your-api-key",
    "DBOT_WALLET_ID": "your-wallet-id",
    "DBOT_AMOUNT_OR_PERCENT": "0.001",
    "DBOT_MIGRATE_SELL_PERCENT": "1.0",
    "DBOT_MIN_DEV_SELL_PERCENT": "0.5",
    "DBOT_DEV_SELL_PERCENT": "1.0"
  }
}
```

#### Take-Profit/Stop-Loss Configuration
- `DBOT_PNL_ORDER_EXPIRE_DELTA`: Take-profit/stop-loss order expiration time (in milliseconds), e.g., 43200000
- `DBOT_PNL_ORDER_EXPIRE_EXECUTE`: Whether to execute expired orders (true/false)
- `DBOT_PNL_ORDER_USE_MID_PRICE`: Whether to use the mid-price (true/false)
- `DBOT_PNL_CUSTOM_CONFIG_ENABLED`: Whether to enable custom take-profit/stop-loss configuration (true/false)

**Example:**
```json
{
  "env": {
    "DBOT_API_KEY": "your-api-key",
    "DBOT_WALLET_ID": "your-wallet-id",
    "DBOT_PNL_ORDER_EXPIRE_DELTA": "43200000",
    "DBOT_PNL_ORDER_EXPIRE_EXECUTE": "true",
    "DBOT_PNL_ORDER_USE_MID_PRICE": "false",
    "DBOT_PNL_CUSTOM_CONFIG_ENABLED": "true"
  }
}
```

Note:
1. All boolean environment variable values should use the strings "true" or "false".
2. Numeric environment variable values should also be in string form.
3. Parameter values specified at runtime will override the default values in the environment variables.
4. You can configure only some parameters as needed; unconfigured parameters will use the system defaults.

## 🛠️ Available Tools

Here are the tools explained:

### create_fast_swap

Create a fast swap order, supporting multi-chain trading (solana/ethereum/base/bsc/tron) and setting take-profit/stop-loss on buy/sell.

**Parameters:**
- `chain` (string, optional): The chain (solana/ethereum/base/bsc/tron), defaults to solana if not specified.
- `pair` (string, required): The token or trading pair address to buy/sell.
- `walletId` (string, optional): The ID of the wallet to use, obtainable via the "Wallet Info API" (will use `DBOT_WALLET_ID` if not provided).
- `type` (string, required): The transaction type, either 'buy' or 'sell'.
- `amountOrPercent` (number, optional): When buying, the buy amount (in ETH/SOL/BNB/TRX); when selling, the sell percentage (0.00-1.00), defaults to 0.001.
- `customFeeAndTip` (boolean, optional): "true" means both priority fee and bribe are effective; "false" means only priority fee is effective in high-speed mode, and only bribe is effective in anti-sandwich mode. Defaults to false.
- `priorityFee` (string, optional): Priority fee (in SOL), effective for Solana. An empty string means automatic priority fee. Defaults to "0.0001".
- `gasFeeDelta` (number, optional): Additional gas to add (in Gwei), effective for EVM chains. Defaults to 5.
- `maxFeePerGas` (number, optional): The transaction will not proceed if the base gas exceeds this value (in Gwei), effective for EVM chains. Defaults to 100.
- `jitoEnabled` (boolean, optional): Whether to enable anti-sandwich mode (Solana & Ethereum & BSC). Defaults to true.
- `jitoTip` (number, optional): The bribe to use in anti-sandwich mode (Solana). Defaults to 0.001.
- `maxSlippage` (number, optional): Maximum slippage (0.00-1.00). Defaults to 0.1.
- `concurrentNodes` (number, optional): Number of concurrent nodes (1-3). Defaults to 2.
- `retries` (number, optional): Number of retries on failure (0-10). Defaults to 1.
- `migrateSellPercent` (number, optional): Migration sell percentage (0.00-1.00). Defaults to 1.0.
- `minDevSellPercent` (number, optional): Minimum developer sell percentage (0.00-1.00). Defaults to 0.5.
- `devSellPercent` (number, optional): Developer sell percentage (0.00-1.00). Defaults to 1.0.
- `stopEarnPercent` (number, optional): Take-profit percentage (0.00 and above).
- `stopLossPercent` (number, optional): Stop-loss percentage (0.00-1.00).
- `stopEarnGroup` (array, optional): Take-profit group settings, max 6 groups.
- `stopLossGroup` (array, optional): Stop-loss group settings, max 6 groups.
- `trailingStopGroup` (array, optional): Trailing stop settings, max 1 group.
- `pnlOrderExpireDelta` (number, optional): Take-profit/stop-loss order validity duration (in milliseconds). Defaults to 43200000.
- `pnlOrderExpireExecute` (boolean, optional): Whether to execute the take-profit/stop-loss order upon expiration. Defaults to false.
- `pnlOrderUseMidPrice` (boolean, optional): Whether the take-profit/stop-loss order should use the mid-price. Defaults to false.
- `pnlCustomConfigEnabled` (boolean, optional): Whether to enable custom take-profit/stop-loss configuration. Defaults to true.
- `pnlCustomConfig` (object, optional): Custom take-profit/stop-loss configuration.

### create_fast_swaps

Create fast swap orders, supporting multi-chain trading (solana/ethereum/base/bsc/tron), setting take-profit/stop-loss on buy/sell, and using multiple wallets simultaneously.

**Parameters:**
- `chain` (string, optional): The chain (solana/ethereum/base/bsc/tron), defaults to solana if not specified.
- `pair` (string, required): The token or trading pair address to buy/sell.
- `walletIdList` (array, required): A list of wallet IDs to use, max 5 wallets.
- `type` (string, required): The transaction type, either 'buy' or 'sell'.
- `customFeeAndTip` (boolean, optional): "true" means both priority fee and bribe are effective. Defaults to false.
- `priorityFee` (string, optional): Priority fee (in SOL). Defaults to an empty string.
- `gasFeeDelta` (number, optional): Additional gas to add (in Gwei). Defaults to 5.
- `maxFeePerGas` (number, optional): The transaction will not proceed if the base gas exceeds this value (in Gwei). Defaults to 100.
- `jitoEnabled` (boolean, optional): Whether to enable anti-sandwich mode. Defaults to false.
- `jitoTip` (number, optional): The bribe to use in anti-sandwich mode (Solana). Defaults to 0.001.
- `maxSlippage` (number, optional): Maximum slippage. Defaults to 0.1.
- `concurrentNodes` (number, optional): Number of concurrent nodes. Defaults to 2.
- `retries` (number, optional): Number of retries on failure. Defaults to 1.
- `minAmount` (number, optional): Minimum buy amount (in ETH/SOL/BNB/TRX).
- `maxAmount` (number, optional): Maximum buy amount (in ETH/SOL/BNB/TRX).
- `sellPercent` (number, optional): Sell percentage (0.00-1.00). Defaults to 1.0.
- `stopEarnPercent` (number, optional): Take-profit percentage (0.00 and above).
- `stopLossPercent` (number, optional): Stop-loss percentage (0.00-1.00).
- `stopEarnGroup` (array, optional): Take-profit group settings, max 6 groups.
- `stopLossGroup` (array, optional): Stop-loss group settings, max 6 groups.
- `trailingStopGroup` (array, optional): Trailing stop settings, max 1 group.
- `pnlOrderExpireDelta` (number, optional): Take-profit/stop-loss order validity duration (in milliseconds). Defaults to 43200000.
- `pnlOrderExpireExecute` (boolean, optional): Whether to execute the take-profit/stop-loss order upon expiration. Defaults to false.
- `pnlOrderUseMidPrice` (boolean, optional): Whether the take-profit/stop-loss order should use the mid-price. Defaults to false.
- `pnlCustomConfigEnabled` (boolean, optional): Whether to enable custom take-profit/stop-loss configuration. Defaults to true.
- `pnlCustomConfig` (object, optional): Custom take-profit/stop-loss configuration.

### get_swap_order_info

Query fast swap order information.

**Parameters:**
- `ids` (string): A list of order IDs, separated by commas **[required]**

### get_swap_records

Get all of a user's fast swap records.

**Parameters:**
- `page` (number, optional): Page number, defaults to 0.
- `size` (number, optional): Number of items per page (max 20), defaults to 10.
- `chain` (string, optional): Chain name (solana/ethereum/base/bsc/tron).

### swap_tpsl_tasks

Get all take-profit/stop-loss tasks created by a user's fast swaps.

**Parameters:**
- `page` (number, optional): Page number, defaults to 0.
- `size` (number, optional): Number of items per page (max 20), defaults to 10.
- `chain` (string, optional): Chain name (solana/ethereum/base/bsc/tron).
- `state` (string, optional): Task state (init/processing/done/fail/expired), defaults to 'init'.
- `sourceId` (string, optional): Fast swap record ID.
- `token` (string, optional): Token address.
- `sortBy` (string, optional): Sort field.
- `sort` (number, optional): Sort direction: 1 for ascending, -1 for descending, defaults to -1.

### edit_fastswap_tpsl_order

Edit a take-profit/stop-loss order created by a fast swap.

**Parameters:**
- `id` (string): Order ID **[required]**
- `enabled` (boolean, optional): Task enabled state
- `groupId` (string, optional): Group ID
- `triggerPriceUsd` (string, optional): Trigger price (in USD)
- `triggerDirection` (string, optional): 'up' or 'down'
- `currencyAmountUI` (number, optional): Buy amount or sell percentage
- `customFeeAndTip` (boolean, optional): Custom fee
- `priorityFee` (string, optional): Priority fee
- `gasFeeDelta` (number, optional): Gas increment
- `maxFeePerGas` (number, optional): Maximum gas fee
- `jitoEnabled` (boolean, optional): Enable Jito
- `jitoTip` (number, optional): Jito tip
- `expireDelta` (number, optional): Expiration time (in milliseconds)
- `expireExecute` (boolean, optional): Execute after expiration
- `useMidPrice` (boolean, optional): Use mid-price
- `maxSlippage` (number, optional): Maximum slippage
- `concurrentNodes` (number, optional): Number of concurrent nodes
- `retries` (number, optional): Number of retries

### enable_fastswap_tpsl_order

Enable/disable a take-profit/stop-loss order created by a fast swap.

**Parameters:**
- `id` (string): Order ID **[required]**
- `enabled` (boolean): Enabled state **[required]**

### delete_fastswap_tpsl_order

Delete a take-profit/stop-loss order created by a fast swap.

**Parameters:**
- `id` (string): Order ID **[required]**


## 📚 API Documentation

For complete API documentation, please refer to: [DBot API](https://dbotx.com/docs).

## 📄 License

MIT License

## 💡 Support

For issues or suggestions, please visit [GitHub Issues](https://github.com/dbotx/dbot-mcp-servers/issues). 