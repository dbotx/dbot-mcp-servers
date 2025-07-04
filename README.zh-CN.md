[English](./README.md) | [中文](./README.zh-CN.md)

# dbot-mcp-servers

本代码库包含一系列专为去中心化交易所（DEX）上的高级加密货币交易设计的多链平台（MCP）服务器。每个服务器都提供特定的自动化交易功能。

## 可用的 MCP 服务器

以下是本代码库中可用的 MCP 服务器列表。每个服务器都是一个独立的软件包，拥有自己独特的功能和配置。

---

### [快速兑换 MCP 服务器](./fast-swap-mcp-server/)

优化以尽可能快地执行代币兑换。

**🚀 功能特性:**
- **快速交易**: 支持多链快速买卖交易（Solana, Ethereum, Base, BSC, Tron）。
- **多钱包支持**: 支持使用多个钱包同时进行交易。
- **订单查询**: 查询交易订单状态和详情。
- **止盈止损**: 管理止盈止损任务。

**▶️ 快速开始:**
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

---

### [限价单 MCP 服务器](./limit-order-mcp-server/)

允许您下达限价单，当代币达到特定价格时将自动执行。

**🚀 功能特性:**
- **精准限价**: 支持多链限价买入和卖出。
- **灵活触发**: 支持高于/低于目标价触发。
- **完整管理**: 创建、编辑、启用/禁用、删除限价单。
- **到期处理**: 可配置任务到期时是否按市价执行。

**▶️ 快速开始:**
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

---

### [跟单 MCP 服务器](./copy-trading-mcp-server/)

使您能够自动复制其他钱包的交易。

**🚀 功能特性:**
- **智能跟单**: 自动跟随指定钱包的交易行为。
- **灵活买入**: 支持固定金额、固定比例、跟随金额三种买入模式。
- **智能卖出**: 支持跟随卖出、止盈止损等多种卖出策略。
- **风险控制**: 全面的代币过滤、税率检查等风险控制机制。

**▶️ 快速开始:**
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

---

### [条件单 MCP 服务器](./conditional-order-mcp-server/)

提供"开盘卖出"和"跟随开发者卖出"等自动化交易任务。

**🚀 功能特性:**
- **开盘卖出**: 当代币从Pump迁移到Raydium时自动卖出。
- **跟随Dev卖出**: 当开发者卖出达到指定比例时自动跟随卖出。
- **智能监控**: 实时监控代币状态和开发者行为。
- **灵活管理**: 创建、编辑、开关、删除任务。

**▶️ 快速开始:**
```json
{
  "mcpServers": {
    "conditional-order": {
      "command": "npx",
      "args": ["-y", "@dbotx/conditional-order-mcp-server@latest"],
      "env": {
        "DBOT_API_KEY": "your-api-key",
        "DBOT_WALLET_ID": "your-wallet-id"
      }
    }
  }
}
```

---

有关详细的配置和使用说明，请参阅每个服务器目录中的 `README.zh-CN.md` 文件。

由 DBot 强力驱动 - [www.dbotx.com](https://www.dbotx.com) 