import axios, { AxiosInstance } from 'axios';
import type {
  CreateCopyTradingRequest,
  EditCopyTradingRequest,
  SwitchCopyTradingRequest,
  DeleteCopyTradingRequest,
  ApiResponse,
  CopyTradingTask,
} from './types.js';

export class DbotCopyTradingClient {
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
   * Create a copy trading task
   */
  async createCopyTrading(request: CreateCopyTradingRequest): Promise<ApiResponse<{ id: string }>> {
    const url = '/automation/follow_order';
    
    const response = await this.client.post(url, request);
    return response.data;
  }

  /**
   * Edit a copy trading task
   */
  async editCopyTrading(request: EditCopyTradingRequest): Promise<ApiResponse<string>> {
    const url = '/automation/follow_order';
    
    const response = await this.client.post(url, request);
    return response.data;
  }

  /**
   * Enable/disable a copy trading task
   */
  async switchCopyTrading(request: SwitchCopyTradingRequest): Promise<ApiResponse<string>> {
    const url = '/automation/follow_order';
    const data = { 
      id: request.id,
      enabled: request.enabled,
      closePnlOrder: request.closePnlOrder
    };
    
    const response = await this.client.patch(url, data);
    return response.data;
  }

  /**
   * Delete a copy trading task
   */
  async deleteCopyTrading(request: DeleteCopyTradingRequest): Promise<ApiResponse<string>> {
    const url = `/automation/follow_order/${request.id}`;
    const params = {
      deletePnlOrder: request.deletePnlOrder
    };
    
    const response = await this.client.delete(url, { params });
    return response.data;
  }

  /**
   * Get the list of copy trading tasks (if supported by the API)
   */
  async getCopyTradingTasks(page = 0, size = 20): Promise<ApiResponse<CopyTradingTask[]>> {
    const url = '/automation/follow_orders';
    const params = {
      page,
      size,
    };
    
    const response = await this.client.get(url, { params });
    return response.data;
  }
} 