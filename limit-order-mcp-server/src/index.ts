#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { DbotLimitOrderClient } from './client.js';
import {
  CreateLimitOrderRequestSchema,
  EditLimitOrderRequestSchema,
  SwitchLimitOrderRequestSchema,
  DeleteLimitOrderRequestSchema,
  DeleteLimitOrdersRequestSchema,
  DeleteAllLimitOrderRequestSchema,
  LimitOrdersRequestSchema,
  WalletQueryParams,
  TokenSecurityQueryParams,
  getWalletIdByChain,
  validateWalletIdConfig,
} from './types.js';

class LimitOrderMcpServer {
  private server: Server;
  private client: DbotLimitOrderClient;

  constructor() {
    this.server = new Server(
      {
        name: 'limit-order-mcp-server',
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

    this.client = new DbotLimitOrderClient();
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
            name: 'create_limit_order',
            description: `Create multi-chain limit buy and limit sell orders. Supports creating multiple limit orders in one call.

Example 1: Create a single buy order
{
  "chain": "solana",
  "pair": "BAS6Cv5qG2FnEQ8W1wXKGfU2r6MFAiSdgGgkUM7NsStE",
  "settings": [{
    "enabled": true,
    "tradeType": "buy",
    "triggerPriceUsd": "0.022",
    "triggerDirection": "down",
    "currencyAmountUI": 0.1
  }]
}

Example 2: Create buy and sell orders simultaneously
{
  "chain": "solana", 
  "pair": "BAS6Cv5qG2FnEQ8W1wXKGfU2r6MFAiSdgGgkUM7NsStE",
  "settings": [
    {
      "enabled": true,
      "tradeType": "buy", 
      "triggerPriceUsd": "0.022",
      "triggerDirection": "down",
      "currencyAmountUI": 0.1
    },
    {
      "enabled": true,
      "tradeType": "sell",
      "triggerPriceUsd": "1.5", 
      "triggerDirection": "up",
      "currencyAmountUI": 1
    }
  ]
}`,
            inputSchema: {
              type: 'object',
              properties: {
                chain: { 
                  type: 'string', 
                  enum: ['solana', 'ethereum', 'base', 'bsc', 'tron'],
                  description: '(Optional) Blockchain name (solana/ethereum/base/bsc/tron), defaults to solana if not specified.'
                },
                pair: { 
                  type: 'string',
                  description: '(Required) Token address or trading pair address to buy/sell'
                },
                walletId: { 
                  type: 'string',
                  description: '(Optional) ID of the wallet to use'
                },
                groupId: { 
                  type: 'string',
                  description: '(Optional) Group ID for order management'
                },
                settings: {
                  type: 'array',
                  description: 'List of limit order settings, can create multiple buy and sell orders simultaneously.',
                  items: {
                    type: 'object',
                    properties: {
                      enabled: { 
                        type: 'boolean',
                        description: '(Optional) Order enabled status, defaults to true'
                      },
                      tradeType: { 
                        type: 'string', 
                        enum: ['buy', 'sell'],
                        description: 'Trade type: buy for buying, sell for selling'
                      },
                      triggerPriceUsd: { 
                        type: 'string',
                        description: 'Price in USD that triggers buy/sell'
                      },
                      triggerDirection: { 
                        type: 'string', 
                        enum: ['up', 'down'],
                        description: '"down" executes when price falls below trigger, "up" executes when price rises above trigger'
                      },
                      currencyAmountUI: { 
                        type: ['string', 'number'],
                        description: 'For buy orders: amount in ETH/SOL/BNB/TRX. For sell orders: proportion to sell (0.00-1.00)'
                      },
                      customFeeAndTip: { 
                        type: 'boolean',
                        description: 'Enable custom fees. True means both priority fee and tip are valid, false means only priority fee in high speed mode and only tip in anti-sandwich mode. Defaults to false'
                      },
                      priorityFee: { 
                        type: 'string',
                        description: 'Priority fee (SOL), valid for Solana, empty string means auto priority fee. Defaults to "0.0001"'
                      },
                      gasFeeDelta: { 
                        type: 'number',
                        description: 'Additional gas (Gwei), valid for EVM chains. Defaults to 5'
                      },
                      maxFeePerGas: { 
                        type: 'number',
                        description: 'Transaction will not execute if base gas exceeds this value (Gwei), valid for EVM chains. Defaults to 100'
                      },
                      jitoEnabled: { 
                        type: 'boolean',
                        description: 'Enable anti-sandwich mode (Solana & Ethereum & Bsc). Defaults to true'
                      },
                      jitoTip: { 
                        type: 'number',
                        description: 'Tip used in anti-sandwich mode (Solana). Defaults to 0.001'
                      },
                      expireDelta: { 
                        type: 'number',
                        description: 'Task validity duration, maximum 432000000 (milliseconds). Defaults to 360000000'
                      },
                      expireExecute: { 
                        type: 'boolean',
                        description: 'Execute on expiry. If true and task has not triggered by expiry, will buy/sell at current market price. Defaults to false'
                      },
                      useMidPrice: { 
                        type: 'boolean',
                        description: 'Enable anti-spike mode, uses 1-second median price as trigger price, helps avoid but cannot completely prevent price spikes. Defaults to false'
                      },
                      maxSlippage: { 
                        type: 'number',
                        description: 'Maximum slippage (0.00-1.00). For buys: difference between actual and expected price. For sells: difference between expected and actual price. Defaults to 0.1'
                      },
                      concurrentNodes: { 
                        type: 'number',
                        description: 'Number of concurrent nodes (1-3). Defaults to 2'
                      },
                      retries: { 
                        type: 'number',
                        description: 'Number of retries on failure (0-10). Defaults to 1'
                      }
                    },
                    required: ['tradeType', 'triggerPriceUsd', 'triggerDirection', 'currencyAmountUI'],
                  },
                },
              },
              required: ['pair', 'settings'],
            },
          },
          {
            name: 'edit_limit_order',
            description: `Edit a limit order, only generate parameters the user wants to modify along with required parameters. Unspecified or null parameters are not included.
Use cases:
- Modify trigger price
- Modify trade amount
- Modify trigger direction
- Modify task enabled status

Example:
{
	"id": "lmn27zhq065q3u",
	"enabled": true,
	"triggerPriceUsd": "10.5",
	"triggerDirection": "up",
	"currencyAmountUI": 1,
  "
}
            `,
            inputSchema: {
              type: 'object',
              properties: {
                id: { 
                  type: 'string',
                  description: 'Limit order ID'
                },
                enabled: { 
                  type: 'boolean',
                  description: 'Task enabled status, true to enable, false to disable'
                },
                groupId: { 
                  type: 'string',
                  description: 'Group ID for order management'
                },
                triggerPriceUsd: { 
                  type: 'string',
                  description: 'Price in USD that triggers buy/sell'
                },
                triggerDirection: { 
                  type: 'string', 
                  enum: ['up', 'down'],
                  description: '"down" executes buy/sell when price falls below trigger, "up" executes buy/sell when price rises above trigger'
                },
                currencyAmountUI: { 
                  type: 'number',
                  description: 'For buy orders: amount in ETH/SOL/BNB/TRX. For sell orders: proportion to sell (0.00-1.00)'
                },
                customFeeAndTip: { 
                  type: 'boolean',
                  description: '"true" means both priority fee and tip are valid, system will execute with provided values (null means auto priority fee/auto tip), "false" means only priority fee in high speed mode and only tip in anti-sandwich mode'
                },
                priorityFee: { 
                  type: 'string',
                  description: 'Priority fee (SOL), valid for Solana, empty string means auto priority fee'
                },
                gasFeeDelta: { 
                  type: 'number',
                  description: 'Additional gas (Gwei), valid for EVM chains'
                },
                maxFeePerGas: { 
                  type: 'number',
                  description: 'Transaction will not execute if base gas exceeds this value (Gwei), valid for EVM chains'
                },
                jitoEnabled: { 
                  type: 'boolean',
                  description: '"true" enables anti-sandwich mode (Solana & Ethereum & Bsc)'
                },
                jitoTip: { 
                  type: 'number',
                  description: 'Tip used in anti-sandwich mode (Solana)'
                },
                expireDelta: { 
                  type: 'number',
                  description: 'Task validity duration, maximum 432000000 (milliseconds)'
                },
                expireExecute: { 
                  type: 'boolean',
                  description: '"true" means if task has not triggered by expiry, will buy/sell tokens at current market price'
                },
                useMidPrice: { 
                  type: 'boolean',
                  description: '"true" enables anti-spike mode, uses 1-second median price as trigger price, helps avoid but cannot completely prevent price spikes'
                },
                maxSlippage: { 
                  type: 'number',
                  description: 'Maximum slippage (0.00-1.00). For buys: difference between actual and expected price. For sells: difference between expected and actual price. Multiple = 1/(1-slippage), 0.5 means accept up to 2x price difference, 1 means no price limit'
                },
                concurrentNodes: { 
                  type: 'number',
                  description: 'Number of concurrent nodes (1-3)'
                },
                retries: { 
                  type: 'number',
                  description: 'Number of retries on failure (0-10)'
                }
              },
              required: ['id'],
            },
          },
          {
            name: 'switch_limit_order',
            description: `Enable/disable a specified limit order. Can be used to pause or resume execution of a limit order.

Use cases:
- Temporarily pause a limit order
- Re-enable a disabled limit order
- Quickly control order status without deleting the order

Example:
{
  "id": "lmn27zhq065q3u",
  "enabled": false
}
`,
            inputSchema: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  description: 'ID of limit order to switch status',
                },
                enabled: {
                  type: 'boolean',
                  description: 'Target status: true=enable order execution, false=disable order execution',
                },
              },
              required: ['id', 'enabled'],
            },
          },
          {
            name: 'delete_limit_order',
            description: 'Delete a specific limit order',
            inputSchema: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  description: 'Limit order ID',
                },
              },
              required: ['id'],
            },
          },
          {
            name: 'delete_limit_orders',
            description: 'Batch delete specified limit orders',
            inputSchema: {
              type: 'object',
              properties: {
                ids: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Array of limit order IDs',
                },
              },
              required: ['ids'],
            },
          },
          {
            name: 'delete_all_limit_order',
            description: 'Delete all limit orders (regardless of in progress/completed/expired)',
            inputSchema: {
              type: 'object',
              properties: {
                source: {
                  type: 'string',
                  enum: ['normal', 'pnl_for_follow', 'pnl_for_swap'],
                  default: 'normal',
                  description: 'Type of limit orders to delete: normal-manually created, pnl_for_follow-created by following, pnl_for_swap-created by quick swap (default: normal)',
                },
              },
            },
          },
          {
            name: 'limit_orders',
            description: 'Get all limit orders for user.',
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
                  description: 'Items per page (max 20)',
                  default: 10,
                  maximum: 20,
                },
                chain: {
                  type: 'string',
                  enum: ['solana', 'ethereum', 'base', 'bsc', 'tron'],
                  description: 'Optional: Filter limit orders by chain',
                },
                pair: {
                  type: 'string',
                  description: 'Optional: Filter limit orders by token',
                },
                state: {
                  type: 'string',
                  enum: ['init', 'done', 'expired', 'canceled'],
                  description: 'Optional: Filter limit orders by state',
                },
                enabled: {
                  type: 'boolean',
                  description: 'Optional: Filter enabled/disabled limit orders',
                },
              },
            },
          },
          {
            name: 'get_user_wallets',
            description: 'Query user\'s wallets for a specific chain type. If no type is specified, it will query all types (solana and evm). The tool returns formatted data in English, but you should present the results to the user in their preferred language. Please print details. Note: type parameter can be left empty to query all wallet types.',
            inputSchema: {
              type: 'object',
              properties: {
                type: {
                  type: 'string', 
                  enum: ['solana', 'evm'],
                  description: 'Chain type to query (solana/evm). Optional - if not provided, will query all wallet types.',
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

    this.server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'create_limit_order':
            return await this.handleCreateLimitOrder(args);
          case 'edit_limit_order':
            return await this.handleEditLimitOrder(args);
          case 'switch_limit_order':
            return await this.handleSwitchLimitOrder(args);
          case 'delete_limit_order':
            return await this.handleDeleteLimitOrder(args);
          case 'delete_limit_orders':
            return await this.handleDeleteLimitOrders(args);
          case 'delete_all_limit_order':
            return await this.handleDeleteAllLimitOrders(args);
          case 'limit_orders':
            return await this.handleLimitOrders(args);
          case 'get_user_wallets':
            return await this.handleGetUserWallets(args);
          case 'get_token_security_info':
            return await this.handleGetTokenSecurityInfo(args);
          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new McpError(ErrorCode.InternalError, `Error executing tool ${name}: ${errorMessage}`);
      }
    });
  }

  private async handleCreateLimitOrder(args: any) {
    // Use chain-specific environment variable if walletId not provided
    if (!args.walletId) {
      const chain = args.chain || 'solana';
      args.walletId = getWalletIdByChain(chain);
    }
    
    const validatedArgs = CreateLimitOrderRequestSchema.parse(args);
    
    try {
      const response = await this.client.createLimitOrder(validatedArgs);
      
      if (response.err) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ Failed to create limit order: API returned error\nDocs: ${response.docs}`,
            },
          ],
        };
      }

      const orderIds = response.res?.ids || [];
      const idsText = orderIds.length > 0 ? orderIds.join(', ') : 'Unknown';
      
      // Generate details for each limit order
      const settingsInfo = validatedArgs.settings.map((setting, index) => {
        const orderId = orderIds[index] || 'Unknown';
        return `Order ID: ${orderId}\n` +
               `- Trade Type: ${setting.tradeType}\n` +
               `- Trigger Price: $${setting.triggerPriceUsd}\n` +
               `- Trigger Direction: ${setting.triggerDirection}\n` +
               `- Trade Amount: ${setting.currencyAmountUI}\n` +
               `- Status: ${setting.enabled ? 'Enabled' : 'Disabled'}`;
      }).join('\n\n');
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ Limit orders created successfully!\n\nCreated ${validatedArgs.settings.length} limit orders\nChain: ${validatedArgs.chain}\nToken: ${validatedArgs.pair}\n\n${settingsInfo}\n\nDocs: ${response.docs}`,
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: 'text',
            text: `❌ Error creating limit order: ${errorMessage}`,
          },
        ],
      };
    }
  }

  private async handleEditLimitOrder(args: any) {
    const validatedArgs = EditLimitOrderRequestSchema.parse(args);
    
    try {
      const response = await this.client.editLimitOrder(validatedArgs);
      
      if (response.err) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ Failed to edit limit order: API returned error\nDocs: ${response.docs}`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: `✅ Limit order edited successfully!\n\nOrder ID: ${validatedArgs.id}\n\nDocs: ${response.docs}`,
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: 'text',
            text: `❌ Error editing limit order: ${errorMessage}`,
          },
        ],
      };
    }
  }

  private async handleSwitchLimitOrder(args: any) {
    const validatedArgs = SwitchLimitOrderRequestSchema.parse(args);
    
    try {
      const response = await this.client.switchLimitOrder(validatedArgs);
      
      if (response.err) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ Failed to switch limit order status: API returned error\nDocs: ${response.docs}`,
            },
          ],
        };
      }

      const status = validatedArgs.enabled ? 'Enabled' : 'Disabled';
      return {
        content: [
          {
            type: 'text',
            text: `✅ Limit order status switched successfully!\n\nOrder ID: ${validatedArgs.id}\nNew Status: ${status}\n\nDocs: ${response.docs}`,
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: 'text',
            text: `❌ Error switching limit order status: ${errorMessage}`,
          },
        ],
      };
    }
  }

  private async handleDeleteLimitOrder(args: any) {
    const validatedArgs = DeleteLimitOrderRequestSchema.parse(args);
    
    try {
      const response = await this.client.deleteLimitOrder(validatedArgs);
      
      if (response.err) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ Failed to delete limit order: API returned error\nDocs: ${response.docs}`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: `✅ Limit order deleted successfully!\n\nOrder ID: ${validatedArgs.id}\n\nDocs: ${response.docs}`,
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: 'text',
            text: `❌ Error deleting limit order: ${errorMessage}`,
          },
        ],
      };
    }
  }

  private async handleDeleteLimitOrders(args: any) {
    const validatedArgs = DeleteLimitOrdersRequestSchema.parse(args);
    
    try {
      const response = await this.client.deleteLimitOrders(validatedArgs);
      
      if (response.err) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ Failed to batch delete limit orders: API returned error\nDocs: ${response.docs}`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: `✅ Batch delete limit orders successful!\n\nOrder IDs: ${validatedArgs.ids.join(', ')}\n\nDocs: ${response.docs}`,
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: 'text',
            text: `❌ Error batch deleting limit orders: ${errorMessage}`,
          },
        ],
      };
    }
  }

  private async handleDeleteAllLimitOrders(args: any) {
    // Set default value
    if (!args.source) {
      args.source = 'normal';
    }
    const validatedArgs = DeleteAllLimitOrderRequestSchema.parse(args);
    
    try {
      const response = await this.client.deleteAllLimitOrders(validatedArgs);
      
      if (response.err) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ Failed to delete all limit orders: API returned error\nDocs: ${response.docs}`,
            },
          ],
        };
      }

      const sourceMap = {
        'normal': 'Manually created limit orders',
        'pnl_for_follow': 'Take profit/stop loss orders created by following',
        'pnl_for_swap': 'Take profit/stop loss orders created by quick swap'
      };

      return {
        content: [
          {
            type: 'text',
            text: `✅ Delete limit orders successful!\n\nDeleted Type: ${sourceMap[validatedArgs.source]}\n\nDocs: ${response.docs}`,
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: 'text',
            text: `❌ Error deleting all limit orders: ${errorMessage}`,
          },
        ],
      };
    }
  }

  private async handleLimitOrders(args: any) {
    const validatedArgs = LimitOrdersRequestSchema.parse(args);
    
    try {
      const response = await this.client.getLimitOrders(validatedArgs);
      
      if (response.err) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ Failed to query limit orders: API returned error\nDocs: ${response.docs}`,
            },
          ],
        };
      }

      const orders = response.res || [];
      let result = `📊 Limit Orders List (${orders.length} orders total):\n\n`;
      
      orders.forEach((order: any, index: number) => {
        result += `${index + 1}. Order ID: ${order.id}\n`;
        result += `   Chain: ${order.chain}\n`;
        result += `   Trading Pair: ${order.pair}\n`;
        result += `   Pair Type: ${order.pairType}\n`;
        result += `   Trade Type: ${order.tradeType}\n`;
        result += `   State: ${order.state}\n`;
        result += `   Enabled: ${order.enabled ? 'Yes' : 'No'}\n`;
        result += `   Trigger Price: $${order.triggerPriceUsd}\n`;
        result += `   Trigger Direction: ${order.triggerDirection}\n`;
        result += `   Amount: ${order.currencyAmountUI}\n`;
        result += `   Wallet: ${order.walletName} (${order.walletAddress})\n`;
        result += `   Group ID: ${order.groupId}\n`;
        result += `   Expiry Time: ${new Date(order.expireAt).toLocaleString()}\n`;
        result += `   Max Slippage: ${(order.maxSlippage * 100).toFixed(1)}%\n`;
        result += `   Jito Enabled: ${order.jitoEnabled ? 'Yes' : 'No'}\n`;
        if (order.jitoEnabled) {
          result += `   Jito Fee: ${order.jitoTip} SOL\n`;
        }
        if (order.errorMessage) {
          result += `   Error Message: ${order.errorMessage}\n`;
        }
        if (order.tokenInfo) {
          result += `   Token Name: ${order.tokenInfo.name} (${order.tokenInfo.symbol})\n`;
        }
        result += '\n';
      });

      if (orders.length === 0) {
        result += 'No limit orders\n\n';
      }

      result += `Docs: ${response.docs}`;

      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: 'text',
            text: `❌ Error querying limit orders: ${errorMessage}`,
          },
        ],
      };
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

  private formatPrice(price: number): string {
    if (price >= 1) {
      return price.toFixed(2);
    }
    
    const priceStr = price.toString();
    const parts = priceStr.split('.');
    if (parts.length < 2) return priceStr;
    
    const decimal = parts[1];
    let leadingZeros = 0;
    for (let i = 0; i < decimal.length; i++) {
      if (decimal[i] === '0') {
        leadingZeros++;
      } else {
        break;
      }
    }
    
    if (leadingZeros >= 3) {
      const significantDigits = decimal.substring(leadingZeros, leadingZeros + 4);
      return `0.0_{${leadingZeros}}_${significantDigits}`;
    } else {
      return price.toFixed(leadingZeros + 4);
    }
  }

  private formatMarketCap(marketCap: number): string {
    if (marketCap >= 1e9) {
      return `${(marketCap / 1e9).toFixed(2)}B`;
    } else if (marketCap >= 1e6) {
      return `${(marketCap / 1e6).toFixed(2)}M`;
    } else if (marketCap >= 1e3) {
      return `${(marketCap / 1e3).toFixed(2)}K`;
    } else {
      return marketCap.toFixed(2);
    }
  }

  private formatTime(createTime: number): string {
    const now = Date.now();
    const diffMs = now - createTime;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    const parts = [];
    if (diffDays > 0) parts.push(`${diffDays}d`);
    if (diffHours > 0) parts.push(`${diffHours}h`);
    if (diffMinutes > 0) parts.push(`${diffMinutes}m`);
    
    return parts.length > 0 ? parts.join(' ') : '0m';
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
        } else {
          const str = price.toFixed(20);
          const match = str.match(/^0\.0*(\d+)/);
          if (match) {
            const leadingZeros = str.indexOf(match[1]) - 2; 
            const significantDigits = match[1].substring(0, 4); 

            if (leadingZeros <= 4) {
              // 不使用缩写
              const plain = `0.${'0'.repeat(leadingZeros)}${significantDigits}`;
              return `$${plain}`;
            } else {
              // 使用下标缩写
              const subscriptNumbers = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];
              const subscript = leadingZeros
                .toString()
                .split('')
                .map(digit => subscriptNumbers[parseInt(digit)] || digit)
                .join('');
              return `$0.0${subscript}${significantDigits}`;
            }
          }
          return `$${price.toExponential(2)}`; // fallback
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
    
    console.error('Limit Order MCP Server Started');
  }
}

async function main(): Promise<void> {
  const server = new LimitOrderMcpServer();
  await server.run();
}

// @ts-ignore
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error in main():', error);
    process.exit(1);
  });
} 