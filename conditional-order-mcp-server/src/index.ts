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
  CreateMigrateOrderRequestSchema,
  CreateDevOrderRequestSchema,
  UpdateMigrateOrderRequestSchema,
  UpdateDevOrderRequestSchema,
  ToggleOrderRequestSchema,
  GetOrdersRequestSchema,
  type CreateMigrateOrderRequest,
  type CreateDevOrderRequest,
  type UpdateMigrateOrderRequest,
  type UpdateDevOrderRequest,
  type ToggleOrderRequest,
  type GetOrdersRequest,
  type WalletQueryParams,
  type TokenSecurityQueryParams,
  getWalletIdByChain,
  validateWalletIdConfig,
} from './types.js';

class ConditionalOrderMcpServer {
  private server: Server;
  private client: DbotClient;

  constructor() {
    this.server = new Server(
      {
        name: 'conditional-order-mcp-server',
        version: '1.0.1',
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
   * Formats API error messages.
   */
  private formatApiError(response: any, operation: string, request?: any): string {
    let errorText = `❌ ${operation} failed:\n\n`;
    
    // Display error status
    errorText += `🔍 Error Status: ${response.err ? 'Failed' : 'Unknown Error'}\n`;
    
    // Display response content
    if (response.res) {
      errorText += `📄 API Response: ${JSON.stringify(response.res, null, 2)}\n`;
    }
    
    // Display request parameters (excluding sensitive information)
    if (request) {
      const safeRequest = { ...request };
      if (safeRequest.walletId) {
        safeRequest.walletId = safeRequest.walletId.substring(0, 8) + '***';
      }
      errorText += `📋 Request Parameters: ${JSON.stringify(safeRequest, null, 2)}\n`;
    }
    
    // Display documentation link
    errorText += `\n📚 Documentation: ${response.docs || 'https://dbotx.com/docs'}`;
    
    return errorText;
  }

  /**
   * Formats network error messages.
   */
  private formatNetworkError(error: any, operation: string, request?: any): string {
    let errorText = `❌ ${operation} failed:\n\n`;
    
    if (error.response) {
      // HTTP error response
      errorText += `🌐 HTTP Status: ${error.response.status} ${error.response.statusText}\n`;
      errorText += `📄 Error Response: ${JSON.stringify(error.response.data, null, 2)}\n`;
    } else if (error.request) {
      // Network request failure
      errorText += `🔌 Network Error: No response from the server, please check your network connection.\n`;
      errorText += `📡 Request Details: ${error.message}\n`;
    } else {
      // Other errors
      errorText += `⚠️ Unknown Error: ${error.message}\n`;
    }
    
    // Display request parameters (excluding sensitive information)
    if (request) {
      const safeRequest = { ...request };
      if (safeRequest.walletId) {
        safeRequest.walletId = safeRequest.walletId.substring(0, 8) + '***';
      }
      errorText += `📋 Request Parameters: ${JSON.stringify(safeRequest, null, 2)}\n`;
    }
    
    errorText += `\n💡 Suggestions:\n`;
    errorText += `- Check if the API key is correct.\n`;
    errorText += `- Check if the network connection is stable.\n`;
    errorText += `- Check if the parameter format is correct.\n`;
    errorText += `- Check if the wallet ID is valid.\n`;
    
    return errorText;
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'create_migrate_order',
            description: 'Create a sell-on-open task - automatically sells when a token opens on Raydium (migrates from Pump).',
            inputSchema: {
              type: 'object',
              properties: {
                chain: {
                  type: 'string',
                  enum: ['solana'],
                  description: 'Currently fixed to "solana".',
                  default: 'solana',
                },
                pairType: {
                  type: 'string',
                  enum: ['pump'],
                  description: 'Currently fixed to "pump".',
                  default: 'pump',
                },
                pair: {
                  type: 'string',
                  description: 'Pump token address.',
                },
                walletId: {
                  type: 'string',
                  description: 'The ID of the wallet to use, can be obtained via the "Wallet Info API" (optional, if not provided, the DBOT_WALLET_ID environment variable will be used).',
                },
                tradeType: {
                  type: 'string',
                  enum: ['sell'],
                  description: 'Currently fixed to "sell".',
                  default: 'sell',
                },
                amountOrPercent: {
                  type: 'number',
                  description: 'Sell ratio (0-1), 0.5 means sell 50%.',
                  minimum: 0,
                  maximum: 1,
                },
                customFeeAndTip: {
                  type: 'boolean',
                  description: 'If "true", both priorityFee and jitoTip are effective, and the system will execute the transaction with the specified values (null means auto priority/bribe fee). If "false", in high-speed mode only priorityFee is effective, and in anti-sandwich mode only jitoTip is effective, and the system will automatically allocate.',
                  default: false,
                },
                priorityFee: {
                  type: 'string',
                  description: 'Priority fee (SOL), effective for Solana. An empty string means auto priority fee.',
                  default: '',
                },
                jitoEnabled: {
                  type: 'boolean',
                  description: 'If "true", enables anti-sandwich mode (Solana, Ethereum, BSC).',
                  default: true,
                },
                jitoTip: {
                  type: 'number',
                  description: 'Bribe fee for anti-sandwich mode (Solana).',
                  default: 0.001,
                },
                expireDelta: {
                  type: 'number',
                  description: 'Task validity duration in milliseconds, max 432000000.',
                  default: 360000000,
                  maximum: 432000000,
                },
                maxSlippage: {
                  type: 'number',
                  description: 'Maximum slippage (0.00-1.00). For buys, it is the difference between the actual and expected price. For sells, it is the difference between the expected and actual price. Difference multiple = 1 / (1 - slippage), so 0.5 means accepting up to a 2x price difference, 1 means no limit.',
                  default: 0.1,
                  minimum: 0,
                  maximum: 1,
                },
                concurrentNodes: {
                  type: 'number',
                  description: 'Number of concurrent nodes (1-3).',
                  default: 2,
                  minimum: 1,
                  maximum: 3,
                },
                retries: {
                  type: 'number',
                  description: 'Number of retries on failure (0-10).',
                  default: 1,
                  minimum: 0,
                  maximum: 10,
                },
              },
              required: ['pair', 'amountOrPercent'],
            },
          },
          {
            name: 'create_dev_order',
            description: "Create a follow-dev-sell task - automatically sells when the developer's sell volume reaches a specified ratio.",
            inputSchema: {
              type: 'object',
              properties: {
                chain: {
                  type: 'string',
                  enum: ['solana'],
                  description: 'Blockchain name, currently fixed to "solana".',
                  default: 'solana',
                },
                pairType: {
                  type: 'string',
                  enum: ['pump', 'raydium_amm'],
                  description: 'Token type, only supports Pump tokens. If the token is not on Raydium yet, use "pump". If it is, use "raydium_amm".',
                  default: 'pump',
                },
                pair: {
                  type: 'string',
                  description: 'If pairType is "pump", this is the Pump token address. If "raydium_amm", this is the pair address created by Pump official.',
                },
                walletId: {
                  type: 'string',
                  description: 'The ID of the wallet to use (optional, if not provided, the DBOT_WALLET_ID environment variable will be used).',
                },
                tradeType: {
                  type: 'string',
                  enum: ['sell'],
                  description: 'Transaction type, currently fixed to "sell".',
                  default: 'sell',
                },
                minDevSellPercent: {
                  type: 'number',
                  description: 'Trigger ratio (0-1). When the dev sells more than this ratio, your tokens will be sold.',
                  default: 0.5,
                  minimum: 0,
                  maximum: 1,
                },
                amountOrPercent: {
                  type: 'number',
                  description: 'Sell ratio (0-1), 0.5 means sell 50%.',
                  minimum: 0,
                  maximum: 1,
                },
                customFeeAndTip: {
                  type: 'boolean',
                  description: 'If "true", both priorityFee and jitoTip are effective. If "false", in high-speed mode only priorityFee is effective, and in anti-sandwich mode only jitoTip is effective.',
                  default: false,
                },
                priorityFee: {
                  type: 'string',
                  description: 'Priority fee (SOL), effective for Solana. An empty string means auto priority fee.',
                  default: '',
                },
                jitoEnabled: {
                  type: 'boolean',
                  description: 'If "true", enables anti-sandwich mode (Solana, Ethereum, BSC).',
                  default: true,
                },
                jitoTip: {
                  type: 'number',
                  description: 'Bribe fee for anti-sandwich mode (Solana).',
                  default: 0.001,
                },
                expireDelta: {
                  type: 'number',
                  description: 'Task validity duration in milliseconds, max 432000000.',
                  default: 360000000,
                  maximum: 432000000,
                },
                maxSlippage: {
                  type: 'number',
                  description: 'Maximum slippage (0.00-1.00).',
                  default: 0.1,
                  minimum: 0,
                  maximum: 1,
                },
                concurrentNodes: {
                  type: 'number',
                  description: 'Number of concurrent nodes (1-3).',
                  default: 2,
                  minimum: 1,
                  maximum: 3,
                },
                retries: {
                  type: 'number',
                  description: 'Number of retries on failure (0-10).',
                  default: 1,
                  minimum: 0,
                  maximum: 10,
                },
              },
              required: ['pair', 'amountOrPercent'],
            },
          },
          {
            name: 'update_migrate_order',
            description: 'Edit a sell-on-open task.',
            inputSchema: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  description: 'ID of the sell-on-open task.',
                },
                chain: {
                  type: 'string',
                  enum: ['solana'],
                  description: 'Blockchain name.',
                  default: 'solana',
                },
                pairType: {
                  type: 'string',
                  enum: ['pump', 'raydium_amm'],
                  description: 'Token type.',
                  default: 'pump',
                },
                pair: {
                  type: 'string',
                  description: 'Pump token address.',
                },
                walletId: {
                  type: 'string',
                  description: 'The ID of the wallet to use (optional, if not provided, the DBOT_WALLET_ID environment variable will be used).',
                },
                amountOrPercent: {
                  type: 'number',
                  description: 'Sell ratio (0-1).',
                  minimum: 0,
                  maximum: 1,
                },
                customFeeAndTip: {
                  type: 'boolean',
                  description: 'Whether to use custom fee and tip settings.',
                  default: false,
                },
                priorityFee: {
                  type: 'string',
                  description: 'Priority fee (SOL).',
                  default: '',
                },
                jitoEnabled: {
                  type: 'boolean',
                  description: 'Whether to enable anti-sandwich mode.',
                  default: true,
                },
                jitoTip: {
                  type: 'number',
                  description: 'Bribe fee for anti-sandwich mode.',
                  default: 0.001,
                },
                expireDelta: {
                  type: 'number',
                  description: 'Task validity duration (milliseconds).',
                  default: 360000000,
                  maximum: 432000000,
                },
                maxSlippage: {
                  type: 'number',
                  description: 'Maximum slippage (0.00-1.00).',
                  default: 0.1,
                  minimum: 0,
                  maximum: 1,
                },
                concurrentNodes: {
                  type: 'number',
                  description: 'Number of concurrent nodes (1-3).',
                  default: 2,
                  minimum: 1,
                  maximum: 3,
                },
                retries: {
                  type: 'number',
                  description: 'Number of retries on failure (0-10).',
                  default: 1,
                  minimum: 0,
                  maximum: 10,
                },
              },
              required: ['id', 'pair', 'amountOrPercent'],
            },
          },
          {
            name: 'update_dev_order',
            description: 'Edit a follow-dev-sell task.',
            inputSchema: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  description: 'ID of the follow-dev-sell task.',
                },
                chain: {
                  type: 'string',
                  enum: ['solana'],
                  description: 'Blockchain name.',
                  default: 'solana',
                },
                pairType: {
                  type: 'string',
                  enum: ['pump', 'raydium_amm'],
                  description: 'Token type.',
                  default: 'pump',
                },
                pair: {
                  type: 'string',
                  description: 'Pump token address or pair address.',
                },
                walletId: {
                  type: 'string',
                  description: 'The ID of the wallet to use (optional, if not provided, the DBOT_WALLET_ID environment variable will be used).',
                },
                minDevSellPercent: {
                  type: 'number',
                  description: 'Trigger ratio (0-1).',
                  default: 0.5,
                  minimum: 0,
                  maximum: 1,
                },
                amountOrPercent: {
                  type: 'number',
                  description: 'Sell ratio (0-1).',
                  minimum: 0,
                  maximum: 1,
                },
                customFeeAndTip: {
                  type: 'boolean',
                  description: 'Whether to use custom fee and tip settings.',
                  default: false,
                },
                priorityFee: {
                  type: 'string',
                  description: 'Priority fee (SOL).',
                  default: '',
                },
                jitoEnabled: {
                  type: 'boolean',
                  description: 'Whether to enable anti-sandwich mode.',
                  default: true,
                },
                jitoTip: {
                  type: 'number',
                  description: 'Bribe fee for anti-sandwich mode.',
                  default: 0.001,
                },
                expireDelta: {
                  type: 'number',
                  description: 'Task validity duration (milliseconds).',
                  default: 360000000,
                  maximum: 432000000,
                },
                maxSlippage: {
                  type: 'number',
                  description: 'Maximum slippage (0.00-1.00).',
                  default: 0.1,
                  minimum: 0,
                  maximum: 1,
                },
                concurrentNodes: {
                  type: 'number',
                  description: 'Number of concurrent nodes (1-3).',
                  default: 2,
                  minimum: 1,
                  maximum: 3,
                },
                retries: {
                  type: 'number',
                  description: 'Number of retries on failure (0-10).',
                  default: 1,
                  minimum: 0,
                  maximum: 10,
                },
              },
              required: ['id', 'pair', 'amountOrPercent'],
            },
          },
          {
            name: 'toggle_migrate_order',
            description: 'Enable/disable a sell-on-open task.',
            inputSchema: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  description: 'ID of the sell-on-open task.',
                },
                enabled: {
                  type: 'boolean',
                  description: 'Task status: true to enable, false to disable.',
                },
              },
              required: ['id', 'enabled'],
            },
          },
          {
            name: 'toggle_dev_order',
            description: 'Enable/disable a follow-dev-sell task.',
            inputSchema: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  description: 'ID of the follow-dev-sell task.',
                },
                enabled: {
                  type: 'boolean',
                  description: 'Task status: true to enable, false to disable.',
                },
              },
              required: ['id', 'enabled'],
            },
          },
          {
            name: 'delete_migrate_order',
            description: 'Delete a sell-on-open task.',
            inputSchema: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  description: 'ID of the sell-on-open task.',
                },
              },
              required: ['id'],
            },
          },
          {
            name: 'delete_dev_order',
            description: 'Delete a follow-dev-sell task.',
            inputSchema: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  description: 'ID of the follow-dev-sell task.',
                },
              },
              required: ['id'],
            },
          },
          {
            name: 'get_migrate_orders',
            description: 'Get the list of sell-on-open tasks.',
            inputSchema: {
              type: 'object',
              properties: {
                page: {
                  type: 'number',
                  description: 'Page number, starting from 0.',
                  default: 0,
                  minimum: 0,
                },
                size: {
                  type: 'number',
                  description: 'Number of items per page.',
                  default: 20,
                  minimum: 1,
                  maximum: 100,
                },
                chain: {
                  type: 'string',
                  enum: ['solana'],
                  description: 'Blockchain name.',
                  default: 'solana',
                },
                state: {
                  type: 'string',
                  enum: ['init', 'processing', 'done', 'fail', 'expired'],
                  description: 'Filter by task status (optional).',
                },
                source: {
                  type: 'string',
                  description: 'Filter by task source (optional).',
                },
              },
              required: [],
            },
          },
          {
            name: 'get_dev_orders',
            description: 'Get the list of follow-dev-sell tasks.',
            inputSchema: {
              type: 'object',
              properties: {
                page: {
                  type: 'number',
                  description: 'Page number, starting from 0.',
                  default: 0,
                  minimum: 0,
                },
                size: {
                  type: 'number',
                  description: 'Number of items per page.',
                  default: 20,
                  minimum: 1,
                  maximum: 100,
                },
                chain: {
                  type: 'string',
                  enum: ['solana'],
                  description: 'Blockchain name.',
                  default: 'solana',
                },
                state: {
                  type: 'string',
                  enum: ['init', 'processing', 'done', 'fail', 'expired'],
                  description: 'Filter by task status (optional).',
                },
                source: {
                  type: 'string',
                  description: 'Filter by task source (optional).',
                },
              },
              required: [],
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

      try {
        switch (name) {
          case 'create_migrate_order':
            return await this.handleCreateMigrateOrder(args);

          case 'create_dev_order':
            return await this.handleCreateDevOrder(args);

          case 'update_migrate_order':
            return await this.handleUpdateMigrateOrder(args);

          case 'update_dev_order':
            return await this.handleUpdateDevOrder(args);

          case 'toggle_migrate_order':
            return await this.handleToggleMigrateOrder(args);

          case 'toggle_dev_order':
            return await this.handleToggleDevOrder(args);

          case 'delete_migrate_order':
            return await this.handleDeleteMigrateOrder(args);

          case 'delete_dev_order':
            return await this.handleDeleteDevOrder(args);
          
          case 'get_migrate_orders':
            return await this.handleGetMigrateOrders(args);

          case 'get_dev_orders':
            return await this.handleGetDevOrders(args);

          case 'get_user_wallets':
            return await this.handleGetUserWallets(args);

          case 'get_token_security_info':
            return await this.handleGetTokenSecurityInfo(args);

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new McpError(
          ErrorCode.InternalError,
          `Error executing tool ${name}: ${errorMessage}`
        );
      }
    });
  }

  private async handleCreateMigrateOrder(args: any) {
    try {
      // Get wallet ID using new logic
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

      const request = CreateMigrateOrderRequestSchema.parse(args);
      const response = await this.client.createMigrateOrder(request);
      
      if (response.err) {
        return {
          content: [
            {
              type: 'text',
              text: this.formatApiError(response, 'Create sell-on-open task', request),
            },
          ],
        };
      }

      const orderId = response.res?.id || 'Unknown';
      return {
        content: [
          {
            type: 'text',
            text: `✅ Sell-on-open task created successfully!\n\nTask ID: ${orderId}\nChain: ${request.chain}\nToken: ${request.pair}\nSell Ratio: ${(request.amountOrPercent * 100).toFixed(1)}%\n\n💡 The system will automatically execute the sell when the token migrates from Pump to Raydium.\n\nDocs: ${response.docs}`,
          },
        ],
      };
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }
      
      // Check for network errors
      if (error && typeof error === 'object' && ('response' in error || 'request' in error)) {
        return {
          content: [
            {
              type: 'text',
              text: this.formatNetworkError(error, 'Create sell-on-open task', args),
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

  private async handleCreateDevOrder(args: any) {
    try {
      // Get wallet ID using new logic
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

      const request = CreateDevOrderRequestSchema.parse(args);
      const response = await this.client.createDevOrder(request);
      
      if (response.err) {
        return {
          content: [
            {
              type: 'text',
              text: this.formatApiError(response, 'Create follow-dev-sell task', request),
            },
          ],
        };
      }

      const orderId = response.res?.id || 'Unknown';
      return {
        content: [
          {
            type: 'text',
            text: `✅ Follow-dev-sell task created successfully!\n\nTask ID: ${orderId}\nChain: ${request.chain}\nToken: ${request.pair}\nTrigger Ratio: ${(request.minDevSellPercent * 100).toFixed(1)}%\nSell Ratio: ${(request.amountOrPercent * 100).toFixed(1)}%\n\n💡 When the developer sells over ${(request.minDevSellPercent * 100).toFixed(1)}%, the system will automatically sell ${(request.amountOrPercent * 100).toFixed(1)}% of your tokens.\n\nDocs: ${response.docs}`,
          },
        ],
      };
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }
      
      // Check for network errors
      if (error && typeof error === 'object' && ('response' in error || 'request' in error)) {
        return {
          content: [
            {
              type: 'text',
              text: this.formatNetworkError(error, 'Create follow-dev-sell task', args),
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

  private async handleUpdateMigrateOrder(args: any) {
    try {
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
      const request = UpdateMigrateOrderRequestSchema.parse(args);
      const response = await this.client.updateMigrateOrder(request);
      
      if (response.err) {
        return {
          content: [
            {
              type: 'text',
              text: this.formatApiError(response, 'Edit sell-on-open task', request),
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: `✅ Sell-on-open task edited successfully!\n\nTask ID: ${request.id}\nChain: ${request.chain}\nToken: ${request.pair}\nSell Ratio: ${(request.amountOrPercent * 100).toFixed(1)}%\n\nDocs: ${response.docs}`,
          },
        ],
      };
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }
      
      // Check for network errors
      if (error && typeof error === 'object' && ('response' in error || 'request' in error)) {
        return {
          content: [
            {
              type: 'text',
              text: this.formatNetworkError(error, 'Edit sell-on-open task', args),
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

  private async handleUpdateDevOrder(args: any) {
    try {
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
      const request = UpdateDevOrderRequestSchema.parse(args);
      const response = await this.client.updateDevOrder(request);
      
      if (response.err) {
        return {
          content: [
            {
              type: 'text',
              text: this.formatApiError(response, 'Edit follow-dev-sell task', request),
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: `✅ Follow-dev-sell task edited successfully!\n\nTask ID: ${request.id}\nChain: ${request.chain}\nToken: ${request.pair}\nTrigger Ratio: ${(request.minDevSellPercent * 100).toFixed(1)}%\nSell Ratio: ${(request.amountOrPercent * 100).toFixed(1)}%\n\nDocs: ${response.docs}`,
          },
        ],
      };
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }
      
      // Check for network errors
      if (error && typeof error === 'object' && ('response' in error || 'request' in error)) {
        return {
          content: [
            {
              type: 'text',
              text: this.formatNetworkError(error, 'Edit follow-dev-sell task', args),
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

  private async handleToggleMigrateOrder(args: any) {
    try {
      const request = ToggleOrderRequestSchema.parse(args);
      const response = await this.client.toggleMigrateOrder(request);
      
      if (response.err) {
        return {
          content: [
            {
              type: 'text',
              text: this.formatApiError(response, 'Toggle sell-on-open task', request),
            },
          ],
        };
      }

      const status = request.enabled ? 'Enabled' : 'Disabled';
      return {
        content: [
          {
            type: 'text',
            text: `✅ Sell-on-open task status updated successfully!\n\nTask ID: ${request.id}\nStatus: ${status}\n\nDocs: ${response.docs}`,
          },
        ],
      };
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }
      
      // Check for network errors
      if (error && typeof error === 'object' && ('response' in error || 'request' in error)) {
        return {
          content: [
            {
              type: 'text',
              text: this.formatNetworkError(error, 'Toggle sell-on-open task', args),
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

  private async handleToggleDevOrder(args: any) {
    try {
      const request = ToggleOrderRequestSchema.parse(args);
      const response = await this.client.toggleDevOrder(request);
      
      if (response.err) {
        return {
          content: [
            {
              type: 'text',
              text: this.formatApiError(response, 'Toggle follow-dev-sell task', request),
            },
          ],
        };
      }

      const status = request.enabled ? 'Enabled' : 'Disabled';
      return {
        content: [
          {
            type: 'text',
            text: `✅ Follow-dev-sell task status updated successfully!\n\nTask ID: ${request.id}\nStatus: ${status}\n\nDocs: ${response.docs}`,
          },
        ],
      };
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }
      
      // Check for network errors
      if (error && typeof error === 'object' && ('response' in error || 'request' in error)) {
        return {
          content: [
            {
              type: 'text',
              text: this.formatNetworkError(error, 'Toggle follow-dev-sell task', args),
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

  private async handleDeleteMigrateOrder(args: any) {
    const { id } = args;
    if (!id || typeof id !== 'string') {
      throw new McpError(ErrorCode.InvalidParams, 'The id parameter must be a string.');
    }

    try {
      const response = await this.client.deleteMigrateOrder(id);
      
      if (response.err) {
        return {
          content: [
            {
              type: 'text',
              text: this.formatApiError(response, 'Delete sell-on-open task', { id }),
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: `✅ Sell-on-open task deleted successfully!\n\nTask ID: ${id}\n\nDocs: ${response.docs}`,
          },
        ],
      };
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }
      
      // Check for network errors
      if (error && typeof error === 'object' && ('response' in error || 'request' in error)) {
        return {
          content: [
            {
              type: 'text',
              text: this.formatNetworkError(error, 'Delete sell-on-open task', args),
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

  private async handleDeleteDevOrder(args: any) {
    const { id } = args;
    if (!id || typeof id !== 'string') {
      throw new McpError(ErrorCode.InvalidParams, 'The id parameter must be a string.');
    }

    try {
      const response = await this.client.deleteDevOrder(id);
      
      if (response.err) {
        return {
          content: [
            {
              type: 'text',
              text: this.formatApiError(response, 'Delete follow-dev-sell task', { id }),
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: `✅ Follow-dev-sell task deleted successfully!\n\nTask ID: ${id}\n\nDocs: ${response.docs}`,
          },
        ],
      };
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }
      
      // Check for network errors
      if (error && typeof error === 'object' && ('response' in error || 'request' in error)) {
        return {
          content: [
            {
              type: 'text',
              text: this.formatNetworkError(error, 'Delete follow-dev-sell task', args),
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

  private async handleGetMigrateOrders(args: any) {
    try {
      const { page, size, chain, state, source } = GetOrdersRequestSchema.parse(args);
      const response = await this.client.getMigrateOrders(page, size, chain, state, source);
      
      if (response.err) {
        return {
          content: [
            {
              type: 'text',
              text: this.formatApiError(response, 'Get sell-on-open task list', args),
            },
          ],
        };
      }

      // Format task list display
      const orders = response.res?.orders || response.res || [];
      const total = response.res?.total || orders.length;
      const currentPage = response.res?.page ?? page;
      const pageSize = response.res?.size ?? size;

      let text = `✅ Sell-on-open task list retrieved successfully!\n\n`;
      text += `📊 Statistics:\n`;
      text += `- Total tasks: ${total}\n`;
      text += `- Current page: ${currentPage + 1}\n`;
      text += `- Page size: ${pageSize}\n\n`;

      if (Array.isArray(orders) && orders.length > 0) {
        text += `📋 Task List:\n`;
        orders.forEach((order: any, index: number) => {
          text += `\n${index + 1}. Task ID: ${order.id}\n`;
          text += `   - Token: ${order.pair}\n`;
          text += `   - Sell Ratio: ${((order.amountOrPercent || 0) * 100).toFixed(1)}%\n`;
          text += `   - Status: ${order.state || 'unknown'}\n`;
          text += `   - Enabled: ${order.enabled ? 'Yes' : 'No'}\n`;
          if (order.createdAt) {
            text += `   - Created At: ${order.createdAt}\n`;
          }
        });
      } else {
        text += `📋 No sell-on-open tasks found.\n`;
      }

      text += `\n📚 Docs: ${response.docs}`;

      return {
        content: [
          {
            type: 'text',
            text: text,
          },
        ],
      };
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }
      
      // Check for network errors
      if (error && typeof error === 'object' && ('response' in error || 'request' in error)) {
        return {
          content: [
            {
              type: 'text',
              text: this.formatNetworkError(error, 'Get sell-on-open task list', args),
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

  private async handleGetDevOrders(args: any) {
    try {
      const { page, size, chain, state, source } = GetOrdersRequestSchema.parse(args);
      const response = await this.client.getDevOrders(page, size, chain, state, source);
      
      if (response.err) {
        return {
          content: [
            {
              type: 'text',
              text: this.formatApiError(response, 'Get follow-dev-sell task list', args),
            },
          ],
        };
      }

      // Format task list display
      const orders = response.res?.orders || response.res || [];
      const total = response.res?.total || orders.length;
      const currentPage = response.res?.page ?? page;
      const pageSize = response.res?.size ?? size;

      let text = `✅ Follow-dev-sell task list retrieved successfully!\n\n`;
      text += `📊 Statistics:\n`;
      text += `- Total tasks: ${total}\n`;
      text += `- Current page: ${currentPage + 1}\n`;
      text += `- Page size: ${pageSize}\n\n`;

      if (Array.isArray(orders) && orders.length > 0) {
        text += `📋 Task List:\n`;
        orders.forEach((order: any, index: number) => {
          text += `\n${index + 1}. Task ID: ${order.id}\n`;
          text += `   - Token: ${order.pair}\n`;
          text += `   - Trigger Ratio: ${((order.minDevSellPercent || 0) * 100).toFixed(1)}%\n`;
          text += `   - Sell Ratio: ${((order.amountOrPercent || 0) * 100).toFixed(1)}%\n`;
          text += `   - Status: ${order.state || 'unknown'}\n`;
          text += `   - Enabled: ${order.enabled ? 'Yes' : 'No'}\n`;
          if (order.createdAt) {
            text += `   - Created At: ${order.createdAt}\n`;
          }
        });
      } else {
        text += `📋 No follow-dev-sell tasks found.\n`;
      }

      text += `\n📚 Docs: ${response.docs}`;

      return {
        content: [
          {
            type: 'text',
            text: text,
          },
        ],
      };
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }
      
      // Check for network errors
      if (error && typeof error === 'object' && ('response' in error || 'request' in error)) {
        return {
          content: [
            {
              type: 'text',
              text: this.formatNetworkError(error, 'Get follow-dev-sell task list', args),
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

  private async handleGetUserWallets(args: any) {
    try {
      const page = args.page || 0;
      const size = args.size || 20;
      
      // If no type specified or empty string, query all types
      if (!args.type || args.type === '') {
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
    
    console.error('Conditional Order MCP Server started');
  }
}

async function main(): Promise<void> {
  const server = new ConditionalOrderMcpServer();
  await server.run();
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error in main():', error);
    process.exit(1);
  });
} 