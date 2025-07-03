[English](./README.md) | [中文](./README.zh-CN.md)

# 专业的多链 DEX 限价交易 MCP 服务

限价单 MCP Server - 支持多链限价买卖，精准价格触发，灵活订单管理。专业的跨链 MCP 交易服务，支持 Solana、Ethereum、BSC 等多条主流区块链的 DEX 交易。

由 DBot 强力驱动 - [www.dbotx.com](https://www.dbotx.com)

## 🚀 功能特性

- 🎯 **精准限价**：支持 Solana、Ethereum、Base、BSC、Tron 多链限价买入和卖出
- ⚡ **灵活触发**：支持高于/低于目标价触发，防插针模式
- 🔧 **完整管理**：创建、编辑、启用/禁用、删除限价单
- 📊 **状态查询**：查看限价单执行状态和历史记录
- ⏰ **到期处理**：可配置任务到期时是否按市价执行
- 🛡️ **风险控制**：支持滑点、优先费、防夹等参数


## 快速开始

在 MCP 客户端配置中添加：

```json
{
  "mcpServers": {
    "limit-order": {
      "command": "npx",
      "args": ["-y", "@dbotx/limit-order-mcp-server@latest"],
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

- **高价卖出**：
  - "帮我在 solana 上高于 100 美元时卖出代币 {{代币地址}} 50% 仓位"
- **低价买入**：
  - "帮我在 solana 上低于 0.0001 美元时买入 1 个 {{代币地址}} 代币"
- **修改限价单**：
  - "帮我把限价单的触发价格改为 20 美元，关闭防夹模式"
- **查询限价单**：
  - "帮我查看所有限价单"
- **管理限价单**：
  - "帮我关闭这个限价单"
  - "帮我重新打开这个限价单"
  - "帮我删除这个限价单"


## 🌱 环境变量

以下为环境变量说明：

### 必需的环境变量
- `DBOT_API_KEY`: DBot API密钥（必需）
- `DBOT_WALLET_ID`: 默认钱包ID（必需）

### 可选的默认参数配置
- 如需更改可根据示例配置，如未更改将使用默认配置。
- 默认配置可通过与llm模型对话得到，例如 "请告诉我 限价单 工具的默认配置"。
- 所有环境变量默认值均可在对话时被覆盖。例如 系统默认开启防夹模式，对话时可要求将其覆盖，"创建限价单 ....，请关闭防夹模式。"

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

#### 限价单配置
- `DBOT_EXPIRE_DELTA`: 任务有效时长（毫秒），例如：432000000
- `DBOT_EXPIRE_EXECUTE`: 任务过期时是否按市价执行 (true/false)
- `DBOT_USE_MID_PRICE`: 是否启用防插针模式 (true/false)

**示例：**

```json
{
  "env": {
    "DBOT_API_KEY": "your-api-key",
    "DBOT_WALLET_ID": "your-wallet-id",
    "DBOT_EXPIRE_DELTA": "432000000",
    "DBOT_EXPIRE_EXECUTE": "false",
    "DBOT_USE_MID_PRICE": "true"
  }
}
```


## 🛠️ 可用工具

### create_limit_order
创建多链限价买入/卖出任务

**主要参数：**
- `chain` (string)：区块链名称 (solana/ethereum/base/bsc/tron)
- `pair` (string)：代币地址或交易对地址（必需）
- `walletId` (string)：钱包 ID（可选）
- `tradeType` (string)：交易类型 (buy/sell)（必需）
- `triggerPriceUsd` (number)：触发价格（美元）（必需）
- `triggerDirection` (string)：触发方向 (up/down)（必需）
- `currencyAmountUI` (number)：买入金额或卖出比例（必需）
- 其他：enabled, groupId, customFeeAndTip, priorityFee, gasFeeDelta, maxFeePerGas, jitoEnabled, jitoTip, expireDelta, expireExecute, useMidPrice, maxSlippage, concurrentNodes, retries

**示例：**
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
编辑限价单
```json
{
  "id": "limit-order-123",
  "triggerPriceUsd": 20
}
```

### switch_limit_order
启用/禁用限价单
```json
{
  "id": "limit-order-123",
  "enabled": false
}
```

### delete_limit_order
删除限价单
```json
{
  "id": "limit-order-123"
}
```

### delete_limit_orders
批量删除限价单
```json
{
  "ids": ["limit-order-123", "limit-order-456"]
}
```

### delete_all_limit_order
删除全部限价单
```json
{
  "chain": "solana"
}
```

### limit_orders
查询限价单列表
```json
{
  "page": 0,
  "size": 10
}
```

## ⚠️ 注意事项

1. `walletId` 可选，未提供时自动使用 `DBOT_WALLET_ID`
2. 价格以美元计价，建议使用合理精度
3. 默认任务有效期为 432000000 毫秒（5 天）
4. 触发方向：`up` 为上涨触发，`down` 为下跌触发
5. 防插针模式可避免瞬时波动误触发
6. 可配置到期时是否按市价强制执行


## 许可证

MIT License

## 支持

如有问题或建议，请访问 [GitHub Issues](https://github.com/dbot-team/dbot-mcp-servers/issues) 