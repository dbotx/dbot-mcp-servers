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
      // Get wallet ID from environment variables if not provided
      if (!args.walletId) {
        args.walletId = process.env.DBOT_WALLET_ID;
        if (!args.walletId) {
          throw new McpError(
            ErrorCode.InternalError,
            'Please set the DBOT_WALLET_ID environment variable or specify walletId in the parameters.'
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
      // Get wallet ID from environment variables if not provided
      if (!args.walletId) {
        args.walletId = process.env.DBOT_WALLET_ID;
        if (!args.walletId) {
          throw new McpError(
            ErrorCode.InternalError,
            'Please set the DBOT_WALLET_ID environment variable or specify walletId in the parameters.'
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
        args.walletId = process.env.DBOT_WALLET_ID;
        if (!args.walletId) {
          throw new McpError(
            ErrorCode.InternalError,
            'Please set the DBOT_WALLET_ID environment variable or specify walletId in the parameters.'
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
        args.walletId = process.env.DBOT_WALLET_ID;
        if (!args.walletId) {
          throw new McpError(
            ErrorCode.InternalError,
            'Please set the DBOT_WALLET_ID environment variable or specify walletId in the parameters.'
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