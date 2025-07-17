import { z } from 'zod';

// Helper function to get default values from environment variables
function getEnvDefault<T>(envKey: string, defaultValue: T, transform?: (value: string) => T): T {
  const envValue = process.env[envKey];
  if (envValue === undefined) {
    return defaultValue;
  }
  if (transform) {
    try {
      return transform(envValue);
    } catch (e) {
      console.warn(`Warning: Invalid value for ${envKey}, using default value`);
      return defaultValue;
    }
  }
  return envValue as unknown as T;
}

// Base type definitions
export const ChainSchema = z.enum(['solana']);
export const PairTypeSchema = z.enum(['pump', 'raydium_amm']);
export const TradeTypeSchema = z.enum(['sell']);

export type Chain = z.infer<typeof ChainSchema>;
export type PairType = z.infer<typeof PairTypeSchema>;
export type TradeType = z.infer<typeof TradeTypeSchema>;

// Request to create a sell-on-open order
export const CreateMigrateOrderRequestSchema = z.object({
  chain: ChainSchema.default(getEnvDefault('DBOT_CHAIN', 'solana')),
  pairType: PairTypeSchema.default('pump'),
  pair: z.string().min(1),
  walletId: z.string().min(1),
  tradeType: TradeTypeSchema.default('sell'),
  amountOrPercent: z.number().min(0).max(1),
  customFeeAndTip: z.boolean().default(getEnvDefault('DBOT_CUSTOM_FEE_AND_TIP', false, (v) => v === 'true')),
  priorityFee: z.string().default(getEnvDefault('DBOT_PRIORITY_FEE', '0.0001')),
  jitoEnabled: z.boolean().default(getEnvDefault('DBOT_JITO_ENABLED', true, (v) => v === 'true')),
  jitoTip: z.number().min(0).default(getEnvDefault('DBOT_JITO_TIP', 0.001, Number)),
  expireDelta: z.number().int().min(0).max(432000000).default(getEnvDefault('DBOT_EXPIRE_DELTA', 360000000, Number)),
  maxSlippage: z.number().min(0).max(1).default(getEnvDefault('DBOT_MAX_SLIPPAGE', 0.1, Number)),
  concurrentNodes: z.number().int().min(1).max(3).default(getEnvDefault('DBOT_CONCURRENT_NODES', 2, Number)),
  retries: z.number().int().min(0).max(10).default(getEnvDefault('DBOT_RETRIES', 1, Number)),
});

export type CreateMigrateOrderRequest = z.infer<typeof CreateMigrateOrderRequestSchema>;

// Request to create a follow-dev-sell order
export const CreateDevOrderRequestSchema = z.object({
  chain: ChainSchema.default(getEnvDefault('DBOT_CHAIN', 'solana')),
  pairType: PairTypeSchema.default('pump'),
  pair: z.string().min(1),
  walletId: z.string().min(1),
  tradeType: TradeTypeSchema.default('sell'),
  minDevSellPercent: z.number().min(0).max(1).default(getEnvDefault('DBOT_MIN_DEV_SELL_PERCENT', 0.5, Number)),
  amountOrPercent: z.number().min(0).max(1),
  customFeeAndTip: z.boolean().default(getEnvDefault('DBOT_CUSTOM_FEE_AND_TIP', false, (v) => v === 'true')),
  priorityFee: z.string().default(getEnvDefault('DBOT_PRIORITY_FEE', '0.0001')),
  jitoEnabled: z.boolean().default(getEnvDefault('DBOT_JITO_ENABLED', true, (v) => v === 'true')),
  jitoTip: z.number().min(0).default(getEnvDefault('DBOT_JITO_TIP', 0.001, Number)),
  expireDelta: z.number().int().min(0).max(432000000).default(getEnvDefault('DBOT_EXPIRE_DELTA', 360000000, Number)),
  maxSlippage: z.number().min(0).max(1).default(getEnvDefault('DBOT_MAX_SLIPPAGE', 0.1, Number)),
  concurrentNodes: z.number().int().min(1).max(3).default(getEnvDefault('DBOT_CONCURRENT_NODES', 2, Number)),
  retries: z.number().int().min(0).max(10).default(getEnvDefault('DBOT_RETRIES', 1, Number)),
});

export type CreateDevOrderRequest = z.infer<typeof CreateDevOrderRequestSchema>;

// Request to update a sell-on-open order
export const UpdateMigrateOrderRequestSchema = z.object({
  id: z.string().min(1),
  chain: ChainSchema.default('solana'),
  pairType: PairTypeSchema.default('pump'),
  pair: z.string().min(1),
  walletId: z.string().min(1),
  tradeType: TradeTypeSchema.default('sell'),
  amountOrPercent: z.number().min(0).max(1),
  customFeeAndTip: z.boolean().default(false),
  priorityFee: z.string().default('0.0001'),
  jitoEnabled: z.boolean().default(true),
  jitoTip: z.number().min(0).default(0.001),
  expireDelta: z.number().int().min(0).max(432000000).default(360000000),
  maxSlippage: z.number().min(0).max(1).default(0.1),
  concurrentNodes: z.number().int().min(1).max(3).default(2),
  retries: z.number().int().min(0).max(10).default(1),
});

export type UpdateMigrateOrderRequest = z.infer<typeof UpdateMigrateOrderRequestSchema>;

// Request to update a follow-dev-sell order
export const UpdateDevOrderRequestSchema = z.object({
  id: z.string().min(1),
  chain: ChainSchema.default('solana'),
  pairType: PairTypeSchema.default('pump'),
  pair: z.string().min(1),
  walletId: z.string().min(1),
  tradeType: TradeTypeSchema.default('sell'),
  minDevSellPercent: z.number().min(0).max(1).default(0.5),
  amountOrPercent: z.number().min(0).max(1),
  customFeeAndTip: z.boolean().default(false),
  priorityFee: z.string().default('0.0001'),
  jitoEnabled: z.boolean().default(true),
  jitoTip: z.number().min(0).default(0.001),
  expireDelta: z.number().int().min(0).max(432000000).default(360000000),
  maxSlippage: z.number().min(0).max(1).default(0.1),
  concurrentNodes: z.number().int().min(1).max(3).default(2),
  retries: z.number().int().min(0).max(10).default(1),
});

export type UpdateDevOrderRequest = z.infer<typeof UpdateDevOrderRequestSchema>;

// Request to toggle an order
export const ToggleOrderRequestSchema = z.object({
  id: z.string().min(1),
  enabled: z.boolean(),
});

export type ToggleOrderRequest = z.infer<typeof ToggleOrderRequestSchema>;

// API response type
export interface ApiResponse<T = any> {
  err: boolean;
  res: T;
  docs: string;
}

export interface OrderResponse {
  id: string;
}

export interface OrderInfo {
  id: string;
  chain: string;
  pairType: string;
  pair: string;
  walletId: string;
  tradeType: string;
  amountOrPercent: number;
  enabled: boolean;
  state: 'init' | 'processing' | 'done' | 'fail' | 'expired';
  createdAt?: string;
  updatedAt?: string;
  errorCode?: string;
  errorMessage?: string;
}

// Task list query parameters
export const GetOrdersRequestSchema = z.object({
  page: z.number().int().min(0).default(0),
  size: z.number().int().min(1).max(100).default(20),
  chain: ChainSchema.default('solana'),
  state: z.enum(['init', 'processing', 'done', 'fail', 'expired']).optional(),
  source: z.string().optional(),
});

export type GetOrdersRequest = z.infer<typeof GetOrdersRequestSchema>;

// Extended task info type for different order types
export interface MigrateOrderInfo extends OrderInfo {
  // Fields specific to sell-on-open orders
}

export interface DevOrderInfo extends OrderInfo {
  // Fields specific to follow-dev-sell orders
  minDevSellPercent: number;
}

// Task list response type
export interface OrdersListResponse {
  orders: OrderInfo[];
  total: number;
  page: number;
  size: number;
} 

// --- Wallet Query Types ---

export interface WalletInfo {
  id: string;
  name: string;
  type: 'solana' | 'evm';
  address: string;
}

export interface WalletQueryParams {
  type?: 'solana' | 'evm';
  page?: number;
  size?: number;
}

// --- Token Security Types ---

export interface TokenSecurityInfo {
  type: string;
  pair: string;
  tokenReserve: string;
  currencyReserve: string;
  tokenPriceUsd: number;
  currencyPriceUsd: number;
  exchange: string;
  tokenInfo: {
    contract: string;
    name: string;
    symbol: string;
    decimals: number;
    icon: string;
    priceUsd: number;
  };
  currencyInfo: {
    contract: string;
    name: string;
    symbol: string;
    decimals: number;
    icon: string;
    priceUsd: number;
  };
  poolSafetyInfo: {
    type: string;
    canMint: boolean;
    canFrozen: boolean;
    totalSupply: string;
    totalSupplyUI: string;
    transferFeePercent: number | null;
    isDelegated: boolean | null;
    tokenReserve: string;
    tokenReserveUI: string;
    currencyReserve: string;
    currencyReserveUI: string;
    lpReserve: string | null;
    lpReserveUI: string | null;
    burnedOrLockedLp: string | null;
    burnedOrLockedLpUI: string | null;
    burnedOrLockedLpPercent: number | null;
    top10Percent: number;
  };
  liquidityUsd: number;
  tokenMcUsd: number;
  tokenCreateAt: number;
  poolCreator: string;
  poolCreatorName: string | null;
  progress: number | null;
  priceImpact: number | null;
  devHoldPercent: number | null;
  poolCreateAt: number;
  links: {
    website: string | null;
    twitter: string | null;
    telegram: string | null;
  };
}

export interface TokenSecurityQueryParams {
  chain?: string;
  pair: string;
}

// --- Wallet ID Helper Function ---

export interface WalletIdConfig {
  DBOT_WALLET_ID_SOLANA?: string;
  DBOT_WALLET_ID_EVM?: string;
  DBOT_WALLET_ID_TRON?: string;
  DBOT_WALLET_ID_BASE?: string;
  DBOT_WALLET_ID_ARBITRUM?: string;
  DBOT_WALLET_ID_BSC?: string;
}

/**
 * Get wallet ID based on chain
 */
export function getWalletIdByChain(chain: Chain): string {
  const chainUpperCase = chain.toUpperCase();
  
  // Check specific chain first
  const specificWalletId = process.env[`DBOT_WALLET_ID_${chainUpperCase}`];
  if (specificWalletId) {
    return specificWalletId;
  }
  
  // Fall back to generic chain type
  let fallbackKey = '';
  switch (chain) {
    case 'solana':
      fallbackKey = 'DBOT_WALLET_ID_SOLANA';
      break;
    default:
      fallbackKey = 'DBOT_WALLET_ID_SOLANA';
  }
  
  const fallbackWalletId = process.env[fallbackKey];
  if (fallbackWalletId) {
    return fallbackWalletId;
  }
  
  throw new Error(`No wallet ID configured for chain ${chain}. Please configure at least one of the following environment variables: DBOT_WALLET_ID_SOLANA, DBOT_WALLET_ID_EVM, DBOT_WALLET_ID_TRON, DBOT_WALLET_ID_BASE, DBOT_WALLET_ID_ARBITRUM, DBOT_WALLET_ID_BSC`);
}

/**
 * Check if at least one wallet ID is configured
 */
export function validateWalletIdConfig(): void {
  const requiredEnvVars = [
    'DBOT_WALLET_ID_SOLANA',
    'DBOT_WALLET_ID_EVM', 
    'DBOT_WALLET_ID_TRON',
    'DBOT_WALLET_ID_BASE',
    'DBOT_WALLET_ID_ARBITRUM',
    'DBOT_WALLET_ID_BSC'
  ];
  
  const hasAtLeastOne = requiredEnvVars.some(envVar => process.env[envVar]);
  
  if (!hasAtLeastOne) {
    throw new Error(`At least one wallet ID must be configured. Please set one of the following environment variables: ${requiredEnvVars.join(', ')}`);
  }
} 