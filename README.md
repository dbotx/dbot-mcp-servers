[English](./README.md) | [中文](./README.zh-CN.md)

# dbot-mcp-servers

This repository contains a collection of Multi-Chain Platform (MCP) servers designed for advanced cryptocurrency trading on Decentralized Exchanges (DEXs). Each server provides specific automated trading functionalities.

## Available MCP Servers

Below is a list of the available MCP servers in this repository. Each server is a standalone package with its own set of features and configurations.

---

### [Fast Swap MCP Server](./fast-swap-mcp-server/)

Optimized for executing token swaps as quickly as possible.

**🚀 Features:**
- **Fast Trading**: Supports multi-chain fast buy/sell transactions (Solana, Ethereum, Base, BSC, Tron).
- **Multi-Wallet Support**: Supports trading with multiple wallets simultaneously.
- **Order Query**: Query transaction order status and details.
- **Take-Profit/Stop-Loss**: Manage take-profit and stop-loss tasks.

**▶️ Quick Start:**
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

### [Limit Order MCP Server](./limit-order-mcp-server/)

Allows you to place limit orders, which are executed when the token reaches a specific price.

**🚀 Features:**
- **Precise Limit Orders**: Supports limit buy and sell on multiple chains.
- **Flexible Triggers**: Supports triggering above/below a target price.
- **Complete Management**: Create, edit, enable/disable, and delete limit orders.
- **Expiration Handling**: Configurable option to execute at market price upon task expiration.

**▶️ Quick Start:**
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

### [Copy Trading MCP Server](./copy-trading-mcp-server/)

Enables you to automatically copy the trades of other wallets.

**🚀 Features:**
- **Smart Copy Trading**: Automatically follow specified wallets' trading behaviors.
- **Flexible Buying**: Supports fixed amount, fixed ratio, and follow amount buying modes.
- **Smart Selling**: Supports various selling strategies like follow selling and take-profit/stop-loss.
- **Risk Control**: Comprehensive token filtering, tax checks, and other risk controls.

**▶️ Quick Start:**
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

### [Conditional Order MCP Server](./conditional-order-mcp-server/)

Provides automated trading tasks like "Sell on Open" and "Follow Dev's Sell".

**🚀 Features:**
- **Sell on Open**: Automatically sell when a token migrates from Pump to Raydium.
- **Follow Dev's Sell**: Automatically follow and sell when a developer sells a specified percentage of tokens.
- **Smart Monitoring**: Real-time monitoring of token status and developer behavior.
- **Flexible Management**: Create, edit, enable/disable, and delete tasks.

**▶️ Quick Start:**
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
Please refer to the `README.md` file within each server's directory for detailed instructions on configuration and usage.

Powered by DBot - [www.dbotx.com](https://www.dbotx.com)