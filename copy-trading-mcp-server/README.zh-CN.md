[English](./README.md) | [中文](./README.zh-CN.md)

# 专业的多链 DEX 交易 MCP 服务

跟单交易 MCP Server - 支持创建和管理复杂的跟单任务，自动跟随其他用户的交易策略

由 DBot 强力驱动 - [www.dbotx.com](https://www.dbotx.com)

## 🚀 功能特性

以下为功能概述：

- 🔗 **智能跟单**: 自动跟随指定钱包的交易行为进行买入和卖出操作
- ⚡ **多链支持**: 支持多链跟单交易（Solana, Ethereum, Base, BSC, Tron）
- 💰 **灵活买入**: 支持固定金额、固定比例、跟随金额三种买入模式
- 📊 **智能卖出**: 支持跟随卖出、止盈止损、混合模式等多种卖出策略
- 🛡️ **风险控制**: 全面的代币过滤、税率检查、持仓限制等风险控制机制
- 🔧 **任务管理**: 创建、编辑、开关、删除跟单任务
- 📈 **实时监控**: 支持多DEX跟随和黑名单管理
- ⚙️ **高级配置**: 支持防夹模式、滑点控制、并发节点等高级功能

## 快速开始

以下为使用方法：

在MCP客户端配置中添加：

**示例:**
```json
{
  "mcpServers": {
    "copy-trading": {
      "command": "npx",
      "args": ["-y", "@dbotx/copy-trading-mcp-server@latest"],
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

- **基础跟单**：
  - "帮我创建一个跟单任务，跟随钱包地址 {{地址}} 在Solana上的交易，每次最多买入0.1 SOL"
- **修改跟单**：
  - "帮我修改跟单任务，每次最多买入改为0.2 SOL，价格上涨100%时卖出50%，下跌30%时止损"
- **智能跟单 + 止盈止损**：
  - "创建跟单任务跟随该地址 {{地址}}，设置最大买入0.5 SOL，价格上涨200%时自动卖出，下跌30%时止损"
- **多目标跟单**：
  - "跟随这几个聪明钱地址进行交易，{{地址1}} {{地址2}} {{地址3}}，设置分级止盈：涨50%卖30%，涨100%卖70%"
- **管理跟单任务**：
  - "获取跟单列表"
  - "暂停我的跟单任务"
  - "修改跟单任务的最大买入金额"
  - "删除指定的跟单任务"

## 🌱 环境变量

以下为环境变量说明：

### 必需的环境变量
- `DBOT_API_KEY`: DBot API密钥（必需）
- `DBOT_WALLET_ID`: 默认钱包ID（必需）

### 可选的默认参数配置
- 如需更改可根据示例配置，如未更改将使用默认配置。
- 默认配置可通过与LLM模型对话得到，例如 "请告诉我 跟单交易 工具的默认配置"。
- 所有环境变量默认值均可在对话时被覆盖。例如 系统默认开启防夹模式，对话时可要求将其覆盖，"创建跟单任务....，请关闭防夹模式。"

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

**示例:**
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

#### 跟单配置
- `DBOT_BUY_AMOUNT_TYPE`: 默认买入类型 (fixed_amount/fixed_ratio/follow_amount)
- `DBOT_MAX_BUY_AMOUNT`: 默认最大买入金额，例如："0.1"
- `DBOT_BUY_RATIO`: 默认跟随比例，例如：1.0
- `DBOT_SELL_MODE`: 默认卖出模式 (mixed/only_copy/only_pnl)
- `DBOT_SELL_AMOUNT_TYPE`: 默认卖出类型 (all/follow_ratio/x_target_ratio)

**示例:**
```json
{
  "env": {
    "DBOT_API_KEY": "your-api-key",
    "DBOT_WALLET_ID": "your-wallet-id",
    "DBOT_BUY_AMOUNT_TYPE": "follow_amount",
    "DBOT_MAX_BUY_AMOUNT": "0.1",
    "DBOT_BUY_RATIO": "1.0",
    "DBOT_SELL_MODE": "mixed",
    "DBOT_SELL_AMOUNT_TYPE": "all"
  }
}
```

#### 止盈止损配置
- `DBOT_PNL_ORDER_EXPIRE_DELTA`: 止盈止损订单过期时间（毫秒），例如：43200000
- `DBOT_PNL_ORDER_EXPIRE_EXECUTE`: 是否执行过期订单 (true/false)
- `DBOT_PNL_ORDER_USE_MID_PRICE`: 是否使用中间价 (true/false)

**示例:**
```json
{
  "env": {
    "DBOT_API_KEY": "your-api-key",
    "DBOT_WALLET_ID": "your-wallet-id",
    "DBOT_PNL_ORDER_EXPIRE_DELTA": "43200000",
    "DBOT_PNL_ORDER_EXPIRE_EXECUTE": "true",
    "DBOT_PNL_ORDER_USE_MID_PRICE": "false"
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

### create_copy_trading

创建多链的跟单交易任务 - 自动跟随指定钱包地址的交易行为进行买入和卖出操作

**基础参数:**
- `enabled` (boolean, 可选): 任务启用状态，true/false，默认为true
- `name` (string, 必需): 跟单任务的名称
- `chain` (string, 可选): 链 (solana/ethereum/base/bsc/tron)，默认为solana
- `dexFilter` (array, 可选): 需要跟随的DEX，null表示全部跟随，填写名字表示只跟随该DEX的交易
- `targetIds` (array, 必需): 需要跟单的钱包地址（最多10个）
- `tokenBlacklist` (array, 可选): 当前任务的黑名单代币地址（最多20个），加入黑名单之后将不会跟买和跟卖这些代币
- `walletId` (string, 可选): 使用的钱包的id，可通过"钱包信息 API"获取（如未提供将使用环境变量 DBOT_WALLET_ID）
- `groupId` (string, 可选): 分组id
- `buySettings` (object, 必需): 买入相关设置
- `sellSettings` (object, 必需): 卖出相关设置

**买入设置 (buySettings):**
- `enabled` (boolean): 买入任务启用状态，默认为true
- `maxBuyAmountUI` (string, 必需): 跟单的最大买入金额，最小可填写0.001 SOL，0.0001 ETH，0.0001 BNB，1 TRX
- `buyAmountType` (string): 跟单买入类型，"fixed_amount"表示固定金额，"fixed_ratio"表示固定比例，"follow_amount"表示跟随金额，默认为follow_amount
- `buyRatio` (number): 跟随买入比例（0-10），当买入类型为fixed_ratio时生效，默认为1
- `maxBalanceUI` (number): 止盈金额（ETH/SOL/BNB/TRX），钱包余额高于此金额时不会再跟随买入，默认为100
- `reservedAmountUI` (number): 止损金额（ETH/SOL/BNB/TRX），钱包余额低于此金额时不会再跟随买入，默认为0.01
- `targetMinAmountUI` (number): 聪明钱买入金额大于此值时才会跟随买入，默认为0
- `targetMaxAmountUI` (number): 聪明钱买入金额小于此值时才会跟随买入，默认为999999
- `minTokenMCUSD` (number): 最小跟单市值，只跟随买入高于此市值的代币，默认为0
- `maxTokenMCUSD` (number): 最大跟单市值，只跟随买入低于此市值的代币，默认为999999999
- `maxSlippage` (number): 最大滑点（0.00-1.00），默认为0.1
- `jitoEnabled` (boolean): 是否启用防夹模式，默认为true
- `jitoTip` (number): 防夹模式使用的贿赂费，默认为0.001
- `skipFreezableToken` (boolean): 不买入冻结权限未丢弃的代币，默认为false
- `skipMintableToken` (boolean): 不买入mint权限未丢弃的代币，默认为false
- `skipHoneyPot` (boolean): 不买入GoPlus定义为貔貅的代币，默认为false
- `minBurnedLp` (number): 池子最小销毁比例（0-1），默认为0
- `maxBuyTimesPerToken` (number): 7日内代币在此任务中的最大买入次数，默认为999
- `buyOncePerWallet` (boolean): 只买入一次，默认为false
- `concurrentNodes` (number): 并发节点数（1-3），默认为2
- `retries` (number): 失败后的重试次数（0-10），默认为1

**卖出设置 (sellSettings):**
- `enabled` (boolean): 卖出任务启用状态，默认为true
- `mode` (string): 卖出模式，"mixed"表示同时启用跟随卖出和止盈止损，"only_copy"表示只启用跟随卖出，"only_pnl"表示只启用止盈止损，默认为mixed
- `sellAmountType` (string): 跟单卖出的比例，"all"表示100%卖出，"follow_ratio"表示跟随比例卖出，"x_target_ratio"表示根据聪明钱的卖出比例，固定乘以一个倍数进行卖出，默认为all
- `xTargetRatio` (number): 聪明钱卖出比例的倍数（0-100），默认为1
- `sellSpeedType` (string): 跟随卖出的速度，"fast"表示速度优先，"accurate"表示准确优先，默认为accurate
- `stopEarnPercent` (number): 止盈百分比（0.5表示50%）
- `stopLossPercent` (number): 止损百分比（0.5表示50%）
- `stopEarnGroup` (array): 止盈分组，最多支持设置6个
- `stopLossGroup` (array): 止损分组，最多支持设置6个
- `trailingStopGroup` (array): 移动止盈止损分组，当前仅支持设置1组
- `pnlOrderExpireDelta` (number): 止盈止损任务的过期时间（毫秒），默认为43200000
- `sellMode` (string): 卖出方式，"smart"表示不会卖出，"normal"表示继续卖出，默认为smart
- `migrateSellPercent` (number): 开盘卖出比例（0.00-1.00），默认为0
- `minDevSellPercent` (number): 触发比例（0-1），默认为0.5
- `devSellPercent` (number): 当跟随Dev卖出任务触发时，你卖出的比例，默认为1

**示例:**
```json
{
  "enabled": true,
  "name": "跟单任务1",
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

编辑跟单交易任务。只需要提供要修改的字段和必需字段（id, enabled, name, chain, targetIds, buySettings, sellSettings），无需重新输入所有字段

**参数:**
- `id` (string, 必需): 跟单任务id
- 其他参数与创建任务相同（可选）

**示例:**
```json
{
  "id": "lxvmnr5h00jeus",
  "enabled": true,
  "name": "更新的任务名称"
}
```

### switch_copy_trading

开关跟单交易任务

**参数:**
- `id` (string, 必需): 跟单任务id
- `enabled` (boolean, 必需): 任务启用状态，true/false
- `closePnlOrder` (boolean, 可选): 是否同时关闭跟单任务创建的所有止盈止损任务，默认false，表示不关闭（当"enabled"为false时有效）

**示例:**
```json
{
  "id": "lxvmnr5h00jeus",
  "enabled": false,
  "closePnlOrder": false
}
```

### delete_copy_trading

删除跟单交易任务

**参数:**
- `id` (string, 必需): 跟单任务id
- `deletePnlOrder` (boolean, 可选): 是否同时删除此跟单任务创建的所有止盈止损任务，默认为false

**示例:**
```json
{
  "id": "lxvmnr5h00jeus",
  "deletePnlOrder": false
}
```

### get_copy_trading_tasks

获取跟单任务列表

**参数:**
- `page` (number, 可选): 页码，默认为0
- `size` (number, 可选): 每页数量（最大100），默认为20

**示例:**
```json
{
  "page": 0,
  "size": 20
}
```

## 跟单机制说明

### 买入类型
- **fixed_amount**: 固定金额买入
- **fixed_ratio**: 固定比例买入（根据buyRatio参数）
- **follow_amount**: 跟随金额买入（按聪明钱的实际买入金额）

### 卖出模式
- **mixed**: 同时启用跟随卖出和止盈止损
- **only_copy**: 只启用跟随卖出
- **only_pnl**: 只启用止盈止损

### 卖出类型
- **all**: 100%卖出
- **follow_ratio**: 跟随比例卖出
- **x_target_ratio**: 根据聪明钱的卖出比例乘以倍数

### 风险控制功能
- **代币过滤**: 支持冻结权限、mint权限、委托检查
- **税率检查**: 支持买入/卖出税率限制（EVM链）
- **貔貅检测**: 集成GoPlus安全检测
- **流动性检查**: 支持最小流动性和LP销毁比例检查
- **持仓限制**: 支持前10持仓比例限制
- **购买频率**: 支持单币最大购买次数和金额限制

## 风险提醒

### 投资风险
1. **市场风险**: 跟单不能保证盈利，存在亏损可能
2. **策略风险**: 被跟单者的策略可能不适合您的风险偏好
3. **时间差风险**: 跟单执行可能存在时间延迟

### 技术风险
1. **网络延迟**: 可能影响跟单执行时机
2. **资金不足**: 确保账户有足够资金执行跟单
3. **链条拥堵**: 网络拥堵可能影响交易执行

### 建议措施
1. **合理配置**: 根据风险承受能力设置买入金额和止盈止损
2. **多重保护**: 启用代币过滤和风险检查功能
3. **定期监控**: 定期检查跟单任务的执行情况
4. **及时调整**: 根据市场情况及时调整策略

## 注意事项

1. **钱包配置**: `walletId` 参数是可选的，如果不提供将自动使用环境变量 `DBOT_WALLET_ID` 中的钱包ID
2. **被跟单地址**: 确保提供的钱包地址是您信任的交易者
3. **资金管理**: 确保账户有足够的资金执行跟单交易
4. **监控频率**: 系统会实时监控被跟单地址的交易活动
5. **参数配置**: 建议先用较小金额测试，确认策略有效后再增加投入

## 📚 API文档

完整的API文档请参考：[DBot API](https://dbotx.com/docs).


## 📄 许可证

MIT


## 💡 支持

如有问题或建议，请访问：[GitHub Issues](https://github.com/dbotx/dbot-mcp-servers/issues). 