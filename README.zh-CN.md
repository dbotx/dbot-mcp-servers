[English](./README.md) | [中文](./README.zh-CN.md)

# dbot-mcp-servers

此仓库包含一系列专为去中心化交易所（DEX）高级加密货币交易设计的多链平台（MCP）服务器。每个服务器都提供特定的自动化交易功能。

## 可用的 MCP 服务器

以下是此仓库中可用的 MCP 服务器列表。每个服务器都是一个独立的包，具有自己的功能集和配置。

---

### [快速买卖 MCP 服务器](./fast-swap-mcp-server/)

专为尽可能快速执行代币交换而优化。

**🚀 功能特性:**
- **快速交易**: 支持多链快速买卖交易（Solana、Ethereum、Base、BSC、Tron）
- **多钱包支持**: 支持同时使用多个钱包进行交易
- **订单查询**: 查询交易订单状态和详情
- **止盈止损**: 管理止盈止损任务
- **钱包管理**: 按链类型查询用户钱包ID和地址（Solana/EVM），为交易操作提供必要的钱包信息
- **代币安全分析**: 全面的代币安全和市场信息，包括价格、市值、创建时间、流动性、安全因素和交易数据

**▶️ 快速开始:**
```json
{
  "mcpServers": {
    "fast-swap": {
      "command": "npx",
      "args": ["-y", "@dbotx/fast-swap-mcp-server@latest"],
      "env": {
        "DBOT_API_KEY": "your-api-key",
        "DBOT_WALLET_ID_SOLANA": "your-solana-wallet-id",
        "DBOT_WALLET_ID_EVM": "your-evm-wallet-id"
      }
    }
  }
}
```

---

### [限价单 MCP 服务器](./limit-order-mcp-server/)

允许您下达限价单，当代币达到特定价格时执行。

**🚀 功能特性:**
- **精确限价单**: 支持多链限价买卖
- **灵活触发**: 支持高于/低于目标价格触发
- **完整管理**: 创建、编辑、启用/禁用和删除限价单
- **过期处理**: 可配置的任务过期时以市场价格执行选项
- **钱包管理**: 按链类型查询用户钱包ID和地址（Solana/EVM），为交易操作提供必要的钱包信息
- **代币安全分析**: 全面的代币安全和市场信息，包括价格、市值、创建时间、流动性、安全因素和交易数据

**▶️ 快速开始:**
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

---

### [跟单交易 MCP 服务器](./copy-trading-mcp-server/)

使您能够自动复制其他钱包的交易。

**🚀 功能特性:**
- **智能跟单交易**: 自动跟随指定钱包的交易行为
- **灵活买入**: 支持固定金额、固定比例和跟随金额买入模式
- **智能卖出**: 支持跟随卖出、止盈止损等各种卖出策略
- **风险控制**: 全面的代币过滤、税率检查和其他风险控制机制
- **钱包管理**: 按链类型查询用户钱包ID和地址（Solana/EVM），为交易操作提供必要的钱包信息

**▶️ 快速开始:**
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

---

### [条件单 MCP 服务器](./conditional-order-mcp-server/)

提供自动化交易任务，如"开盘卖出"和"跟随开发者卖出"。

**🚀 功能特性:**
- **开盘卖出**: 当代币从 Pump 迁移到 Raydium 时自动卖出
- **跟随开发者卖出**: 当开发者卖出指定比例的代币时自动跟随卖出
- **智能监控**: 实时监控代币状态和开发者行为
- **灵活管理**: 创建、编辑、启用/禁用和删除任务
- **钱包管理**: 按链类型查询用户钱包ID和地址（Solana/EVM），为交易操作提供必要的钱包信息
- **代币安全分析**: 全面的代币安全和市场信息，包括价格、市值、创建时间、流动性、安全因素和交易数据

**▶️ 快速开始:**
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

---
请参考每个服务器目录中的 `README.md` 文件获取详细的配置和使用说明。

由 DBot 强力驱动 - [www.dbotx.com](https://www.dbotx.com) 