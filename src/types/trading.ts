export interface Candle {
  time: number; // Unix timestamp in seconds (aligned to 5m boundary)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SupportResistanceLevel {
  price: number;
  type: 'SUPPORT' | 'RESISTANCE';
  strength: 'STRONG' | 'MODERATE' | 'MINOR';
  touches: number;
  distanceUsd: number;
  distanceAtr: number;
  label: string;
}

export interface HarmonicPatternSignal {
  name: 'Gartley' | 'Bat' | 'Butterfly' | 'Crab' | 'Deep Crab' | 'Cypher' | 'AB=CD';
  direction: 'BULLISH' | 'BEARISH';
  status: 'AT_PRZ' | 'APPROACHING_PRZ' | 'COMPLETED';
  xPrice: number;
  aPrice: number;
  bPrice: number;
  cPrice: number;
  dPrice: number;
  przLow: number;
  przHigh: number;
  ratiosSummary: string;
  target1: number;
  target2: number;
  invalidation: number;
}

export interface ChartStructureAnalysis {
  marketStructure: 'UPTREND_HH_HL' | 'DOWNTREND_LH_LL' | 'CONSOLIDATION' | 'TRANSITION_BOS';
  structureSummary: string;
  nearestResistance: SupportResistanceLevel | null;
  nearestSupport: SupportResistanceLevel | null;
  resistances: SupportResistanceLevel[];
  supports: SupportResistanceLevel[];
  pivotPoint: number | null;
  sessionHigh: number;
  sessionLow: number;
  roundLevels: number[];
  candlestickPatterns: string[];
  chartPatterns: string[];
  fvgZones: Array<{ type: 'BULLISH_FVG' | 'BEARISH_FVG'; low: number; high: number }>;
  harmonicPattern?: HarmonicPatternSignal | null;
  pricePositionNote: string;
}

export interface IndicatorSnapshot {
  ema9: number | null;
  ema21: number | null;
  ema50: number | null;
  ema200: number | null;
  rsi14: number | null;
  stochastic?: {
    k: number | null;
    d: number | null;
  };
  adx14?: number | null;
  obvTrend?: 'ACCUMULATION' | 'DISTRIBUTION' | 'NEUTRAL';
  fibonacci?: {
    swingHigh: number;
    swingLow: number;
    trend: 'UP' | 'DOWN';
    r382: number;
    r500: number;
    r618: number;
    r786: number;
    ext1272: number;
    ext1618: number;
  };
  macd: {
    line: number | null;
    signal: number | null;
    histogram: number | null;
  };
  atr14: number | null;
  bollinger: {
    upper: number | null;
    middle: number | null;
    lower: number | null;
  };
  swingHigh: number;
  swingLow: number;
  structure?: ChartStructureAnalysis;
}

export interface MacroContext {
  dxyPrice: number | null;
  dxyChangePct: number | null;
  dxyBias: 'MENGUAT' | 'MELEMAH' | 'NETRAL';
  us10yYield: number | null;
  us10yChangePct: number | null;
  sp500Price: number | null;
  sp500ChangePct: number | null;
  headlines: Array<{ title: string; source: string; pubDate: string }>;
  updatedAt: number;
}

export type BrokerFeedId =
  | 'PEPPERSTONE'
  | 'TICKMILL'
  | 'ICMARKETS'
  | 'OANDA'
  | 'EIGHTCAP'
  | 'BLACKBULL'
  | 'FXCM'
  | 'MT5_LIVE'
  | 'AUTO_SPOT';

export interface BrokerFeedOption {
  id: BrokerFeedId;
  name: string;
  tvSymbol: string | null;
  description: string;
}

export const BROKER_FEEDS: BrokerFeedOption[] = [
  {
    id: 'PEPPERSTONE',
    name: 'Pepperstone',
    tvSymbol: 'PEPPERSTONE:XAUUSD',
    description: 'Pepperstone XAUUSD Real-Time (TradingView Feed)',
  },
  {
    id: 'TICKMILL',
    name: 'Tickmill',
    tvSymbol: 'TICKMILL:XAUUSD',
    description: 'Tickmill XAUUSD Real-Time (TradingView Feed)',
  },
  {
    id: 'ICMARKETS',
    name: 'IC Markets',
    tvSymbol: 'ICMARKETS:XAUUSD',
    description: 'IC Markets XAUUSD Real-Time (TradingView Feed)',
  },
  {
    id: 'OANDA',
    name: 'OANDA',
    tvSymbol: 'OANDA:XAUUSD',
    description: 'OANDA XAUUSD Real-Time (TradingView Feed)',
  },
  {
    id: 'EIGHTCAP',
    name: 'Eightcap',
    tvSymbol: 'EIGHTCAP:XAUUSD',
    description: 'Eightcap XAUUSD Real-Time (TradingView Feed)',
  },
  {
    id: 'BLACKBULL',
    name: 'BlackBull',
    tvSymbol: 'BLACKBULL:XAUUSD',
    description: 'BlackBull Markets XAUUSD Real-Time (TradingView Feed)',
  },
  {
    id: 'FXCM',
    name: 'FXCM',
    tvSymbol: 'FX:XAUUSD',
    description: 'FXCM (FX) XAUUSD Real-Time (TradingView Feed)',
  },
  {
    id: 'MT5_LIVE',
    name: 'MT5 Live Bridge',
    tvSymbol: null,
    description: 'Feed harga langsung dari Terminal MetaTrader 5 Anda',
  },
  {
    id: 'AUTO_SPOT',
    name: 'Auto Spot / PAXG',
    tvSymbol: null,
    description: 'Yahoo Finance Spot XAU/USD & Binance PAXG 24/7',
  },
];

export type ChartTimeframe = 'M1' | 'M5' | 'M15' | 'M30' | 'H1';

export interface TimeframeMeta {
  id: ChartTimeframe;
  label: string;
  seconds: number;
  tvResolution: '1' | '5' | '15' | '30' | '60';
  binanceInterval: '1m' | '5m' | '15m' | '30m' | '1h';
  yahooInterval: '1m' | '5m' | '15m' | '30m' | '60m';
  krakenInterval: 1 | 5 | 15 | 30 | 60;
}

export const CHART_TIMEFRAME_OPTIONS: Array<{
  id: ChartTimeframe;
  label: string;
  fullLabel: string;
}> = [
  { id: 'M1', label: 'M1', fullLabel: 'M1 (1 Menit)' },
  { id: 'M5', label: 'M5', fullLabel: 'M5 (5 Menit)' },
  { id: 'M15', label: 'M15', fullLabel: 'M15 (15 Menit)' },
  { id: 'M30', label: 'M30', fullLabel: 'M30 (30 Menit)' },
  { id: 'H1', label: 'H1', fullLabel: 'H1 (60 Menit)' },
];

export const TIMEFRAME_META: Record<ChartTimeframe, TimeframeMeta> = {
  M1: {
    id: 'M1',
    label: 'M1',
    seconds: 60,
    tvResolution: '1',
    binanceInterval: '1m',
    yahooInterval: '1m',
    krakenInterval: 1,
  },
  M5: {
    id: 'M5',
    label: 'M5',
    seconds: 300,
    tvResolution: '5',
    binanceInterval: '5m',
    yahooInterval: '5m',
    krakenInterval: 5,
  },
  M15: {
    id: 'M15',
    label: 'M15',
    seconds: 900,
    tvResolution: '15',
    binanceInterval: '15m',
    yahooInterval: '15m',
    krakenInterval: 15,
  },
  M30: {
    id: 'M30',
    label: 'M30',
    seconds: 1800,
    tvResolution: '30',
    binanceInterval: '30m',
    yahooInterval: '30m',
    krakenInterval: 30,
  },
  H1: {
    id: 'H1',
    label: 'H1',
    seconds: 3600,
    tvResolution: '60',
    binanceInterval: '1h',
    yahooInterval: '60m',
    krakenInterval: 60,
  },
};

export function getTimeframeForCadence(cadence: EaConfig['analyzeCadence']): ChartTimeframe {
  if (cadence === '900S') return 'M15';
  if (cadence === '1800S') return 'M30';
  if (cadence === '3600S') return 'H1';
  return 'M5';
}

export type TradingSymbol = 'XAU/USD' | 'GBP/USD' | 'EUR/USD' | 'BTC/USD';

export interface SymbolMeta {
  id: TradingSymbol;
  label: string;
  shortName: string;
  mt5Symbol: string;
  decimals: number;
  minMove: number;
  contractSize: number;
  defaultAtr: number;
  minSlDistance: number;
  spreadFallback: number;
  roundIncrement: number;
  fastBullPairId: number | null;
  unitLabel: string;
  tvDefaultSymbol: string;
  yahooSymbols: string[];
  binanceSymbol: string | null;
  krakenSymbol: string | null;
  assetClass: 'METAL' | 'FOREX' | 'CRYPTO';
}

export const SYMBOL_OPTIONS: Array<{
  id: TradingSymbol;
  label: string;
  description: string;
}> = [
  { id: 'XAU/USD', label: 'XAU/USD', description: 'Gold Spot vs US Dollar' },
  { id: 'GBP/USD', label: 'GBP/USD', description: 'British Pound vs US Dollar' },
  { id: 'EUR/USD', label: 'EUR/USD', description: 'Euro vs US Dollar' },
  { id: 'BTC/USD', label: 'BTC/USD', description: 'Bitcoin vs US Dollar (24/7)' },
];

export const SYMBOL_META: Record<TradingSymbol, SymbolMeta> = {
  'XAU/USD': {
    id: 'XAU/USD',
    label: 'XAU/USD',
    shortName: 'Gold',
    mt5Symbol: 'XAUUSD',
    decimals: 2,
    minMove: 0.01,
    contractSize: 100,
    defaultAtr: 2.5,
    minSlDistance: 0.25,
    spreadFallback: 0.16,
    roundIncrement: 10,
    fastBullPairId: 28,
    unitLabel: 'USD/oz',
    tvDefaultSymbol: 'OANDA:XAUUSD',
    yahooSymbols: ['XAUUSD=X', 'GC=F'],
    binanceSymbol: 'PAXGUSDT',
    krakenSymbol: 'PAXGUSD',
    assetClass: 'METAL',
  },
  'GBP/USD': {
    id: 'GBP/USD',
    label: 'GBP/USD',
    shortName: 'Cable',
    mt5Symbol: 'GBPUSD',
    decimals: 5,
    minMove: 0.00001,
    contractSize: 100_000,
    defaultAtr: 0.0012,
    minSlDistance: 0.0002,
    spreadFallback: 0.00014,
    roundIncrement: 0.005,
    fastBullPairId: 3,
    unitLabel: 'USD',
    tvDefaultSymbol: 'OANDA:GBPUSD',
    yahooSymbols: ['GBPUSD=X'],
    binanceSymbol: null,
    krakenSymbol: null,
    assetClass: 'FOREX',
  },
  'EUR/USD': {
    id: 'EUR/USD',
    label: 'EUR/USD',
    shortName: 'Fiber',
    mt5Symbol: 'EURUSD',
    decimals: 5,
    minMove: 0.00001,
    contractSize: 100_000,
    defaultAtr: 0.0009,
    minSlDistance: 0.0002,
    spreadFallback: 0.00012,
    roundIncrement: 0.005,
    fastBullPairId: 2,
    unitLabel: 'USD',
    tvDefaultSymbol: 'OANDA:EURUSD',
    yahooSymbols: ['EURUSD=X'],
    binanceSymbol: null,
    krakenSymbol: null,
    assetClass: 'FOREX',
  },
  'BTC/USD': {
    id: 'BTC/USD',
    label: 'BTC/USD',
    shortName: 'Bitcoin',
    mt5Symbol: 'BTCUSD',
    decimals: 2,
    minMove: 0.01,
    contractSize: 1,
    defaultAtr: 180,
    minSlDistance: 15,
    spreadFallback: 12,
    roundIncrement: 500,
    fastBullPairId: null,
    unitLabel: 'USD',
    tvDefaultSymbol: 'COINBASE:BTCUSD',
    yahooSymbols: ['BTC-USD'],
    binanceSymbol: 'BTCUSDT',
    krakenSymbol: 'XBTUSD',
    assetClass: 'CRYPTO',
  },
};

export function normalizeTradingSymbol(raw?: string | null): TradingSymbol {
  const upper = String(raw || '').trim().toUpperCase().replace(/[^A-Z]/g, '');
  if (upper.startsWith('GBPUSD')) return 'GBP/USD';
  if (upper.startsWith('EURUSD')) return 'EUR/USD';
  if (upper.startsWith('BTCUSD') || upper.startsWith('XBTUSD')) return 'BTC/USD';
  return 'XAU/USD';
}

export function getSymbolMeta(symbol?: string | null): SymbolMeta {
  return SYMBOL_META[normalizeTradingSymbol(symbol)];
}

export function formatPairPrice(price: number | null | undefined, symbol?: string | null): string {
  if (typeof price !== 'number' || !Number.isFinite(price)) return '--';
  const meta = getSymbolMeta(symbol);
  return price.toFixed(meta.decimals);
}

export function getTvSymbolForBrokerAndPair(
  brokerId: BrokerFeedId,
  symbol?: string | null
): string | null {
  const sym = normalizeTradingSymbol(symbol);
  const compact = SYMBOL_META[sym].mt5Symbol;
  if (sym === 'BTC/USD') {
    switch (brokerId) {
      case 'PEPPERSTONE':
      case 'OANDA':
      case 'EIGHTCAP':
        return 'COINBASE:BTCUSD';
      case 'TICKMILL':
      case 'BLACKBULL':
        return 'BITSTAMP:BTCUSD';
      case 'ICMARKETS':
        return 'BINANCE:BTCUSDT';
      case 'FXCM':
        return 'KRAKEN:BTCUSD';
      default:
        return null;
    }
  }
  switch (brokerId) {
    case 'PEPPERSTONE':
      return `PEPPERSTONE:${compact}`;
    case 'TICKMILL':
      return `TICKMILL:${compact}`;
    case 'ICMARKETS':
      return sym === 'XAU/USD' ? 'ICMARKETS:XAUUSD' : `IC:${compact}`;
    case 'OANDA':
      return `OANDA:${compact}`;
    case 'EIGHTCAP':
      return `EIGHTCAP:${compact}`;
    case 'BLACKBULL':
      return `BLACKBULL:${compact}`;
    case 'FXCM':
      return `FX:${compact}`;
    default:
      return null;
  }
}

export interface MarketQuote {
  symbol: string;
  timeframe: ChartTimeframe;
  bid: number;
  ask: number;
  mid: number;
  spread: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  source: string;
  brokerId?: BrokerFeedId;
  brokerSymbol?: string;
  marketStatus: 'LIVE' | 'DELAYED';
  updatedAt: number;
  candleCloseInSec: number;
}

export interface MarketSnapshot {
  quote: MarketQuote;
  candles: Candle[];
  indicators: IndicatorSnapshot;
  ema9Series: Array<{ time: number; value: number }>;
  ema21Series: Array<{ time: number; value: number }>;
  ema50Series: Array<{ time: number; value: number }>;
  bbUpperSeries: Array<{ time: number; value: number }>;
  bbLowerSeries: Array<{ time: number; value: number }>;
}

export type TradeSignalType = 'BUY' | 'SELL' | 'HOLD';
export type MarketBias = 'BULLISH' | 'BEARISH' | 'RANGING';
export type PositionDecision = 'NONE' | 'KEEP' | 'CLOSE_BUY' | 'CLOSE_SELL' | 'CLOSE_ALL';
export type PostTpDecision =
  | 'NONE'
  | 'RE_ENTRY_CONTINUATION'
  | 'WAIT_PULLBACK_HOLD'
  | 'EXHAUSTION_SKIP';

export interface RecentClosedTradeContext {
  side: 'BUY' | 'SELL';
  lots?: number;
  entryPrice: number;
  closePrice: number;
  takeProfit: number;
  pnlUsd: number;
  points: number;
  closeReason: ClosedTrade['closeReason'];
  closedMinutesAgo: number;
}

export interface MathematicalRecoveryPlan {
  isActive: boolean;
  mode: 'EXECUTE_NOW' | 'ARMED_WAIT_SIGNAL';
  triggeredBy: 'ACTIVE_INVALIDATED' | 'CLOSED_LOSS_STREAK' | 'BOTH';
  direction: 'BUY' | 'SELL';
  lossToRecoverUsd: number;
  lossStreakCount: number;
  baseLot: number;
  lastLostLot: number;
  martingaleEnabled: boolean;
  martingaleMultiplier: number;
  recoveryLots: number;
  entryPrice: number;
  breakevenPrice: number;
  recoveryTp: number;
  neededMoveUsd: number;
  expectedNetProfitUsd: number;
  achievableWithinAtr: boolean;
  rationale: string;
}

export interface EaAnalysisResult {
  id: string;
  symbol?: TradingSymbol;
  timestamp: number;
  candleTime: number;
  priceAtAnalysis: number;
  signal: TradeSignalType;
  confidence: number;
  marketBias: MarketBias;
  entryPrice: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  riskRewardRatio: string;
  setupPattern: string;
  summary: string;
  keyFactors: string[];
  invalidatedIf: string;
  model: string;
  latencyMs: number;
  usedChartVision: boolean;
  judgeVerdict?: string;
  indicatorWeighting?: string;
  authorityMode?: 'AI_JUDGE_100' | 'CONFIDENCE_FILTER';
  positionDecision?: PositionDecision;
  positionReason?: string;
  winProbability?: number;
  reversalConfidence?: number;
  highProbTp?: number;
  highProbTpConfidence?: number;
  postTpEvaluation?: PostTpDecision;
  postTpReason?: string;
  keyLevelsSummary?: string;
  priceActionSignal?: string;
  harmonicPattern?: string;
  lstmProbability?: {
    upPct: number;
    downPct: number;
    holdPct: number;
    horizonMinutes: number;
    rationale: string;
  };
  ocrExtractedPrice?: string;
  globalSyncSummary?: string;
  fastBullPositionSummary?: string;
  macroSummary?: string;
  mtfSummary?: string;
  recoveryPlan?: MathematicalRecoveryPlan;
  lockProfitPlan?: {
    lock25Price: number;
    lock50Price: number;
  };
  dataSources?: string[];
}

export interface OpenPosition {
  id: string;
  symbol?: TradingSymbol;
  side: 'BUY' | 'SELL';
  lots: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  openedAt: number;
  source: 'AI_AUTO' | 'AI_MANUAL' | 'MARKET_MANUAL' | 'MT5_LIVE';
  confidence?: number;
  setupPattern?: string;
  highestFavorablePrice: number;
  trailingActivated: boolean;
  mt5Ticket?: number;
}

export interface ClosedTrade {
  id: string;
  symbol?: TradingSymbol;
  side: 'BUY' | 'SELL';
  lots: number;
  entryPrice: number;
  closePrice: number;
  stopLoss: number;
  takeProfit: number;
  openedAt: number;
  closedAt: number;
  pnlUsd: number;
  points: number;
  closeReason: 'TP Hit' | 'SL Hit' | 'Trailing SL' | 'AI Exit' | 'Manual Close' | 'MT5 Sync';
  source: 'AI_AUTO' | 'AI_MANUAL' | 'MARKET_MANUAL' | 'MT5_LIVE';
  setupPattern?: string;
}

export type AiProviderMode =
  | 'AUTO'
  | 'ROUND_ROBIN'
  | 'OPENROUTER_GEMMA_PPLX_CONSENSUS'
  | 'OPENROUTER_CLEF_PPLX12_CONSENSUS'
  | 'OPENROUTER_CLEF_PPLX12_GPTOSS_CONSENSUS'
  | 'OPENROUTER_SPAN_PPLX_LINGDT_CONSENSUS'
  | 'OPENROUTER_RESPAN_PPLX'
  | 'OPENROUTER_FLASH_TRIO'
  | 'GEMINI'
  | 'AIRFORCE'
  | 'OPENROUTER'
  | 'OPENROUTER_RESPAN'
  | 'OPENROUTER_CLEF'
  | 'OPENROUTER_PPLX_V12'
  | 'OPENROUTER_LINGDT'
  | 'OPENROUTER_GPT_OSS'
  | 'OPENROUTER_HEYGEN'
  | 'OPENROUTER_DREX'
  | 'OPENROUTER_JEV'
  | 'OPENROUTER_PPLX'
  | 'OPENROUTER_ARGON'
  | 'OPENROUTER_HYDROGEN'
  | 'OPENROUTER_NEMOTRON'
  | 'OPENROUTER_KIMI'
  | 'OPENROUTER_LING'
  | 'OPENROUTER_ERNIE'
  | 'OPENROUTER_LFM';

export const AI_PROVIDER_OPTIONS: Array<{
  id: AiProviderMode;
  shortLabel: string;
  label: string;
}> = [
  {
    id: 'AUTO',
    shortLabel: 'Otomatis (Failover Kuota)',
    label: 'Otomatis Failover (Gemini 4 → Airforce → OpenRouter Pool)',
  },
  {
    id: 'ROUND_ROBIN',
    shortLabel: 'Bergantian (Round-Robin)',
    label: 'Bergantian Merata (Gemini 4 ↔ Airforce ↔ OpenRouter Pool)',
  },
  {
    id: 'OPENROUTER_GEMMA_PPLX_CONSENSUS',
    shortLabel: 'OR Konsensus (Gemma + PPLX)',
    label: 'OR Dual Konsensus: Gemma-4-26B + PPLX-Decider (Wajib Sepakat Searah, Jika Beda/Netral → HOLD)',
  },
  {
    id: 'OPENROUTER_CLEF_PPLX12_CONSENSUS',
    shortLabel: 'OR Konsensus (Clef + PPLX v1.2)',
    label: 'OR Dual Konsensus: Clef-Flash + PPLX-Decider-v1.2 (Wajib Sepakat Searah, Jika Beda/Netral → HOLD)',
  },
  {
    id: 'OPENROUTER_CLEF_PPLX12_GPTOSS_CONSENSUS',
    shortLabel: 'OR Konsensus 2/3 (Clef + PPLX v1.2 + GPT-OSS-20B)',
    label: 'OR Triple Konsensus 2/3: Clef-Flash + PPLX-Decider-v1.2 + GPT-OSS-20B (Wajib ≥2/3 Sepakat Searah, Jika <2/Netral → HOLD)',
  },
  {
    id: 'OPENROUTER_RESPAN_PPLX',
    shortLabel: 'OR Dual (Span-01 ↔ PPLX)',
    label: 'OR Bergantian Cepat: Span-01-Lite ↔ PPLX-Decider (Auto-Takeover jika lambat)',
  },
  {
    id: 'OPENROUTER_SPAN_PPLX_LINGDT_CONSENSUS',
    shortLabel: 'OR Konsensus 2/3 (Span-01 + PPLX + LingDT)',
    label: 'OR Triple Konsensus 2/3: Span-01-Lite + PPLX-Decider + LingDT-Fast (Wajib ≥2/3 Sepakat Searah, Jika <2/Netral → HOLD)',
  },
  {
    id: 'OPENROUTER_FLASH_TRIO',
    shortLabel: 'OR Trio (Ling ↔ Ernie ↔ LFM)',
    label: 'OR Kelompok Khusus: Ling-3.2 ↔ Ernie-5.5 ↔ LFM-3-1.7B (Bergantian & Auto-Takeover)',
  },
  {
    id: 'GEMINI',
    shortLabel: 'Gemini 4 (Hydrogen / Argon)',
    label: 'Hanya Gemini 4 Direct (gemini-4-hydrogen → gemini-4-argon)',
  },
  {
    id: 'OPENROUTER',
    shortLabel: 'OpenRouter (All Pool)',
    label: 'OpenRouter Pool (Clef-Flash / PPLX-v1.2 / GPT-OSS-20B / Span-01 / PPLX / LingDT / Ling / Ernie / LFM / Heygen / Drex-Max / Jev-1.14 / Argon / Hydrogen / Nemotron / Kimi)',
  },
  {
    id: 'OPENROUTER_CLEF',
    shortLabel: 'OR (clef-flash)',
    label: 'OpenRouter Alpha Decisions: cloudflare/clef-flash',
  },
  {
    id: 'OPENROUTER_PPLX_V12',
    shortLabel: 'OR (pplx-decider-v1.2)',
    label: 'OpenRouter Alpha Decisions: perplexity/pplx-decider-v1.2',
  },
  {
    id: 'OPENROUTER_GPT_OSS',
    shortLabel: 'OR (gpt-oss-20b)',
    label: 'OpenRouter Chat: openai/gpt-oss-20b',
  },
  {
    id: 'OPENROUTER_RESPAN',
    shortLabel: 'OR (span-01-lite:free)',
    label: 'OpenRouter Alpha Decisions: respan/span-01-lite:free',
  },
  {
    id: 'OPENROUTER_PPLX',
    shortLabel: 'OR (pplx-decider-flash)',
    label: 'OpenRouter Alpha Decisions: perplexity/pplx-decider-flash-v1.3:free',
  },
  {
    id: 'OPENROUTER_LINGDT',
    shortLabel: 'OR (lingdt-decision-fast)',
    label: 'OpenRouter Alpha Decisions: antdigital/lingdt-decision-fast-1.0:free',
  },
  {
    id: 'OPENROUTER_LING',
    shortLabel: 'OR (ling-3.2-flash)',
    label: 'OpenRouter Chat: inclusionai/ling-3.2-flash:free',
  },
  {
    id: 'OPENROUTER_ERNIE',
    shortLabel: 'OR (ernie-5.5-flash)',
    label: 'OpenRouter Chat: baidu/ernie-5.5-flash-preview:free',
  },
  {
    id: 'OPENROUTER_LFM',
    shortLabel: 'OR (lfm-3-1.7b)',
    label: 'OpenRouter Chat: liquid/lfm-3-1.7b:free',
  },
  {
    id: 'OPENROUTER_HEYGEN',
    shortLabel: 'OR (heygen-decision-1-turbo)',
    label: 'OpenRouter Alpha Decisions: heygen/heygen-decision-1-turbo',
  },
  {
    id: 'OPENROUTER_DREX',
    shortLabel: 'OR (nace-ai/drex-max)',
    label: 'OpenRouter Alpha Decisions: nace-ai/drex-max',
  },
  {
    id: 'OPENROUTER_JEV',
    shortLabel: 'OR (typesafe/jev-1.14)',
    label: 'OpenRouter Alpha Decisions: typesafe/jev-1.14',
  },
  {
    id: 'OPENROUTER_ARGON',
    shortLabel: 'OR (gemini-4-argon)',
    label: 'OpenRouter Chat: google/gemini-4-argon',
  },
  {
    id: 'OPENROUTER_HYDROGEN',
    shortLabel: 'OR (gemini-4-hydrogen)',
    label: 'OpenRouter Chat: google/gemini-4-hydrogen',
  },
  {
    id: 'OPENROUTER_NEMOTRON',
    shortLabel: 'OR (nemotron-3-ultra)',
    label: 'OpenRouter Chat: nvidia/nemotron-3-ultra-550b-a55b:free',
  },
  {
    id: 'OPENROUTER_KIMI',
    shortLabel: 'OR (kimi-k3.1-pro)',
    label: 'OpenRouter Chat: moonshotai/kimi-k3.1-pro',
  },
  {
    id: 'AIRFORCE',
    shortLabel: 'Airforce (deepseek-v3)',
    label: 'Hanya Airforce API (deepseek-v3)',
  },
];

export interface EaConfig {
  tradingSymbol?: TradingSymbol;
  chartTimeframe?: ChartTimeframe;
  autoAnalyze: boolean;
  analyzeCadence: 'CANDLE_CLOSE' | '30S' | '60S' | '180S' | '900S' | '1800S' | '3600S';
  autoExecute: boolean;
  minConfidence: number;
  lotMode: 'RISK_PERCENT' | 'FIXED_LOT';
  riskPercent: number;
  fixedLot: number;
  maxOpenPositions: number;
  maxDailyLossPercent: number;
  useTrailingStop: boolean;
  trailingAtrMultiplier: number;
  useBreakeven?: boolean;
  breakevenTriggerUsd?: number;
  noSlAiExit?: boolean;
  fullAiControl?: boolean;
  allowSameSideLayering?: boolean;
  sameSideMinConfidence?: number;
  martingaleEnabled?: boolean;
  martingaleMultiplier?: number;
  mathRecoveryEnabled?: boolean;
  mathRecoveryMaxSteps?: number;
  aiProvider?: AiProviderMode;
  aiThinkingHigh?: boolean;
  strategyFocus:
    | 'UNIFIED_8IN1'
    | 'ADAPTIVE_SCALP'
    | 'BALANCED'
    | 'SCALPING_EMA'
    | 'ULTRA_SCALP'
    | 'LIQUIDITY_SMC';
  brokerFeed?: BrokerFeedId;
  initialBalance: number;
}

export interface Mt5AccountConfig {
  login: string;
  server: string;
  accountType: 'REAL' | 'DEMO';
  bridgeKey: string;
  configuredAt: number;
}

export interface Mt5LivePosition {
  ticket: number;
  symbol: string;
  side: 'BUY' | 'SELL';
  lots: number;
  openPrice: number;
  sl: number;
  tp: number;
  profit: number;
  openTime: number;
}

export interface Mt5ConnectedTerminal {
  terminalId: string;
  login: string;
  server: string;
  company: string;
  currency: string;
  balance: number;
  equity: number;
  positionsCount: number;
  isPrimary: boolean;
  lastSeenAt: number;
}

export interface Mt5BridgeStatus {
  configured: boolean;
  connected: boolean;
  profile: Mt5AccountConfig | null;
  lastHeartbeatAt: number | null;
  liveAccount: {
    login: string;
    server: string;
    company: string;
    currency: string;
    balance: number;
    equity: number;
    margin: number;
    freeMargin: number;
    leverage: number;
    tradeAllowed: boolean;
    positions: Mt5LivePosition[];
  } | null;
  pendingCommandsCount: number;
  connectedTerminals?: Mt5ConnectedTerminal[];
}

export interface RiskNotification {
  id: string;
  timestamp: number;
  level: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  message: string;
  tradeRiskPercent: number;
  tradeRiskUsd: number;
  totalExposurePercent: number;
}
