import { z } from 'zod';

// Base type definitions
export const ChainSchema = z.enum(['solana', 'ethereum', 'base', 'bsc', 'tron']);
export const BuyAmountTypeSchema = z.enum(['fixed_amount', 'fixed_ratio', 'follow_amount']);
export const SellModeSchema = z.enum(['mixed', 'only_copy', 'only_pnl']);
export const SellAmountTypeSchema = z.enum(['all', 'follow_ratio', 'x_target_ratio']);
export const SellSpeedTypeSchema = z.enum(['fast', 'accurate']);

export type Chain = z.infer<typeof ChainSchema>;
export type BuyAmountType = z.infer<typeof BuyAmountTypeSchema>;
export type SellMode = z.infer<typeof SellModeSchema>;
export type SellAmountType = z.infer<typeof SellAmountTypeSchema>;
export type SellSpeedType = z.infer<typeof SellSpeedTypeSchema>;

// Take-profit/Stop-loss groups
export const PnlGroupSchema = z.object({
  pricePercent: z.number().min(0).max(1),
  amountPercent: z.number().min(0).max(1),
});

export type PnlGroup = z.infer<typeof PnlGroupSchema>;

// Buy settings
export const BuySettingsSchema = z.object({
  enabled: z.boolean().default(true),
  startHour: z.number().int().min(0).max(23).default(0),
  endHour: z.number().int().min(0).max(23).default(23),
  buyAmountType: BuyAmountTypeSchema.default('follow_amount'),
  maxBuyAmountUI: z.string().min(1),
  buyRatio: z.number().min(0).max(10).default(1),
  maxBalanceUI: z.number().min(0).default(100),
  reservedAmountUI: z.number().min(0).default(0.01),
  targetMinAmountUI: z.number().min(0).default(0),
  targetMaxAmountUI: z.number().min(0).default(999999),
  minTokenMCUSD: z.number().min(0).default(0),
  maxTokenMCUSD: z.number().min(0).default(999999999),
  maxBuyTax: z.number().min(0).max(1).optional(),
  maxSellTax: z.number().min(0).max(1).optional(),
  customFeeAndTip: z.boolean().default(false),
  priorityFee: z.string().default(''),
  gasFeeDelta: z.number().int().min(0).default(5),
  maxFeePerGas: z.number().int().min(0).default(100),
  jitoEnabled: z.boolean().default(true),
  jitoTip: z.number().min(0).default(0.001),
  maxSlippage: z.number().min(0).max(1).default(0.1),
  skipFreezableToken: z.boolean().default(false),
  skipMintableToken: z.boolean().default(false),
  skipDelegatedToken: z.boolean().default(false),
  skipNotOpensource: z.boolean().default(false),
  skipHoneyPot: z.boolean().default(false),
  skipTargetIncreasePosition: z.boolean().default(false),
  minBurnedLp: z.number().min(0).max(1).default(0),
  minLpUsd: z.number().min(0).default(0),
  minTokenAgeMs: z.number().min(0).default(0),
  maxTokenAgeMs: z.number().min(0).default(999999999999),
  maxTopHoldPercent: z.number().min(0).max(1).default(1),
  maxBuyTimesPerToken: z.number().int().min(1).default(999),
  maxBuyAmountPerToken: z.number().min(0).default(999999),
  buyExist: z.boolean().default(false),
  buyOncePerWallet: z.boolean().default(false),
  concurrentNodes: z.number().int().min(1).max(3).default(2),
  retries: z.number().int().min(0).max(10).default(1),
});

export type BuySettings = z.infer<typeof BuySettingsSchema>;

// Sell settings
export const SellSettingsSchema = z.object({
  enabled: z.boolean().default(true),
  startHour: z.number().int().min(0).max(23).default(0),
  endHour: z.number().int().min(0).max(23).default(23),
  mode: SellModeSchema.default('mixed'),
  sellAmountType: SellAmountTypeSchema.default('all'),
  xTargetRatio: z.number().min(0).max(100).default(1),
  sellSpeedType: SellSpeedTypeSchema.default('accurate'),
  targetMinAmountUI: z.number().min(0).default(0),
  targetMaxAmountUI: z.number().min(0).default(999999),
  stopEarnPercent: z.number().min(0).optional(),
  stopLossPercent: z.number().min(0).optional(),
  stopEarnGroup: z.array(PnlGroupSchema).max(6).optional(),
  stopLossGroup: z.array(PnlGroupSchema).max(6).optional(),
  trailingStopGroup: z.array(PnlGroupSchema).max(1).optional(),
  pnlOrderExpireDelta: z.number().int().min(0).max(432000000).default(43200000),
  pnlOrderExpireExecute: z.boolean().default(false),
  pnlOrderUseMidPrice: z.boolean().default(false),
  sellMode: z.enum(['smart', 'normal']).default('smart'),
  migrateSellPercent: z.number().min(0).max(1).default(0),
  minDevSellPercent: z.number().min(0).max(1).default(0.5),
  devSellPercent: z.number().min(0).max(1).default(1),
  customFeeAndTip: z.boolean().default(false),
  priorityFee: z.string().default(''),
  gasFeeDelta: z.number().int().min(0).default(5),
  maxFeePerGas: z.number().int().min(0).default(100),
  jitoEnabled: z.boolean().default(true),
  jitoTip: z.number().min(0).default(0.001),
  maxSlippage: z.number().min(0).max(1).default(0.1),
  concurrentNodes: z.number().int().min(1).max(3).default(2),
  retries: z.number().int().min(0).max(10).default(1),
});

export type SellSettings = z.infer<typeof SellSettingsSchema>;

// Create copy trading task request
export const CreateCopyTradingRequestSchema = z.object({
  enabled: z.boolean().default(true),
  name: z.string().min(1),
  chain: ChainSchema.default('solana'),
  dexFilter: z.array(z.string()).optional(),
  targetIds: z.array(z.string()).min(1).max(10),
  tokenBlacklist: z.array(z.string()).max(20).optional(),
  walletId: z.string().min(1).optional(),
  groupId: z.string().optional(),
  buySettings: BuySettingsSchema,
  sellSettings: SellSettingsSchema,
});

export type CreateCopyTradingRequest = z.infer<typeof CreateCopyTradingRequestSchema>;

// Edit copy trading task request
export const EditCopyTradingRequestSchema = z.object({
  id: z.string().min(1),
  enabled: z.boolean(),
  name: z.string().min(1),
  chain: ChainSchema,
  dexFilter: z.array(z.string()).optional(),
  targetIds: z.array(z.string()).min(1).max(10),
  tokenBlacklist: z.array(z.string()).max(20).optional(),
  walletId: z.string().min(1).optional(),
  groupId: z.string().optional(),
  buySettings: BuySettingsSchema,
  sellSettings: SellSettingsSchema,
});

export type EditCopyTradingRequest = z.infer<typeof EditCopyTradingRequestSchema>;

// Switch copy trading task request
export const SwitchCopyTradingRequestSchema = z.object({
  id: z.string().min(1),
  enabled: z.boolean(),
  closePnlOrder: z.boolean().default(false),
});

export type SwitchCopyTradingRequest = z.infer<typeof SwitchCopyTradingRequestSchema>;

// Delete copy trading task request
export const DeleteCopyTradingRequestSchema = z.object({
  id: z.string().min(1),
  deletePnlOrder: z.boolean().default(false),
});

export type DeleteCopyTradingRequest = z.infer<typeof DeleteCopyTradingRequestSchema>;

// API response type
export interface ApiResponse<T = any> {
  err: boolean;
  res: T;
  docs: string;
}

// Copy trading task information
export interface CopyTradingTask {
  id: string;
  enabled: boolean;
  name: string;
  chain: string;
  dexFilter: string[] | null;
  targetIds: string[];
  tokenBlacklist: string[];
  walletId: string;
  groupId: string;
  buySettings: BuySettings;
  sellSettings: SellSettings;
  createdAt?: number;
  updatedAt?: number;
} 