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
    // Use environment variable if walletId not provided
    if (!args.walletId) {
      args.walletId = process.env.DBOT_WALLET_ID;
      if (!args.walletId) {
        throw new Error('Wallet ID not provided: Please specify walletId in parameters or set DBOT_WALLET_ID environment variable');
      }
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