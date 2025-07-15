import axios, { AxiosInstance } from 'axios';
import type {
  CreateFastSwapRequest,
  CreateFastSwapsRequest,
  ApiResponse,
  SwapOrderInfo,
  TpslTask,
  CreateLimitOrdersRequest,
  EditLimitOrderRequest,
  EnableLimitOrderRequest,
  LimitOrderInfo,
  WalletInfo,
  WalletQueryParams,
  TokenSecurityInfo,
  TokenSecurityQueryParams,
} from './types.js';

export class DbotClient {
  private client: AxiosInstance;
  private apiKey: string | undefined;
  private baseUrl: string;

  constructor(apiKey?: string, baseUrl = 'https://api-bot-v1.dbotx.com') {
    this.apiKey = apiKey || process.env.DBOT_API_KEY;
    if (!this.apiKey) {
      throw new Error('Please set the DBOT_API_KEY environment variable');
    }
    this.baseUrl = baseUrl;
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'X-API-KEY': this.apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * Converts request data to the format required by the API
   */
  private convertRequestData(request: CreateFastSwapRequest): Record<string, any> {
    const data: Record<string, any> = {
      chain: request.chain,
      pair: request.pair,
      walletId: request.walletId,
      type: request.type,
      customFeeAndTip: request.customFeeAndTip,
      priorityFee: request.priorityFee,
      gasFeeDelta: request.gasFeeDelta,
      maxFeePerGas: request.maxFeePerGas,
      jitoEnabled: request.jitoEnabled,
      jitoTip: request.jitoTip,
      maxSlippage: request.maxSlippage,
      concurrentNodes: request.concurrentNodes,
      retries: request.retries,
      amountOrPercent: request.amountOrPercent,
      migrateSellPercent: request.migrateSellPercent,
      minDevSellPercent: request.minDevSellPercent,
      devSellPercent: request.devSellPercent,
      stopEarnPercent: request.stopEarnPercent,
      stopLossPercent: request.stopLossPercent,
      pnlOrderExpireDelta: request.pnlOrderExpireDelta,
      pnlOrderExpireExecute: request.pnlOrderExpireExecute,
      pnlOrderUseMidPrice: request.pnlOrderUseMidPrice,
      pnlCustomConfigEnabled: request.pnlCustomConfigEnabled,
    };

    // Handle group settings
    if (request.stopEarnGroup) {
      data.stopEarnGroup = request.stopEarnGroup.map(group => ({
        pricePercent: group.pricePercent,
        amountPercent: group.amountPercent,
      }));
    }

    if (request.stopLossGroup) {
      data.stopLossGroup = request.stopLossGroup.map(group => ({
        pricePercent: group.pricePercent,
        amountPercent: group.amountPercent,
      }));
    }

    if (request.trailingStopGroup) {
      data.trailingStopGroup = request.trailingStopGroup.map(group => ({
        pricePercent: group.pricePercent,
        amountPercent: group.amountPercent,
      }));
    }

    // Handle custom configuration
    if (request.pnlCustomConfig) {
      data.pnlCustomConfig = {
        customFeeAndTip: request.pnlCustomConfig.customFeeAndTip,
        priorityFee: request.pnlCustomConfig.priorityFee,
        gasFeeDelta: request.pnlCustomConfig.gasFeeDelta,
        maxFeePerGas: request.pnlCustomConfig.maxFeePerGas,
        jitoEnabled: request.pnlCustomConfig.jitoEnabled,
        jitoTip: request.pnlCustomConfig.jitoTip,
        maxSlippage: request.pnlCustomConfig.maxSlippage,
        concurrentNodes: request.pnlCustomConfig.concurrentNodes,
        retries: request.pnlCustomConfig.retries,
      };
    }

    return data;
  }

  /**
   * Converts batch request data to the format required by the API
   */
  private convertBatchRequestData(request: CreateFastSwapsRequest): Record<string, any> {
    const data: Record<string, any> = {
      chain: request.chain,
      pair: request.pair,
      walletIdList: request.walletIdList,
      type: request.type,
      customFeeAndTip: request.customFeeAndTip,
      priorityFee: request.priorityFee,
      gasFeeDelta: request.gasFeeDelta,
      maxFeePerGas: request.maxFeePerGas,
      jitoEnabled: request.jitoEnabled,
      jitoTip: request.jitoTip,
      maxSlippage: request.maxSlippage,
      concurrentNodes: request.concurrentNodes,
      retries: request.retries,
      minAmount: request.minAmount,
      maxAmount: request.maxAmount,
      sellPercent: request.sellPercent,
      stopEarnPercent: request.stopEarnPercent,
      stopLossPercent: request.stopLossPercent,
      pnlOrderExpireDelta: request.pnlOrderExpireDelta,
      pnlOrderExpireExecute: request.pnlOrderExpireExecute,
      pnlOrderUseMidPrice: request.pnlOrderUseMidPrice,
      pnlCustomConfigEnabled: request.pnlCustomConfigEnabled,
    };

    // Handle group settings
    if (request.stopEarnGroup) {
      data.stopEarnGroup = request.stopEarnGroup.map(group => ({
        pricePercent: group.pricePercent,
        amountPercent: group.amountPercent,
      }));
    }

    if (request.stopLossGroup) {
      data.stopLossGroup = request.stopLossGroup.map(group => ({
        pricePercent: group.pricePercent,
        amountPercent: group.amountPercent,
      }));
    }

    if (request.trailingStopGroup) {
      data.trailingStopGroup = request.trailingStopGroup.map(group => ({
        pricePercent: group.pricePercent,
        amountPercent: group.amountPercent,
      }));
    }

    // Handle custom configuration
    if (request.pnlCustomConfig) {
      data.pnlCustomConfig = {
        customFeeAndTip: request.pnlCustomConfig.customFeeAndTip,
        priorityFee: request.pnlCustomConfig.priorityFee,
        gasFeeDelta: request.pnlCustomConfig.gasFeeDelta,
        maxFeePerGas: request.pnlCustomConfig.maxFeePerGas,
        jitoEnabled: request.pnlCustomConfig.jitoEnabled,
        jitoTip: request.pnlCustomConfig.jitoTip,
        maxSlippage: request.pnlCustomConfig.maxSlippage,
        concurrentNodes: request.pnlCustomConfig.concurrentNodes,
        retries: request.pnlCustomConfig.retries,
      };
    }

    return data;
  }

  /**
   * Creates a fast buy/sell trade order
   */
  async createFastSwap(request: CreateFastSwapRequest): Promise<ApiResponse<{ id: string }>> {
    const url = '/automation/swap_order';
    const data = this.convertRequestData(request);
    
    const response = await this.client.post(url, data);
    return response.data;
  }

  /**
   * Creates batch fast buy/sell trade orders
   */
  async createFastSwaps(request: CreateFastSwapsRequest): Promise<ApiResponse<{ id: string }[]>> {
    const url = '/automation/swap_orders';
    const data = this.convertBatchRequestData(request);
    
    const response = await this.client.post(url, data);
    return response.data;
  }

  /**
   * Queries fast buy/sell order information
   */
  async getSwapOrderInfo(orderIds: string[]): Promise<ApiResponse<SwapOrderInfo[]>> {
    const url = '/automation/swap_orders';
    const params = { ids: orderIds.join(',') };
    
    const response = await this.client.get(url, { params });
    const data = response.data;
    
    // Convert response data field names
    if (data.res && Array.isArray(data.res)) {
      data.res = data.res.map((order: any) => ({
        id: order.id,
        state: order.state,
        chain: order.chain,
        tradeType: order.tradeType || order.trade_type,
        txPriceUsd: order.txPriceUsd || order.tx_price_usd,
        swapHash: order.swapHash || order.swap_hash,
        errorCode: order.errorCode || order.error_code || '',
        errorMessage: order.errorMessage || order.error_message || '',
      }));
    }
    
    return data;
  }

  /**
   * Gets all take-profit/stop-loss tasks created by the user's fast buy/sell
   */
  async getSwapTpslTasks(params?: {
    page?: number;
    size?: number;
    chain?: string;
    state?: string;
    sourceId?: string;
    token?: string;
    sortBy?: string;
    sort?: number;
  }): Promise<ApiResponse<TpslTask[]>> {
    const url = '/automation/pnl_orders_from_swap_order';
    
    const response = await this.client.get(url, { params });
    return response.data;
  }

  /**
   * Gets user's fast buy/sell records
   */
  async getSwapRecords(params?: {
    page?: number;
    size?: number;
    chain?: string;
  }): Promise<ApiResponse<any[]>> {
    const url = '/account/swap_trades';
    const response = await this.client.get(url, { params });
    return response.data;
  }

  // --- Limit Order Methods ---

  /**
   * Creates limit orders
   */
  async createLimitOrders(request: CreateLimitOrdersRequest): Promise<ApiResponse<any>> {
    const url = '/automation/limit_orders';
    const response = await this.client.post(url, request);
    return response.data;
  }

  /**
   * Gets the list of limit orders
   */
  async getLimitOrders(params?: {
    page?: number;
    size?: number;
    chain?: string;
    state?: string;
    groupId?: string;
    token?: string;
  }): Promise<ApiResponse<LimitOrderInfo[]>> {
    const url = '/automation/limit_orders';
    const response = await this.client.get(url, { params });
    return response.data;
  }

  /**
   * Edits a limit order
   */
  async editLimitOrder(request: EditLimitOrderRequest): Promise<ApiResponse<any>> {
    const url = '/automation/limit_order';
    const response = await this.client.patch(url, request);
    return response.data;
  }

  /**
   * Enables/disables a limit order
   */
  async enableLimitOrder(request: EnableLimitOrderRequest): Promise<ApiResponse<any>> {
    const url = '/automation/limit_order';
    const response = await this.client.patch(url, request);
    return response.data;
  }

  /**
   * Deletes a limit order
   */
  async deleteLimitOrder(orderId: string): Promise<ApiResponse<any>> {
    const url = `/automation/limit_order/${orderId}`;
    const response = await this.client.delete(url);
    return response.data;
  }

  // --- Wallet Query Methods ---

  /**
   * Get user's wallets for a specific chain
   */
  async getWallets(params: WalletQueryParams = {}): Promise<ApiResponse<WalletInfo[]>> {
    const url = '/account/wallets';
    const queryParams = {
      type: params.type || 'solana',
      page: params.page || 0,
      size: params.size || 20,
    };
    
    const response = await this.client.get(url, { params: queryParams });
    return response.data;
  }

  // --- Token Security Methods ---

  /**
   * Get token security information
   */
  async getTokenSecurityInfo(params: TokenSecurityQueryParams): Promise<ApiResponse<TokenSecurityInfo>> {
    const url = 'https://servapi.dbotx.com/dex/poolinfo';
    const queryParams = {
      chain: params.chain || 'solana',
      pair: params.pair,
    };
    
    // Create a new axios instance with auth headers for this specific API
    const response = await axios.get(url, { 
      params: queryParams, 
      timeout: 30000,
      headers: {
        'X-API-KEY': this.apiKey,
        'Content-Type': 'application/json',
      }
    });
    return response.data;
  }
} 