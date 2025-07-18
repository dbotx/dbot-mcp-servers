[English](./README.md) | [中文](./README.zh-CN.md)

# Professional Multi-Chain DEX Trading MCP Server

Copy Trading MCP Server - Supports creating and managing complex copy trading tasks, automatically following other users' trading strategies

Powered by DBot - [www.dbotx.com](https://www.dbotx.com)

## 🚀 Features

Here's an overview of the features:

- 🔗 **Smart Copy Trading**: Automatically follow specified wallets' trading behaviors for buying and selling operations
- ⚡ **Multi-chain Support**: Supports multi-chain copy trading (Solana, Ethereum, Base, BSC, Tron)
- 💰 **Flexible Buying**: Supports fixed amount, fixed ratio, and follow amount buying modes
- 📊 **Smart Selling**: Supports follow selling, take-profit/stop-loss, mixed mode, and other selling strategies
- 💳 **Wallet Management**: Query user wallet IDs and addresses by chain type (Solana/EVM) - provides essential wallet information for trading operations, not balance data
- 🛡️ **Risk Control**: Comprehensive token filtering, tax rate checks, position limits, and other risk control mechanisms
- 🔧 **Task Management**: Create, edit, enable/disable, and delete copy trading tasks
- 📈 **Real-time Monitoring**: Supports multi-DEX following and blacklist management
- ⚙️ **Advanced Configuration**: Supports anti-sandwich mode, slippage control, concurrent nodes, and other advanced features

## Quick Start

Here's how to use it:

Add to MCP client configuration:

**Example:**
```json
{
  "mcpServers": {
    "copy-trading": {
      "command": "npx",
      "args": ["-y", "@dbotx/copy-trading-mcp-server@latest"],
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

- **Basic Copy Trading**:
  - "Help me create a copy trading task to follow wallet address {{address}}'s trades on Solana, with a maximum buy of 0.1 SOL each time."
- **Modify Copy Trading**:
  - "Help me modify the copy trading task, change the maximum buy to 0.2 SOL each time, sell 50% when the price rises by 100%, and stop loss at a 30% drop."
- **Smart Copy Trading + Take-Profit/Stop-Loss**:
  - "Create a copy trading task to follow address {{address}}, set a maximum buy of 0.5 SOL, automatically sell when the price rises by 200%, and stop loss at a 30% drop."
- **Multi-target Copy Trading**:
  - "Follow these smart money addresses for trading, {{address1}} {{address2}} {{address3}}, set tiered take-profit: sell 30% at a 50% increase, sell 70% at a 100% increase."
- **Manage Copy Trading Tasks**:
  - "Get copy trading list"
  - "Pause my copy trading tasks"
  - "Modify the maximum buy amount for a copy trading task"
  - "Delete specified copy trading tasks"

## 🌱 Environment Variables

The following are environment variable descriptions:

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
- If you need to change, you can configure according to the example; if not changed, the default configuration will be used.
- Default configurations can be obtained by conversing with the LLM model, e.g., "Please tell me the default configuration for the Copy Trading tool."
- All environment variable default values can be overridden during conversation. For example, the system defaults to enabling anti-sandwich mode, but you can request to override it during conversation, "Create a copy trading task..., please disable anti-sandwich mode."

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

#### Copy Trading Configuration
- `DBOT_BUY_AMOUNT_TYPE`: Default buy type (fixed_amount/fixed_ratio/follow_amount), default value is "follow_amount"
- `DBOT_MAX_BUY_AMOUNT`: Default maximum buy amount, default value is null (user must specify)
- `DBOT_BUY_RATIO`: Default follow ratio, default value is 1.0
- `DBOT_SELL_MODE`: Default sell mode (mixed/only_copy/only_pnl), default value is "mixed"
- `DBOT_SELL_AMOUNT_TYPE`: Default sell type (all/follow_ratio/x_target_ratio), default value is "all"

**Example:**
```json
{
  "env": {
    "DBOT_API_KEY": "your-api-key",
    "DBOT_WALLET_ID_SOLANA": "your-solana-wallet-id",
    "DBOT_WALLET_ID_EVM": "your-evm-wallet-id",
    "DBOT_BUY_AMOUNT_TYPE": "follow_amount",
    "DBOT_MAX_BUY_AMOUNT": "0.1",
    "DBOT_BUY_RATIO": "1.0",
    "DBOT_SELL_MODE": "mixed",
    "DBOT_SELL_AMOUNT_TYPE": "all"
  }
}
```

#### Take-Profit/Stop-Loss Configuration
- `DBOT_PNL_ORDER_EXPIRE_DELTA`: Take-profit/stop-loss order expiration time (milliseconds), default value is 43200000
- `DBOT_PNL_ORDER_EXPIRE_EXECUTE`: Whether to execute expired orders, default value is false
- `DBOT_PNL_ORDER_USE_MID_PRICE`: Whether to use mid-price, default value is false

**Example:**
```json
{
  "env": {
    "DBOT_API_KEY": "your-api-key",
    "DBOT_WALLET_ID_SOLANA": "your-solana-wallet-id",
    "DBOT_WALLET_ID_EVM": "your-evm-wallet-id",
    "DBOT_PNL_ORDER_EXPIRE_DELTA": "43200000",
    "DBOT_PNL_ORDER_EXPIRE_EXECUTE": "true",
    "DBOT_PNL_ORDER_USE_MID_PRICE": "false"
  }
}
```

Note:
1. All boolean environment variable values should use the strings "true" or "false"
2. Numeric environment variable values should also be in string form
3. Parameter values specified during invocation will override default values in environment variables
4. You can configure only a subset of parameters as needed; unconfigured parameters will use system default values

## 🛠️ Available Tools

The following are tool descriptions:

### create_copy_trading

Create multi-chain copy trading tasks - automatically follow specified wallet addresses' trading behaviors for buying and selling operations

**Basic Parameters:**
- `enabled` (boolean, optional): Task enabled status, true/false, defaults to true
- `name` (string, required): Name of the copy trading task
- `chain` (string, optional): Chain (solana/ethereum/base/bsc/tron), defaults to solana
- `dexFilter` (array, optional): DEXs to follow, null means all, specifying names means only follow those DEXs' trades
- `targetIds` (array, required): Wallet addresses to copy trade (up to 10)
- `tokenBlacklist` (array, optional): Blacklisted token addresses for the current task (up to 20), buying and selling of these tokens will be skipped
- `walletId` (string, optional): ID of the wallet to use, obtainable via "Wallet Info API" (if not provided, the appropriate chain-specific environment variable will be used)
- `groupId` (string, optional): Group ID
- `buySettings` (object, required): Buy-related settings
- `sellSettings` (object, required): Sell-related settings

**Buy Settings (buySettings):**
- `enabled` (boolean): Buy task enabled status, defaults to true
- `maxBuyAmountUI` (string, required): Maximum buy amount for copy trading, minimum 0.001 SOL, 0.0001 ETH, 0.0001 BNB, 1 TRX
- `buyAmountType` (string): Copy buy type, "fixed_amount" for fixed amount, "fixed_ratio" for fixed ratio, "follow_amount" for follow amount, defaults to follow_amount
- `buyRatio` (number): Follow buy ratio (0-10), effective when buy type is fixed_ratio, defaults to 1
- `maxBalanceUI` (number): Take-profit amount (ETH/SOL/BNB/TRX), no more copy buys when wallet balance exceeds this amount, defaults to 100
- `reservedAmountUI` (number): Stop-loss amount (ETH/SOL/BNB/TRX), no more copy buys when wallet balance falls below this amount, defaults to 0.01
- `targetMinAmountUI` (number): Only follow buy when smart money buy amount is greater than this value, defaults to 0
- `targetMaxAmountUI` (number): Only follow buy when smart money buy amount is less than this value, defaults to 999999
- `minTokenMCUSD` (number): Minimum copy token market cap, only follow buy tokens with market cap higher than this value, defaults to 0
- `maxTokenMCUSD` (number): Maximum copy token market cap, only follow buy tokens with market cap lower than this value, defaults to 999999999
- `maxSlippage` (number): Maximum slippage (0.00-1.00), defaults to 0.1
- `jitoEnabled` (boolean): Whether to enable anti-sandwich mode, defaults to true
- `jitoTip` (number): Bribe fee used in anti-sandwich mode, defaults to 0.001
- `skipFreezableToken` (boolean): Do not buy tokens with unrevoked freeze authority, defaults to false
- `skipMintableToken` (boolean): Do not buy tokens with unrevoked mint authority, defaults to false
- `skipHoneyPot` (boolean): Do not buy tokens identified as honeypots by GoPlus, defaults to false
- `minBurnedLp` (number): Minimum burned LP ratio (0-1), defaults to 0
- `maxBuyTimesPerToken` (number): Maximum buy times per token within 7 days in this task, defaults to 999
- `buyOncePerWallet` (boolean): Buy only once, defaults to false
- `concurrentNodes` (number): Number of concurrent nodes (1-3), defaults to 2
- `retries` (number): Number of retries after failure (0-10), defaults to 1

**Sell Settings (sellSettings):**
- `enabled` (boolean): Sell task enabled status, defaults to true
- `mode` (string): Sell mode, "mixed" means both follow selling and take-profit/stop-loss are enabled, "only_copy" means only follow selling is enabled, "only_pnl" means only take-profit/stop-loss is enabled, defaults to mixed
- `sellAmountType` (string): Copy sell ratio, "all" for 100% sell, "follow_ratio" for sell by follow ratio, "x_target_ratio" for selling by multiplying smart money's sell ratio by a fixed multiplier, defaults to all
- `xTargetRatio` (number): Multiplier for smart money's sell ratio (0-100), defaults to 1
- `sellSpeedType` (string): Follow sell speed, "fast" for speed priority, "accurate" for accuracy priority, defaults to accurate
- `stopEarnPercent` (number): Take-profit percentage (0.5 means 50%)
- `stopLossPercent` (number): Stop-loss percentage (0.5 means 50%)
- `stopEarnGroup` (array): Take-profit groups, up to 6 supported
- `stopLossGroup` (array): Stop-loss groups, up to 6 supported
- `trailingStopGroup` (array): Trailing stop-loss groups, currently only 1 group supported
- `pnlOrderExpireDelta` (number): Take-profit/stop-loss task expiration time (milliseconds), defaults to 43200000
- `sellMode` (string): Sell method, "smart" means no selling, "normal" means continue selling, defaults to smart
- `migrateSellPercent` (number): Open sell percentage (0.00-1.00), defaults to 0
- `minDevSellPercent` (number): Trigger ratio (0-1), defaults to 0.5
- `devSellPercent` (number): When following Dev sell task is triggered, your sell percentage, defaults to 1

**Example:**
```json
{
  "enabled": true,
  "name": "Copy Task 1",
  "chain": "solana",
  "targetIds": ["ECQwEUMk75pxgruroXKTfqMHL4Aoj622vEZxBtYu4gNt"],
  "buySettings": {
    "enabled": true,
    "maxBuyAmountUI": "0.1",
    "buyAmountType": "follow_amount",
    "buyRatio": 1.5,
    "maxSlippage": 0.1,
    "jitoEnabled": true
  },
  "sellSettings": {
    "enabled": true,
    "mode": "mixed",
    "sellAmountType": "all",
    "stopEarnPercent": 1,
    "stopLossPercent": 0.5
  }
}
```

### edit_copy_trading

Edit copy trading tasks. Only provide the fields to modify and required fields (id, enabled, name, chain, targetIds, buySettings, sellSettings), no need to re-enter all fields

**Parameters:**
- `id` (string, required): Copy trading task ID
- Other parameters are the same as creating a task (optional)

**Example:**
```json
{
  "id": "lxvmnr5h00jeus",
  "enabled": true,
  "name": "Updated Task Name"
}
```

### switch_copy_trading

Enable/disable copy trading tasks

**Parameters:**
- `id` (string, required): Copy trading task ID
- `enabled` (boolean, required): Task enabled status, true/false
- `closePnlOrder` (boolean, optional): Whether to also close all take-profit/stop-loss tasks created by the copy trading task, defaults to false, meaning not closed (effective when "enabled" is false)

**Example:**
```json
{
  "id": "lxvmnr5h00jeus",
  "enabled": false,
  "closePnlOrder": false
}
```

### delete_copy_trading

Delete copy trading tasks

**Parameters:**
- `id` (string, required): Copy trading task ID
- `deletePnlOrder` (boolean, optional): Whether to also delete all take-profit/stop-loss tasks created by this copy trading task, defaults to false

**Example:**
```json
{
  "id": "lxvmnr5h00jeus",
  "deletePnlOrder": false
}
```

### get_copy_trading_tasks

Get copy trading task list

**Parameters:**
- `page` (number, optional): Page number, defaults to 0
- `size` (number, optional): Number per page (max 100), defaults to 20

**Example:**
```json
{
  "page": 0,
  "size": 20
}
```

### get_user_wallets

Query user wallet IDs and addresses by chain type. This provides essential wallet information for trading operations, not balance data.

**Parameters:**
- `type` (string): Chain type - "solana" for Solana wallets, "evm" for EVM wallets. If not specified, queries all types
- `page` (number): Page number, starting from 0
- `size` (number): Number of items per page (1-20)

**Example:**
```json
{
  "type": "solana",
  "page": 0,
  "size": 20
}
```

**Returns:** Wallet ID, name, type, and address for each wallet.

## Copy Trading Mechanism Description

### Buy Types
- **fixed_amount**: Fixed amount buying
- **fixed_ratio**: Fixed ratio buying (based on `buyRatio` parameter)
- **follow_amount**: Follow amount buying (based on smart money's actual buy amount)

### Sell Modes
- **mixed**: Both follow selling and take-profit/stop-loss are enabled
- **only_copy**: Only follow selling is enabled
- **only_pnl**: Only take-profit/stop-loss is enabled

### Sell Types
- **all**: 100% sell
- **follow_ratio**: Sell by follow ratio
- **x_target_ratio**: Sell by multiplying smart money's sell ratio by a multiplier

### Risk Control Features
- **Token Filtering**: Supports freeze authority, mint authority, delegation checks
- **Tax Rate Check**: Supports buy/sell tax rate limits (EVM chains)
- **Honeypot Detection**: Integrated GoPlus security detection
- **Liquidity Check**: Supports minimum liquidity and LP burn ratio checks
- **Position Limits**: Supports top 10 position ratio limits
- **Purchase Frequency**: Supports maximum purchase times and amount limits per token

## Risk Warning

### Investment Risks
1. **Market Risk**: Copy trading does not guarantee profit and may result in losses
2. **Strategy Risk**: The copied trader's strategy may not suit your risk appetite
3. **Time Lag Risk**: Copy trading execution may experience time delays

### Technical Risks
1. **Network Latency**: May affect the timing of copy trading execution
2. **Insufficient Funds**: Ensure your account has sufficient funds for copy trading
3. **Chain Congestion**: Network congestion may affect trade execution

### Recommended Measures
1. **Reasonable Configuration**: Set buy amounts and take-profit/stop-loss according to your risk tolerance
2. **Multiple Protections**: Enable token filtering and risk check features
3. **Regular Monitoring**: Regularly check the execution status of copy trading tasks
4. **Timely Adjustment**: Adjust strategies promptly based on market conditions

## Important Notes

1. **Wallet Configuration**: The `walletId` parameter is optional; if not provided, the appropriate chain-specific wallet ID will be used automatically
2. **Copied Address**: Ensure the provided wallet address belongs to a trader you trust
3. **Fund Management**: Ensure your account has sufficient funds for copy trading
4. **Monitoring Frequency**: The system will monitor the copied address's trading activities in real-time
5. **Parameter Configuration**: It is recommended to test with smaller amounts first to confirm strategy effectiveness before increasing investment

## 📚 API Documentation

For complete API documentation, please refer to: [DBot API](https://dbotx.com/docs).

## 📄 License

MIT License

## 💡 Support

For issues or suggestions, please visit [GitHub Issues](https://github.com/dbotx/dbot-mcp-servers/issues). 