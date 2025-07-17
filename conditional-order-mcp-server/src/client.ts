import axios, { AxiosInstance } from 'axios';
import type {
  CreateMigrateOrderRequest,
  CreateDevOrderRequest,
  UpdateMigrateOrderRequest,
  UpdateDevOrderRequest,
  ToggleOrderRequest,
  ApiResponse,
  OrderResponse,
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
   * Converts the sell-on-open order request data to the format required by the API.
   */
  private convertMigrateOrderData(request: CreateMigrateOrderRequest | UpdateMigrateOrderRequest): Record<string, any> {
    const data: Record<string, any> = {
      chain: request.chain,
      pairType: request.pairType,
      pair: request.pair,
      walletId: request.walletId,
      tradeType: request.tradeType,
      amountOrPercent: request.amountOrPercent,
      customFeeAndTip: request.customFeeAndTip,
      priorityFee: request.priorityFee,
      jitoEnabled: request.jitoEnabled,
      jitoTip: request.jitoTip,
      expireDelta: request.expireDelta,
      maxSlippage: request.maxSlippage,
      concurrentNodes: request.concurrentNodes,
      retries: request.retries,
    };

    // If it's an update request, add the ID
    if ('id' in request) {
      data.id = request.id;
    }

    return data;
  }

  /**
   * Converts the follow-dev-sell order request data to the format required by the API.
   */
  private convertDevOrderData(request: CreateDevOrderRequest | UpdateDevOrderRequest): Record<string, any> {
    const data: Record<string, any> = {
      chain: request.chain,
      pairType: request.pairType,
      pair: request.pair,
      walletId: request.walletId,
      tradeType: request.tradeType,
      minDevSellPercent: request.minDevSellPercent,
      amountOrPercent: request.amountOrPercent,
      customFeeAndTip: request.customFeeAndTip,
      priorityFee: request.priorityFee,
      jitoEnabled: request.jitoEnabled,
      jitoTip: request.jitoTip,
      expireDelta: request.expireDelta,
      maxSlippage: request.maxSlippage,
      concurrentNodes: request.concurrentNodes,
      retries: request.retries,
    };

    // If it's an update request, add the ID
    if ('id' in request) {
      data.id = request.id;
    }

    return data;
  }

  /**
   * Creates a sell-on-open task.
   */
  async createMigrateOrder(request: CreateMigrateOrderRequest): Promise<ApiResponse<OrderResponse>> {
    const url = '/automation/migrate_order';
    const data = this.convertMigrateOrderData(request);
    
    const response = await this.client.post(url, data);
    return response.data;
  }

  /**
   * Creates a follow-dev-sell task.
   */
  async createDevOrder(request: CreateDevOrderRequest): Promise<ApiResponse<OrderResponse>> {
    const url = '/automation/dev_order';
    const data = this.convertDevOrderData(request);
    
    const response = await this.client.post(url, data);
    return response.data;
  }

  /**
   * Edits a sell-on-open task.
   */
  async updateMigrateOrder(request: UpdateMigrateOrderRequest): Promise<ApiResponse<string>> {
    const url = '/automation/migrate_order';
    const data = this.convertMigrateOrderData(request);
    
    const response = await this.client.patch(url, data);
    return response.data;
  }

  /**
   * Edits a follow-dev-sell task.
   */
  async updateDevOrder(request: UpdateDevOrderRequest): Promise<ApiResponse<string>> {
    const url = '/automation/dev_order';
    const data = this.convertDevOrderData(request);
    
    const response = await this.client.patch(url, data);
    return response.data;
  }

  /**
   * Toggles a sell-on-open task on/off.
   */
  async toggleMigrateOrder(request: ToggleOrderRequest): Promise<ApiResponse<string>> {
    const url = '/automation/migrate_order';
    const data = {
      id: request.id,
      enabled: request.enabled,
    };
    
    const response = await this.client.patch(url, data);
    return response.data;
  }

  /**
   * Toggles a follow-dev-sell task on/off.
   */
  async toggleDevOrder(request: ToggleOrderRequest): Promise<ApiResponse<string>> {
    const url = '/automation/dev_order';
    const data = {
      id: request.id,
      enabled: request.enabled,
    };
    
    const response = await this.client.patch(url, data);
    return response.data;
  }

  /**
   * Deletes a sell-on-open task.
   */
  async deleteMigrateOrder(orderId: string): Promise<ApiResponse<string>> {
    const url = `/automation/migrate_order/${orderId}`;
    
    const response = await this.client.delete(url);
    return response.data;
  }

  /**
   * Deletes a follow-dev-sell task.
   */
  async deleteDevOrder(orderId: string): Promise<ApiResponse<string>> {
    const url = `/automation/dev_order/${orderId}`;
    
    const response = await this.client.delete(url);
    return response.data;
  }

  /**
   * Gets the list of sell-on-open tasks.
   */
  async getMigrateOrders(page = 0, size = 20, chain = 'solana', state?: string, source?: string): Promise<ApiResponse<any>> {
    const url = '/automation/migrate_orders';
    const params: Record<string, any> = {
      page,
      size,
      chain,
    };
    
    if (state) {
      params.state = state;
    }
    if (source) {
      params.source = source;
    }
    
    const response = await this.client.get(url, { params });
    return response.data;
  }

  /**
   * Gets the list of follow-dev-sell tasks.
   */
  async getDevOrders(page = 0, size = 20, chain = 'solana', state?: string, source?: string): Promise<ApiResponse<any>> {
    const url = '/automation/dev_orders';
    const params: Record<string, any> = {
      page,
      size,
      chain,
    };
    
    if (state) {
      params.state = state;
    }
    if (source) {
      params.source = source;
    }
    
    const response = await this.client.get(url, { params });
    return response.data;
  }

  // --- Wallet Management Methods ---

  /**
   * Get user wallets
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