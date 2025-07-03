import axios, { AxiosInstance } from 'axios';
import type {
  CreateLimitOrderRequest,
  EditLimitOrderRequest,
  SwitchLimitOrderRequest,
  DeleteLimitOrderRequest,
  DeleteLimitOrdersRequest,
  DeleteAllLimitOrderRequest,
  LimitOrdersRequest,
  ApiResponse,
  LimitOrder,
} from './types.js';

export class DbotLimitOrderClient {
  private client: AxiosInstance;
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string, baseUrl = 'https://api-bot-v1.dbotx.com') {
    this.apiKey = apiKey || process.env.DBOT_API_KEY || '';
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
   * Create a limit order
   */
  async createLimitOrder(request: CreateLimitOrderRequest): Promise<ApiResponse<{ ids: string[] }>> {
    const url = '/automation/limit_orders'; // Use plural form
    
    const response = await this.client.post(url, request);
    return response.data;
  }

  /**
   * Edit a limit order
   */
  async editLimitOrder(request: EditLimitOrderRequest): Promise<ApiResponse<string>> {
    const url = `/automation/limit_order`;
    
    const response = await this.client.patch(url, request);
    return response.data;
  }

  /**
   * Enable/disable a limit order
   */
  async switchLimitOrder(request: SwitchLimitOrderRequest): Promise<ApiResponse<string>> {
    const url = '/automation/limit_order';
    const data = { 
      id: request.id,
      enabled: request.enabled 
    };
    
    const response = await this.client.patch(url, data);
    return response.data;
  }

  /**
   * Delete a limit order
   */
  async deleteLimitOrder(request: DeleteLimitOrderRequest): Promise<ApiResponse<string>> {
    const url = `/automation/limit_order/${request.id}`;
    
    const response = await this.client.delete(url);
    return response.data;
  }

  /**
   * Delete limit orders in batch
   */
  async deleteLimitOrders(request: DeleteLimitOrdersRequest): Promise<ApiResponse<string>> {
    const url = '/automation/limit_order/delete_many';
    const data = { ids: request.ids };
    
    const response = await this.client.post(url, data);
    return response.data;
  }

  /**
   * Delete all limit orders
   */
  async deleteAllLimitOrders(request: DeleteAllLimitOrderRequest): Promise<ApiResponse<string>> {
    const url = '/automation/limit_order/delete_all';
    const params = {
      source: request.source
    };
    
    const response = await this.client.delete(url, { params });
    return response.data;
  }

  /**
   * Get a list of limit orders
   */
  async getLimitOrders(request: Partial<LimitOrdersRequest> = {}): Promise<ApiResponse<LimitOrder[]>> {
    const url = '/automation/limit_orders';
    
    // Use default parameters page=0&size=20&chain=&state=init&groupId=&token=&sortBy=&sort=-1
    const params: Record<string, any> = {
      page: request.page ?? 0,
      size: request.size ?? 20,
      chain: request.chain ?? '',
      state: request.state ?? 'init',
      groupId: request.groupId ?? '',
      token: request.token ?? '',
      sortBy: request.sortBy ?? '',
      sort: request.sort ?? -1,
    };
    
    // Only add optional parameters that have values
    if (request.pair) params.pair = request.pair;
    if (request.enabled !== undefined) params.enabled = request.enabled;
    
    const response = await this.client.get(url, { params });
    return response.data;
  }
} 