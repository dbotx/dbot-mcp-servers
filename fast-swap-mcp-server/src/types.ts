import { z } from 'zod';

// Helper function to get default values from environment variables
export function getEnvDefault<T>(envKey: string, defaultValue: T, transform?: (value: string) => T): T {
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
export const ChainSchema = z.enum(['solana', 'ethereum', 'base', 'bsc', 'tron']);
export const TradeTypeSchema = z.enum(['buy', 'sell']);

export type Chain = z.infer<typeof ChainSchema>;
export type TradeType = z.infer<typeof TradeTypeSchema>;

// Take-profit/Stop-loss groups
export const PnlGroupSchema = z.object({
  pricePercent: z.number().min(0).max(10), // Price change percentage
  amountPercent: z.number().min(0).max(1), // Sell ratio
});

export type PnlGroup = z.infer<typeof PnlGroupSchema>;

// Custom take-profit/stop-loss configuration
export const PnlCustomConfigSchema = z.object({
  customFeeAndTip: z.boolean().default(getEnvDefault('DBOT_CUSTOM_FEE_AND_TIP', false, (v) => v === 'true')),
  priorityFee: z.string().default(getEnvDefault('DBOT_PRIORITY_FEE', '0.0001')),
  gasFeeDelta: z.number().int().min(0).default(getEnvDefault('DBOT_GAS_FEE_DELTA', 5, Number)),
  maxFeePerGas: z.number().int().min(0).default(getEnvDefault('DBOT_MAX_FEE_PER_GAS', 100, Number)),
  jitoEnabled: z.boolean().default(getEnvDefault('DBOT_JITO_ENABLED', true, (v) => v === 'true')),
  jitoTip: z.number().min(0).default(getEnvDefault('DBOT_JITO_TIP', 0.001, Number)),
  maxSlippage: z.number().min(0).max(1).default(getEnvDefault('DBOT_MAX_SLIPPAGE', 0.1, Number)),
  concurrentNodes: z.number().int().min(1).max(3).default(getEnvDefault('DBOT_CONCURRENT_NODES', 2, Number)),
  retries: z.number().int().min(0).max(10).default(getEnvDefault('DBOT_RETRIES', 1, Number)),
});

export type PnlCustomConfig = z.infer<typeof PnlCustomConfigSchema>;

// Fast swap request
export const CreateFastSwapRequestSchema = z.object({
  chain: ChainSchema.default(getEnvDefault('DBOT_CHAIN', 'solana')),
  pair: z.string().min(1),
  walletId: z.string().min(1),
  type: TradeTypeSchema,
  customFeeAndTip: z.boolean().default(getEnvDefault('DBOT_CUSTOM_FEE_AND_TIP', false, (v) => v === 'true')),
  priorityFee: z.string().default(getEnvDefault('DBOT_PRIORITY_FEE', '0.0001')),
  gasFeeDelta: z.number().int().min(0).default(getEnvDefault('DBOT_GAS_FEE_DELTA', 5, Number)),
  maxFeePerGas: z.number().int().min(0).default(getEnvDefault('DBOT_MAX_FEE_PER_GAS', 100, Number)),
  jitoEnabled: z.boolean().default(getEnvDefault('DBOT_JITO_ENABLED', true, (v) => v === 'true')),
  jitoTip: z.number().min(0).default(getEnvDefault('DBOT_JITO_TIP', 0.001, Number)),
  maxSlippage: z.number().min(0).max(1).default(getEnvDefault('DBOT_MAX_SLIPPAGE', 0.1, Number)),
  concurrentNodes: z.number().int().min(1).max(3).default(getEnvDefault('DBOT_CONCURRENT_NODES', 2, Number)),
  retries: z.number().int().min(0).max(10).default(getEnvDefault('DBOT_RETRIES', 1, Number)),
  amountOrPercent: z.number().min(0).default(getEnvDefault('DBOT_AMOUNT_OR_PERCENT', 0.001, Number)),
  migrateSellPercent: z.number().min(0).max(1).default(getEnvDefault('DBOT_MIGRATE_SELL_PERCENT', 1.0, Number)),
  minDevSellPercent: z.number().min(0).max(1).default(getEnvDefault('DBOT_MIN_DEV_SELL_PERCENT', 0.5, Number)),
  devSellPercent: z.number().min(0).max(1).default(getEnvDefault('DBOT_DEV_SELL_PERCENT', 1.0, Number)),
  stopEarnPercent: z.number().min(0).optional(),
  stopLossPercent: z.number().min(0).max(1).optional(),
  stopEarnGroup: z.array(PnlGroupSchema).max(6).optional(),
  stopLossGroup: z.array(PnlGroupSchema).max(6).optional(),
  trailingStopGroup: z.array(PnlGroupSchema).max(1).optional(),
  pnlOrderExpireDelta: z.number().int().min(0).max(432000000).default(getEnvDefault('DBOT_PNL_ORDER_EXPIRE_DELTA', 43200000, Number)),
  pnlOrderExpireExecute: z.boolean().default(getEnvDefault('DBOT_PNL_ORDER_EXPIRE_EXECUTE', false, (v) => v === 'true')),
  pnlOrderUseMidPrice: z.boolean().default(getEnvDefault('DBOT_PNL_ORDER_USE_MID_PRICE', false, (v) => v === 'true')),
  pnlCustomConfigEnabled: z.boolean().default(getEnvDefault('DBOT_PNL_CUSTOM_CONFIG_ENABLED', true, (v) => v === 'true')),
  pnlCustomConfig: PnlCustomConfigSchema.optional(),
});

export type CreateFastSwapRequest = z.infer<typeof CreateFastSwapRequestSchema>;

// Batch fast swap request
export const CreateFastSwapsRequestSchema = z.object({
  chain: ChainSchema.default('solana'),
  pair: z.string().min(1),
  walletIdList: z.array(z.string()).max(5).min(1),
  type: TradeTypeSchema,
  customFeeAndTip: z.boolean().default(false),
  priorityFee: z.string().default(''),
  gasFeeDelta: z.number().int().min(0).default(5),
  maxFeePerGas: z.number().int().min(0).default(100),
  jitoEnabled: z.boolean().default(false),
  jitoTip: z.number().min(0).default(0.001),
  maxSlippage: z.number().min(0).max(1).default(0.1),
  concurrentNodes: z.number().int().min(1).max(3).default(2),
  retries: z.number().int().min(0).max(10).default(1),
  minAmount: z.number().min(0).optional(),
  maxAmount: z.number().min(0).optional(),
  sellPercent: z.number().min(0).max(1).default(1.0),
  stopEarnPercent: z.number().min(0).optional(),
  stopLossPercent: z.number().min(0).max(1).optional(),
  stopEarnGroup: z.array(PnlGroupSchema).max(6).optional(),
  stopLossGroup: z.array(PnlGroupSchema).max(6).optional(),
  trailingStopGroup: z.array(PnlGroupSchema).max(1).optional(),
  pnlOrderExpireDelta: z.number().int().min(0).max(432000000).default(43200000),
  pnlOrderExpireExecute: z.boolean().default(false),
  pnlOrderUseMidPrice: z.boolean().default(false),
  pnlCustomConfigEnabled: z.boolean().default(true),
  pnlCustomConfig: PnlCustomConfigSchema.optional(),
});

export type CreateFastSwapsRequest = z.infer<typeof CreateFastSwapsRequestSchema>;

// API response type
export interface ApiResponse<T = any> {
  err: boolean;
  res: T;
  docs: string;
}

export interface SwapOrderInfo {
  id: string;
  state: 'init' | 'processing' | 'done' | 'fail' | 'expired';
  chain: string;
  tradeType: string;
  txPriceUsd?: number;
  swapHash?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface TpslTask {
  accountId: string;
  id: string;
  enabled: boolean;
  state: 'init' | 'processing' | 'done' | 'fail' | 'expired';
  chain: string;
  tradeType: 'buy' | 'sell';
  basePriceUsd?: number;
  triggerDirection: 'up' | 'down';
  triggerPriceUsd: number;
  triggerPercent: number;
  txPriceUsd?: number;
  currencyAmountUI: number;
  initPnlPercent: number;
  pair: string;
  pairType: string;
  walletId: string;
  walletType: 'solana' | 'evm';
  walletAddress: string;
  walletName: string;
  source: 'follow_order' | 'swap_order';
  sourceGroupIdx: number;
  sourceId: string;
  sourceTradeId: string;
  customFeeAndTip: boolean;
  priorityFee: string;
  gasFeeDelta: number;
  maxFeePerGas: number;
  jitoEnabled: boolean;
  jitoTip: number;
  maxSlippage: number;
  expireAt: number;
  expireDelta: number;
  useMidPrice: boolean;
  concurrentNodes: number;
  retries: number;
  errorCode?: string;
  errorMessage?: string;
  currencyInfo?: any;
  tokenInfo?: any;
  link?: string;
}

export interface SwapRecord {
  id: string;
  chain: string;
  pair: string;
  tradeType: string;
  amountOrPercent: number;
  state: string;
  txPriceUsd?: number;
  swapHash?: string;
  createdAt: string;
}

// --- Limit Order Types ---

export const TriggerDirectionSchema = z.enum(['up', 'down']);
export type TriggerDirection = z.infer<typeof TriggerDirectionSchema>;

// Schema definition for limit order settings
export const LimitOrderSettingSchema = z.object({
  enabled: z.boolean().default(true),
  tradeType: TradeTypeSchema,
  triggerPriceUsd: z.string(),
  triggerDirection: TriggerDirectionSchema,
  currencyAmountUI: z.union([z.string(), z.number()]),
  customFeeAndTip: z.boolean().default(getEnvDefault('DBOT_CUSTOM_FEE_AND_TIP', false, (v) => v === 'true')),
  priorityFee: z.string().default(getEnvDefault('DBOT_PRIORITY_FEE', '0.0001')),
  gasFeeDelta: z.number().int().min(0).default(getEnvDefault('DBOT_GAS_FEE_DELTA', 5, Number)),
  maxFeePerGas: z.number().int().min(0).default(getEnvDefault('DBOT_MAX_FEE_PER_GAS', 100, Number)),
  jitoEnabled: z.boolean().default(getEnvDefault('DBOT_JITO_ENABLED', true, (v) => v === 'true')),
  jitoTip: z.number().min(0).default(getEnvDefault('DBOT_JITO_TIP', 0.001, Number)),
  expireDelta: z.number().int().min(0).max(432000000).default(getEnvDefault('DBOT_PNL_ORDER_EXPIRE_DELTA', 360000000, Number)),
  expireExecute: z.boolean().default(getEnvDefault('DBOT_PNL_ORDER_EXPIRE_EXECUTE', false, (v) => v === 'true')),
  useMidPrice: z.boolean().default(getEnvDefault('DBOT_PNL_ORDER_USE_MID_PRICE', false, (v) => v === 'true')),
  maxSlippage: z.number().min(0).max(1).default(getEnvDefault('DBOT_MAX_SLIPPAGE', 0.1, Number)),
  concurrentNodes: z.number().int().min(1).max(3).default(getEnvDefault('DBOT_CONCURRENT_NODES', 2, Number)),
  retries: z.number().int().min(0).max(10).default(getEnvDefault('DBOT_RETRIES', 1, Number))
});

export type LimitOrderSetting = z.infer<typeof LimitOrderSettingSchema>;

// Schema definition for create limit order request
export const CreateLimitOrdersRequestSchema = z.object({
  chain: ChainSchema.default(getEnvDefault('DBOT_CHAIN', 'solana')),
  pair: z.string().min(1),
  walletId: z.string().min(1).optional(),
  groupId: z.string(),
  settings: z.array(LimitOrderSettingSchema)
});

export type CreateLimitOrdersRequest = z.infer<typeof CreateLimitOrdersRequestSchema>;

export interface EditLimitOrderRequest {
  id: string;
  enabled?: boolean;
  groupId?: string;
  triggerPriceUsd?: string;
  triggerDirection?: TriggerDirection;
  currencyAmountUI?: number;
  customFeeAndTip?: boolean;
  priorityFee?: string;
  gasFeeDelta?: number;
  maxFeePerGas?: number;
  jitoEnabled?: boolean;
  jitoTip?: number;
  expireDelta?: number;
  expireExecute?: boolean;
  useMidPrice?: boolean;
  maxSlippage?: number;
  concurrentNodes?: number;
  retries?: number;
}

export interface EnableLimitOrderRequest {
  id: string;
  enabled: boolean;
}

export interface LimitOrderInfo {
  accountId: string;
  id: string;
  enabled: boolean;
  groupId: string;
  state: 'init' | 'processing' | 'done' | 'fail' | 'expired';
  chain: Chain;
  tradeType: TradeType;
  triggerDirection: TriggerDirection;
  triggerPriceUsd: number;
  currencyAmountUI: number;
  pair: string;
  pairType: string;
  walletId: string;
  walletType: 'solana' | 'evm';
  walletAddress: string;
  walletName: string;
  customFeeAndTip: boolean;
  priorityFee: string | null;
  gasFeeDelta: number;
  maxFeePerGas: number;
  jitoEnabled: boolean;
  jitoTip: number;
  maxSlippage: number;
  expireAt: number;
  expireDelta: number;
  expireExecute: boolean;
  useMidPrice: boolean;
  concurrentNodes: number;
  retries: number;
  errorCode: string;
  errorMessage: string;
  currencyInfo: Record<string, any>;
  tokenInfo: Record<string, any>;
  links: Record<string, any>;
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
    case 'ethereum':
    case 'base':
    case 'bsc':
      fallbackKey = 'DBOT_WALLET_ID_EVM';
      break;
    case 'tron':
      fallbackKey = 'DBOT_WALLET_ID_TRON';
      break;
    default:
      fallbackKey = 'DBOT_WALLET_ID_EVM';
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