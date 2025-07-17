[English](./README.md) | [中文](./README.zh-CN.md)

# Professional Multi-Chain DEX Trading Server

Conditional Order MCP Server - Supports creating and managing automated trading tasks like sell on market open and follow dev's sell.

## 🚀 Features

- 🚀 **Sell on Open**: Automatically sell when a token migrates from Pump to Raydium.
- 👥 **Follow Dev's Sell**: Automatically follow and sell when a developer sells a specified percentage of tokens.
- ⚡ **Smart Monitoring**: Real-time monitoring of token status and developer behavior.
- 🔧 **Flexible Management**: Create, edit, enable/disable, and delete tasks.
- 📊 **Status Tracking**: View task status and execution history.
- 🤖 **Automated Execution**: Automatically triggers trades when conditions are met.
- 🎯 **Precise Control**: Supports custom fees, slippage, retries, and other parameters.
- 💳 **Wallet Management**: Query user wallets by chain type (Solana/EVM).
- 🔐 **Token Security Check**: Get comprehensive token security information and pool safety details.

## Quick Start

### Configure in MCP Client

Add the following to your MCP client configuration:

```json
{
  "mcpServers": {
    "conditional-order": {
      "command": "npx",
      "args": ["-y", "@dbotx/conditional-order-mcp-server@latest"],
      "env": {
        "DBOT_API_KEY": "your-api-key",
        "DBOT_WALLET_ID_SOLANA": "your-solana-wallet-id",
        "DBOT_WALLET_ID_EVM": "your-evm-wallet-id"
      }
    }
  }
}
```
**api-key 与 wallet-id 获取地址 [www.dbotx.com](https://www.dbotx.com)**

## 📚 Typical Scenarios

- **Sell on Open**:
  - "Help me create a sell-on-open task to sell 80% of the SOLANA token {{address}}."
- **Follow Dev's Sell**:
  - "Help me create a follow-dev-sell task. When the dev sells 60% of the SOLANA token {{address}}, sell 80% of my position."
- **Manage Tasks**:
  - "Get my list of sell-on-open tasks."
  - "Show all follow-dev-sell tasks."
  - "Display my ongoing tasks."
  - "Pause my conditional order tasks."
  - "Change the sell percentage of my sell-on-open task to 90%."
- **Wallet Management**:
  - "Show me all my wallets."
  - "Show me my Solana wallets."
  - "Show me my EVM wallets."
- **Token Security Check**:
  - "Check the security of token {{token_address}} before I create a conditional order."
  - "Show me the pool information for {{token_address}}."
  - "Change the sell percentage of my follow-dev-sell task to 90%."
  - "Delete a specific conditional order task."

## 🌱 Environment Variables

### Required Environment Variables
- `DBOT_API_KEY`: DBot API key (required).

### Wallet Configuration
At least one of the following wallet IDs must be configured:
- `DBOT_WALLET_ID_SOLANA`: Solana chain wallet ID (optional)
- `DBOT_WALLET_ID_EVM`: EVM chain wallet ID (optional, used for Ethereum, Base, BSC)
- `DBOT_WALLET_ID_TRON`: Tron chain wallet ID (optional)
- `DBOT_WALLET_ID_BASE`: Base chain wallet ID (optional, takes priority over EVM)
- `DBOT_WALLET_ID_ARBITRUM`: Arbitrum chain wallet ID (optional, takes priority over EVM)
- `DBOT_WALLET_ID_BSC`: BSC chain wallet ID (optional, takes priority over EVM)

**Priority:** Specific chain wallet ID > Generic chain type wallet ID

**Example:**
```json
{
  "env": {
    "DBOT_API_KEY": "your-api-key",
    "DBOT_WALLET_ID_SOLANA": "your-solana-wallet-id",
    "DBOT_WALLET_ID_EVM": "your-evm-wallet-id",
    "DBOT_WALLET_ID_BASE": "your-base-wallet-id"
  }
}
```

### Optional Default Parameter Configuration
The following environment variables can be used to configure default parameter values. These defaults can be overridden at runtime.

#### Basic Configuration
- `DBOT_CHAIN`: Default chain type, default value is "solana"
- `DBOT_CUSTOM_FEE_AND_TIP`: Whether to use custom fees, default value is false
- `DBOT_PRIORITY_FEE`: Priority fee, default value is "0.0001"
- `DBOT_JITO_ENABLED`: Whether to enable anti-sandwich mode, default value is true
- `DBOT_JITO_TIP`: Anti-sandwich tip, default value is 0.001
- `DBOT_MAX_SLIPPAGE`: Maximum slippage (0.00-1.00), default value is 0.1
- `DBOT_CONCURRENT_NODES`: Number of concurrent nodes (1-3), default value is 2
- `DBOT_RETRIES`: Number of retries (0-10), default value is 1
- `DBOT_EXPIRE_DELTA`: Task validity duration (milliseconds), default value is 360000000
- `DBOT_MIN_DEV_SELL_PERCENT`: Trigger percentage for following dev's sell, default value is 0.5

**Configuration Example:**
```json
{
  "env": {
    "DBOT_API_KEY": "your-api-key",
    "DBOT_WALLET_ID_SOLANA": "your-solana-wallet-id",
    "DBOT_WALLET_ID_EVM": "your-evm-wallet-id",
    "DBOT_CHAIN": "solana",
    "DBOT_CUSTOM_FEE_AND_TIP": "false",
    "DBOT_PRIORITY_FEE": "",
    "DBOT_JITO_ENABLED": "true",
    "DBOT_JITO_TIP": "0.001",
    "DBOT_MAX_SLIPPAGE": "0.1",
    "DBOT_CONCURRENT_NODES": "2",
    "DBOT_RETRIES": "1",
    "DBOT_EXPIRE_DELTA": "360000000",
    "DBOT_MIN_DEV_SELL_PERCENT": "0.5"
  }
}
```

## 🛠️ Available Tools

### create_migrate_order

Create a sell-on-open task.

**Description:**
Automatically executes a sell order when a token migrates from Pump.fun to Raydium.

**Parameters:**
- `pair` (string): Pump token address **[Required]**.
- `amountOrPercent` (number): Sell percentage (0-1), e.g., 0.5 for 50% **[Required]**.
- `walletId` (string): Wallet ID (optional, uses the appropriate chain-specific wallet ID if not provided).
- `chain` (string): Blockchain name (solana, default: solana).
- `pairType` (string): Token type (pump, default: pump).
- `customFeeAndTip` (boolean): Whether to use custom fee and tip settings (default: false).
- `priorityFee` (string): Priority fee (SOL), an empty string means auto-priority fee (default: "").
- `jitoEnabled` (boolean): Whether to enable anti-sandwich mode (default: true).
- `jitoTip` (number): Bribe for anti-sandwich mode (default: 0.001).
- `expireDelta` (number): Task validity duration (milliseconds), max 432000000 (default: 360000000).
- `maxSlippage` (number): Maximum slippage (0.00-1.00) (default: 0.1).
- `concurrentNodes` (number): Number of concurrent nodes (1-3) (default: 2).
- `retries` (number): Number of retries on failure (0-10) (default: 1).

**Example:**
```json
{
  "pair": "9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump",
  "amountOrPercent": 0.5,
  "jitoEnabled": true,
  "jitoTip": 0.001
}
```

### create_dev_order

Create a follow-dev-sell task.

**Description:**
Automatically follows and sells when a developer sells a specified percentage of tokens.

**Parameters:**
- `pair` (string): Pump token address or pair address **[Required]**.
- `amountOrPercent` (number): Sell percentage (0-1), e.g., 0.5 for 50% **[Required]**.
- `minDevSellPercent` (number): Trigger percentage (0-1), sells your tokens when the dev sells more than this percentage (default: 0.5).
- `walletId` (string): Wallet ID (optional, uses the appropriate chain-specific wallet ID if not provided).
- Other parameters are the same as `create_migrate_order`.

**Example:**
```json
{
  "pair": "9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump",
  "minDevSellPercent": 0.3,
  "amountOrPercent": 0.8,
  "jitoEnabled": true
}
```

### update_migrate_order

Edit a sell-on-open task.

**Parameters:**
- `id` (string): ID of the sell-on-open task **[Required]**.
- `pair` (string): Pump token address **[Required]**.
- `amountOrPercent` (number): Sell percentage (0-1) **[Required]**.
- `walletId` (string): Wallet ID (optional, uses the appropriate chain-specific wallet ID if not provided).
- Other parameters are the same as `create_migrate_order`.

### update_dev_order

Edit a follow-dev-sell task.

**Parameters:**
- `id` (string): ID of the follow-dev-sell task **[Required]**.
- `pair` (string): Pump token address or pair address **[Required]**.
- `amountOrPercent` (number): Sell percentage (0-1) **[Required]**.
- `walletId` (string): Wallet ID (optional, uses the appropriate chain-specific wallet ID if not provided).
- Other parameters are the same as `create_dev_order`.

### toggle_migrate_order

Enable/disable a sell-on-open task.

**Parameters:**
- `id` (string): ID of the sell-on-open task **[Required]**.
- `enabled` (boolean): Task status: true to enable, false to disable **[Required]**.

### toggle_dev_order

Enable/disable a follow-dev-sell task.

**Parameters:**
- `id` (string): ID of the follow-dev-sell task **[Required]**.
- `enabled` (boolean): Task status: true to enable, false to disable **[Required]**.

### delete_migrate_order

Delete a sell-on-open task.

**Parameters:**
- `id` (string): ID of the sell-on-open task **[Required]**.

### delete_dev_order

Delete a follow-dev-sell task.

**Parameters:**
- `id` (string): ID of the follow-dev-sell task **[Required]**.

### get_migrate_orders

Get the list of sell-on-open tasks.

**Description:**
Get all of the user's sell-on-open tasks, with support for pagination and status filtering.

**Parameters:**
- `page` (number): Page number, starting from 0 (default: 0).
- `size` (number): Number of items per page, 1-100 (default: 20).
- `chain` (string): Blockchain name (solana, default: solana).
- `state` (string): Task status filter (optional)
  - `init`: Initializing
  - `processing`: Processing
  - `done`: Completed
  - `fail`: Failed
  - `expired`: Expired
- `source` (string): Task source filter (optional).

**Example:**
```json
{
  "page": 0,
  "size": 10,
  "state": "init"
}
```

### get_dev_orders

Get the list of follow-dev-sell tasks.

**Description:**
Get all of the user's follow-dev-sell tasks, with support for pagination and status filtering.

**Parameters:**
- `page` (number): Page number, starting from 0 (default: 0).
- `size` (number): Number of items per page, 1-100 (default: 20).
- `chain` (string): Blockchain name (solana, default: solana).
- `state` (string): Task status filter (optional)
  - `init`: Initializing
  - `processing`: Processing
  - `done`: Completed
  - `fail`: Failed
  - `expired`: Expired
- `source` (string): Task source filter (optional).

**Example:**
```json
{
  "page": 0,
  "size": 10,
  "state": "processing"
}
```

### get_user_wallets

Query user's wallets for a specific chain type. If no type is specified, it will query all types (solana and evm).

**Parameters:**
- `type` (string, optional): Chain type to query (solana/evm). If not specified, queries all types.
- `page` (number, optional): Page number, defaults to 0.
- `size` (number, optional): Number of results per page, defaults to 20.

### get_token_security_info

Get token security information and pool safety details. **Important: This tool should be called before making any trading transactions to check token security factors.**

**Parameters:**
- `chain` (string, optional): Chain name, defaults to 'solana'.
- `pair` (string, required): Token address or trading pair address.

**Returns comprehensive token information including:**
- Token and pool creation time
- Price and market cap
- Security factors (mint/freeze authority, top holder concentration)
- Pool liquidity information
- Relevant links (Birdeye, Jupiter, etc.)

## Use Cases

### 1. Sell-on-Open Strategy
When you hold a Pump.fun token and want to sell it immediately upon migration to Raydium to secure profits:
```json
{
  "pair": "token_address",
  "amountOrPercent": 1.0,
  "jitoEnabled": true,
  "jitoTip": 0.001
}
```

### 2. Follow-Dev-Sell Strategy
When you are concerned about a developer dumping tokens and want to exit your position promptly when they start selling in large quantities:
```json
{
  "pair": "token_address",
  "minDevSellPercent": 0.2,
  "amountOrPercent": 0.5,
  "jitoEnabled": true
}
```

### 3. Risk Control
Combine sell-on-open and follow-dev-sell for multi-layered risk control:
- Set up a sell-on-open task to sell 50% on migration.
- Set up a follow-dev-sell task to sell the remaining 50% if the developer sells more than 30%.

## Technical Features

### Fee Control
- **Auto-Fee Mode**: The system automatically selects the optimal fee settings.
- **Custom Fee Mode**: Allows for precise control over priority fees and bribes.
- **Anti-Sandwich Mode**: Enable Jito to prevent MEV attacks.

### Slippage Protection
- Supports setting maximum slippage limits.
- Automatically adjusts the trading strategy based on market conditions.

### Reliability
- Multi-node concurrent execution to improve success rates.
- Automatic retry mechanism on failure.
- Task validity limits to prevent expired executions.

## Important Notes

1.  **Wallet Configuration**: The `walletId` parameter is optional. If not provided, the system will automatically select an appropriate wallet ID based on the chain configuration.
2.  **Token Type**:
    - `pump`: Indicates the token has not yet been listed on Raydium.
    - `raydium_amm`: Indicates the token has been listed on Raydium.
3.  **Task Monitoring**: The system continuously monitors conditions and executes automatically when met.
4.  **Fee Settings**:
    - `customFeeAndTip=false`: In high-speed mode, only the priority fee is effective. In anti-sandwich mode, only the bribe is effective.
    - `customFeeAndTip=true`: Both the priority fee and bribe are effective.
5.  **Risk Control**: It is recommended to set reasonable sell percentages and slippage limits.

## Error Handling

All tool calls return detailed error messages to help quickly identify and resolve issues. Common errors include:
- Invalid API key
- Invalid wallet ID
- Incorrect token address format
- Parameter out of range

## 📚 API Documentation

For complete API documentation, please refer to: [DBot API](https://dbotx.com/docs).

## 📄 License

MIT License

## 💡 Support

For issues or suggestions, please visit [GitHub Issues](https://github.com/dbotx/dbot-mcp-servers/issues). 