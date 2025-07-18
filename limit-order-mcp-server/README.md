[English](./README.md) | [中文](./README.zh-CN.md)


# Professional Multi-Chain DEX Trading MCP Server

Limit Order MCP Server - Supporting multi-chain limit orders, precise price triggers, and flexible order management. A professional cross-chain MCP trading service supporting DEX trading on multiple mainstream blockchains including Solana, Ethereum, BSC and more.

Powered by DBot - [www.dbotx.com](https://www.dbotx.com)

## 🚀 Features

- 🎯 **Precise Limit Orders**: Supports limit buy and sell on multiple chains including Solana, Ethereum, Base, BSC, and Tron.
- ⚡ **Flexible Triggers**: Supports triggering above/below a target price, with an anti-spike mode.
- 🔧 **Complete Management**: Create, edit, enable/disable, and delete limit orders.
- 📊 **Status Query**: Check the execution status and history of limit orders.
- 💳 **Wallet Management**: Query user wallet IDs and addresses by chain type (Solana/EVM) - provides essential wallet information for trading operations, not balance data.
- 🔍 **Token Market & Security Information**: Provides token market and security information including price data, market cap, creation time, liquidity, trading volume, holder distribution and security details.
- ⏰ **Expiration Handling**: Configurable option to execute at market price upon task expiration.
- 🛡️ **Risk Control**: Supports parameters like slippage, priority fee, and anti-sandwich.


##  Quick Start

Add the following to your MCP client configuration:

```json
{
  "mcpServers": {
    "limit-order": {
      "command": "npx",
      "args": ["-y", "@dbotx/limit-order-mcp-server@latest"],
      "env": {
        "DBOT_API_KEY": "your-api-key",
        "DBOT_WALLET_ID_SOLANA": "your-solana-wallet-id",
        "DBOT_WALLET_ID_EVM": "your-evm-wallet-id"
      }
    }
  }
}
```
**Get your api-key and wallet-id at [www.dbotx.com](https://www.dbotx.com)**

## 📚 Typical Scenarios

- **Sell High**:
  - "Help me sell 50% of my position in token {{token_address}} on Solana when the price is above $100."
- **Buy Low**:
  - "Help me buy 1 of token {{token_address}} on Solana when the price is below $0.0001."
- **Modify Limit Order**:
  - "Help me change the trigger price of the limit order to $20 and turn off anti-sandwich mode."
- **Query Limit Orders**:
  - "Help me check all my limit orders."
- **Manage Limit Orders**:
  - "Help me disable this limit order."
  - "Help me re-enable this limit order."
  - "Help me delete this limit order."


## 🌱 Environment Variables

Here are the environment variables explained:

### Required Environment Variables
- `DBOT_API_KEY`: DBot API key (required)

### Wallet Configuration (At least one required)
Configure chain-specific wallet IDs. The system will automatically select the appropriate wallet based on the trading chain:

#### Chain-specific Wallet IDs (Priority)
- `DBOT_WALLET_ID_SOLANA`: Solana wallet ID
- `DBOT_WALLET_ID_BASE`: Base network wallet ID  
- `DBOT_WALLET_ID_ARBITRUM`: Arbitrum network wallet ID
- `DBOT_WALLET_ID_BSC`: BSC network wallet ID

#### Generic Wallet IDs (Fallback)
- `DBOT_WALLET_ID_EVM`: Generic EVM wallet ID (for Ethereum/Base/Arbitrum/BSC)
- `DBOT_WALLET_ID_TRON`: Tron wallet ID

**Wallet Selection Priority:**
1. Specific chain wallet ID (e.g., `DBOT_WALLET_ID_BASE` for Base)
2. Generic chain type wallet ID (e.g., `DBOT_WALLET_ID_EVM` for EVM chains)
3. At least one wallet ID must be configured, or the system will throw an error

### Optional Default Parameter Configuration
- You can change the configuration according to the examples. If not changed, the default configuration will be used.
- The default configuration can be obtained by talking to the LLM, for example, "Tell me the default configuration for the limit order tool."
- All environment variable defaults can be overridden during the conversation. For example, if the system's default is to enable anti-sandwich mode, you can request to override it by saying, "Create a limit order..., please disable anti-sandwich mode."

#### Basic Configuration
- `DBOT_CHAIN`: Default chain type (solana/ethereum/base/bsc/tron), default value is "solana"
- `DBOT_CUSTOM_FEE_AND_TIP`: Whether to use custom fees, default value is false
- `DBOT_PRIORITY_FEE`: Priority fee, default value is "0.0001"
- `DBOT_GAS_FEE_DELTA`: Gas fee increment, default value is 5
- `DBOT_MAX_FEE_PER_GAS`: Maximum gas fee, default value is 100
- `DBOT_JITO_ENABLED`: Whether to enable anti-sandwich mode, default value is true
- `DBOT_JITO_TIP`: Anti-sandwich tip, default value is 0.001
- `DBOT_MAX_SLIPPAGE`: Maximum slippage (0.00-1.00), default value is 0.1
- `DBOT_CONCURRENT_NODES`: Number of concurrent nodes (1-3), default value is 2
- `DBOT_RETRIES`: Number of retries (0-10), default value is 1

**Example:**

```json
{
  "env": {
    "DBOT_API_KEY": "your-api-key",
    "DBOT_WALLET_ID_SOLANA": "your-solana-wallet-id",
    "DBOT_WALLET_ID_EVM": "your-evm-wallet-id",
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

#### Limit Order Configuration
- `DBOT_EXPIRE_DELTA`: Task validity duration (in milliseconds), default value is 432000000
- `DBOT_EXPIRE_EXECUTE`: Whether to execute at market price upon task expiration, default value is false
- `DBOT_USE_MID_PRICE`: Whether to use anti-spike mode, default value is false

**Example:**

```json
{
  "env": {
    "DBOT_API_KEY": "your-api-key",
    "DBOT_WALLET_ID_SOLANA": "your-solana-wallet-id",
    "DBOT_WALLET_ID_EVM": "your-evm-wallet-id",
    "DBOT_EXPIRE_DELTA": "432000000",
    "DBOT_EXPIRE_EXECUTE": "false",
    "DBOT_USE_MID_PRICE": "true"
  }
}
```


## 🛠️ Available Tools

### create_limit_order
Create multi-chain limit buy/sell tasks.

**Main Parameters:**
- `chain` (string): Blockchain name (solana/ethereum/base/bsc/tron)
- `pair` (string): Token address or trading pair address (required)
- `walletId` (string): Wallet ID (optional)
- `tradeType` (string): Transaction type (buy/sell) (required)
- `triggerPriceUsd` (number): Trigger price (in USD) (required)
- `triggerDirection` (string): Trigger direction (up/down) (required)
- `currencyAmountUI` (number): Buy amount or sell percentage (required)
- Others: enabled, groupId, customFeeAndTip, priorityFee, gasFeeDelta, maxFeePerGas, jitoEnabled, jitoTip, expireDelta, expireExecute, useMidPrice, maxSlippage, concurrentNodes, retries

**Example:**
```json
{
  "chain": "solana",
  "pair": "9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump",
  "tradeType": "sell",
  "triggerPriceUsd": 10,
  "triggerDirection": "up",
  "currencyAmountUI": 1
}
```

### edit_limit_order
Edit a limit order.
```json
{
  "id": "limit-order-123",
  "triggerPriceUsd": 20
}
```

### switch_limit_order
Enable/disable a limit order.
```json
{
  "id": "limit-order-123",
  "enabled": false
}
```

### delete_limit_order
Delete a limit order.
```json
{
  "id": "limit-order-123"
}
```

### delete_limit_orders
Delete limit orders in bulk.
```json
{
  "ids": ["limit-order-123", "limit-order-456"]
}
```

### delete_all_limit_order
Delete all limit orders.
```json
{
  "chain": "solana"
}
```

### limit_orders
Query the list of limit orders.
```json
{
  "page": 0,
  "size": 10
}
```

### get_user_wallets
Query user wallet IDs and addresses by chain type. This provides essential wallet information for trading operations, not balance data.
```json
{
  "type": "solana",
  "page": 0,
  "size": 20
}
```

**Parameters:**
- `type` (string): Chain type - "solana" for Solana wallets, "evm" for EVM wallets. If not specified, queries all types
- `page` (number): Page number, starting from 0
- `size` (number): Number of items per page (1-20)

**Returns:** Wallet ID, name, type, and address for each wallet.

### get_token_security_info
Get token market and security information.
```json
{
  "pair": "9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump"
}
```

**Returns token market and security information including:**
- Token and pool creation time
- Current price and market cap
- Trading volume and liquidity data
- Security factors (mint/freeze authority, top holder concentration)
- Pool liquidity and safety information
- Relevant links (Birdeye, Jupiter, etc.)

## ⚠️ Notes

1.  `walletId` is optional; the appropriate chain-specific wallet ID is used if not provided.
2.  Prices are in USD; use reasonable precision.
3.  The default task validity is 432,000,000 milliseconds (5 days).
4.  Trigger direction: `up` triggers on price increase, `down` triggers on price decrease.
5.  Anti-spike mode can prevent false triggers from momentary fluctuations.
6.  It's configurable whether to force execution at market price upon expiration.


## 📚 API Documentation

For complete API documentation, please refer to: [DBot API](https://dbotx.com/docs).

## 📄 License

MIT License

## 💡 Support

For issues or suggestions, please visit [GitHub Issues](https://github.com/dbotx/dbot-mcp-servers/issues). 