[English](./README.md) | [中文](./README.zh-CN.md)

# 专业的多链 DEX 交易 MCP 服务

条件单交易 MCP Server - 支持创建和管理开盘卖出、跟随Dev卖出等自动化交易任务

## 功能特性

- 🚀 **开盘卖出**: 当代币从Pump迁移到Raydium时自动卖出
- 👥 **跟随Dev卖出**: 当开发者卖出达到指定比例时自动跟随卖出
- ⚡ **智能监控**: 实时监控代币状态和开发者行为
- 🔧 **灵活管理**: 创建、编辑、开关、删除任务
- 📊 **状态跟踪**: 查看任务状态和执行历史
- 🤖 **自动执行**: 满足条件时自动触发交易
- 🎯 **精准控制**: 支持自定义费用、滑点、重试等参数
- 💳 **钱包管理**: 按链类型查询用户钱包（Solana/EVM）
- 🔐 **代币安全检查**: 获取全面的代币安全信息和池子安全详情

## 快速开始

### 在MCP客户端中配置

在你的MCP客户端配置中添加：

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
**Get your api-key and wallet-id at [www.dbotx.com](https://www.dbotx.com)**

## 📚 典型场景

- **开盘卖出**：
  - "帮我创建一个开盘卖出任务，卖出SOLANA代币 {{地址}} ，80%仓位"
- **跟随Dev卖出**：
  - "帮我创建一个跟随Dev卖出任务，当Dev卖出SOLANA代币 {{地址}} 60%仓位时，卖出我80%仓位"
- **管理任务**：
  - "获取我的开盘卖出任务列表"
  - "查看所有跟随Dev卖出任务"
  - "显示进行中的任务"
  - "暂停我的条件单任务"
  - "修改开盘卖出任务的卖出比例为90%"
- **钱包管理**：
  - "显示我的所有钱包"
  - "显示我的 Solana 钱包"
  - "显示我的 EVM 钱包"
- **代币安全检查**：
  - "创建条件单前先检查代币 {{代币地址}} 的安全性"
  - "显示 {{代币地址}} 的池子信息"
  - "修改跟随dev卖出任务的卖出比例为90%"
  - "删除指定的条件单任务"

## 环境变量

### 必需的环境变量
- `DBOT_API_KEY`: DBot API密钥（必需）

### 钱包配置
至少需要配置以下钱包ID中的一个：
- `DBOT_WALLET_ID_SOLANA`: Solana 链钱包ID（可选）
- `DBOT_WALLET_ID_EVM`: EVM 链钱包ID（可选，用于 Ethereum, Base, BSC）
- `DBOT_WALLET_ID_TRON`: Tron 链钱包ID（可选）
- `DBOT_WALLET_ID_BASE`: Base 链钱包ID（可选，优先于 EVM）
- `DBOT_WALLET_ID_ARBITRUM`: Arbitrum 链钱包ID（可选，优先于 EVM）
- `DBOT_WALLET_ID_BSC`: BSC 链钱包ID（可选，优先于 EVM）

**优先级：** 特定链钱包ID > 通用链类型钱包ID

**示例：**
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

### 可选的默认参数配置
以下环境变量可用于配置默认参数值。这些默认值可以在调用时被覆盖。

#### 基础配置
- `DBOT_CHAIN`: 默认链类型，默认值为 "solana"
- `DBOT_CUSTOM_FEE_AND_TIP`: 是否使用自定义费用，默认值为 false
- `DBOT_PRIORITY_FEE`: 优先费，默认值为 "0.0001"
- `DBOT_JITO_ENABLED`: 是否启用防夹模式，默认值为 true
- `DBOT_JITO_TIP`: 防夹小费，默认值为 0.001
- `DBOT_MAX_SLIPPAGE`: 最大滑点 (0.00-1.00)，默认值为 0.1
- `DBOT_CONCURRENT_NODES`: 并发节点数 (1-3)，默认值为 2
- `DBOT_RETRIES`: 重试次数 (0-10)，默认值为 1
- `DBOT_EXPIRE_DELTA`: 任务有效时长（毫秒），默认值为 360000000
- `DBOT_MIN_DEV_SELL_PERCENT`: 跟随Dev卖出触发比例，默认值为 0.5

**配置示例：**
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

## 可用工具

### create_migrate_order

创建开盘卖出任务

**功能说明：**
当代币从Pump.fun迁移到Raydium时自动执行卖出操作。

**参数:**
- `pair` (string): Pump代币地址 **[必需]**
- `amountOrPercent` (number): 卖出比例（0-1），例如 0.5 表示卖出50% **[必需]**
- `walletId` (string): 钱包ID（可选，如未提供将使用相应链的钱包ID）
- `chain` (string): 区块链名称 (solana，默认：solana)
- `pairType` (string): 代币类型 (pump/raydium_amm，默认：pump)
- `customFeeAndTip` (boolean): 是否自定义费用和小费设置（默认：false）
- `priorityFee` (string): 优先费（SOL），空字符串表示使用自动优先费（默认：""）
- `jitoEnabled` (boolean): 是否启用防夹模式（默认：true）
- `jitoTip` (number): 防夹模式使用的贿赂费（默认：0.001）
- `expireDelta` (number): 任务有效时长（毫秒），最大值为432000000（默认：360000000）
- `maxSlippage` (number): 最大滑点（0.00-1.00）（默认：0.1）
- `concurrentNodes` (number): 并发节点数（1-3）（默认：2）
- `retries` (number): 失败后的重试次数（0-10）（默认：1）

**示例:**
```json
{
  "pair": "9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump",
  "amountOrPercent": 0.5,
  "jitoEnabled": true,
  "jitoTip": 0.001
}
```

### create_dev_order

创建跟随Dev卖出任务

**功能说明：**
当开发者卖出代币达到指定比例时，自动跟随卖出。

**参数:**
- `pair` (string): Pump代币地址或交易对地址 **[必需]**
- `amountOrPercent` (number): 卖出比例（0-1），例如 0.5 表示卖出50% **[必需]**
- `minDevSellPercent` (number): 触发比例（0-1），当Dev卖出超过这个比例时卖出你的代币（默认：0.5）
- `walletId` (string): 钱包ID（可选，如未提供将使用相应链的钱包ID）
- 其他参数与 `create_migrate_order` 相同

**示例:**
```json
{
  "pair": "9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump",
  "minDevSellPercent": 0.3,
  "amountOrPercent": 0.8,
  "jitoEnabled": true
}
```

### update_migrate_order

编辑开盘卖出任务

**参数:**
- `id` (string): 开盘卖出任务的ID **[必需]**
- `pair` (string): Pump代币地址 **[必需]**
- `walletId` (string): 钱包ID **[必需]**
- `amountOrPercent` (number): 卖出比例（0-1） **[必需]**
- 其他参数与 `create_migrate_order` 相同

### update_dev_order

编辑跟随Dev卖出任务

**参数:**
- `id` (string): 跟随Dev卖出任务的ID **[必需]**
- `pair` (string): Pump代币地址或交易对地址 **[必需]**
- `walletId` (string): 钱包ID **[必需]**
- `amountOrPercent` (number): 卖出比例（0-1） **[必需]**
- 其他参数与 `create_dev_order` 相同

### toggle_migrate_order

开启/关闭开盘卖出任务

**参数:**
- `id` (string): 开盘卖出任务的ID **[必需]**
- `enabled` (boolean): 任务启用状态：true表示启用，false表示禁用 **[必需]**

### toggle_dev_order

开启/关闭跟随Dev卖出任务

**参数:**
- `id` (string): 跟随Dev卖出任务的ID **[必需]**
- `enabled` (boolean): 任务启用状态：true表示启用，false表示禁用 **[必需]**

### delete_migrate_order

删除开盘卖出任务

**参数:**
- `id` (string): 开盘卖出任务的ID **[必需]**

### delete_dev_order

删除跟随Dev卖出任务

**参数:**
- `id` (string): 跟随Dev卖出任务的ID **[必需]**

### get_migrate_orders

获取开盘卖出任务列表

**功能说明：**
获取用户的所有开盘卖出任务，支持分页和状态筛选。

**参数:**
- `page` (number): 页码，从0开始（默认：0）
- `size` (number): 每页数量，1-100（默认：20）
- `chain` (string): 区块链名称 (solana，默认：solana)
- `state` (string): 任务状态筛选（可选）
  - `init`: 初始化
  - `processing`: 处理中
  - `done`: 已完成
  - `fail`: 失败
  - `expired`: 已过期
- `source` (string): 任务来源筛选（可选）

**示例:**
```json
{
  "page": 0,
  "size": 10,
  "state": "init"
}
```

### get_dev_orders

获取跟随Dev卖出任务列表

**功能说明：**
获取用户的所有跟随Dev卖出任务，支持分页和状态筛选。

**参数:**
- `page` (number): 页码，从0开始（默认：0）
- `size` (number): 每页数量，1-100（默认：20）
- `chain` (string): 区块链名称 (solana，默认：solana)
- `state` (string): 任务状态筛选（可选）
  - `init`: 初始化
  - `processing`: 处理中
  - `done`: 已完成
  - `fail`: 失败
  - `expired`: 已过期
- `source` (string): 任务来源筛选（可选）

**示例:**
```json
{
  "page": 0,
  "size": 10,
  "state": "processing"
}
```

### get_user_wallets

查询用户指定链类型的钱包。如果未指定类型，会查询所有类型（solana 和 evm）。

**参数:**
- `type` (string, 可选): 查询的链类型 (solana/evm)。如果未指定，查询所有类型。
- `page` (number, 可选): 页码，默认为 0。
- `size` (number, 可选): 每页结果数，默认为 20。

### get_token_security_info

获取代币安全信息和池子安全详情。**重要提示：在进行任何交易前应该调用此工具检查代币安全因素。**

**参数:**
- `chain` (string, 可选): 链名称，默认为 'solana'。
- `pair` (string, 必需): 代币地址或交易对地址。

**返回全面的代币信息，包括：**
- 代币和池子创建时间
- 价格和市值
- 安全因素（mint/freeze权限、前10持有者集中度）
- 池子流动性信息
- 相关链接（Birdeye、Jupiter等）

## 使用场景

### 1. 开盘卖出策略
当你持有Pump.fun代币，希望在代币迁移到Raydium时立即卖出获利：
```json
{
  "pair": "代币地址",
  "amountOrPercent": 1.0,
  "jitoEnabled": true,
  "jitoTip": 0.001
}
```

### 2. 跟随Dev卖出策略
当你担心开发者抛售，希望在开发者开始大量卖出时及时止损：
```json
{
  "pair": "代币地址",
  "minDevSellPercent": 0.2,
  "amountOrPercent": 0.5,
  "jitoEnabled": true
}
```

### 3. 风险控制
结合开盘卖出和跟随Dev卖出，实现多层风险控制：
- 设置开盘卖出任务，在迁移时卖出50%
- 设置跟随Dev卖出任务，当Dev卖出超过30%时卖出剩余的50%

## 技术特性

### 费用控制
- **自动费用模式**: 系统自动选择最优费用设置
- **自定义费用模式**: 可精确控制优先费和贿赂费
- **防夹模式**: 启用Jito防夹，避免MEV攻击

### 滑点保护
- 支持设置最大滑点限制
- 自动根据市场情况调整交易策略

### 可靠性保证
- 多节点并发执行，提高成功率
- 失败自动重试机制
- 任务有效期限制，避免过期执行

## 注意事项

1. **钱包配置**: `walletId` 参数是可选的，如果不提供将自动使用相应链的钱包ID
2. **代币类型**: 
   - `pump`: 表示代币还未上Raydium
   - `raydium_amm`: 表示代币已上Raydium
3. **任务监控**: 系统会持续监控条件状态，满足条件时自动执行
4. **费用设置**: 
   - `customFeeAndTip=false`: 高速模式下只有优先费有效，防夹模式下只有贿赂费有效
   - `customFeeAndTip=true`: 优先费和贿赂费均有效
5. **风险控制**: 建议设置合理的卖出比例和滑点限制

## 错误处理

所有工具调用都会返回详细的错误信息，帮助快速定位和解决问题。常见错误包括：
- API密钥错误
- 钱包ID无效
- 代币地址格式错误
- 参数范围超出限制

## 📚 API文档

完整的API文档请参考：[DBot API](https://dbotx.com/docs).


## 📄 许可证

MIT


## 💡 支持

如有问题或建议，请访问：[GitHub Issues](https://github.com/dbotx/dbot-mcp-servers/issues). 