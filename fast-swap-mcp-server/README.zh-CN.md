[English](./README.md) | [中文](./README.zh-CN.md)


# 专业的多链 DEX 交易 MCP 服务

快速买卖 MCP Server - 支持快速发起买卖代币任务，查询交易结果，管理止盈止损任务。

由 DBot 强力驱动 - [www.dbotx.com](https://www.dbotx.com)


## 🚀 功能特性

以下为功能概述：

- 🚀 **快速交易**: 支持多链快速买卖交易（Solana, Ethereum, Base, BSC, Tron）
- 💼 **多钱包支持**: 支持使用多个钱包同时进行交易
- 📊 **订单查询**: 查询交易订单状态和详情
- 📈 **止盈止损**: 管理止盈止损任务


## 快速开始

以下为使用方法：

在MCP客户端配置中添加：

**示例：**

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
**api-key 与 wallet-id 获取地址 [www.dbotx.com](https://www.dbotx.com)**


## 📚 典型场景

- **快速买入**：
  - "帮我买入 solana 上的代币 9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump 0.001sol"
- **快速卖出**：
  - "帮我卖出 solana 上的代币 9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump 50%仓位"
- **买入并设置止盈止损**：
  - "帮我买入 solana 上的代币 9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump 0.001sol，价格上涨80%时卖出60%仓位，下跌30%时卖出80%仓位"
- **修改止盈止损**：
  - "帮我将止损单改为卖出100%仓位"
- **管理止盈止损**：
  - "帮我关闭止盈单"
  - "帮我打开止盈单"
  - "帮我删除止盈单"


## 🌱 环境变量

以下为环境变量说明：

### 必需的环境变量
- `DBOT_API_KEY`: DBot API密钥（必需）
- `DBOT_WALLET_ID`: 默认钱包ID（必需）

### 可选的默认参数配置
- 如需更改可根据示例配置，如未更改将使用默认配置。
- 默认配置可通过与llm模型对话得到，例如 "请告诉我 快速买卖 工具的默认配置"。
- 所有环境变量默认值均可在对话时被覆盖。例如 系统默认开启防夹模式，对话时可要求将其覆盖，"买入 ....，请关闭防夹模式。"

#### 基础配置
- `DBOT_CHAIN`: 默认链类型 (solana/ethereum/base/bsc/tron)
- `DBOT_CUSTOM_FEE_AND_TIP`: 是否使用自定义费用 (true/false)
- `DBOT_PRIORITY_FEE`: 优先费，例如："0.0001"
- `DBOT_GAS_FEE_DELTA`: gas费用增量，例如：5
- `DBOT_MAX_FEE_PER_GAS`: 最大gas费用，例如：100
- `DBOT_JITO_ENABLED`: 是否启用防夹模式 (true/false)
- `DBOT_JITO_TIP`: 防夹小费，例如：0.001
- `DBOT_MAX_SLIPPAGE`: 最大滑点 (0.00-1.00)，例如：0.1
- `DBOT_CONCURRENT_NODES`: 并发节点数 (1-3)，例如：2
- `DBOT_RETRIES`: 重试次数 (0-10)，例如：1

**示例：**

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

#### 交易配置
- `DBOT_AMOUNT_OR_PERCENT`: 默认交易数量或百分比，例如：0.001
- `DBOT_MIGRATE_SELL_PERCENT`: 迁移卖出百分比 (0.00-1.00)，例如：1.0
- `DBOT_MIN_DEV_SELL_PERCENT`: 最小开发者卖出百分比 (0.00-1.00)，例如：0.5
- `DBOT_DEV_SELL_PERCENT`: 开发者卖出百分比 (0.00-1.00)，例如：1.0

**示例：**

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

#### 止盈止损配置
- `DBOT_PNL_ORDER_EXPIRE_DELTA`: 止盈止损订单过期时间（毫秒），例如：43200000
- `DBOT_PNL_ORDER_EXPIRE_EXECUTE`: 是否执行过期订单 (true/false)
- `DBOT_PNL_ORDER_USE_MID_PRICE`: 是否使用中间价 (true/false)
- `DBOT_PNL_CUSTOM_CONFIG_ENABLED`: 是否启用自定义止盈止损配置 (true/false)

**示例：**

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

注意：
1. 所有布尔类型的环境变量值应该使用字符串 "true" 或 "false"
2. 数字类型的环境变量值也应该使用字符串形式
3. 在调用时指定的参数值会覆盖环境变量中的默认值
4. 可以根据需要只配置部分参数，未配置的参数将使用系统默认值


## 🛠️ 可用工具

以下为工具说明：

### create_fast_swap

创建快速买卖交易订单，支持多链交易（solana/ethereum/base/bsc/tron），支持买入与卖出时设定止盈止损

**参数:**
- `chain` (string, 可选): 链 (solana/ethereum/base/bsc/tron)，未指定时默认使用 solana。
- `pair` (string, 必需): 需要买入/卖出的代币地址或交易对地址。
- `walletId` (string, 可选): 使用的钱包的id，可通过"钱包信息 API"获取（如未提供将使用环境变量 DBOT_WALLET_ID）。
- `type` (string, 必需): 交易类型，值为'buy'和'sell'。
- `amountOrPercent` (number, 可选): 交易类型为buy时，填写买入金额（ETH/SOL/BNB/TRX），交易类型为sell时，填写卖出比例（0.00-1.00），默认为0.001。
- `customFeeAndTip` (boolean, 可选): "true"表示优先费和贿赂费均有效，"false"表示高速模式下只有优先费有效，防夹模式下只有贿赂费有效。默认为false。
- `priorityFee` (string, 可选): 优先费（SOL），对Solana有效，空字符串表示使用自动优先费。默认为"0.0001"。
- `gasFeeDelta` (number, 可选): 额外增加的gas（Gwei），对EVM链有效。默认为5。
- `maxFeePerGas` (number, 可选): 基础gas超过此值时将不进行交易（Gwei），对EVM链有效。默认为100。
- `jitoEnabled` (boolean, 可选): 是否启用防夹模式（Solana & Ethereum & Bsc）。默认为true。
- `jitoTip` (number, 可选): 防夹模式使用的贿赂费（Solana）。默认为0.001。
- `maxSlippage` (number, 可选): 最大滑点（0.00-1.00）。默认为0.1。
- `concurrentNodes` (number, 可选): 并发节点数（1-3）。默认为2。
- `retries` (number, 可选): 失败后的重试次数（0-10）。默认为1。
- `migrateSellPercent` (number, 可选): 迁移卖出比例（0.00-1.00）。默认为1.0。
- `minDevSellPercent` (number, 可选): 最小开发者卖出比例（0.00-1.00）。默认为0.5。
- `devSellPercent` (number, 可选): 开发者卖出比例（0.00-1.00）。默认为1.0。
- `stopEarnPercent` (number, 可选): 止盈百分比（0.00以上）。
- `stopLossPercent` (number, 可选): 止损百分比（0.00-1.00）。
- `stopEarnGroup` (array, 可选): 止盈分组设置，最多6组。
- `stopLossGroup` (array, 可选): 止损分组设置，最多6组。
- `trailingStopGroup` (array, 可选): 追踪止损设置，最多1组。
- `pnlOrderExpireDelta` (number, 可选): 止盈止损订单有效时长（毫秒）。默认为43200000。
- `pnlOrderExpireExecute` (boolean, 可选): 止盈止损订单过期是否执行。默认为false。
- `pnlOrderUseMidPrice` (boolean, 可选): 止盈止损订单是否使用中间价格。默认为false。
- `pnlCustomConfigEnabled` (boolean, 可选): 是否启用自定义止盈止损配置。默认为true。
- `pnlCustomConfig` (object, 可选): 自定义止盈止损配置。

### create_fast_swaps

创建快速买卖交易订单，支持多链交易（solana/ethereum/base/bsc/tron），支持买入与卖出时设定止盈止损，使用多个钱包同时进行交易。

**参数:**
- `chain` (string, 可选): 链 (solana/ethereum/base/bsc/tron)，未指定时默认使用 solana。
- `pair` (string, 必需): 需要买入/卖出的代币地址或交易对地址。
- `walletIdList` (array, 必需): 使用的钱包ID列表，最多5个钱包。
- `type` (string, 必需): 交易类型，值为'buy'和'sell'。
- `customFeeAndTip` (boolean, 可选): "true"表示优先费和贿赂费均有效。默认为false。
- `priorityFee` (string, 可选): 优先费（SOL）。默认为空字符串。
- `gasFeeDelta` (number, 可选): 额外增加的gas（Gwei）。默认为5。
- `maxFeePerGas` (number, 可选): 基础gas超过此值时将不进行交易（Gwei）。默认为100。
- `jitoEnabled` (boolean, 可选): 是否启用防夹模式。默认为false。
- `jitoTip` (number, 可选): 防夹模式使用的贿赂费（Solana）。默认为0.001。
- `maxSlippage` (number, 可选): 最大滑点。默认为0.1。
- `concurrentNodes` (number, 可选): 并发节点数。默认为2。
- `retries` (number, 可选): 失败后的重试次数。默认为1。
- `minAmount` (number, 可选): 最小买入金额（ETH/SOL/BNB/TRX）。
- `maxAmount` (number, 可选): 最大买入金额（ETH/SOL/BNB/TRX）。
- `sellPercent` (number, 可选): 卖出比例（0.00-1.00）。默认为1.0。
- `stopEarnPercent` (number, 可选): 止盈百分比（0.00以上）。
- `stopLossPercent` (number, 可选): 止损百分比（0.00-1.00）。
- `stopEarnGroup` (array, 可选): 止盈分组设置，最多6组。
- `stopLossGroup` (array, 可选): 止损分组设置，最多6组。
- `trailingStopGroup` (array, 可选): 追踪止损设置，最多1组。
- `pnlOrderExpireDelta` (number, 可选): 止盈止损订单有效时长（毫秒）。默认为43200000。
- `pnlOrderExpireExecute` (boolean, 可选): 止盈止损订单过期是否执行。默认为false。
- `pnlOrderUseMidPrice` (boolean, 可选): 止盈止损订单是否使用中间价格。默认为false。
- `pnlCustomConfigEnabled` (boolean, 可选): 是否启用自定义止盈止损配置。默认为true。
- `pnlCustomConfig` (object, 可选): 自定义止盈止损配置。

### get_swap_order_info

查询快速买卖的订单信息

**参数:**
- `ids` (string): 订单ID列表，多个ID用逗号分隔 **[必需]**

### get_swap_records

获取用户所有的快速买卖记录

**参数:**
- `page` (number, 可选): 页码，默认为 0。
- `size` (number, 可选): 每页数量（最大20），默认为 10。
- `chain` (string, 可选): 链名称 (solana/ethereum/base/bsc/tron)。

### swap_tpsl_tasks

获取用户快速买卖创建的所有止盈止损任务

**参数:**
- `page` (number, 可选): 页码，默认为 0。
- `size` (number, 可选): 每页数量（最大20），默认为 10。
- `chain` (string, 可选): 链名称 (solana/ethereum/base/bsc/tron)。
- `state` (string, 可选): 任务状态 (init/processing/done/fail/expired)，默认为 'init'。
- `sourceId` (string, 可选): 快速买卖记录ID。
- `token` (string, 可选): 代币地址。
- `sortBy` (string, 可选): 排序字段。
- `sort` (number, 可选): 排序方向：1为升序，-1为降序，默认为-1。

### edit_fastswap_tpsl_order

编辑快速买卖创建的止损止盈订单

**参数:**
- `id` (string): 订单ID **[必需]**
- `enabled` (boolean, 可选): 任务启用状态
- `groupId` (string, 可选): 分组id
- `triggerPriceUsd` (string, 可选): 触发价格（美元）
- `triggerDirection` (string, 可选): 'up' 或 'down'
- `currencyAmountUI` (number, 可选): 买入金额或卖出比例
- `customFeeAndTip` (boolean, 可选): 自定义费用
- `priorityFee` (string, 可选): 优先费
- `gasFeeDelta` (number, 可选): Gas增量
- `maxFeePerGas` (number, 可选): 最大Gas费用
- `jitoEnabled` (boolean, 可选): 启用Jito
- `jitoTip` (number, 可选): Jito小费
- `expireDelta` (number, 可选): 过期时间（毫秒）
- `expireExecute` (boolean, 可选): 过期后执行
- `useMidPrice` (boolean, 可选): 使用中间价
- `maxSlippage` (number, 可选): 最大滑点
- `concurrentNodes` (number, 可选): 并发节点数
- `retries` (number, 可选): 重试次数

### enable_fastswap_tpsl_order

开启/关闭快速买卖创建的止损止盈订单

**参数:**
- `id` (string): 订单ID **[必需]**
- `enabled` (boolean): 启用状态 **[必需]**

### delete_fastswap_tpsl_order

删除快速买卖创建的止损止盈订单

**参数:**
- `id` (string): 订单ID **[必需]**


## 📚 API文档

完整的API文档请参考：[DBot API](https://dbotx.com/docs).


## 📄 许可证

MIT


## 💡 支持

如有问题或建议，请访问：[GitHub Issues](https://github.com/dbotx/dbot-mcp-servers/issues). 