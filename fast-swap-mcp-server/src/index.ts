#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { DbotClient } from './client.js';
import {
  CreateFastSwapRequestSchema,
  CreateFastSwapsRequestSchema,
  type CreateFastSwapRequest,
  type CreateFastSwapsRequest,
  type CreateLimitOrdersRequest,
  type EditLimitOrderRequest,
  type EnableLimitOrderRequest,
  type WalletQueryParams,
  type TokenSecurityQueryParams,
  getEnvDefault,
  getWalletIdByChain,
  validateWalletIdConfig,
} from './types.js';

class FastSwapMcpServer {
  private server: Server;
  private client: DbotClient;

  constructor() {
    this.server = new Server(
      {
        name: 'fast-swap-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Validate wallet ID configuration
    try {
      validateWalletIdConfig();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Wallet ID configuration error:', errorMessage);
      throw error;
    }

    this.client = new DbotClient();
    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  /**
   * Format API error message
   */
  private formatApiError(response: any, operation: string, request?: any): string {
    let errorText = `❌ ${operation} failed:\n\n`;
    
    // Show error status
    errorText += `🔍 Error Status: ${response.err ? 'Failed' : 'Unknown Error'}\n`;
    
    // Show response content
    if (response.res) {
      errorText += `📄 API Response: ${JSON.stringify(response.res, null, 2)}\n`;
    }
    
    // Show request parameters (exclude sensitive info)
    if (request) {
      const safeRequest = { ...request };
      if (safeRequest.walletId) {
        safeRequest.walletId = safeRequest.walletId.substring(0, 8) + '***';
      }
      errorText += `📋 Request Parameters: ${JSON.stringify(safeRequest, null, 2)}\n`;
    }
    
    // Show documentation link
    errorText += `\n📚 Documentation: ${response.docs || 'https://dbotx.com/docs'}`;
    
    return errorText;
  }

  /**
   * Format network error message
   */
  private formatNetworkError(error: any, operation: string, request?: any): string {
    let errorText = `❌ ${operation} failed:\n\n`;
    
    if (error.response) {
      // HTTP error response
      errorText += `🌐 HTTP Status: ${error.response.status} ${error.response.statusText}\n`;
      errorText += `📄 Error Response: ${JSON.stringify(error.response.data, null, 2)}\n`;
    } else if (error.request) {
      // Network request failed
      errorText += `🔌 Network Error: No response received, please check network connection\n`;
      errorText += `📡 Request Details: ${error.message}\n`;
    } else {
      // Other errors
      errorText += `⚠️ Unknown Error: ${error.message}\n`;
    }
    
    // Show request parameters (exclude sensitive info)
    if (request) {
      const safeRequest = { ...request };
      if (safeRequest.walletId) {
        safeRequest.walletId = safeRequest.walletId.substring(0, 8) + '***';
      }
      if (safeRequest.walletIdList) {
        safeRequest.walletIdList = safeRequest.walletIdList.map((id: string) => 
          id.substring(0, 8) + '***'
        );
      }
      errorText += `📋 Request Parameters: ${JSON.stringify(safeRequest, null, 2)}\n`;
    }
    
    errorText += `\n💡 Suggestions:\n`;
    errorText += `- Check if API key is correct\n`;
    errorText += `- Check if network connection is normal\n`;
    errorText += `- Check if parameter format is correct\n`;
    errorText += `- Check if wallet ID is valid\n`;
    
    return errorText;
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'create_fast_swap',
            description: 'Create fast buy/sell trading orders, supporting multi-chain trading (solana/ethereum/base/bsc/tron), supporting take profit and stop loss settings for both buy and sell',
            inputSchema: {
              type: 'object',
              properties: {
                chain: {
                  type: 'string',
                  enum: ['solana', 'ethereum', 'base', 'bsc', 'tron'],
                  description: 'Chain (solana/ethereum/base/bsc/tron), defaults to solana if not specified',
                  default: 'solana',
                },
                pair: {
                  type: 'string',
                  description: 'Token address or trading pair address to buy/sell',
                },
                walletId: {
                  type: 'string',
                  description: 'Wallet ID to use, This parameter is optional. You do not need to ask user to provide this parameter in most cases.',
                },
                type: {
                  type: 'string',
                  enum: ['buy', 'sell'],
                  description: 'Transaction type, value is buy or sell',
                },
                amountOrPercent: {
                  type: 'number',
                  description: 'For buy type, fill in buy amount (ETH/SOL/BNB/TRX), for sell type, fill in sell percentage (0.00-1.00), defaults to 0.001',
                  default: 0.001,
                },
                customFeeAndTip: {
                  type: 'boolean',
                  description: '"true" means both priority fee and tip are valid, system will execute transaction according to filled values, "false" means only priority fee is valid in high speed mode, only tip is valid in anti-sandwich mode. Defaults to false',
                  default: false,
                },
                priorityFee: {
                  type: 'string',
                  description: 'Priority fee (SOL), valid for Solana, empty string means using auto priority fee. Defaults to "0.0001"',
                  default: '0.0001',
                },
                gasFeeDelta: {
                  type: 'number',
                  description: 'Additional gas (Gwei), valid for EVM chains. Defaults to 5',
                  default: 5,
                },
                maxFeePerGas: {
                  type: 'number',
                  description: 'Will not trade if base gas exceeds this value (Gwei), valid for EVM chains. Defaults to 100',
                  default: 100,
                },
                jitoEnabled: {
                  type: 'boolean',
                  description: 'Whether to enable anti-sandwich mode (Solana & Ethereum & Bsc). Defaults to true',
                  default: true,
                },
                jitoTip: {
                  type: 'number',
                  description: 'Tip used in anti-sandwich mode (Solana). Defaults to 0.001',
                  default: 0.001,
                },
                maxSlippage: {
                  type: 'number',
                  description: 'Maximum slippage (0.00-1.00), for buy it means difference between actual transaction price and expected price, for sell it means difference between expected price and actual transaction price. Defaults to 0.1',
                  default: 0.1,
                },
                concurrentNodes: {
                  type: 'number',
                  description: 'Number of concurrent nodes (1-3). Defaults to 2',
                  default: 2,
                },
                retries: {
                  type: 'number',
                  description: 'Number of retries after failure (0-10). Defaults to 1',
                  default: 1,
                },
                migrateSellPercent: {
                  type: 'number',
                  description: 'Migration sell percentage (0.00-1.00). Defaults to 1.0',
                  default: 1.0,
                },
                minDevSellPercent: {
                  type: 'number',
                  description: 'Minimum developer sell percentage (0.00-1.00). Defaults to 0.5',
                  default: 0.5,
                },
                devSellPercent: {
                  type: 'number',
                  description: 'Developer sell percentage (0.00-1.00). Defaults to 1.0',
                  default: 1.0,
                },
                stopEarnPercent: {
                  type: 'number',
                  description: 'Take profit percentage (0.00 and above), optional',
                },
                stopLossPercent: {
                  type: 'number',
                  description: 'Stop loss percentage (0.00-1.00), optional',
                },
                stopEarnGroup: {
                  type: 'array',
                  description: 'Take profit group settings, maximum 6 groups, optional',
                  items: {
                    type: 'object',
                    properties: {
                      pricePercent: { type: 'number' },
                      amountPercent: { type: 'number' },
                    },
                  },
                  maxItems: 6,
                },
                stopLossGroup: {
                  type: 'array',
                  description: 'Stop loss group settings, maximum 6 groups, optional',
                  items: {
                    type: 'object',
                    properties: {
                      pricePercent: { type: 'number' },
                      amountPercent: { type: 'number' },
                    },
                  },
                  maxItems: 6,
                },
                trailingStopGroup: {
                  type: 'array',
                  description: 'Trailing stop settings, maximum 1 group, optional',
                  items: {
                    type: 'object',
                    properties: {
                      pricePercent: { type: 'number' },
                      amountPercent: { type: 'number' },
                    },
                  },
                  maxItems: 1,
                },
                pnlOrderExpireDelta: {
                  type: 'number',
                  description: 'Take profit/stop loss order valid duration (milliseconds), maximum value is 432000000. Defaults to 43200000',
                  default: 43200000,
                },
                pnlOrderExpireExecute: {
                  type: 'boolean',
                  description: 'Whether to execute when take profit/stop loss order expires. Defaults to false',
                  default: false,
                },
                pnlOrderUseMidPrice: {
                  type: 'boolean',
                  description: 'Whether take profit/stop loss order uses mid price. Defaults to false',
                  default: false,
                },
                pnlCustomConfigEnabled: {
                  type: 'boolean',
                  description: 'Whether to enable custom take profit/stop loss configuration. Defaults to true',
                  default: true,
                },
                pnlCustomConfig: {
                  type: 'object',
                  description: 'Custom take profit/stop loss configuration, optional',
                  properties: {
                    customFeeAndTip: { type: 'boolean', default: false },
                    priorityFee: { type: 'string', default: '0.0001' },
                    gasFeeDelta: { type: 'number', default: 5 },
                    maxFeePerGas: { type: 'number', default: 100 },
                    jitoEnabled: { type: 'boolean', default: true },
                    jitoTip: { type: 'number', default: 0.001 },
                    maxSlippage: { type: 'number', default: 0.1 },
                    concurrentNodes: { type: 'number', default: 2 },
                    retries: { type: 'number', default: 1 },
                  },
                },
              },
              required: ['pair', 'type'],
            },
          },
          {
            name: 'create_fast_swaps',
            description: 'Create fast buy/sell trading orders, supporting multi-chain trading (solana/ethereum/base/bsc/tron), supporting take profit and stop loss settings for both buy and sell, using multiple wallets to trade simultaneously',
            inputSchema: {
              type: 'object',
              properties: {
                chain: {
                  type: 'string',
                  enum: ['solana', 'ethereum', 'base', 'bsc', 'tron'],
                  description: 'Chain (solana/ethereum/base/bsc/tron), defaults to solana if not specified',
                  default: 'solana',
                },
                pair: {
                  type: 'string',
                  description: 'Token address or trading pair address to buy/sell',
                },
                walletIdList: {
                  type: 'array',
                  description: 'List of wallet IDs to use, maximum 5 wallets, can be obtained via "Wallet Info API" (optional, will use DBOT_WALLET_ID environment variable if not provided)',
                  items: { type: 'string' },
                  maxItems: 5,
                },
                type: {
                  type: 'string',
                  enum: ['buy', 'sell'],
                  description: 'Transaction type, value is buy or sell',
                },
                customFeeAndTip: {
                  type: 'boolean',
                  description: '"true" means both priority fee and tip are valid, system will execute transaction according to filled values, "false" means only priority fee is valid in high speed mode, only tip is valid in anti-sandwich mode. Defaults to false',
                  default: false,
                },
                priorityFee: {
                  type: 'string',
                  description: 'Priority fee (SOL), valid for Solana, empty string means using auto priority fee. Defaults to empty string',
                  default: '',
                },
                gasFeeDelta: {
                  type: 'number',
                  description: 'Additional gas (Gwei), valid for EVM chains. Defaults to 5',
                  default: 5,
                },
                maxFeePerGas: {
                  type: 'number',
                  description: 'Will not trade if base gas exceeds this value (Gwei), valid for EVM chains. Defaults to 100',
                  default: 100,
                },
                jitoEnabled: {
                  type: 'boolean',
                  description: 'Whether to enable anti-sandwich mode (Solana & Ethereum & Bsc). Defaults to false',
                  default: false,
                },
                jitoTip: {
                  type: 'number',
                  description: 'Tip used in anti-sandwich mode (Solana). Defaults to 0.001',
                  default: 0.001,
                },
                maxSlippage: {
                  type: 'number',
                  description: 'Maximum slippage (0.00-1.00), for buy it means difference between actual transaction price and expected price, for sell it means difference between expected price and actual transaction price. Defaults to 0.1',
                  default: 0.1,
                },
                concurrentNodes: {
                  type: 'number',
                  description: 'Number of concurrent nodes (1-3). Defaults to 2',
                  default: 2,
                },
                retries: {
                  type: 'number',
                  description: 'Number of retries after failure (0-10). Defaults to 1',
                  default: 1,
                },
                minAmount: {
                  type: 'number',
                  description: 'Minimum buy amount (ETH/SOL/BNB/TRX), optional',
                },
                maxAmount: {
                  type: 'number',
                  description: 'Maximum buy amount (ETH/SOL/BNB/TRX), optional',
                },
                sellPercent: {
                  type: 'number',
                  description: 'Sell percentage (0.00-1.00). Defaults to 1.0',
                  default: 1.0,
                },
                stopEarnPercent: {
                  type: 'number',
                  description: 'Take profit percentage (0.00 and above), optional',
                },
                stopLossPercent: {
                  type: 'number',
                  description: 'Stop loss percentage (0.00-1.00), optional',
                },
                stopEarnGroup: {
                  type: 'array',
                  description: 'Take profit group settings, maximum 6 groups, optional',
                  items: {
                    type: 'object',
                    properties: {
                      pricePercent: { type: 'number' },
                      amountPercent: { type: 'number' },
                    },
                  },
                  maxItems: 6,
                },
                stopLossGroup: {
                  type: 'array',
                  description: 'Stop loss group settings, maximum 6 groups, optional',
                  items: {
                    type: 'object',
                    properties: {
                      pricePercent: { type: 'number' },
                      amountPercent: { type: 'number' },
                    },
                  },
                  maxItems: 6,
                },
                trailingStopGroup: {
                  type: 'array',
                  description: 'Trailing stop settings, maximum 1 group, optional',
                  items: {
                    type: 'object',
                    properties: {
                      pricePercent: { type: 'number' },
                      amountPercent: { type: 'number' },
                    },
                  },
                  maxItems: 1,
                },
                pnlOrderExpireDelta: {
                  type: 'number',
                  description: 'Take profit/stop loss order valid duration (milliseconds), maximum value is 432000000. Defaults to 43200000',
                  default: 43200000,
                },
                pnlOrderExpireExecute: {
                  type: 'boolean',
                  description: 'Whether to execute when take profit/stop loss order expires. Defaults to false',
                  default: false,
                },
                pnlOrderUseMidPrice: {
                  type: 'boolean',
                  description: 'Whether take profit/stop loss order uses mid price. Defaults to false',
                  default: false,
                },
                pnlCustomConfigEnabled: {
                  type: 'boolean',
                  description: 'Whether to enable custom take profit/stop loss configuration. Defaults to true',
                  default: true,
                },
                pnlCustomConfig: {
                  type: 'object',
                  description: 'Custom take profit/stop loss configuration, optional',
                  properties: {
                    customFeeAndTip: { type: 'boolean', default: false },
                    priorityFee: { type: 'string', default: '0.0001' },
                    gasFeeDelta: { type: 'number', default: 5 },
                    maxFeePerGas: { type: 'number', default: 100 },
                    jitoEnabled: { type: 'boolean', default: true },
                    jitoTip: { type: 'number', default: 0.001 },
                    maxSlippage: { type: 'number', default: 0.1 },
                    concurrentNodes: { type: 'number', default: 2 },
                    retries: { type: 'number', default: 1 },
                  },
                },
              },
              required: ['pair', 'walletIdList', 'type'],
            },
          },
          {
            name: 'get_swap_order_info',
            description: 'Query fast buy/sell order information',
            inputSchema: {
              type: 'object',
              properties: {
                ids: {
                  type: 'string',
                  description: 'List of order IDs, multiple IDs separated by commas',
                },
              },
              required: ['ids'],
            },
          },
          {
            name: 'get_swap_records',
            description: 'Get all fast buy/sell records for the user',
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
                  description: 'Items per page (maximum 20)',
                  default: 10,
                  maximum: 20,
                },
                chain: {
                  type: 'string',
                  enum: ['solana', 'ethereum', 'base', 'bsc', 'tron', ''],
                  description: 'Chain name (defaults to empty, query all chains)',
                  default: '',
                },
              },
            },
          },
          {
            name: 'swap_tpsl_tasks',
            description: 'Get all take profit/stop loss tasks created by fast buy/sell. Note: All parameters are optional, you can query the first 20 tasks without any parameters',
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
                  description: 'Items per page (maximum 20)',
                  default: 10,
                  maximum: 20,
                },
                chain: {
                  type: 'string',
                  enum: ['solana', 'ethereum', 'base', 'bsc', 'tron'],
                  description: 'Chain name (defaults to empty, query all chains)',
                },
                state: {
                  type: 'string',
                  enum: ['init', 'processing', 'done', 'fail', 'expired'],
                  description: 'Task status (defaults to init)',
                },
                sourceId: {
                  type: 'string',
                  description: 'Fast buy/sell record ID',
                },
                token: {
                  type: 'string',
                  description: 'Token address',
                },
                sortBy: {
                  type: 'string',
                  description: 'Sort field',
                },
                sort: {
                  type: 'number',
                  description: 'Sort direction: 1 for ascending, -1 for descending (defaults to -1)',
                },
              },
            },
          },
          {
            name: 'edit_fastswap_tpsl_order',
            description: 'Edit take profit/stop loss orders created by fast buy/sell, can modify trigger price, transaction amount, slippage and other parameters. Only generate parameters that user wants to modify and required parameters, do not pass parameters that are not specified or null.',
            inputSchema: {
              type: 'object',
              properties: {
                id: { 
                  type: 'string',
                  description: 'Limit order ID'
                },
                enabled: { 
                  type: 'boolean',
                  description: 'Task enabled status, true means enabled, false means disabled'
                },
                groupId: { 
                  type: 'string',
                  description: 'Group ID, used for order group management'
                },
                triggerPriceUsd: { 
                  type: 'string',
                  description: 'Price to trigger buy/sell (USD)'
                },
                triggerDirection: { 
                  type: 'string', 
                  enum: ['up', 'down'],
                  description: '"down" means execute buy/sell when price is below trigger price, "up" means execute buy/sell when price is above trigger price'
                },
                currencyAmountUI: { 
                  type: 'number',
                  description: 'For buy type, fill in buy amount (ETH/SOL/BNB/TRX), for sell type, fill in sell percentage (0.00-1.00)'
                },
                customFeeAndTip: { 
                  type: 'boolean',
                  description: '"true" means both priority fee and tip are valid, system will execute transaction according to filled values (null means auto priority fee/auto tip), "false" means only priority fee is valid in high speed mode, only tip is valid in anti-sandwich mode'
                },
                priorityFee: { 
                  type: 'string',
                  description: 'Priority fee (SOL), valid for Solana, empty string means using auto priority fee'
                },
                gasFeeDelta: { 
                  type: 'number',
                  description: 'Additional gas (Gwei), valid for EVM chains'
                },
                maxFeePerGas: { 
                  type: 'number',
                  description: 'Will not trade if base gas exceeds this value (Gwei), valid for EVM chains'
                },
                jitoEnabled: { 
                  type: 'boolean',
                  description: '"true" means enable anti-sandwich mode (Solana & Ethereum & Bsc)'
                },
                jitoTip: { 
                  type: 'number',
                  description: 'Tip used in anti-sandwich mode (Solana)'
                },
                expireDelta: { 
                  type: 'number',
                  description: 'Task valid duration, maximum value is 432000000 (milliseconds)'
                },
                expireExecute: { 
                  type: 'boolean',
                  description: '"true" means if task has not triggered when expired, will buy or sell token at real-time price'
                },
                useMidPrice: { 
                  type: 'boolean',
                  description: '"true" means enable anti-spike mode, will use mid price within 1 second as trigger price, will try best but cannot 100% guarantee to avoid spikes'
                },
                maxSlippage: { 
                  type: 'number',
                  description: 'Maximum slippage (0.00-1.00), for buy it means difference between actual transaction price and expected price, for sell it means difference between expected price and actual transaction price, ratio=1/(1-slippage), 0.5 means accept up to 2x price difference, 1 means no price difference limit'
                },
                concurrentNodes: { 
                  type: 'number',
                  description: 'Number of concurrent nodes (1-3)'
                },
                retries: { 
                  type: 'number',
                  description: 'Number of retries after failure (0-10)'
                }
              },
              required: ['id'],
            },
          },
          {
            name: 'enable_fastswap_tpsl_order',
            description: 'Enable/disable take profit/stop loss orders created by fast buy/sell',
            inputSchema: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                enabled: { type: 'boolean' },
              },
              required: ['id', 'enabled'],
            },
          },
          {
            name: 'delete_fastswap_tpsl_order',
            description: 'Delete take profit/stop loss orders created by fast buy/sell',
            inputSchema: {
              type: 'object',
              properties: {
                id: { type: 'string' },
              },
              required: ['id'],
            },
          },
          {
            name: 'get_user_wallets',
            description: 'Query user\'s wallets for a specific chain type. If no type is specified, it will query all types (solana and evm). The tool returns formatted data in English, but you should present the results to the user in their preferred language. Please print details.',
            inputSchema: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: ['solana', 'evm'],
                  description: 'Chain type to query (solana/evm). If not specified, queries all types.',
                },
                page: {
                  type: 'number',
                  description: 'Page number',
                  default: 0,
                },
                size: {
                  type: 'number',
                  description: 'Number of results per page',
                  default: 20,
                },
              },
            },
          },
          {
            name: 'get_token_security_info',
            description: 'Get token security information and pool safety details. **Important: Please call this tool before making any trading transactions to check token security factors. If unsafe factors are detected, warn the user instead of proceeding with other trading tools.** The tool returns formatted data in English, but you should present the results to the user in their preferred language. Please print details. (For numbers with many decimal places, they will be simplified (e.g. $0.0₅132 instead of $0.0₅132391, 841.01 SOL instead of 841.012585 SOL).)',
            inputSchema: {
              type: 'object',
              properties: {
                chain: {
                  type: 'string',
                  description: 'Chain name',
                  default: 'solana',
                },
                pair: {
                  type: 'string',
                  description: 'Token address or trading pair address (required)',
                },
              },
              required: ['pair'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      switch (name) {
        case 'create_fast_swap':
          return this.handleCreateFastSwap(args);
        case 'create_fast_swaps':
          return this.handleCreateFastSwaps(args);
        case 'get_swap_order_info':
          return this.handleGetSwapOrderInfo(args);
        case 'get_swap_records':
          return this.handleGetSwapRecords(args);
        case 'swap_tpsl_tasks':
          return this.handleSwapTpslTasks(args);
        case 'edit_fastswap_tpsl_order':
          return this.handleEditLimitOrder(args);
        case 'enable_fastswap_tpsl_order':
          return this.handleEnableLimitOrder(args);
        case 'delete_fastswap_tpsl_order':
          return this.handleDeleteLimitOrder(args);
        case 'get_user_wallets':
          return this.handleGetUserWallets(args);
        case 'get_token_security_info':
          return this.handleGetTokenSecurityInfo(args);
        default:
          throw new McpError(ErrorCode.MethodNotFound, `Tool ${name} not found`);
      }
    });
  }

  private async handleCreateFastSwap(args: any) {
    try {
      // Get wallet ID from environment variable using new logic
      if (!args.walletId) {
        try {
          args.walletId = getWalletIdByChain(args.chain || 'solana');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          throw new McpError(
            ErrorCode.InternalError,
            errorMessage
          );
        }
      }

      const request = CreateFastSwapRequestSchema.parse(args);
      const response = await this.client.createFastSwap(request);
      
      if (response.err) {
        return {
          content: [
            {
              type: 'text',
              text: this.formatApiError(response, 'Create fast trade order', request),
            },
          ],
        };
      }

      const orderId = response.res?.id || 'Unknown';
      return {
        content: [
          {
            type: 'text',
            text: `✅ Trade order created successfully!\n\nOrder ID: ${orderId}\nChain: ${request.chain}\nTransaction Type: ${request.type}\nToken: ${request.pair}\n\n⚠️ Note: Please immediately use get_swap_order_info tool with order ID to check order status and transaction result.\n\nDocumentation: ${response.docs}`,
          },
        ],
      };
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }
      
      // Check if it's a network error
      if (error && typeof error === 'object' && ('response' in error || 'request' in error)) {
        return {
          content: [
            {
              type: 'text',
              text: this.formatNetworkError(error, 'Create fast trade order', args),
            },
          ],
        };
      }
      
      throw new McpError(
        ErrorCode.InternalError,
        `Parameter validation failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async handleCreateFastSwaps(args: any) {
    try {
      // Check wallet ID list using new logic
      if (!args.walletIdList || args.walletIdList.length === 0) {
        try {
          const walletId = getWalletIdByChain(args.chain || 'solana');
          args.walletIdList = [walletId];
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          throw new McpError(
            ErrorCode.InternalError,
            errorMessage
          );
        }
      }

      const request = CreateFastSwapsRequestSchema.parse(args);
      const response = await this.client.createFastSwaps(request);
      
      if (response.err) {
        return {
          content: [
            {
              type: 'text',
              text: this.formatApiError(response, 'Create batch fast trade orders', request),
            },
          ],
        };
      }

      const orderIds = response.res.map(r => r.id || 'Unknown').join(', ');
      return {
        content: [
          {
            type: 'text',
            text: `✅ Batch trade orders created successfully!\n\nOrder ID List: ${orderIds}\nChain: ${request.chain}\nTrade Type: ${request.type}\nToken: ${request.pair}\n\n⚠️ Note: Please use get_swap_order_info tool with order IDs immediately to check order status and transaction results.\n\nDocs: ${response.docs}`,
          },
        ],
      };
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }
      
      // Check if it's a network error
      if (error && typeof error === 'object' && ('response' in error || 'request' in error)) {
        return {
          content: [
            {
              type: 'text',
              text: this.formatNetworkError(error, 'Create batch fast trade orders', args),
            },
          ],
        };
      }
      
      throw new McpError(
        ErrorCode.InternalError,
        `Parameter validation failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async handleGetSwapOrderInfo(args: any) {
    const { ids } = args;
    if (!ids || typeof ids !== 'string') {
      throw new McpError(ErrorCode.InvalidParams, 'ids parameter must be a string');
    }

    try {
      const orderIds = ids.split(',').map((id: string) => id.trim()).filter(Boolean);
      const response = await this.client.getSwapOrderInfo(orderIds);
      
      if (response.err) {
        return {
          content: [
            {
              type: 'text',
              text: this.formatApiError(response, 'Query order information', { ids: orderIds }),
            },
          ],
        };
      }

      const orders = response.res || [];
      let result = `📊 Order Information Query Results (${orders.length} orders in total):\n\n`;
      
      orders.forEach((order, index) => {
        result += `${index + 1}. Order ID: ${order.id}\n`;
        result += `   Status: ${order.state}\n`;
        result += `   Chain: ${order.chain}\n`;
        result += `   Type: ${order.tradeType}\n`;
        if (order.txPriceUsd) {
          result += `   Price: $${order.txPriceUsd}\n`;
        }
        if (order.swapHash) {
          result += `   Transaction Hash: ${order.swapHash}\n`;
        }
        if (order.errorCode || order.errorMessage) {
          result += `   Error: ${order.errorCode} - ${order.errorMessage}\n`;
        }
        result += '\n';
      });

      result += `\nDocs: ${response.docs}`;

      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: this.formatNetworkError(error, 'Query order information', args),
          },
        ],
      };
    }
  }

  private async handleGetSwapRecords(args: any) {
    try {
      const params = {
        page: args.page ?? 0,
        size: args.size ?? 10,
        chain: args.chain ?? '',
      };
      const response = await this.client.getSwapRecords(params);

      if (response.err) {
        return {
          content: [
            {
              type: 'text',
              text: this.formatApiError(response, 'Query fast buy/sell records', params),
            },
          ],
        };
      }

      const records = response.res || [];
      let result = `📜 Fast Buy/Sell Records (${records.length} records in total):\n\n`;

      if (records.length === 0) {
        result += 'No records found.\n';
      } else {
        records.forEach((record, index) => {
          result += `[${index + 1}] ${new Date(record.createAt).toLocaleString()}\n`;
          result += `  Order ID: ${record.id}\n`;
          result += `  Status: ${record.state} | Chain: ${record.chain} | Type: ${record.type}\n`;
          result += `  Trading Pair: ${record.pair}\n`;
          if (record.send?.info && record.receive?.info) {
            const sendToken = record.send.info.symbol;
            const receiveToken = record.receive.info.symbol;
            const sendAmount = record.send.amount / Math.pow(10, record.send.info.decimals);
            const receiveAmount = record.receive.amount / Math.pow(10, record.receive.info.decimals);
            result += `  Trade: ${sendAmount.toFixed(2)} ${sendToken} -> ${receiveAmount.toFixed(2)} ${receiveToken}\n`;
          }
          if (record.errorMessage) {
            result += `  Error: ${record.errorMessage}\n`;
          }
          result += '\n';
        });
      }

      result += `\nDocs: ${response.docs}`;

      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: this.formatNetworkError(error, 'Query fast buy/sell records', args),
          },
        ],
      };
    }
  }

  private async handleSwapTpslTasks(args: any) {
    try {
      // Set default parameters
      const params = {
        page: args.page ?? 0,
        size: args.size ?? 20,
        chain: args.chain ?? '',
        state: args.state ?? 'init',
        sourceId: args.sourceId ?? '',
        token: args.token ?? '',
        sortBy: args.sortBy ?? '',
        sort: args.sort ?? -1,
      };
      
      const response = await this.client.getSwapTpslTasks(params);
      
      if (response.err) {
        return {
          content: [
            {
              type: 'text',
              text: this.formatApiError(response, 'Query take profit/stop loss tasks', params),
            },
          ],
        };
      }

      // API returns task array directly, not a paginated object
      const tasks = Array.isArray(response.res) ? response.res : [];
      const totalElements = tasks.length;
      
      let result = `📈 Take Profit/Stop Loss Task List (${totalElements} tasks in total, showing ${tasks.length}):\n\n`;
      
      tasks.forEach((task, index) => {
        result += `${index + 1}. Task ID: ${task.id}\n`;
        result += `   Status: ${task.state} ${task.enabled ? '(Enabled)' : '(Disabled)'}\n`;
        result += `   Chain: ${task.chain}\n`;
        result += `   Token: ${task.pair}\n`;
        result += `   Trade Type: ${task.tradeType}\n`;
        result += `   Trigger Direction: ${task.triggerDirection === 'up' ? 'When price rises' : 'When price falls'}\n`;
        result += `   Trigger Price: $${task.triggerPriceUsd}\n`;
        result += `   Take Profit/Stop Loss Percentage: ${(task.triggerPercent * 100).toFixed(2)}%\n`;
        if (task.basePriceUsd) {
          result += `   Buy Price: $${task.basePriceUsd}\n`;
        }
        if (task.txPriceUsd) {
          result += `   Transaction Price: $${task.txPriceUsd}\n`;
        }
        if (task.walletName) {
          result += `   Wallet: ${task.walletName}\n`;
        }
        result += `   Source: ${task.source === 'swap_order' ? 'Fast Buy/Sell' : 'Copy Trade'}\n`;
        if (task.errorCode || task.errorMessage) {
          result += `   Error: ${task.errorCode} - ${task.errorMessage}\n`;
        }
        result += '\n';
      });

      if (tasks.length === 0) {
        result += 'No take profit/stop loss tasks\n\n';
      }

      result += `\nDocs: ${response.docs}`;

      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } catch (error) {
      console.error('Error querying take profit/stop loss tasks:', error);
      return {
        content: [
          {
            type: 'text',
            text: this.formatNetworkError(error, 'Query take profit/stop loss tasks', args),
          },
        ],
      };
    }
  }

  private async handleEditLimitOrder(args: any) {
    try {
      const response = await this.client.editLimitOrder(args as EditLimitOrderRequest);
      if (response.err) {
        return {
          content: [
            {
              type: 'text',
              text: this.formatApiError(response, 'Edit take profit/stop loss order', args),
            },
          ],
        };
      }
      return {
        content: [
          {
            type: 'text',
            text: `✅ Successfully edited take profit/stop loss order: ${JSON.stringify(response.res, null, 2)}\n\nPlease print result status.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: this.formatNetworkError(error, 'Edit take profit/stop loss order', args),
          },
        ],
      };
    }
  }

  private async handleEnableLimitOrder(args: any) {
    try {
      const response = await this.client.enableLimitOrder(args as EnableLimitOrderRequest);
      if (response.err) {
        return {
          content: [
            {
              type: 'text',
              text: this.formatApiError(response, 'Enable/Disable take profit/stop loss order', args),
            },
          ],
        };
      }
      return {
        content: [
          {
            type: 'text',
            text: `✅ Successfully enabled/disabled take profit/stop loss order: ${JSON.stringify(response.res, null, 2)}\n\nPlease print result status.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: this.formatNetworkError(error, 'Enable/Disable take profit/stop loss order', args),
          },
        ],
      };
    }
  }

  private async handleDeleteLimitOrder(args: any) {
    try {
      const response = await this.client.deleteLimitOrder(args.id);
      if (response.err) {
        return {
          content: [
            {
              type: 'text',
              text: this.formatApiError(response, 'Delete take profit/stop loss order', args),
            },
          ],
        };
      }
      return {
        content: [
          {
            type: 'text',
            text: `✅ Successfully deleted take profit/stop loss order: ${JSON.stringify(response.res, null, 2)}\n\nPlease print result status.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: this.formatNetworkError(error, 'Delete take profit/stop loss order', args),
          },
        ],
      };
    }
  }

  private async handleGetUserWallets(args: any) {
    try {
      const page = args.page || 0;
      const size = args.size || 20;
      
      // If no type specified, query all types
      if (!args.type) {
        const [solanaResponse, evmResponse] = await Promise.all([
          this.client.getWallets({ type: 'solana', page, size }),
          this.client.getWallets({ type: 'evm', page, size }),
        ]);
        
        // Check for errors in either response
        if (solanaResponse.err && evmResponse.err) {
          return {
            content: [
              {
                type: 'text',
                text: this.formatApiError(solanaResponse, 'Query user wallets', { type: 'all', page, size }),
              },
            ],
          };
        }
        
        // Combine results
        const solanaWallets = solanaResponse.err ? [] : (solanaResponse.res || []);
        const evmWallets = evmResponse.err ? [] : (evmResponse.res || []);
        const allWallets = [...solanaWallets, ...evmWallets];
        
        let result = `💳 User Wallets Query Results (${allWallets.length} wallets total):\n\n`;
        
        if (allWallets.length === 0) {
          result += 'No wallets found\n';
        } else {
          // Group by type for better organization
          const solanaCount = solanaWallets.length;
          const evmCount = evmWallets.length;
          
          if (solanaCount > 0) {
            result += `🔶 Solana Wallets (${solanaCount}):\n`;
            solanaWallets.forEach((wallet, index) => {
              result += `${index + 1}. Wallet ID: ${wallet.id}\n`;
              result += `   Name: ${wallet.name}\n`;
              result += `   Type: ${wallet.type}\n`;
              result += `   Address: ${wallet.address}\n\n`;
            });
          }
          
          if (evmCount > 0) {
            result += `🔷 EVM Wallets (${evmCount}):\n`;
            evmWallets.forEach((wallet, index) => {
              result += `${index + 1}. Wallet ID: ${wallet.id}\n`;
              result += `   Name: ${wallet.name}\n`;
              result += `   Type: ${wallet.type}\n`;
              result += `   Address: ${wallet.address}\n\n`;
            });
          }
        }
        
        result += `\n📚 Documentation: ${solanaResponse.docs || evmResponse.docs}`;
        
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }
      
      // If type is specified, query only that type
      const params: WalletQueryParams = {
        type: args.type,
        page,
        size,
      };
      
      const response = await this.client.getWallets(params);
      
      if (response.err) {
        return {
          content: [
            {
              type: 'text',
              text: this.formatApiError(response, 'Query user wallets', params),
            },
          ],
        };
      }

      const wallets = response.res || [];
      let result = `💳 User Wallets Query Results (${wallets.length} ${args.type} wallets):\n\n`;
      
      if (wallets.length === 0) {
        result += 'No wallets found\n';
      } else {
        wallets.forEach((wallet, index) => {
          result += `${index + 1}. Wallet ID: ${wallet.id}\n`;
          result += `   Name: ${wallet.name}\n`;
          result += `   Type: ${wallet.type}\n`;
          result += `   Address: ${wallet.address}\n\n`;
        });
      }

      result += `\n📚 Documentation: ${response.docs}`;

      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: this.formatNetworkError(error, 'Query user wallets', args),
          },
        ],
      };
    }
  }

  private async handleGetTokenSecurityInfo(args: any) {
    try {
      const params: TokenSecurityQueryParams = {
        chain: args.chain || 'solana',
        pair: args.pair,
      };
      
      const response = await this.client.getTokenSecurityInfo(params);
      
      if (response.err) {
        return {
          content: [
            {
              type: 'text',
              text: this.formatApiError(response, 'Query token security info', params),
            },
          ],
        };
      }

      const tokenInfo = response.res;
      if (!tokenInfo) {
        return {
          content: [
            {
              type: 'text',
              text: '❌ Token information not found',
            },
          ],
        };
      }

      // Format the response according to the user's requirements
      const formatPrice = (price: number): string => {
        if (price >= 1) {
          return `$${price.toFixed(2)}`;
        } else if (price >= 0.0001) {
          return `$${price.toFixed(4)}`;
        } else {
          const str = price.toFixed(20);
          const match = str.match(/^0\.0*(\d+)/);
          if (match) {
            const leadingZeros = str.indexOf(match[1]) - 2;
            const subscriptNumbers = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];
            const subscript = leadingZeros.toString().split('').map(digit => subscriptNumbers[parseInt(digit)] || digit).join('');
            // Limit to first 4 non-zero digits
            const significantDigits = match[1].substring(0, 4);
            return `$0.0${subscript}${significantDigits}`;
          }
          return `$${price.toExponential(2)}`;
        }
      };

      const formatMarketCap = (mcap: number): string => {
        if (mcap >= 1000000000) {
          return `$${(mcap / 1000000000).toFixed(2)}B`;
        } else if (mcap >= 1000000) {
          return `$${(mcap / 1000000).toFixed(2)}M`;
        } else if (mcap >= 1000) {
          return `$${(mcap / 1000).toFixed(2)}K`;
        } else {
          return `$${mcap.toFixed(2)}`;
        }
      };

      const formatTimeAgo = (timestamp: number): string => {
        const now = Date.now();
        const diff = now - timestamp;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        let result = '';
        if (days > 0) {
          result += `${days}d `;
        }
        if (hours > 0) {
          result += `${hours}h `;
        }
        if (minutes > 0 || result === '') {
          result += `${minutes}m`;
        }
        
        return result.trim();
      };

      const tokenCreateTime = formatTimeAgo(tokenInfo.tokenCreateAt);
      const poolCreateTime = formatTimeAgo(tokenInfo.poolCreateAt);

      let result = `📌 ${tokenInfo.tokenInfo.symbol}\n`;
      result += `${tokenInfo.tokenInfo.contract}\n\n`;
      
      result += `⚖️ Trading\n`;
      result += `┣ Price: ${formatPrice(tokenInfo.tokenPriceUsd)}\n`;
      result += `┣ Market Cap: ${formatMarketCap(tokenInfo.tokenMcUsd)}\n`;
      result += `┣ Token Created: ${tokenCreateTime}\n`;
      result += `┣ Pool Created: ${poolCreateTime}\n`;
      result += `┣ DEX: ${tokenInfo.exchange}\n`;
      result += `┣ Pair: ${tokenInfo.tokenInfo.symbol}/${tokenInfo.currencyInfo.symbol}\n`;
      result += `┗ ${tokenInfo.currencyInfo.symbol} in Pool: ${parseFloat(tokenInfo.poolSafetyInfo.currencyReserveUI || tokenInfo.currencyReserve).toFixed(2)} ${tokenInfo.currencyInfo.symbol}\n\n`;

      result += `🔎 Security\n`;
      const safety = tokenInfo.poolSafetyInfo;
      result += `┣ ${safety.canMint ? '❌ Mint Authority Not Revoked' : '✅ Mint Authority Revoked'} ${safety.canFrozen ? '❌ Freeze Authority Not Revoked' : '✅ Freeze Authority Revoked'}\n`;
      result += `┗ ${safety.top10Percent < 0.3 ? '✅' : '❌'} Top 10 Holders (${(safety.top10Percent * 100).toFixed(2)}%)\n\n`;

      result += `🔗 Links\n`;
      const links = [];
      if (tokenInfo.links?.website) {
        links.push(`[Website](${tokenInfo.links.website})`);
      }
      if (tokenInfo.links?.twitter) {
        links.push(`[Twitter](${tokenInfo.links.twitter})`);
      }
      if (tokenInfo.links?.telegram) {
        links.push(`[Telegram](${tokenInfo.links.telegram})`);
      }
      
      // Add default links for Solana
      if (params.chain === 'solana') {
        links.push(`[Birdeye](https://birdeye.so/token/${tokenInfo.tokenInfo.contract})`);
        links.push(`[Jupiter](https://jup.ag/swap/SOL-${tokenInfo.tokenInfo.contract})`);
      }
      
      result += `┗ ${links.join(' | ')}\n`;

      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: this.formatNetworkError(error, 'Query token security info', args),
          },
        ],
      };
    }
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    // This line won't execute because the connection will be maintained
    console.error('Fast Buy/Sell MCP Server Started');
  }
}

async function main(): Promise<void> {
  const server = new FastSwapMcpServer();
  await server.run();
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error in main():', error);
    process.exit(1);
  });
} 