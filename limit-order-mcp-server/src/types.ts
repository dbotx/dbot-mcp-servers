import { z } from 'zod';

// Basic type definitions
export const ChainSchema = z.enum(['solana', 'ethereum', 'base', 'bsc', 'tron']);
export const TradeTypeSchema = z.enum(['buy', 'sell']);
export const TriggerDirectionSchema = z.enum(['up', 'down']);

export type Chain = z.infer<typeof ChainSchema>;
export type TradeType = z.infer<typeof TradeTypeSchema>;
export type TriggerDirection = z.infer<typeof TriggerDirectionSchema>;

// Limit order settings
export const LimitOrderSettingSchema = z.object({
  enabled: z.boolean().default(true),
  tradeType: TradeTypeSchema,
  triggerPriceUsd: z.string().min(1),
  triggerDirection: TriggerDirectionSchema,
  currencyAmountUI: z.number().min(0),
  customFeeAndTip: z.boolean().default(false),
  priorityFee: z.string().default('0.0001'),
  gasFeeDelta: z.number().int().min(0).default(5),
  maxFeePerGas: z.number().int().min(0).default(100),
  jitoEnabled: z.boolean().default(true),
  jitoTip: z.number().min(0).default(0.001),
  expireDelta: z.number().int().min(0).max(432000000).default(432000000),
  expireExecute: z.boolean().default(false),
  useMidPrice: z.boolean().default(false),
  maxSlippage: z.number().min(0).max(1).default(0.1),
  concurrentNodes: z.number().int().min(1).max(3).default(2),
  retries: z.number().int().min(0).max(10).default(1),
});

export type LimitOrderSetting = z.infer<typeof LimitOrderSettingSchema>;

// Create limit order request - supports multiple settings
export const CreateLimitOrderRequestSchema = z.object({
  chain: ChainSchema.default('solana'),
  pair: z.string().min(1),
  walletId: z.string().min(1).optional(),
  groupId: z.string().optional(),
  settings: z.array(LimitOrderSettingSchema).min(1),
});

export type CreateLimitOrderRequest = z.infer<typeof CreateLimitOrderRequestSchema>;

// Edit limit order request
export const EditLimitOrderRequestSchema = z.object({
  id: z.string().min(1),
  enabled: z.boolean().optional(),
  groupId: z.string().optional(),
  triggerPriceUsd: z.string().min(1).optional(),
  triggerDirection: TriggerDirectionSchema.optional(),
  currencyAmountUI: z.number().min(0).optional(),
  customFeeAndTip: z.boolean().optional(),
  priorityFee: z.string().optional(),
  gasFeeDelta: z.number().int().min(0).optional(),
  maxFeePerGas: z.number().int().min(0).optional(),
  jitoEnabled: z.boolean().optional(),
  jitoTip: z.number().min(0).optional(),
  expireDelta: z.number().int().min(0).max(432000000).optional(),
  expireExecute: z.boolean().optional(),
  useMidPrice: z.boolean().optional(),
  maxSlippage: z.number().min(0).max(1).optional(),
  concurrentNodes: z.number().int().min(1).max(3).optional(),
  retries: z.number().int().min(0).max(10).optional(),
});

export type EditLimitOrderRequest = z.infer<typeof EditLimitOrderRequestSchema>;

// Switch limit order status request
export const SwitchLimitOrderRequestSchema = z.object({
  id: z.string().min(1),
  enabled: z.boolean(),
});

export type SwitchLimitOrderRequest = z.infer<typeof SwitchLimitOrderRequestSchema>;

// Delete limit order request
export const DeleteLimitOrderRequestSchema = z.object({
  id: z.string().min(1),
});

export type DeleteLimitOrderRequest = z.infer<typeof DeleteLimitOrderRequestSchema>;

// Batch delete limit orders request
export const DeleteLimitOrdersRequestSchema = z.object({
  ids: z.array(z.string()).min(1),
});

export type DeleteLimitOrdersRequest = z.infer<typeof DeleteLimitOrdersRequestSchema>;

// Delete all limit orders request
export const DeleteAllLimitOrderRequestSchema = z.object({
  source: z.enum(['normal', 'pnl_for_follow', 'pnl_for_swap']),
});

export type DeleteAllLimitOrderRequest = z.infer<typeof DeleteAllLimitOrderRequestSchema>;

// Get limit orders request
export const LimitOrdersRequestSchema = z.object({
  page: z.number().int().min(0).default(0),
  size: z.number().int().min(1).max(20).default(20),
  chain: ChainSchema.optional(),
  pair: z.string().optional(),
  state: z.enum(['init', 'done', 'expired', 'canceled']).optional().default('init'),
  enabled: z.boolean().optional(),
  groupId: z.string().optional(),
  token: z.string().optional(),
  sortBy: z.string().optional(),
  sort: z.number().optional().default(-1),
});

export type LimitOrdersRequest = z.infer<typeof LimitOrdersRequestSchema>;

// API response type
export interface ApiResponse<T = any> {
  err: boolean;
  res: T;
  docs: string;
}

export interface CurrencyInfo {
  contract: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string | null;
  icon: string;
  createAt: number | null;
}

export interface TokenInfo {
  contract: string;
  createAt: number;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  icon: string;
  freezeAuthority: string | null;
  mintAuthority: string | null;
}

export interface Links {
  etherscan: string;
  dexscreener: string;
  uniswap: string;
}

export interface LimitOrder {
  accountId: string;
  id: string;
  enabled: boolean;
  groupId: string;
  state: 'init' | 'done' | 'expired' | 'canceled';
  chain: string;
  tradeType: string;
  triggerDirection: string;
  triggerPriceUsd: number;
  currencyAmountUI: number;
  pair: string;
  pairType: string;
  walletId: string;
  walletType: string;
  walletAddress: string;
  walletName: string;
  customFeeAndTip: boolean;
  priorityFee: number | null;
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
  currencyInfo: CurrencyInfo;
  tokenInfo: TokenInfo;
  links: Links;
}

// Wallet query types
export const WalletQueryRequestSchema = z.object({
  type: z.enum(['solana', 'evm']).optional(),
  page: z.number().int().min(0).default(0),
  size: z.number().int().min(1).max(20).default(20),
});

export type WalletQueryRequest = z.infer<typeof WalletQueryRequestSchema>;

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