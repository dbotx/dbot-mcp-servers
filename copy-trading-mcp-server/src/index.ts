#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { DbotCopyTradingClient } from './client.js';
import {
  CreateCopyTradingRequestSchema,
  EditCopyTradingRequestSchema,
  SwitchCopyTradingRequestSchema,
  DeleteCopyTradingRequestSchema,
} from './types.js';

class CopyTradingMcpServer {
  private server: Server;
  private client: DbotCopyTradingClient;

  constructor() {
    this.server = new Server(
      {
        name: 'copy-trading-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.client = new DbotCopyTradingClient();
    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error: any) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'create_copy_trading',
            description: `Create multi-chain copy trading tasks - automatically follow the trading behavior of specified wallet addresses for buying and selling operations.
Request example:
{
  "enabled": true,
  "name": "Follow xxx",
  "chain": "solana",
  "targetIds": [
    "xxx"
  ],
  "buySettings": {
    "enabled": true,
    "maxBuyAmountUI": "0.1"
  },
  "sellSettings": {
    "enabled": true
  }
}
            `,
            inputSchema: {
              type: 'object',
              properties: {
                enabled: {
                  type: 'boolean',
                  description: 'Task enabled status, true/false',
                  default: true,
                },
                name: {
                  type: 'string',
                  description: 'Name of the copy trading task',
                },
                chain: {
                  type: 'string',
                  enum: ['solana', 'ethereum', 'base', 'bsc', 'tron'],
                  description: 'Chain (solana/ethereum/base/bsc/tron)',
                  default: 'solana',
                },
                dexFilter: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'DEXs to follow, null means all, specifying names means only follow trades on those DEXs, including: raydium_amm,raydium_clmm,raydium_cpmm,raydium_launchpad,meteora_dlmm,meteora_dyn,meteora_dyn2,meteora_bc,pump,pump_swap,moonshot,orca_wp,uniswap_v2,uniswap_v3,pancake_v2,pancake_v3,sunswap_v2,sunpump,ether_vista,okx_v2,fourmeme,boop',
                },
                targetIds: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Wallet addresses to copy trade (up to 10)',
                  maxItems: 10,
                  minItems: 1,
                },
                tokenBlacklist: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Blacklisted token addresses for the current task (up to 20), buying and selling of these tokens will be skipped',
                  maxItems: 20,
                },
                walletId: {
                  type: 'string',
                  description: 'ID of the wallet to use, obtainable via "Wallet Info API"',
                },
                groupId: {
                  type: 'string',
                  description: 'Group ID',
                },
                buySettings: {
                  type: 'object',
                  description: 'Buy-related settings',
                  properties: {
                    enabled: { type: 'boolean', default: true, description: 'Buy task enabled status' },
                    startHour: { type: 'number', minimum: 0, maximum: 23, default: 0, description: 'Enable time for follow buy or sell (UTC). Follow buys or sells will only execute after this time each day. Must be an integer between 0-23, e.g., 10 means 10:00 UTC.' },
                    endHour: { type: 'number', minimum: 0, maximum: 23, default: 23, description: 'Disable time for follow buy or sell (UTC). Follow buys or sells will only execute before this time each day. Must be an integer between 0-23, e.g., 10 means 10:00 UTC.' },
                    buyAmountType: {
                      type: 'string',
                      enum: ['fixed_amount', 'fixed_ratio', 'follow_amount'],
                      default: 'follow_amount',
                      description: 'Copy buy type, "fixed_amount" for fixed amount, "fixed_ratio" for fixed ratio, "follow_amount" for follow amount'
                    },
                    maxBuyAmountUI: { type: 'string', description: 'Maximum buy amount for copy trading, minimum 0.001 SOL, 0.0001 ETH, 0.0001 BNB, 1 TRX' },
                    buyRatio: { type: 'number', minimum: 0, maximum: 10, default: 1, description: 'Follow buy ratio (0-10), effective when buy type is fixed_ratio' },
                    maxBalanceUI: { type: 'number', minimum: 0, default: 100, description: 'Take-profit amount (ETH/SOL/BNB/TRX), no more copy buys when wallet balance exceeds this amount' },
                    reservedAmountUI: { type: 'number', minimum: 0, default: 0.01, description: 'Stop-loss amount (ETH/SOL/BNB/TRX), no more copy buys when wallet balance falls below this amount' },
                    targetMinAmountUI: { type: 'number', minimum: 0, default: 0, description: 'When in buy settings, it means only follow buy when smart money buy amount is greater than this value; when in sell settings, it means only follow sell when smart money sell income is greater than this value' },
                    targetMaxAmountUI: { type: 'number', minimum: 0, default: 999999, description: 'When in buy settings, it means only follow buy when smart money buy amount is less than this value; when in sell settings, it means only follow sell when smart money sell income is less than this value' },
                    minTokenMCUSD: { type: 'number', minimum: 0, default: 0, description: 'Minimum copy token market cap, only follow buy tokens with market cap higher than this value' },
                    maxTokenMCUSD: { type: 'number', minimum: 0, default: 999999999, description: 'Maximum copy token market cap, only follow buy tokens with market cap lower than this value' },
                    maxBuyTax: { type: 'number', minimum: 0, maximum: 1, description: 'Maximum token buy tax, effective for EVM chains, only follow buy tokens with tax rate lower than this value (data from GoPlus, may affect copy trading speed)' },
                    maxSellTax: { type: 'number', minimum: 0, maximum: 1, description: 'Maximum token sell tax, effective for EVM chains, only follow buy tokens with tax rate lower than this value (data from GoPlus, may affect copy trading speed)' },
                    customFeeAndTip: { type: 'boolean', default: false, description: '"true" means both priorityFee and jitoTip fields are effective, the system will execute the transaction with the specified values (null means auto priority fee/auto bribe), "false" means only priorityFee is effective in high-speed mode, and only jitoTip is effective in anti-sandwich mode, the system will allocate automatically' },
                    priorityFee: { type: 'string', default: '', description: 'Priority fee (SOL), effective for Solana, an empty string means use auto priority fee' },
                    gasFeeDelta: { type: 'number', minimum: 0, default: 5, description: 'Additional gas (Gwei), effective for EVM chains' },
                    maxFeePerGas: { type: 'number', minimum: 0, default: 100, description: 'No transaction will be made if base gas exceeds this value (Gwei), effective for EVM chains' },
                    jitoEnabled: { type: 'boolean', default: true, description: '"true" enables anti-sandwich mode (Solana & Ethereum & Bsc)' },
                    jitoTip: { type: 'number', minimum: 0, default: 0.001, description: 'Bribe fee for anti-sandwich mode (Solana)' },
                    maxSlippage: { type: 'number', minimum: 0, maximum: 1, default: 0.1, description: 'Maximum slippage (0.00-1.00). For buying, it is the difference between the actual and expected price. For selling, it is the difference between the expected and actual price. The difference multiple = 1/(1-slippage). 0.5 means accepting up to a 2x price difference, 1 means no limit.' },
                    skipFreezableToken: { type: 'boolean', default: false, description: '"true" means do not buy tokens with unrevoked freeze authority' },
                    skipMintableToken: { type: 'boolean', default: false, description: '"true" means do not buy tokens with unrevoked mint authority' },
                    skipDelegatedToken: { type: 'boolean', default: false, description: '"true" means do not buy delegated tokens' },
                    skipNotOpensource: { type: 'boolean', default: false, description: '"true" means do not buy tokens defined as not open-source by GoPlus, effective for EVM chains (enabling this may affect copy trading speed)' },
                    skipHoneyPot: { type: 'boolean', default: false, description: '"true" means do not buy tokens identified as honeypots by GoPlus, effective for EVM chains (enabling this may affect copy trading speed)' },
                    skipTargetIncreasePosition: { type: 'boolean', default: false, description: '"true" means do not buy tokens already held by the smart money address' },
                    minBurnedLp: { type: 'number', minimum: 0, maximum: 1, default: 0, description: 'Minimum LP burn ratio (0-1). Only follow buys for tokens with a liquidity burn ratio greater than or equal to this value. Supports Raydium (AMM) and Raydium (CPMM).' },
                    minLpUsd: { type: 'number', minimum: 0, default: 0, description: 'Minimum liquidity ($), only follow buy tokens with liquidity greater than or equal to this value' },
                    minTokenAgeMs: { type: 'number', minimum: 0, default: 0, description: 'Minimum token creation time (milliseconds), only follow buy tokens created at or after this time' },
                    maxTokenAgeMs: { type: 'number', minimum: 0, default: 999999999999, description: 'Maximum token creation time (milliseconds), only follow buy tokens created at or before this time' },
                    maxTopHoldPercent: { type: 'number', minimum: 0, maximum: 1, default: 1, description: 'Maximum top 10 holders percentage (0-1), only follow buy tokens where the top 10 holders have less than this percentage (effective for Solana)' },
                    maxBuyTimesPerToken: { type: 'number', minimum: 1, default: 999, description: 'Maximum number of buys for a token in this task within 7 days. No more buys will occur if this number is exceeded.' },
                    maxBuyAmountPerToken: { type: 'number', minimum: 0, default: 999999, description: 'Maximum buy amount for a token in this task within 7 days (in SOL / ETH / BNB / TRX). No more buys will occur if this amount is exceeded.' },
                    buyExist: { type: 'boolean', default: false, description: 'Whether to continue following buys for tokens already held' },
                    buyOncePerWallet: { type: 'boolean', default: false, description: '"true" means buy only once, "false" means no limit on the number of buys (only for tokens bought via DBot)' },
                    concurrentNodes: { type: 'number', minimum: 1, maximum: 3, default: 2, description: 'Number of concurrent nodes (1-3)' },
                    retries: { type: 'number', minimum: 0, maximum: 10, default: 1, description: 'Number of retries after failure (0-10)' },
                  },
                  required: ['maxBuyAmountUI'],
                },
                sellSettings: {
                  type: 'object',
                  description: 'Sell-related settings',
                  properties: {
                    enabled: { type: 'boolean', default: true, description: 'Sell task enabled status' },
                    startHour: { type: 'number', minimum: 0, maximum: 23, default: 0, description: 'Enable time for follow buy or sell (UTC). Follow buys or sells will only execute after this time each day. Must be an integer between 0-23, e.g., 10 means 10:00 UTC.' },
                    endHour: { type: 'number', minimum: 0, maximum: 23, default: 23, description: 'Disable time for follow buy or sell (UTC). Follow buys or sells will only execute before this time each day. Must be an integer between 0-23, e.g., 10 means 10:00 UTC.' },
                    mode: {
                      type: 'string',
                      enum: ['mixed', 'only_copy', 'only_pnl'],
                      default: 'mixed',
                      description: 'Sell mode, "mixed" means both follow selling and take-profit/stop-loss are enabled, "only_copy" means only follow selling is enabled, "only_pnl" means only take-profit/stop-loss is enabled'
                    },
                    sellAmountType: {
                      type: 'string',
                      enum: ['all', 'follow_ratio', 'x_target_ratio'],
                      default: 'all',
                      description: 'Copy sell ratio, "all" for 100% sell, "follow_ratio" for sell by follow ratio, "x_target_ratio" for selling by multiplying smart money\'s sell ratio by a fixed multiplier'
                    },
                    xTargetRatio: { type: 'number', minimum: 0, maximum: 100, default: 1, description: 'Multiplier for smart money\'s sell ratio (0-100), e.g., if set to 0.5 and smart money sells 10%, you sell 10% * 0.5 = 5%; if set to 2, you sell 10% * 2 = 20%' },
                    sellSpeedType: {
                      type: 'string',
                      enum: ['fast', 'accurate'],
                      default: 'accurate',
                      description: 'Follow sell speed, invalid when mode is "only_pnl". Can be "fast" or "accurate". "fast" prioritizes speed but may cause inconsistent sell ratios with smart money. "accurate" prioritizes accuracy but may be slower.'
                    },
                    targetMinAmountUI: { type: 'number', minimum: 0, default: 0, description: 'When in buy settings, it means only follow buy when smart money buy amount is greater than this value; when in sell settings, it means only follow sell when smart money sell income is greater than this value' },
                    targetMaxAmountUI: { type: 'number', minimum: 0, default: 999999, description: 'When in buy settings, it means only follow buy when smart money buy amount is less than this value; when in sell settings, it means only follow sell when smart money sell income is less than this value' },
                    stopEarnPercent: { type: 'number', minimum: 0, description: 'Take-profit percentage (0.5 means 50%). Effective for "buy" type in quick buy/sell and in copy trading sell settings. Automatically sells when a token price increases by this percentage. "null" means take-profit is disabled.' },
                    stopLossPercent: { type: 'number', minimum: 0, description: 'Stop-loss percentage (0.5 means 50%). Effective for "buy" type in quick buy/sell and in copy trading sell settings. Automatically sells when a token price drops by this percentage. "null" means stop-loss is disabled.' },
                    stopEarnGroup: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          pricePercent: { type: 'number', minimum: 0, maximum: 1, description: 'Price change percentage (0.5 means 50%) or pullback ratio. In take-profit groups, it\'s the increase to sell at. In stop-loss groups, it\'s the decrease to sell at. In trailing stop-loss groups, it\'s the pullback ratio (cannot be >= 1).' },
                          amountPercent: { type: 'number', minimum: 0, maximum: 1, description: 'Sell ratio (0-1, 0.5 means 50%). E.g., for selling 50% at 100% gain and all at 200% gain, the sell ratios should be 0.5 and 1, not 0.5 and 0.5.' },
                        },
                        required: ['pricePercent', 'amountPercent'],
                      },
                      maxItems: 6,
                      description: 'Take-profit groups. Effective for "buy" type in quick buy/sell and in copy trading sell settings. Up to 6 groups supported. "null" means disabled. If both "stopEarnGroup" and "stopEarnPercent" are set, "stopEarnPercent" is ignored.'
                    },
                    stopLossGroup: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          pricePercent: { type: 'number', minimum: 0, maximum: 1, description: 'Price change percentage (0.5 means 50%) or pullback ratio. In take-profit groups, it\'s the increase to sell at. In stop-loss groups, it\'s the decrease to sell at. In trailing stop-loss groups, it\'s the pullback ratio (cannot be >= 1).' },
                          amountPercent: { type: 'number', minimum: 0, maximum: 1, description: 'Sell ratio (0-1, 0.5 means 50%). E.g., for selling 50% at 100% gain and all at 200% gain, the sell ratios should be 0.5 and 1, not 0.5 and 0.5.' },
                        },
                        required: ['pricePercent', 'amountPercent'],
                      },
                      maxItems: 6,
                      description: 'Stop-loss groups. Effective for "buy" type in quick buy/sell and in copy trading sell settings. Up to 6 groups supported. "null" means disabled. If both "stopLossGroup" and "stopLossPercent" are set, "stopLossPercent" is ignored.'
                    },
                    trailingStopGroup: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          pricePercent: { type: 'number', minimum: 0, maximum: 1, description: 'Price change percentage (0.5 means 50%) or pullback ratio. In take-profit groups, it\'s the increase to sell at. In stop-loss groups, it\'s the decrease to sell at. In trailing stop-loss groups, it\'s the pullback ratio (cannot be >= 1).' },
                          amountPercent: { type: 'number', minimum: 0, maximum: 1, description: 'Sell ratio (0-1, 0.5 means 50%). E.g., for selling 50% at 100% gain and all at 200% gain, the sell ratios should be 0.5 and 1, not 0.5 and 0.5.' },
                        },
                        required: ['pricePercent', 'amountPercent'],
                      },
                      maxItems: 1,
                      description: 'Trailing stop-loss group. Effective for "buy" type in quick buy/sell, and when copy trading sell mode is "mixed" or "only_pnl". Currently only 1 group is supported. "null" means trailing stop-loss is disabled.'
                    },
                    pnlOrderExpireDelta: { type: 'number', minimum: 0, maximum: 432000000, default: 43200000, description: 'Expiration time for take-profit/stop-loss tasks, max value is 432,000,000 (ms).' },
                    pnlOrderExpireExecute: { type: 'boolean', default: false, description: '"true" means that if the take-profit/stop-loss task is not triggered within its validity period, it will be executed automatically at the end of the task.' },
                    pnlOrderUseMidPrice: { type: 'boolean', default: false, description: '"true" enables anti-wick mode, using the median price within 1 second as the trigger price. It will try its best but cannot 100% guarantee avoiding wicks.' },
                    sellMode: { type: 'string', enum: ['smart', 'normal'], default: 'smart', description: 'Sell method, effective for EVM chains. When sell income is lower than gas cost, "smart" means no selling, "normal" means continue selling.' },
                    migrateSellPercent: { type: 'number', minimum: 0, maximum: 1, default: 0, description: 'Open sell percentage (0.00-1.00), effective for Pump tokens, 0 means no auto-sell.' },
                    minDevSellPercent: { type: 'number', minimum: 0, maximum: 1, default: 0.5, description: 'Trigger ratio (0-1). When Dev sells more than this ratio, your tokens will be sold.' },
                    devSellPercent: { type: 'number', minimum: 0, maximum: 1, default: 1, description: 'When the follow Dev sell task is triggered, this is the percentage of your tokens to sell. 0 means do not create a follow Dev sell task.' },
                    customFeeAndTip: { type: 'boolean', default: false, description: '"true" means both priorityFee and jitoTip fields are effective, the system will execute the transaction with the specified values (null means auto priority fee/auto bribe), "false" means only priorityFee is effective in high-speed mode, and only jitoTip is effective in anti-sandwich mode, the system will allocate automatically' },
                    priorityFee: { type: 'string', default: '', description: 'Priority fee (SOL), effective for Solana, an empty string means use auto priority fee' },
                    gasFeeDelta: { type: 'number', minimum: 0, default: 5, description: 'Additional gas (Gwei), effective for EVM chains' },
                    maxFeePerGas: { type: 'number', minimum: 0, default: 100, description: 'No transaction will be made if base gas exceeds this value (Gwei), effective for EVM chains' },
                    jitoEnabled: { type: 'boolean', default: true, description: '"true" enables anti-sandwich mode (Solana & Ethereum & Bsc)' },
                    jitoTip: { type: 'number', minimum: 0, default: 0.001, description: 'Bribe fee for anti-sandwich mode (Solana)' },
                    maxSlippage: { type: 'number', minimum: 0, maximum: 1, default: 0.1, description: 'Maximum slippage (0.00-1.00). For buying, it is the difference between the actual and expected price. For selling, it is the difference between the expected and actual price. The difference multiple = 1/(1-slippage). 0.5 means accepting up to a 2x price difference, 1 means no limit.' },
                    concurrentNodes: { type: 'number', minimum: 1, maximum: 3, default: 2, description: 'Number of concurrent nodes (1-3)' },
                    retries: { type: 'number', minimum: 0, maximum: 10, default: 1, description: 'Number of retries after failure (0-10)' },
                  },
                },
              },
              required: ['name', 'targetIds', 'buySettings', 'sellSettings'],
            },
          },
          {
            name: 'edit_copy_trading',
            description: `Edit a copy trading task. Note that you need to provide **the fields to be modified and the required fields, which include (id, enabled, name, chain, targetIds, buySettings, sellSettings)**. You don't need to re-enter all fields.
Request example:
{
  "id": "xxx",
  "enabled": true,
  "chain": "solana",
  "targetIds": [
    "xxxxx"
  ],
  "buySettings": {
    "enabled": true,
    "maxBuyAmountUI": "0.001"
  },
  "sellSettings": {
    "enabled": true,
    "mode": "mixed"
  }
}
            `,
            inputSchema: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  description: 'Copy trading task ID',
                },
                enabled: {
                  type: 'boolean',
                  description: 'Task enabled status, true/false',
                },
                name: {
                  type: 'string',
                  description: 'Name of the copy trading task',
                },
                chain: {
                  type: 'string',
                  enum: ['solana', 'ethereum', 'base', 'bsc', 'tron'],
                  description: 'Chain (solana/ethereum/base/bsc/tron)',
                },
                dexFilter: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'DEXs to follow, null means all, specifying names means only follow trades on those DEXs, including: raydium_amm,raydium_clmm,raydium_cpmm,raydium_launchpad,meteora_dlmm,meteora_dyn,meteora_dyn2,meteora_bc,pump,pump_swap,moonshot,orca_wp,uniswap_v2,uniswap_v3,pancake_v2,pancake_v3,sunswap_v2,sunpump,ether_vista,okx_v2,fourmeme,boop',
                },
                targetIds: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Wallet addresses to copy trade (up to 10)',
                  maxItems: 10,
                  minItems: 1,
                },
                tokenBlacklist: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Blacklisted token addresses for the current task (up to 20), buying and selling of these tokens will be skipped',
                  maxItems: 20,
                },
                walletId: {
                  type: 'string',
                  description: 'ID of the wallet to use, obtainable via "Wallet Info API"',
                },
                groupId: {
                  type: 'string',
                  description: 'Group ID',
                },
                buySettings: {
                  type: 'object',
                  description: 'Buy-related settings',
                  properties: {
                    enabled: { type: 'boolean', default: true, description: 'Buy task enabled status' },
                    startHour: { type: 'number', minimum: 0, maximum: 23, default: 0, description: 'Enable time for follow buy or sell (UTC). Follow buys or sells will only execute after this time each day. Must be an integer between 0-23, e.g., 10 means 10:00 UTC.' },
                    endHour: { type: 'number', minimum: 0, maximum: 23, default: 23, description: 'Disable time for follow buy or sell (UTC). Follow buys or sells will only execute before this time each day. Must be an integer between 0-23, e.g., 10 means 10:00 UTC.' },
                    buyAmountType: {
                      type: 'string',
                      enum: ['fixed_amount', 'fixed_ratio', 'follow_amount'],
                      default: 'follow_amount',
                      description: 'Copy buy type, "fixed_amount" for fixed amount, "fixed_ratio" for fixed ratio, "follow_amount" for follow amount'
                    },
                    maxBuyAmountUI: { type: 'string', description: 'Maximum buy amount for copy trading, minimum "0.001", "0.0001", "0.0001", "1"' },
                    buyRatio: { type: 'number', minimum: 0, maximum: 10, default: 1, description: 'Follow buy ratio (0-10), effective when buy type is fixed_ratio' },
                    maxBalanceUI: { type: 'number', minimum: 0, default: 100, description: 'Take-profit amount (ETH/SOL/BNB/TRX), no more copy buys when wallet balance exceeds this amount' },
                    reservedAmountUI: { type: 'number', minimum: 0, default: 0.01, description: 'Stop-loss amount (ETH/SOL/BNB/TRX), no more copy buys when wallet balance falls below this amount' },
                    targetMinAmountUI: { type: 'number', minimum: 0, default: 0, description: 'When in buy settings, it means only follow buy when smart money buy amount is greater than this value; when in sell settings, it means only follow sell when smart money sell income is greater than this value' },
                    targetMaxAmountUI: { type: 'number', minimum: 0, default: 999999, description: 'When in buy settings, it means only follow buy when smart money buy amount is less than this value; when in sell settings, it means only follow sell when smart money sell income is less than this value' },
                    minTokenMCUSD: { type: 'number', minimum: 0, default: 0, description: 'Minimum copy token market cap, only follow buy tokens with market cap higher than this value' },
                    maxTokenMCUSD: { type: 'number', minimum: 0, default: 999999999, description: 'Maximum copy token market cap, only follow buy tokens with market cap lower than this value' },
                    maxBuyTax: { type: 'number', minimum: 0, maximum: 1, description: 'Maximum token buy tax, effective for EVM chains, only follow buy tokens with tax rate lower than this value (data from GoPlus, may affect copy trading speed)' },
                    maxSellTax: { type: 'number', minimum: 0, maximum: 1, description: 'Maximum token sell tax, effective for EVM chains, only follow buy tokens with tax rate lower than this value (data from GoPlus, may affect copy trading speed)' },
                    customFeeAndTip: { type: 'boolean', default: false, description: '"true" means both priorityFee and jitoTip fields are effective, the system will execute the transaction with the specified values (null means auto priority fee/auto bribe), "false" means only priorityFee is effective in high-speed mode, and only jitoTip is effective in anti-sandwich mode, the system will allocate automatically' },
                    priorityFee: { type: 'string', default: '', description: 'Priority fee (SOL), effective for Solana, an empty string means use auto priority fee' },
                    gasFeeDelta: { type: 'number', minimum: 0, default: 5, description: 'Additional gas (Gwei), effective for EVM chains' },
                    maxFeePerGas: { type: 'number', minimum: 0, default: 100, description: 'No transaction will be made if base gas exceeds this value (Gwei), effective for EVM chains' },
                    jitoEnabled: { type: 'boolean', default: true, description: '"true" enables anti-sandwich mode (Solana & Ethereum & Bsc)' },
                    jitoTip: { type: 'number', minimum: 0, default: 0.001, description: 'Bribe fee for anti-sandwich mode (Solana)' },
                    maxSlippage: { type: 'number', minimum: 0, maximum: 1, default: 0.1, description: 'Maximum slippage (0.00-1.00). For buying, it is the difference between the actual and expected price. For selling, it is the difference between the expected and actual price. The difference multiple = 1/(1-slippage). 0.5 means accepting up to a 2x price difference, 1 means no limit.' },
                    skipFreezableToken: { type: 'boolean', default: false, description: '"true" means do not buy tokens with unrevoked freeze authority' },
                    skipMintableToken: { type: 'boolean', default: false, description: '"true" means do not buy tokens with unrevoked mint authority' },
                    skipDelegatedToken: { type: 'boolean', default: false, description: '"true" means do not buy delegated tokens' },
                    skipNotOpensource: { type: 'boolean', default: false, description: '"true" means do not buy tokens defined as not open-source by GoPlus, effective for EVM chains (enabling this may affect copy trading speed)' },
                    skipHoneyPot: { type: 'boolean', default: false, description: '"true" means do not buy tokens identified as honeypots by GoPlus, effective for EVM chains (enabling this may affect copy trading speed)' },
                    skipTargetIncreasePosition: { type: 'boolean', default: false, description: '"true" means do not buy tokens already held by the smart money address' },
                    minBurnedLp: { type: 'number', minimum: 0, maximum: 1, default: 0, description: 'Minimum LP burn ratio (0-1). Only follow buys for tokens with a liquidity burn ratio greater than or equal to this value. Supports Raydium (AMM) and Raydium (CPMM).' },
                    minLpUsd: { type: 'number', minimum: 0, default: 0, description: 'Minimum liquidity ($), only follow buy tokens with liquidity greater than or equal to this value' },
                    minTokenAgeMs: { type: 'number', minimum: 0, default: 0, description: 'Minimum token creation time (milliseconds), only follow buy tokens created at or after this time' },
                    maxTokenAgeMs: { type: 'number', minimum: 0, default: 999999999999, description: 'Maximum token creation time (milliseconds), only follow buy tokens created at or before this time' },
                    maxTopHoldPercent: { type: 'number', minimum: 0, maximum: 1, default: 1, description: 'Maximum top 10 holders percentage (0-1), only follow buy tokens where the top 10 holders have less than this percentage (effective for Solana)' },
                    maxBuyTimesPerToken: { type: 'number', minimum: 1, default: 999, description: 'Maximum number of buys for a token in this task within 7 days. No more buys will occur if this number is exceeded.' },
                    maxBuyAmountPerToken: { type: 'number', minimum: 0, default: 999999, description: 'Maximum buy amount for a token in this task within 7 days (in SOL / ETH / BNB / TRX). No more buys will occur if this amount is exceeded.' },
                    buyExist: { type: 'boolean', default: false, description: 'Whether to continue following buys for tokens already held' },
                    buyOncePerWallet: { type: 'boolean', default: false, description: '"true" means buy only once, "false" means no limit on the number of buys (only for tokens bought via DBot)' },
                    concurrentNodes: { type: 'number', minimum: 1, maximum: 3, default: 2, description: 'Number of concurrent nodes (1-3)' },
                    retries: { type: 'number', minimum: 0, maximum: 10, default: 1, description: 'Number of retries after failure (0-10)' },
                  },
                },
                sellSettings: {
                  type: 'object',
                  description: 'Sell-related settings',
                  properties: {
                    enabled: { type: 'boolean', default: true, description: 'Sell task enabled status' },
                    startHour: { type: 'number', minimum: 0, maximum: 23, default: 0, description: 'Enable time for follow buy or sell (UTC). Follow buys or sells will only execute after this time each day. Must be an integer between 0-23, e.g., 10 means 10:00 UTC.' },
                    endHour: { type: 'number', minimum: 0, maximum: 23, default: 23, description: 'Disable time for follow buy or sell (UTC). Follow buys or sells will only execute before this time each day. Must be an integer between 0-23, e.g., 10 means 10:00 UTC.' },
                    mode: {
                      type: 'string',
                      enum: ['mixed', 'only_copy', 'only_pnl'],
                      default: 'mixed',
                      description: 'Sell mode, "mixed" means both follow selling and take-profit/stop-loss are enabled, "only_copy" means only follow selling is enabled, "only_pnl" means only take-profit/stop-loss is enabled'
                    },
                    sellAmountType: {
                      type: 'string',
                      enum: ['all', 'follow_ratio', 'x_target_ratio'],
                      default: 'all',
                      description: 'Copy sell ratio, "all" for 100% sell, "follow_ratio" for sell by follow ratio, "x_target_ratio" for selling by multiplying smart money\'s sell ratio by a fixed multiplier'
                    },
                    xTargetRatio: { type: 'number', minimum: 0, maximum: 100, default: 1, description: 'Multiplier for smart money\'s sell ratio (0-100), e.g., if set to 0.5 and smart money sells 10%, you sell 10% * 0.5 = 5%; if set to 2, you sell 10% * 2 = 20%' },
                    sellSpeedType: {
                      type: 'string',
                      enum: ['fast', 'accurate'],
                      default: 'accurate',
                      description: 'Follow sell speed, invalid when mode is "only_pnl". Can be "fast" or "accurate". "fast" prioritizes speed but may cause inconsistent sell ratios with smart money. "accurate" prioritizes accuracy but may be slower.'
                    },
                    targetMinAmountUI: { type: 'number', minimum: 0, default: 0, description: 'When in buy settings, it means only follow buy when smart money buy amount is greater than this value; when in sell settings, it means only follow sell when smart money sell income is greater than this value' },
                    targetMaxAmountUI: { type: 'number', minimum: 0, default: 999999, description: 'When in buy settings, it means only follow buy when smart money buy amount is less than this value; when in sell settings, it means only follow sell when smart money sell income is less than this value' },
                    stopEarnPercent: { type: 'number', minimum: 0, description: 'Take-profit percentage (0.5 means 50%). Effective for "buy" type in quick buy/sell and in copy trading sell settings. Automatically sells when a token price increases by this percentage. "null" means take-profit is disabled.' },
                    stopLossPercent: { type: 'number', minimum: 0, description: 'Stop-loss percentage (0.5 means 50%). Effective for "buy" type in quick buy/sell and in copy trading sell settings. Automatically sells when a token price drops by this percentage. "null" means stop-loss is disabled.' },
                    stopEarnGroup: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          pricePercent: { type: 'number', minimum: 0, maximum: 1, description: 'Price change percentage (0.5 means 50%) or pullback ratio. In take-profit groups, it\'s the increase to sell at. In stop-loss groups, it\'s the decrease to sell at. In trailing stop-loss groups, it\'s the pullback ratio (cannot be >= 1).' },
                          amountPercent: { type: 'number', minimum: 0, maximum: 1, description: 'Sell ratio (0-1, 0.5 means 50%). E.g., for selling 50% at 100% gain and all at 200% gain, the sell ratios should be 0.5 and 1, not 0.5 and 0.5.' },
                        },
                        required: ['pricePercent', 'amountPercent'],
                      },
                      maxItems: 6,
                      description: 'Take-profit groups. Effective for "buy" type in quick buy/sell and in copy trading sell settings. Up to 6 groups supported. "null" means disabled. If both "stopEarnGroup" and "stopEarnPercent" are set, "stopEarnPercent" is ignored.'
                    },
                    stopLossGroup: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          pricePercent: { type: 'number', minimum: 0, maximum: 1, description: 'Price change percentage (0.5 means 50%) or pullback ratio. All values are positive. In take-profit groups, it\'s the increase to sell at. In stop-loss groups, it\'s the decrease to sell at. In trailing stop-loss groups, it\'s the pullback ratio (cannot be >= 1).' },
                          amountPercent: { type: 'number', minimum: 0, maximum: 1, description: 'Sell ratio (0-1, 0.5 means 50%). E.g., for selling 50% at 100% gain and all at 200% gain, the sell ratios should be 0.5 and 1, not 0.5 and 0.5.' },
                        },
                        required: ['pricePercent', 'amountPercent'],
                      },
                      maxItems: 6,
                      description: 'Stop-loss groups. Effective for "buy" type in quick buy/sell and in copy trading sell settings. Up to 6 groups supported. "null" means disabled. If both "stopLossGroup" and "stopLossPercent" are set, "stopLossPercent" is ignored.'
                    },
                    trailingStopGroup: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          pricePercent: { type: 'number', minimum: 0, maximum: 1, description: 'Price change percentage (0.5 means 50%) or pullback ratio. All values are positive. In take-profit groups, it\'s the increase to sell at. In stop-loss groups, it\'s the decrease to sell at. In trailing stop-loss groups, it\'s the pullback ratio (cannot be >= 1).' },
                          amountPercent: { type: 'number', minimum: 0, maximum: 1, description: 'Sell ratio (0-1, 0.5 means 50%). E.g., for selling 50% at 100% gain and all at 200% gain, the sell ratios should be 0.5 and 1, not 0.5 and 0.5.' },
                        },
                        required: ['pricePercent', 'amountPercent'],
                      },
                      maxItems: 1,
                      description: 'Trailing stop-loss group. Effective for "buy" type in quick buy/sell, and when copy trading sell mode is "mixed" or "only_pnl". Currently only 1 group is supported. "null" means trailing stop-loss is disabled.'
                    },
                    pnlOrderExpireDelta: { type: 'number', minimum: 0, maximum: 432000000, default: 43200000, description: 'Expiration time for take-profit/stop-loss tasks, max value is 432,000,000 (ms).' },
                    pnlOrderExpireExecute: { type: 'boolean', default: false, description: '"true" means that if the take-profit/stop-loss task is not triggered within its validity period, it will be executed automatically at the end of the task.' },
                    pnlOrderUseMidPrice: { type: 'boolean', default: false, description: '"true" enables anti-wick mode, using the median price within 1 second as the trigger price. It will try its best but cannot 100% guarantee avoiding wicks.' },
                    sellMode: { type: 'string', enum: ['smart', 'normal'], default: 'smart', description: 'Sell method, effective for EVM chains. When sell income is lower than gas cost, "smart" means no selling, "normal" means continue selling.' },
                    migrateSellPercent: { type: 'number', minimum: 0, maximum: 1, default: 0, description: 'Open sell percentage (0.00-1.00), effective for Pump tokens, 0 means no auto-sell.' },
                    minDevSellPercent: { type: 'number', minimum: 0, maximum: 1, default: 0.5, description: 'Trigger ratio (0-1). When Dev sells more than this ratio, your tokens will be sold.' },
                    devSellPercent: { type: 'number', minimum: 0, maximum: 1, default: 1, description: 'When the follow Dev sell task is triggered, this is the percentage of your tokens to sell. 0 means do not create a follow Dev sell task.' },
                    customFeeAndTip: { type: 'boolean', default: false, description: '"true" means both priorityFee and jitoTip fields are effective, the system will execute the transaction with the specified values (null means auto priority fee/auto bribe), "false" means only priorityFee is effective in high-speed mode, and only jitoTip is effective in anti-sandwich mode, the system will allocate automatically' },
                    priorityFee: { type: 'string', default: '', description: 'Priority fee (SOL), effective for Solana, an empty string means use auto priority fee' },
                    gasFeeDelta: { type: 'number', minimum: 0, default: 5, description: 'Additional gas (Gwei), effective for EVM chains' },
                    maxFeePerGas: { type: 'number', minimum: 0, default: 100, description: 'No transaction will be made if base gas exceeds this value (Gwei), effective for EVM chains' },
                    jitoEnabled: { type: 'boolean', default: true, description: '"true" enables anti-sandwich mode (Solana & Ethereum & Bsc)' },
                    jitoTip: { type: 'number', minimum: 0, default: 0.001, description: 'Bribe fee for anti-sandwich mode (Solana)' },
                    maxSlippage: { type: 'number', minimum: 0, maximum: 1, default: 0.1, description: 'Maximum slippage (0.00-1.00). For buying, it is the difference between the actual and expected price. For selling, it is the difference between the expected and actual price. The difference multiple = 1/(1-slippage). 0.5 means accepting up to a 2x price difference, 1 means no limit.' },
                    concurrentNodes: { type: 'number', minimum: 1, maximum: 3, default: 2, description: 'Number of concurrent nodes (1-3)' },
                    retries: { type: 'number', minimum: 0, maximum: 10, default: 1, description: 'Number of retries after failure (0-10)' },
                  },
                },
              },
              required: ['id', 'enabled', 'name', 'chain', 'targetIds', 'buySettings', 'sellSettings'],
            },
          },
          {
            name: 'switch_copy_trading',
            description: 'Enable/disable a copy trading task',
            inputSchema: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  description: 'Copy trading task ID',
                },
                enabled: {
                  type: 'boolean',
                  description: 'Task enabled status, true/false',
                },
                closePnlOrder: {
                  type: 'boolean',
                  description: 'Whether to also close all take-profit/stop-loss tasks created by the copy trading task. Defaults to false (not closed). Effective when "enabled" is false.',
                  default: false,
                },
              },
              required: ['id', 'enabled'],
            },
          },
          {
            name: 'delete_copy_trading',
            description: 'Delete a copy trading task',
            inputSchema: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  description: 'Copy trading task ID',
                },
                deletePnlOrder: {
                  type: 'boolean',
                  description: 'Whether to also delete all take-profit/stop-loss tasks created by this copy trading task',
                  default: false,
                },
              },
              required: ['id'],
            },
          },
          {
            name: 'get_copy_trading_tasks',
            description: 'Get the list of copy trading tasks',
            inputSchema: {
              type: 'object',
              properties: {
                page: {
                  type: 'number',
                  description: 'Page number',
                  default: 0,
                },
                size: {
                  type: 'number',
                  description: 'Number of items per page',
                  default: 20,
                  maximum: 100,
                },
              },
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'create_copy_trading':
            return await this.handleCreateCopyTrading(args);
          case 'edit_copy_trading':
            return await this.handleEditCopyTrading(args);
          case 'switch_copy_trading':
            return await this.handleSwitchCopyTrading(args);
          case 'delete_copy_trading':
            return await this.handleDeleteCopyTrading(args);
          case 'get_copy_trading_tasks':
            return await this.handleGetCopyTradingTasks(args);
          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Error executing tool ${name}:`, error);
        
        throw new McpError(
          ErrorCode.InternalError,
          `Error executing ${name}: ${errorMessage}`
        );
      }
    });
  }

  private async handleCreateCopyTrading(args: any) {
    try {
      // If walletId is not provided, use the environment variable
      if (!args.walletId) {
        args.walletId = process.env.DBOT_WALLET_ID;
        if (!args.walletId) {
          throw new Error('Wallet ID not provided: Please specify walletId in the parameters or set the DBOT_WALLET_ID environment variable');
        }
      }

      // Validate the request parameters
      const validatedRequest = CreateCopyTradingRequestSchema.parse(args);
      
      const response = await this.client.createCopyTrading(validatedRequest);
      
      if (response.err) {
        throw new Error(`API Error: ${JSON.stringify(response)}`);
      }

      return {
        content: [
          {
            type: 'text',
            text: `✅ Copy trading task created successfully!

📋 Task Information:
- Task ID: ${response.res.id}
- Task Name: ${args.name}
- Chain: ${args.chain || 'solana'}
- Target Addresses: ${args.targetIds.join(', ')}
- Status: ${args.enabled !== false ? 'Enabled' : 'Disabled'}
- Wallet ID: ${args.walletId}
${args.groupId ? `- Group ID: ${args.groupId}` : ''}

🛒 Buy Settings:
- Enabled: ${args.buySettings.enabled ? 'Yes' : 'No'}
- Max Buy Amount: ${args.buySettings.maxBuyAmountUI}
- Buy Amount Type: ${args.buySettings.buyAmountType || 'follow_amount'}

💰 Sell Settings:
- Enabled: ${args.sellSettings.enabled ? 'Yes' : 'No'}  
- Mode: ${args.sellSettings.mode || 'mixed'}`,
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Failed to create copy trading task: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async handleEditCopyTrading(args: any) {
    try {
      // If walletId is not provided, use the environment variable
      if (!args.walletId) {
        args.walletId = process.env.DBOT_WALLET_ID;
        if (!args.walletId) {
          throw new Error('Wallet ID not provided: Please specify walletId in the parameters or set the DBOT_WALLET_ID environment variable');
        }
      }

      const validatedRequest = EditCopyTradingRequestSchema.parse(args);
      
      const response = await this.client.editCopyTrading(validatedRequest);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }
        ]
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Failed to edit copy trading task: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async handleSwitchCopyTrading(args: any) {
    try {
      const validatedRequest = SwitchCopyTradingRequestSchema.parse(args);
      
      const response = await this.client.switchCopyTrading(validatedRequest);
      
      if (response.err) {
        throw new Error(`API Error: ${JSON.stringify(response)}`);
      }

      return {
        content: [
          {
            type: 'text',
            text: `✅ Copy trading task status switched successfully!

📋 Task Information:
- Task ID: ${args.id}
- New Status: ${args.enabled ? 'Enabled' : 'Disabled'}
${args.closePnlOrder ? '- Also closed all take-profit/stop-loss orders' : ''}`,
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Failed to switch copy trading task status: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async handleDeleteCopyTrading(args: any) {
    try {
      const validatedRequest = DeleteCopyTradingRequestSchema.parse(args);
      
      const response = await this.client.deleteCopyTrading(validatedRequest);
      
      if (response.err) {
        throw new Error(`API Error: ${JSON.stringify(response)}`);
      }

      return {
        content: [
          {
            type: 'text',
            text: `✅ Copy trading task deleted successfully!

📋 Deletion Information:
- Task ID: ${args.id}
${args.deletePnlOrder ? '- Also deleted all associated take-profit/stop-loss orders' : '- Kept associated take-profit/stop-loss orders'}`,
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Failed to delete copy trading task: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async handleGetCopyTradingTasks(args: any) {
    try {
      const page = args.page || 0;
      const size = Math.min(args.size || 20, 100);
      
      const response = await this.client.getCopyTradingTasks(page, size);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }
        ]
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Failed to get copy trading task list: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Copy Trading MCP server has started');
  }
}

async function main(): Promise<void> {
  const server = new CopyTradingMcpServer();
  await server.run();
}

// @ts-ignore
if (require.main === module) {
  main().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
} 
