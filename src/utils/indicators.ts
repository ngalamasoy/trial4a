import {
  getSymbolMeta,
  type Candle,
  type ChartStructureAnalysis,
  type HarmonicPatternSignal,
  type IndicatorSnapshot,
  type MathematicalRecoveryPlan,
  type SupportResistanceLevel,
  type TradingSymbol,
} from '../types/trading.ts';

export function inferPriceDecimals(price: number | undefined, symbol?: TradingSymbol): number {
  if (symbol) return getSymbolMeta(symbol).decimals;
  if (typeof price === 'number' && Number.isFinite(price) && price > 0 && price < 20) {
    return 5;
  }
  return 2;
}

export function roundToDecimals(val: number, decimals: number): number {
  return Number(val.toFixed(decimals));
}

export function computeEmaArray(
  values: number[],
  period: number,
  decimalsOverride?: number
): Array<number | null> {
  const result: Array<number | null> = new Array(values.length).fill(null);
  if (values.length < period) return result;
  const decimals = decimalsOverride ?? inferPriceDecimals(values[values.length - 1]);

  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += values[i];
  }
  let prevEma = sum / period;
  result[period - 1] = roundToDecimals(prevEma, decimals);

  const k = 2 / (period + 1);
  for (let i = period; i < values.length; i++) {
    prevEma = values[i] * k + prevEma * (1 - k);
    result[i] = roundToDecimals(prevEma, decimals);
  }
  return result;
}

export function computeRsi14(closes: number[], period = 14): number | null {
  if (closes.length <= period) return null;

  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return Number((100 - 100 / (1 + rs)).toFixed(2));
}

export function computeMacd(
  closes: number[],
  symbol?: TradingSymbol
): {
  line: number | null;
  signal: number | null;
  histogram: number | null;
} {
  if (closes.length < 35) {
    return { line: null, signal: null, histogram: null };
  }

  const priceDecimals = inferPriceDecimals(closes[closes.length - 1], symbol);
  const emaPrecision = Math.max(4, priceDecimals + 2);
  const outPrecision = priceDecimals >= 5 ? 5 : 3;

  const ema12 = computeEmaArray(closes, 12, emaPrecision);
  const ema26 = computeEmaArray(closes, 26, emaPrecision);

  const macdValues: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    const fast = ema12[i];
    const slow = ema26[i];
    if (fast !== null && slow !== null) {
      macdValues.push(fast - slow);
    }
  }

  if (macdValues.length < 9) {
    return { line: null, signal: null, histogram: null };
  }

  const signalArr = computeEmaArray(macdValues, 9, emaPrecision);
  const lastMacd = macdValues[macdValues.length - 1];
  const lastSignal = signalArr[signalArr.length - 1];

  if (lastSignal === null) {
    return { line: Number(lastMacd.toFixed(outPrecision)), signal: null, histogram: null };
  }

  return {
    line: Number(lastMacd.toFixed(outPrecision)),
    signal: Number(lastSignal.toFixed(outPrecision)),
    histogram: Number((lastMacd - lastSignal).toFixed(outPrecision)),
  };
}

export function computeAtr14(
  candles: Candle[],
  period = 14,
  symbol?: TradingSymbol
): number | null {
  if (candles.length <= period) return null;
  const decimals = inferPriceDecimals(candles[candles.length - 1]?.close, symbol);

  const trs: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const cur = candles[i];
    const prev = candles[i - 1];
    const tr = Math.max(
      cur.high - cur.low,
      Math.abs(cur.high - prev.close),
      Math.abs(cur.low - prev.close)
    );
    trs.push(tr);
  }

  let atr = 0;
  for (let i = 0; i < period; i++) {
    atr += trs[i];
  }
  atr /= period;

  for (let i = period; i < trs.length; i++) {
    atr = (atr * (period - 1) + trs[i]) / period;
  }

  return roundToDecimals(atr, decimals);
}

export function computeBollingerSeries(
  candles: Candle[],
  period = 20,
  mult = 2,
  symbol?: TradingSymbol
): {
  upperSeries: Array<{ time: number; value: number }>;
  lowerSeries: Array<{ time: number; value: number }>;
  latest: { upper: number | null; middle: number | null; lower: number | null };
} {
  const upperSeries: Array<{ time: number; value: number }> = [];
  const lowerSeries: Array<{ time: number; value: number }> = [];
  let latest: { upper: number | null; middle: number | null; lower: number | null } = {
    upper: null,
    middle: null,
    lower: null,
  };

  if (candles.length < period) {
    return { upperSeries, lowerSeries, latest };
  }
  const decimals = inferPriceDecimals(candles[candles.length - 1]?.close, symbol);

  for (let i = period - 1; i < candles.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sum += candles[j].close;
    }
    const mean = sum / period;

    let sqDiffSum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const diff = candles[j].close - mean;
      sqDiffSum += diff * diff;
    }
    const stdDev = Math.sqrt(sqDiffSum / period);

    const upper = roundToDecimals(mean + mult * stdDev, decimals);
    const lower = roundToDecimals(mean - mult * stdDev, decimals);
    const middle = roundToDecimals(mean, decimals);

    upperSeries.push({ time: candles[i].time, value: upper });
    lowerSeries.push({ time: candles[i].time, value: lower });
    if (i === candles.length - 1) {
      latest = { upper, middle, lower };
    }
  }

  return { upperSeries, lowerSeries, latest };
}

export function analyzeChartStructure(
  candles: Candle[],
  atr: number | null,
  symbol?: TradingSymbol
): ChartStructureAnalysis {
  const refClose = candles[candles.length - 1]?.close;
  const decimals = inferPriceDecimals(refClose, symbol);
  if (candles.length < 10) {
    const last = candles[candles.length - 1];
    const high = last?.high ?? 0;
    const low = last?.low ?? 0;
    return {
      marketStructure: 'CONSOLIDATION',
      structureSummary: 'Data candle belum cukup untuk pemetaan struktur S/R penuh.',
      nearestResistance: null,
      nearestSupport: null,
      resistances: [],
      supports: [],
      pivotPoint: last ? roundToDecimals((high + low + last.close) / 3, decimals) : null,
      sessionHigh: roundToDecimals(high, decimals),
      sessionLow: roundToDecimals(low, decimals),
      roundLevels: [],
      candlestickPatterns: [],
      chartPatterns: [],
      fvgZones: [],
      harmonicPattern: null,
      pricePositionNote: 'Menunggu akumulasi candle.',
    };
  }

  const n = candles.length;
  const currentPrice = candles[n - 1].close;
  const isForex5 = decimals >= 5;
  const isCrypto = currentPrice > 10000;
  const defaultAtr = symbol
    ? getSymbolMeta(symbol).defaultAtr
    : isForex5
    ? 0.001
    : isCrypto
    ? 180
    : 2.5;
  const minSafeAtr = isForex5 ? 0.00015 : isCrypto ? 15 : 0.5;
  const safeAtr = Math.max(minSafeAtr, atr ?? defaultAtr);
  const clusterTol = Math.max(
    isForex5 ? 0.0002 : isCrypto ? 25 : 0.65,
    safeAtr * 0.45
  );

  interface RawPivot {
    idx: number;
    price: number;
    kind: 'HIGH' | 'LOW';
    weight: number;
  }

  const swingHighs: RawPivot[] = [];
  const swingLows: RawPivot[] = [];

  // Detect fractal swing highs & lows (radius 3 = intraday, radius 6 = major)
  for (let i = 3; i < n - 2; i++) {
    const c = candles[i];
    let isHigh3 = true;
    let isLow3 = true;
    for (let k = i - 3; k <= i + 2; k++) {
      if (k === i || k < 0 || k >= n) continue;
      if (candles[k].high > c.high) isHigh3 = false;
      if (candles[k].low < c.low) isLow3 = false;
    }

    let isHigh6 = false;
    let isLow6 = false;
    if (i >= 6 && i < n - 4) {
      isHigh6 = isHigh3;
      isLow6 = isLow3;
      for (let k = i - 6; k <= i + 4; k++) {
        if (k === i || k < 0 || k >= n) continue;
        if (candles[k].high > c.high) isHigh6 = false;
        if (candles[k].low < c.low) isLow6 = false;
      }
    }

    if (isHigh3) {
      swingHighs.push({ idx: i, price: c.high, kind: 'HIGH', weight: isHigh6 ? 2 : 1 });
    }
    if (isLow3) {
      swingLows.push({ idx: i, price: c.low, kind: 'LOW', weight: isLow6 ? 2 : 1 });
    }
  }

  const sessionSlice = candles.slice(-96);
  const sessionHigh = roundToDecimals(Math.max(...sessionSlice.map((c) => c.high)), decimals);
  const sessionLow = roundToDecimals(Math.min(...sessionSlice.map((c) => c.low)), decimals);
  const pivotPoint = roundToDecimals((sessionHigh + sessionLow + currentPrice) / 3, decimals);

  // Add session extreme & prior major swings as anchor pivots
  const allPivots: RawPivot[] = [
    ...swingHighs,
    ...swingLows,
    { idx: n - 1, price: sessionHigh, kind: 'HIGH', weight: 2 },
    { idx: n - 1, price: sessionLow, kind: 'LOW', weight: 2 },
  ];

  interface SrCluster {
    weightedSum: number;
    weightTotal: number;
    touches: number;
    lastIdx: number;
  }

  const clusters: SrCluster[] = [];
  for (const p of allPivots) {
    let matched: SrCluster | null = null;
    let bestDiff = Infinity;
    for (const cl of clusters) {
      const center = cl.weightedSum / cl.weightTotal;
      const diff = Math.abs(center - p.price);
      if (diff <= clusterTol && diff < bestDiff) {
        bestDiff = diff;
        matched = cl;
      }
    }
    if (matched) {
      matched.weightedSum += p.price * p.weight;
      matched.weightTotal += p.weight;
      matched.touches += 1;
      matched.lastIdx = Math.max(matched.lastIdx, p.idx);
    } else {
      clusters.push({
        weightedSum: p.price * p.weight,
        weightTotal: p.weight,
        touches: p.weight,
        lastIdx: p.idx,
      });
    }
  }

  // Count additional historical wick/close rejections near each cluster center
  const wickTol = Math.max(isForex5 ? 0.0001 : isCrypto ? 12 : 0.35, safeAtr * 0.22);
  const scoredLevels = clusters.map((cl) => {
    const price = roundToDecimals(cl.weightedSum / cl.weightTotal, decimals);
    let reactionTouches = 0;
    for (let i = Math.max(0, n - 140); i < n - 1; i++) {
      const c = candles[i];
      const nearHigh = Math.abs(c.high - price) <= wickTol && c.close < price;
      const nearLow = Math.abs(c.low - price) <= wickTol && c.close > price;
      if (nearHigh || nearLow) reactionTouches += 1;
    }
    const touches = Math.max(cl.touches, Math.min(8, Math.round((cl.touches + reactionTouches) / 2)));
    const strength: SupportResistanceLevel['strength'] =
      touches >= 3 || cl.weightTotal >= 4
        ? 'STRONG'
        : touches >= 2 || cl.weightTotal >= 2
        ? 'MODERATE'
        : 'MINOR';
    return { price, touches, strength };
  });

  const minGapFromPrice = Math.max(
    isForex5 ? 0.00004 : isCrypto ? 4 : 0.15,
    safeAtr * 0.08
  );
  const rawResistances = scoredLevels
    .filter((l) => l.price > currentPrice + minGapFromPrice)
    .sort((a, b) => a.price - b.price);
  const rawSupports = scoredLevels
    .filter((l) => l.price < currentPrice - minGapFromPrice)
    .sort((a, b) => b.price - a.price);

  const dedupLevels = (arr: typeof rawResistances, minSpacing: number) => {
    const out: typeof rawResistances = [];
    for (const item of arr) {
      if (out.every((kept) => Math.abs(kept.price - item.price) >= minSpacing)) {
        out.push(item);
      }
      if (out.length >= 3) break;
    }
    return out;
  };

  const minSpacing = Math.max(
    isForex5 ? 0.00025 : isCrypto ? 30 : 0.8,
    safeAtr * 0.55
  );
  const resistances: SupportResistanceLevel[] = dedupLevels(rawResistances, minSpacing).map((l, idx) => {
    const dist = roundToDecimals(l.price - currentPrice, decimals);
    const distAtr = Number((dist / safeAtr).toFixed(2));
    return {
      price: l.price,
      type: 'RESISTANCE',
      strength: l.strength,
      touches: l.touches,
      distanceUsd: dist,
      distanceAtr: distAtr,
      label: `R${idx + 1} (${l.strength === 'STRONG' ? 'Kuat' : l.strength === 'MODERATE' ? 'Sedang' : 'Minor'} · ${l.touches}x)`,
    };
  });

  const supports: SupportResistanceLevel[] = dedupLevels(rawSupports, minSpacing).map((l, idx) => {
    const dist = roundToDecimals(currentPrice - l.price, decimals);
    const distAtr = Number((dist / safeAtr).toFixed(2));
    return {
      price: l.price,
      type: 'SUPPORT',
      strength: l.strength,
      touches: l.touches,
      distanceUsd: dist,
      distanceAtr: distAtr,
      label: `S${idx + 1} (${l.strength === 'STRONG' ? 'Kuat' : l.strength === 'MODERATE' ? 'Sedang' : 'Minor'} · ${l.touches}x)`,
    };
  });

  const nearestResistance = resistances[0] ?? null;
  const nearestSupport = supports[0] ?? null;

  // Market Structure (HH/HL vs LH/LL vs BOS/CHoCH)
  let marketStructure: ChartStructureAnalysis['marketStructure'] = 'CONSOLIDATION';
  let structureSummary = 'Konsolidasi / pergerakan menyamping di antara level S/R.';

  if (swingHighs.length >= 2 && swingLows.length >= 2) {
    const shPrev = swingHighs[swingHighs.length - 2];
    const shLast = swingHighs[swingHighs.length - 1];
    const slPrev = swingLows[swingLows.length - 2];
    const slLast = swingLows[swingLows.length - 1];

    const structMoveTol = Math.max(isForex5 ? 0.00005 : isCrypto ? 8 : 0.2, safeAtr * 0.08);
    const bosTol = Math.max(isForex5 ? 0.00006 : isCrypto ? 10 : 0.25, safeAtr * 0.1);
    const hh = shLast.price > shPrev.price + structMoveTol;
    const lh = shLast.price < shPrev.price - structMoveTol;
    const hl = slLast.price > slPrev.price + structMoveTol;
    const ll = slLast.price < slPrev.price - structMoveTol;

    if (hh && hl) {
      if (currentPrice < slLast.price) {
        marketStructure = 'TRANSITION_BOS';
        structureSummary = `Transisi Bearish CHoCH: sempat HH (${shLast.price.toFixed(decimals)}) & HL (${slLast.price.toFixed(decimals)}), namun harga menembus ke bawah HL terakhir.`;
      } else {
        marketStructure = 'UPTREND_HH_HL';
        structureSummary = `Uptrend Struktur Sehat (HH ${shPrev.price.toFixed(decimals)}→${shLast.price.toFixed(decimals)} & HL ${slPrev.price.toFixed(decimals)}→${slLast.price.toFixed(decimals)}).`;
      }
    } else if (lh && ll) {
      if (currentPrice > shLast.price) {
        marketStructure = 'TRANSITION_BOS';
        structureSummary = `Transisi Bullish CHoCH: sempat LH (${shLast.price.toFixed(decimals)}) & LL (${slLast.price.toFixed(decimals)}), namun harga break di atas LH terakhir.`;
      } else {
        marketStructure = 'DOWNTREND_LH_LL';
        structureSummary = `Downtrend Struktur Sehat (LH ${shPrev.price.toFixed(decimals)}→${shLast.price.toFixed(decimals)} & LL ${slPrev.price.toFixed(decimals)}→${slLast.price.toFixed(decimals)}).`;
      }
    } else if (currentPrice > shLast.price + bosTol) {
      marketStructure = 'TRANSITION_BOS';
      structureSummary = `Bullish Breakout / BOS ke atas Swing High ${shLast.price.toFixed(decimals)}.`;
    } else if (currentPrice < slLast.price - bosTol) {
      marketStructure = 'TRANSITION_BOS';
      structureSummary = `Bearish Breakdown / BOS ke bawah Swing Low ${slLast.price.toFixed(decimals)}.`;
    } else {
      marketStructure = 'CONSOLIDATION';
      structureSummary = `Konsolidasi Range antara Swing Low ${slLast.price.toFixed(decimals)} dan Swing High ${shLast.price.toFixed(decimals)}.`;
    }
  }

  // Candlestick Patterns (evaluate last closed & active bars)
  const candlestickPatterns: string[] = [];
  const barCur = candles[n - 1];
  const barPrev = candles[n - 2];
  const barPrev2 = candles[n - 3];
  const minRangeFloor = isForex5 ? 0.00002 : isCrypto ? 5 : 0.05;

  const inspectCandle = (c: Candle, tag: string) => {
    const range = Math.max(minRangeFloor, c.high - c.low);
    const body = Math.abs(c.close - c.open);
    const upWick = c.high - Math.max(c.open, c.close);
    const dnWick = Math.min(c.open, c.close) - c.low;
    const isBull = c.close >= c.open;

    if (dnWick >= Math.max(body * 2.1, range * 0.55) && upWick <= range * 0.22) {
      const nearSup = nearestSupport && Math.abs(c.low - nearestSupport.price) <= safeAtr * 0.6;
      candlestickPatterns.push(
        `Bullish Pin Bar / Hammer (${tag})${nearSup ? ` di dekat ${nearestSupport.label}` : ''}`
      );
    } else if (upWick >= Math.max(body * 2.1, range * 0.55) && dnWick <= range * 0.22) {
      const nearRes = nearestResistance && Math.abs(c.high - nearestResistance.price) <= safeAtr * 0.6;
      candlestickPatterns.push(
        `Bearish Pin Bar / Shooting Star (${tag})${nearRes ? ` di dekat ${nearestResistance.label}` : ''}`
      );
    } else if (body / range >= 0.72 && range >= safeAtr * 0.85) {
      candlestickPatterns.push(
        `${isBull ? 'Bullish' : 'Bearish'} Momentum Marubozu (${tag}, body ${body.toFixed(decimals)})`
      );
    } else if (body / range <= 0.16 && range >= safeAtr * 0.45) {
      candlestickPatterns.push(`Doji / Keraguan Pasar (${tag})`);
    }
  };

  inspectCandle(barPrev, 'candle tutup terakhir');
  if (barCur.high - barCur.low >= safeAtr * 0.5) {
    inspectCandle(barCur, 'candle berjalan');
  }

  // Engulfing & Inside Bar on last closed pair
  const prev2Bull = barPrev2.close >= barPrev2.open;
  const prevBull = barPrev.close >= barPrev.open;
  const prev2Body = Math.abs(barPrev2.close - barPrev2.open);
  const prevBody = Math.abs(barPrev.close - barPrev.open);

  if (!prev2Bull && prevBull && prevBody > prev2Body * 1.15 && barPrev.close >= barPrev2.open && barPrev.open <= barPrev2.close) {
    candlestickPatterns.push('Bullish Engulfing');
  } else if (prev2Bull && !prevBull && prevBody > prev2Body * 1.15 && barPrev.close <= barPrev2.open && barPrev.open >= barPrev2.close) {
    candlestickPatterns.push('Bearish Engulfing');
  }
  if (barPrev.high <= barPrev2.high && barPrev.low >= barPrev2.low) {
    candlestickPatterns.push('Inside Bar (Kompresi sebelum ekspansi)');
  }

  // Macro Chart Patterns (Double Top/Bottom, Triangles, Wedges, Liquidity Sweep, Breakout)
  const chartPatterns: string[] = [];

  if (swingHighs.length >= 2) {
    const h1 = swingHighs[swingHighs.length - 2];
    const h2 = swingHighs[swingHighs.length - 1];
    if (h2.idx - h1.idx >= 5 && Math.abs(h1.price - h2.price) <= safeAtr * 0.45) {
      chartPatterns.push(
        `Double Top / Equal Highs Liquidity Pool sekitar ${((h1.price + h2.price) / 2).toFixed(decimals)}`
      );
    }
  }
  if (swingLows.length >= 2) {
    const l1 = swingLows[swingLows.length - 2];
    const l2 = swingLows[swingLows.length - 1];
    if (l2.idx - l1.idx >= 5 && Math.abs(l1.price - l2.price) <= safeAtr * 0.45) {
      chartPatterns.push(
        `Double Bottom / Equal Lows Liquidity Pool sekitar ${((l1.price + l2.price) / 2).toFixed(decimals)}`
      );
    }
  }

  // Triangle / Wedge / Channel geometry using recent 32 bars split into two halves
  if (n >= 32) {
    const seg1 = candles.slice(-32, -16);
    const seg2 = candles.slice(-16);
    const max1 = Math.max(...seg1.map((c) => c.high));
    const max2 = Math.max(...seg2.map((c) => c.high));
    const min1 = Math.min(...seg1.map((c) => c.low));
    const min2 = Math.min(...seg2.map((c) => c.low));
    const highDelta = max2 - max1;
    const lowDelta = min2 - min1;
    const flatTol = safeAtr * 0.35;

    if (Math.abs(highDelta) <= flatTol && lowDelta > flatTol * 1.2) {
      chartPatterns.push(`Ascending Triangle (Resistance datar ~${max2.toFixed(decimals)}, Low meninggi)`);
    } else if (Math.abs(lowDelta) <= flatTol && highDelta < -flatTol * 1.2) {
      chartPatterns.push(`Descending Triangle (Support datar ~${min2.toFixed(decimals)}, High menurun)`);
    } else if (highDelta < -flatTol && lowDelta > flatTol) {
      chartPatterns.push('Symmetrical Triangle (Kompresi harga mengerucut siap breakout)');
    } else if (highDelta > flatTol && lowDelta > highDelta * 1.25) {
      chartPatterns.push('Rising Wedge (Potensi kehabisan dorongan beli jika break bawah)');
    } else if (lowDelta < -flatTol && highDelta < lowDelta * 1.25) {
      chartPatterns.push('Falling Wedge (Potensi reversal naik jika break atas)');
    }
  }

  // Liquidity Sweep detection on last 2 candles against prior swing high/low
  if (swingHighs.length >= 1) {
    const refHigh = swingHighs[swingHighs.length - 1];
    if (n - 1 - refHigh.idx >= 3 && (barPrev.high > refHigh.price || barCur.high > refHigh.price) && currentPrice < refHigh.price) {
      chartPatterns.push(`Bearish Liquidity Sweep di atas ${refHigh.price.toFixed(decimals)} (Fake Breakout)`);
    } else if (n - 1 - refHigh.idx >= 3 && barPrev.close > refHigh.price && currentPrice > refHigh.price) {
      chartPatterns.push(`Bullish Breakout terkonfirmasi di atas ${refHigh.price.toFixed(decimals)}`);
    }
  }
  if (swingLows.length >= 1) {
    const refLow = swingLows[swingLows.length - 1];
    if (n - 1 - refLow.idx >= 3 && (barPrev.low < refLow.price || barCur.low < refLow.price) && currentPrice > refLow.price) {
      chartPatterns.push(`Bullish Liquidity Sweep di bawah ${refLow.price.toFixed(decimals)} (Stop Hunt Rejection)`);
    } else if (n - 1 - refLow.idx >= 3 && barPrev.close < refLow.price && currentPrice < refLow.price) {
      chartPatterns.push(`Bearish Breakdown terkonfirmasi di bawah ${refLow.price.toFixed(decimals)}`);
    }
  }

  // Fair Value Gaps (FVG / Imbalance) in last 25 candles
  const fvgZones: ChartStructureAnalysis['fvgZones'] = [];
  const fvgMinGap = Math.max(isForex5 ? 0.00004 : isCrypto ? 5 : 0.15, safeAtr * 0.06);
  const startFvg = Math.max(2, n - 25);
  for (let i = startFvg; i < n; i++) {
    const c0 = candles[i - 2];
    const c2 = candles[i];
    if (c0.high < c2.low - fvgMinGap && currentPrice >= c0.high) {
      fvgZones.push({
        type: 'BULLISH_FVG',
        low: roundToDecimals(c0.high, decimals),
        high: roundToDecimals(c2.low, decimals),
      });
    } else if (c0.low > c2.high + fvgMinGap && currentPrice <= c0.low) {
      fvgZones.push({
        type: 'BEARISH_FVG',
        low: roundToDecimals(c2.high, decimals),
        high: roundToDecimals(c0.low, decimals),
      });
    }
  }

  // Nearest Psychological Round Levels scaled to asset class
  const roundStep = symbol
    ? getSymbolMeta(symbol).roundIncrement
    : isForex5
    ? 0.005
    : isCrypto
    ? 500
    : 10;
  const baseRound = Math.floor(currentPrice / roundStep) * roundStep;
  const roundLevels = [
    roundToDecimals(baseRound - roundStep, decimals),
    roundToDecimals(baseRound, decimals),
    roundToDecimals(baseRound + roundStep, decimals),
    roundToDecimals(baseRound + roundStep * 2, decimals),
  ]
    .filter((lvl) => lvl > 0)
    .sort((a, b) => Math.abs(a - currentPrice) - Math.abs(b - currentPrice))
    .slice(0, 3);

  const resNote = nearestResistance
    ? `R1=${nearestResistance.price.toFixed(decimals)} (+${nearestResistance.distanceUsd.toFixed(decimals)} / ${nearestResistance.distanceAtr} ATR${nearestResistance.distanceAtr <= 0.35 ? ' · SANGAT DEKAT ATAP' : ''})`
    : 'Tidak ada R terdekat';
  const supNote = nearestSupport
    ? `S1=${nearestSupport.price.toFixed(decimals)} (-${nearestSupport.distanceUsd.toFixed(decimals)} / ${nearestSupport.distanceAtr} ATR${nearestSupport.distanceAtr <= 0.35 ? ' · SANGAT DEKAT LANTAI' : ''})`
    : 'Tidak ada S terdekat';
  const pricePositionNote = `${resNote} | ${supNote}`;

  const detectHarmonicPattern = (): HarmonicPatternSignal | null => {
    // Build strictly alternating pivots (HIGH <-> LOW) from fractal swings
    const rawAlternating: RawPivot[] = [...swingHighs, ...swingLows].sort((a, b) => a.idx - b.idx);
    const pivots: RawPivot[] = [];
    for (const p of rawAlternating) {
      if (pivots.length === 0) {
        pivots.push({ ...p });
        continue;
      }
      const top = pivots[pivots.length - 1];
      if (top.kind === p.kind) {
        if ((p.kind === 'HIGH' && p.price > top.price) || (p.kind === 'LOW' && p.price < top.price)) {
          pivots[pivots.length - 1] = { ...p };
        }
      } else {
        if (Math.abs(p.price - top.price) >= safeAtr * 0.45) {
          pivots.push({ ...p });
        }
      }
    }

    if (pivots.length < 4) return null;

    // Candidate sets: either last 5 confirmed pivots [X,A,B,C,D] (if D is recent)
    // or last 4 confirmed pivots [X,A,B,C] + current live swing extreme D
    const candidateSets: Array<{
      x: number;
      a: number;
      b: number;
      c: number;
      d: number;
      dBarDist: number;
    }> = [];

    if (pivots.length >= 5) {
      const p5 = pivots.slice(-5);
      candidateSets.push({
        x: p5[0].price,
        a: p5[1].price,
        b: p5[2].price,
        c: p5[3].price,
        d: p5[4].price,
        dBarDist: n - 1 - p5[4].idx,
      });
    }

    const p4 = pivots.slice(-4);
    const lastC = p4[3];
    const tailSlice = candles.slice(Math.max(lastC.idx + 1, n - 12));
    if (tailSlice.length >= 1) {
      const dLive =
        lastC.kind === 'HIGH'
          ? Math.min(...tailSlice.map((c) => c.low))
          : Math.max(...tailSlice.map((c) => c.high));
      if (Math.abs(lastC.price - dLive) >= safeAtr * 0.4) {
        candidateSets.push({
          x: p4[0].price,
          a: p4[1].price,
          b: p4[2].price,
          c: p4[3].price,
          d: dLive,
          dBarDist: 0,
        });
      }
    }

    let bestMatch: { score: number; signal: HarmonicPatternSignal } | null = null;
    const inRange = (val: number, min: number, max: number) => val >= min && val <= max;

    for (const s of candidateSets) {
      const isBullish = s.x < s.a && s.a > s.b && s.b < s.c && s.d < s.c;
      const isBearish = s.x > s.a && s.a < s.b && s.b > s.c && s.d > s.c;
      if (!isBullish && !isBearish) continue;

      const xa = Math.abs(s.a - s.x);
      const ab = Math.abs(s.b - s.a);
      const bc = Math.abs(s.c - s.b);
      const cd = Math.abs(s.d - s.c);
      const ad = Math.abs(s.d - s.a);
      const xc = Math.abs(s.c - s.x);
      if (xa < safeAtr * 0.8 || ab < safeAtr * 0.4 || bc < safeAtr * 0.35 || cd < safeAtr * 0.35) {
        continue;
      }

      const abXa = ab / xa;
      const bcAb = bc / ab;
      const adXa = ad / xa;
      const cdBc = cd / bc;
      const cdAb = cd / ab;
      const bcXa = bc / xa;
      const cdXc = xc > minRangeFloor ? cd / xc : 0;

      type PatDef = {
        name: HarmonicPatternSignal['name'];
        idealAdXa: number;
        idealCdXc?: number;
        match: boolean;
        err: number;
      };

      const defs: PatDef[] = [
        {
          name: 'Gartley',
          idealAdXa: 0.786,
          match:
            inRange(abXa, 0.52, 0.71) &&
            inRange(bcAb, 0.36, 0.92) &&
            inRange(adXa, 0.71, 0.86) &&
            inRange(cdBc, 1.12, 1.75),
          err: Math.abs(abXa - 0.618) + Math.abs(adXa - 0.786),
        },
        {
          name: 'Bat',
          idealAdXa: 0.886,
          match:
            inRange(abXa, 0.35, 0.56) &&
            inRange(bcAb, 0.36, 0.92) &&
            inRange(adXa, 0.82, 0.95) &&
            inRange(cdBc, 1.45, 2.75),
          err: Math.abs(abXa - 0.44) + Math.abs(adXa - 0.886),
        },
        {
          name: 'Butterfly',
          idealAdXa: 1.272,
          match:
            inRange(abXa, 0.7, 0.86) &&
            inRange(bcAb, 0.36, 0.92) &&
            inRange(adXa, 1.18, 1.65) &&
            inRange(cdBc, 1.45, 2.75),
          err: Math.abs(abXa - 0.786) + Math.abs(adXa - 1.272),
        },
        {
          name: 'Crab',
          idealAdXa: 1.618,
          match:
            inRange(abXa, 0.35, 0.66) &&
            inRange(bcAb, 0.36, 0.92) &&
            inRange(adXa, 1.48, 1.75) &&
            inRange(cdBc, 2.0, 3.8),
          err: Math.abs(abXa - 0.5) + Math.abs(adXa - 1.618),
        },
        {
          name: 'Deep Crab',
          idealAdXa: 1.618,
          match:
            inRange(abXa, 0.82, 0.93) &&
            inRange(bcAb, 0.36, 0.92) &&
            inRange(adXa, 1.48, 1.75) &&
            inRange(cdBc, 1.85, 3.8),
          err: Math.abs(abXa - 0.886) + Math.abs(adXa - 1.618),
        },
        {
          name: 'Cypher',
          idealAdXa: 0.786,
          idealCdXc: 0.786,
          match:
            inRange(abXa, 0.36, 0.66) &&
            inRange(bcXa, 1.08, 1.48) &&
            inRange(cdXc, 0.72, 0.86),
          err: Math.abs(abXa - 0.5) + Math.abs(cdXc - 0.786),
        },
        {
          name: 'AB=CD',
          idealAdXa: adXa,
          match: inRange(bcAb, 0.38, 0.88) && inRange(cdAb, 0.88, 1.32),
          err: Math.abs(cdAb - 1.0) + 0.15,
        },
      ];

      const matched = defs.filter((d) => d.match).sort((a, b) => a.err - b.err)[0];
      if (!matched) continue;

      const direction: HarmonicPatternSignal['direction'] = isBullish ? 'BULLISH' : 'BEARISH';
      let idealD = s.d;
      if (matched.name === 'AB=CD') {
        idealD = isBullish ? s.c - ab : s.c + ab;
      } else if (matched.name === 'Cypher' && matched.idealCdXc) {
        idealD = isBullish ? s.c - xc * matched.idealCdXc : s.c + xc * matched.idealCdXc;
      } else {
        idealD = isBullish ? s.a - xa * matched.idealAdXa : s.a + xa * matched.idealAdXa;
      }

      const przPad = Math.max(isForex5 ? 0.00015 : isCrypto ? 15 : 0.45, safeAtr * 0.38);
      const przLow = roundToDecimals(Math.min(idealD, s.d) - przPad * 0.5, decimals);
      const przHigh = roundToDecimals(Math.max(idealD, s.d) + przPad * 0.5, decimals);
      const distToPrz =
        currentPrice < przLow
          ? przLow - currentPrice
          : currentPrice > przHigh
          ? currentPrice - przHigh
          : 0;

      let status: HarmonicPatternSignal['status'] = 'COMPLETED';
      if (distToPrz <= safeAtr * 0.35 && s.dBarDist <= 5) {
        status = 'AT_PRZ';
      } else if (distToPrz <= safeAtr * 1.25 && s.dBarDist <= 8) {
        status = 'APPROACHING_PRZ';
      } else if (s.dBarDist > 10) {
        continue;
      }

      const target1 = roundToDecimals(
        isBullish ? s.d + ad * 0.382 : s.d - ad * 0.382,
        decimals
      );
      const target2 = roundToDecimals(
        isBullish ? s.d + ad * 0.618 : s.d - ad * 0.618,
        decimals
      );
      const invalidation = roundToDecimals(
        isBullish
          ? Math.min(s.x, s.d) - safeAtr * 0.45
          : Math.max(s.x, s.d) + safeAtr * 0.45,
        decimals
      );

      const score = (status === 'AT_PRZ' ? 2 : status === 'APPROACHING_PRZ' ? 1 : 0.5) - matched.err;
      if (!bestMatch || score > bestMatch.score) {
        bestMatch = {
          score,
          signal: {
            name: matched.name,
            direction,
            status,
            xPrice: roundToDecimals(s.x, decimals),
            aPrice: roundToDecimals(s.a, decimals),
            bPrice: roundToDecimals(s.b, decimals),
            cPrice: roundToDecimals(s.c, decimals),
            dPrice: roundToDecimals(s.d, decimals),
            przLow,
            przHigh,
            ratiosSummary: `AB/XA=${abXa.toFixed(3)}, BC/AB=${bcAb.toFixed(3)}, AD/XA=${adXa.toFixed(3)}`,
            target1,
            target2,
            invalidation,
          },
        };
      }
    }

    return bestMatch ? bestMatch.signal : null;
  };

  const harmonicPattern = detectHarmonicPattern();
  if (harmonicPattern && (harmonicPattern.status === 'AT_PRZ' || harmonicPattern.status === 'APPROACHING_PRZ')) {
    chartPatterns.unshift(
      `${harmonicPattern.direction} Harmonic ${harmonicPattern.name} (${harmonicPattern.status} PRZ ${harmonicPattern.przLow.toFixed(decimals)}-${harmonicPattern.przHigh.toFixed(decimals)})`
    );
  }

  return {
    marketStructure,
    structureSummary,
    nearestResistance,
    nearestSupport,
    resistances,
    supports,
    pivotPoint,
    sessionHigh,
    sessionLow,
    roundLevels,
    candlestickPatterns: candlestickPatterns.slice(0, 4),
    chartPatterns: chartPatterns.slice(0, 4),
    fvgZones: fvgZones.slice(-3),
    harmonicPattern,
    pricePositionNote,
  };
}

export function computeStochastic(
  candles: Candle[],
  kPeriod = 14,
  dPeriod = 3
): { k: number | null; d: number | null } {
  if (candles.length < kPeriod + dPeriod) return { k: null, d: null };
  const kValues: number[] = [];
  for (let i = kPeriod - 1; i < candles.length; i++) {
    let highest = -Infinity;
    let lowest = Infinity;
    for (let j = i - kPeriod + 1; j <= i; j++) {
      if (candles[j].high > highest) highest = candles[j].high;
      if (candles[j].low < lowest) lowest = candles[j].low;
    }
    const range = highest - lowest;
    const rawK = range > 0 ? ((candles[i].close - lowest) / range) * 100 : 50;
    kValues.push(rawK);
  }
  const latestK = kValues[kValues.length - 1];
  const dSlice = kValues.slice(-dPeriod);
  const latestD = dSlice.reduce((a, b) => a + b, 0) / dSlice.length;
  return {
    k: Number(latestK.toFixed(1)),
    d: Number(latestD.toFixed(1)),
  };
}

export function computeAdx14(candles: Candle[], period = 14): number | null {
  if (candles.length < period * 2 + 2) return null;
  const plusDm: number[] = [];
  const minusDm: number[] = [];
  const tr: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const cur = candles[i];
    const prev = candles[i - 1];
    const upMove = cur.high - prev.high;
    const downMove = prev.low - cur.low;
    plusDm.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDm.push(downMove > upMove && downMove > 0 ? downMove : 0);
    tr.push(
      Math.max(
        cur.high - cur.low,
        Math.abs(cur.high - prev.close),
        Math.abs(cur.low - prev.close)
      )
    );
  }

  let smoothTr = 0;
  let smoothPlus = 0;
  let smoothMinus = 0;
  for (let i = 0; i < period; i++) {
    smoothTr += tr[i];
    smoothPlus += plusDm[i];
    smoothMinus += minusDm[i];
  }

  const dxArr: number[] = [];
  for (let i = period; i < tr.length; i++) {
    smoothTr = smoothTr - smoothTr / period + tr[i];
    smoothPlus = smoothPlus - smoothPlus / period + plusDm[i];
    smoothMinus = smoothMinus - smoothMinus / period + minusDm[i];

    const plusDi = smoothTr > 0 ? (smoothPlus / smoothTr) * 100 : 0;
    const minusDi = smoothTr > 0 ? (smoothMinus / smoothTr) * 100 : 0;
    const diSum = plusDi + minusDi;
    dxArr.push(diSum > 0 ? (Math.abs(plusDi - minusDi) / diSum) * 100 : 0);
  }

  if (dxArr.length < period) return null;
  let adx = 0;
  for (let i = 0; i < period; i++) {
    adx += dxArr[i];
  }
  adx /= period;
  for (let i = period; i < dxArr.length; i++) {
    adx = (adx * (period - 1) + dxArr[i]) / period;
  }
  return Number(adx.toFixed(1));
}

export function computeObvTrend(
  candles: Candle[],
  lookback = 20
): 'ACCUMULATION' | 'DISTRIBUTION' | 'NEUTRAL' {
  if (candles.length < lookback + 2) return 'NEUTRAL';
  let obv = 0;
  const obvSeries: number[] = [0];
  for (let i = 1; i < candles.length; i++) {
    const vol = Math.max(1, candles[i].volume || 1);
    if (candles[i].close > candles[i - 1].close) obv += vol;
    else if (candles[i].close < candles[i - 1].close) obv -= vol;
    obvSeries.push(obv);
  }
  const recent = obvSeries.slice(-lookback);
  const firstHalf = recent.slice(0, Math.floor(lookback / 2));
  const secondHalf = recent.slice(Math.floor(lookback / 2));
  const avg1 = firstHalf.reduce((a, b) => a + b, 0) / Math.max(1, firstHalf.length);
  const avg2 = secondHalf.reduce((a, b) => a + b, 0) / Math.max(1, secondHalf.length);
  const diff = avg2 - avg1;
  const avgVol =
    candles.slice(-lookback).reduce((a, c) => a + Math.max(1, c.volume || 1), 0) / lookback;
  if (diff > avgVol * 1.1) return 'ACCUMULATION';
  if (diff < -avgVol * 1.1) return 'DISTRIBUTION';
  return 'NEUTRAL';
}

export function computeFibonacciLevels(
  candles: Candle[],
  symbol?: TradingSymbol
): IndicatorSnapshot['fibonacci'] {
  const slice = candles.slice(-60);
  if (slice.length < 10) return undefined;
  const decimals = inferPriceDecimals(slice[slice.length - 1]?.close, symbol);
  let highIdx = 0;
  let lowIdx = 0;
  for (let i = 1; i < slice.length; i++) {
    if (slice[i].high > slice[highIdx].high) highIdx = i;
    if (slice[i].low < slice[lowIdx].low) lowIdx = i;
  }
  const swingHigh = roundToDecimals(slice[highIdx].high, decimals);
  const swingLow = roundToDecimals(slice[lowIdx].low, decimals);
  const minRange = decimals >= 5 ? 0.0002 : swingHigh > 10000 ? 15 : 0.5;
  const range = Math.max(minRange, swingHigh - swingLow);
  const trend: 'UP' | 'DOWN' = highIdx > lowIdx ? 'UP' : 'DOWN';

  if (trend === 'UP') {
    return {
      swingHigh,
      swingLow,
      trend,
      r382: roundToDecimals(swingHigh - range * 0.382, decimals),
      r500: roundToDecimals(swingHigh - range * 0.5, decimals),
      r618: roundToDecimals(swingHigh - range * 0.618, decimals),
      r786: roundToDecimals(swingHigh - range * 0.786, decimals),
      ext1272: roundToDecimals(swingLow + range * 1.272, decimals),
      ext1618: roundToDecimals(swingLow + range * 1.618, decimals),
    };
  }
  return {
    swingHigh,
    swingLow,
    trend,
    r382: roundToDecimals(swingLow + range * 0.382, decimals),
    r500: roundToDecimals(swingLow + range * 0.5, decimals),
    r618: roundToDecimals(swingLow + range * 0.618, decimals),
    r786: roundToDecimals(swingLow + range * 0.786, decimals),
    ext1272: roundToDecimals(swingHigh - range * 1.272, decimals),
    ext1618: roundToDecimals(swingHigh - range * 1.618, decimals),
  };
}

export function buildIndicatorPack(
  candles: Candle[],
  symbol?: TradingSymbol
): {
  snapshot: IndicatorSnapshot;
  ema9Series: Array<{ time: number; value: number }>;
  ema21Series: Array<{ time: number; value: number }>;
  ema50Series: Array<{ time: number; value: number }>;
  bbUpperSeries: Array<{ time: number; value: number }>;
  bbLowerSeries: Array<{ time: number; value: number }>;
} {
  const closes = candles.map((c) => c.close);
  const decimals = inferPriceDecimals(closes[closes.length - 1], symbol);
  const ema9Arr = computeEmaArray(closes, 9, decimals);
  const ema21Arr = computeEmaArray(closes, 21, decimals);
  const ema50Arr = computeEmaArray(closes, 50, decimals);
  const ema200Arr = computeEmaArray(closes, 200, decimals);

  const ema9Series: Array<{ time: number; value: number }> = [];
  const ema21Series: Array<{ time: number; value: number }> = [];
  const ema50Series: Array<{ time: number; value: number }> = [];

  for (let i = 0; i < candles.length; i++) {
    const t = candles[i].time;
    if (ema9Arr[i] !== null) ema9Series.push({ time: t, value: ema9Arr[i]! });
    if (ema21Arr[i] !== null) ema21Series.push({ time: t, value: ema21Arr[i]! });
    if (ema50Arr[i] !== null) ema50Series.push({ time: t, value: ema50Arr[i]! });
  }

  const bb = computeBollingerSeries(candles, 20, 2, symbol);
  const lookback = candles.slice(-30);
  const swingHigh = lookback.length > 0 ? Math.max(...lookback.map((c) => c.high)) : 0;
  const swingLow = lookback.length > 0 ? Math.min(...lookback.map((c) => c.low)) : 0;
  const atr14 = computeAtr14(candles, 14, symbol);
  const structure = analyzeChartStructure(candles, atr14, symbol);

  const lastIdx = candles.length - 1;
  const snapshot: IndicatorSnapshot = {
    ema9: lastIdx >= 0 ? ema9Arr[lastIdx] : null,
    ema21: lastIdx >= 0 ? ema21Arr[lastIdx] : null,
    ema50: lastIdx >= 0 ? ema50Arr[lastIdx] : null,
    ema200: lastIdx >= 0 ? ema200Arr[lastIdx] : null,
    rsi14: computeRsi14(closes, 14),
    stochastic: computeStochastic(candles, 14, 3),
    adx14: computeAdx14(candles, 14),
    obvTrend: computeObvTrend(candles, 20),
    fibonacci: computeFibonacciLevels(candles, symbol),
    macd: computeMacd(closes, symbol),
    atr14,
    bollinger: bb.latest,
    swingHigh: roundToDecimals(swingHigh, decimals),
    swingLow: roundToDecimals(swingLow, decimals),
    structure,
  };

  return {
    snapshot,
    ema9Series,
    ema21Series,
    ema50Series,
    bbUpperSeries: bb.upperSeries,
    bbLowerSeries: bb.lowerSeries,
  };
}

export function calculatePairLotSize(
  balance: number,
  riskPercent: number,
  entryPrice: number,
  stopLoss: number,
  symbol?: TradingSymbol
): number {
  const meta = getSymbolMeta(symbol);
  const slDistance = Math.abs(entryPrice - stopLoss);
  if (slDistance < meta.minSlDistance) return 0.01;
  const riskUsd = (balance * riskPercent) / 100;
  const rawLots = riskUsd / (slDistance * meta.contractSize);
  const clamped = Math.max(0.01, Math.min(10.0, rawLots));
  return Number(clamped.toFixed(2));
}

export function calculatePairPnl(
  side: 'BUY' | 'SELL',
  lots: number,
  entryPrice: number,
  currentPrice: number,
  symbol?: TradingSymbol
): number {
  const meta = getSymbolMeta(symbol);
  const diff = side === 'BUY' ? currentPrice - entryPrice : entryPrice - currentPrice;
  return Number((diff * lots * meta.contractSize).toFixed(2));
}

export function calculateXauLotSize(
  balance: number,
  riskPercent: number,
  entryPrice: number,
  stopLoss: number,
  symbol: TradingSymbol = 'XAU/USD'
): number {
  return calculatePairLotSize(balance, riskPercent, entryPrice, stopLoss, symbol);
}

export function calculateXauPnl(
  side: 'BUY' | 'SELL',
  lots: number,
  entryPrice: number,
  currentPrice: number,
  symbol: TradingSymbol = 'XAU/USD'
): number {
  return calculatePairPnl(side, lots, entryPrice, currentPrice, symbol);
}

export interface ComputeRecoveryInput {
  enabled?: boolean;
  symbol?: TradingSymbol;
  accountBalance: number;
  lotMode?: 'RISK_PERCENT' | 'FIXED_LOT';
  fixedLot?: number;
  riskPercent?: number;
  martingaleEnabled?: boolean;
  martingaleMultiplier?: number;
  maxRecoverySteps?: number;
  bid: number;
  ask: number;
  atr: number;
  nearestSupport?: number | null;
  nearestResistance?: number | null;
  openPositions: Array<{
    side: 'BUY' | 'SELL';
    lots: number;
    entryPrice: number;
    floatingPnlUsd: number;
  }>;
  positionDecision: 'NONE' | 'KEEP' | 'CLOSE_BUY' | 'CLOSE_SELL' | 'CLOSE_ALL';
  reversalConfidence?: number;
  recentClosedTrades: Array<{
    side: 'BUY' | 'SELL';
    lots?: number;
    pnlUsd: number;
    closeReason?: string;
    closedMinutesAgo?: number;
  }>;
  aiSignal: 'BUY' | 'SELL' | 'HOLD';
  marketBias: 'BULLISH' | 'BEARISH' | 'RANGING';
}

export function computeMathematicalRecoveryPlan(
  input: ComputeRecoveryInput
): MathematicalRecoveryPlan | undefined {
  if (input.enabled === false) return undefined;

  const isInvalidatedClose =
    input.openPositions.length > 0 &&
    (input.positionDecision === 'CLOSE_ALL' ||
      input.positionDecision === 'CLOSE_BUY' ||
      input.positionDecision === 'CLOSE_SELL');

  const invalidatedPositions = isInvalidatedClose
    ? input.openPositions.filter((p) =>
        input.positionDecision === 'CLOSE_ALL'
          ? true
          : input.positionDecision === 'CLOSE_BUY'
          ? p.side === 'BUY'
          : p.side === 'SELL'
      )
    : [];

  const invalidatedFloatingPnl = invalidatedPositions.reduce(
    (s, p) => s + (Number(p.floatingPnlUsd) || 0),
    0
  );
  const invalidatedLossUsd =
    invalidatedFloatingPnl < 0 ? Math.abs(invalidatedFloatingPnl) : 0;

  // Sum trailing consecutive losing trades from newest backward until a profitable trade resets the streak
  let closedStreakLossUsd = 0;
  let closedStreakCount = 0;
  let lastClosedLostLot = 0;
  for (const t of input.recentClosedTrades) {
    const pnl = Number(t.pnlUsd);
    if (!Number.isFinite(pnl)) continue;
    if (pnl >= 0) break;
    closedStreakLossUsd += Math.abs(pnl);
    closedStreakCount += 1;
    if (lastClosedLostLot === 0 && Number(t.lots) > 0) {
      lastClosedLostLot = Number(t.lots);
    }
  }

  const totalLossToRecoverUsd = Number((closedStreakLossUsd + invalidatedLossUsd).toFixed(2));
  const lossStreakCount =
    closedStreakCount + (invalidatedPositions.length > 0 && invalidatedLossUsd > 0 ? 1 : 0);

  if (totalLossToRecoverUsd <= 0 && invalidatedPositions.length === 0) {
    return undefined;
  }

  const inferredSymbol: TradingSymbol =
    input.symbol ??
    (input.bid > 0 && input.bid < 20
      ? 'EUR/USD'
      : input.bid > 15000
      ? 'BTC/USD'
      : 'XAU/USD');
  const meta = getSymbolMeta(inferredSymbol);
  const decimals = meta.decimals;
  const contractSize = meta.contractSize;
  const safeAtr = Math.max(meta.minSlDistance * 2, Number(input.atr) || meta.defaultAtr);
  const lotMode = input.lotMode ?? 'RISK_PERCENT';
  const configuredFixed = Math.max(0.01, Math.min(20, Number(input.fixedLot) || 0.05));
  const configuredRiskPct = Math.max(0.1, Math.min(10, Number(input.riskPercent) || 1.0));
  const martilOn = input.martingaleEnabled ?? true;
  const mult = Math.max(1.0, Math.min(5.0, Number(input.martingaleMultiplier) || 2.0));
  const maxSteps = Math.max(1, Math.min(5, Math.round(Number(input.maxRecoverySteps) || 3)));

  // Determine recovery direction
  let direction: 'BUY' | 'SELL' = 'BUY';
  if (input.aiSignal === 'BUY' || input.aiSignal === 'SELL') {
    direction = input.aiSignal;
  } else if (invalidatedPositions.length > 0) {
    direction = invalidatedPositions[0].side === 'BUY' ? 'SELL' : 'BUY';
  } else if (input.marketBias === 'BEARISH') {
    direction = 'SELL';
  } else if (input.marketBias === 'BULLISH') {
    direction = 'BUY';
  } else if (input.recentClosedTrades[0]) {
    direction = input.recentClosedTrades[0].side === 'BUY' ? 'SELL' : 'BUY';
  }

  const entryPrice = roundToDecimals(direction === 'BUY' ? input.ask : input.bid, decimals);
  const refSl =
    direction === 'BUY' ? entryPrice - safeAtr * 0.95 : entryPrice + safeAtr * 0.95;
  const baseLot =
    lotMode === 'FIXED_LOT'
      ? configuredFixed
      : calculatePairLotSize(
          Math.max(100, input.accountBalance),
          configuredRiskPct,
          entryPrice,
          refSl,
          inferredSymbol
        );

  const invalidatedMaxLot =
    invalidatedPositions.length > 0
      ? Math.max(...invalidatedPositions.map((p) => Math.max(0.01, Number(p.lots) || 0.01)))
      : 0;
  const lastLostLot =
    invalidatedMaxLot > 0
      ? invalidatedMaxLot
      : lastClosedLostLot > 0
      ? lastClosedLostLot
      : baseLot;

  const effectiveStep = Math.min(Math.max(1, lossStreakCount), maxSteps);
  const maxAllowedMartilLot = Number(
    Math.min(20, baseLot * Math.pow(mult, maxSteps)).toFixed(2)
  );
  const rawMartilLot = martilOn
    ? lastLostLot > 0
      ? lastLostLot * mult
      : baseLot * Math.pow(mult, effectiveStep)
    : baseLot;

  const recoveryLots = Number(
    Math.max(0.01, Math.min(20, maxAllowedMartilLot, rawMartilLot)).toFixed(2)
  );

  // Exact price move required for 100% loss recovery + positive net buffer
  const beMoveUsd =
    totalLossToRecoverUsd > 0 ? totalLossToRecoverUsd / (recoveryLots * contractSize) : 0;
  const profitBufferUsd = Math.max(0.5, safeAtr * recoveryLots * contractSize * 0.2);
  const rawNeededMove =
    (totalLossToRecoverUsd + profitBufferUsd) / (recoveryLots * contractSize);
  const minScalpMove = Math.max(meta.minSlDistance * 1.5, safeAtr * 0.32);
  const neededMoveUsd = roundToDecimals(Math.max(minScalpMove, rawNeededMove), decimals);

  const breakevenPrice = roundToDecimals(
    direction === 'BUY' ? entryPrice + beMoveUsd : entryPrice - beMoveUsd,
    decimals
  );
  const recoveryTp = roundToDecimals(
    direction === 'BUY' ? entryPrice + neededMoveUsd : entryPrice - neededMoveUsd,
    decimals
  );
  const expectedGrossUsd = neededMoveUsd * recoveryLots * contractSize;
  const expectedNetProfitUsd = Number((expectedGrossUsd - totalLossToRecoverUsd).toFixed(2));

  const srRoomUsd =
    direction === 'BUY'
      ? input.nearestResistance && input.nearestResistance > entryPrice
        ? input.nearestResistance - entryPrice
        : Infinity
      : input.nearestSupport && input.nearestSupport < entryPrice
      ? entryPrice - input.nearestSupport
      : Infinity;

  const achievableWithinAtr =
    neededMoveUsd <= Math.max(safeAtr * 1.9, minScalpMove * 3.5) &&
    neededMoveUsd <= srRoomUsd * 1.08;

  const triggeredBy: MathematicalRecoveryPlan['triggeredBy'] =
    invalidatedPositions.length > 0 && closedStreakCount > 0
      ? 'BOTH'
      : invalidatedPositions.length > 0
      ? 'ACTIVE_INVALIDATED'
      : 'CLOSED_LOSS_STREAK';

  const mode: MathematicalRecoveryPlan['mode'] =
    input.aiSignal === 'BUY' || input.aiSignal === 'SELL'
      ? 'EXECUTE_NOW'
      : 'ARMED_WAIT_SIGNAL';

  const rationale =
    mode === 'EXECUTE_NOW'
      ? `AI mengonfirmasi pembalikan ${direction} (${inferredSymbol}): buka Martil ${recoveryLots.toFixed(
          2
        )} lot (Base ${baseLot.toFixed(2)} / Prev ${lastLostLot.toFixed(2)} × ${
          martilOn ? `${mult.toFixed(1)}x` : '1.0x'
        }) @ ${entryPrice.toFixed(decimals)} dengan TP Matematis ${recoveryTp.toFixed(
          decimals
        )} (+${neededMoveUsd.toFixed(decimals)}) untuk pulih 100% loss -$${totalLossToRecoverUsd.toFixed(
          2
        )} + net +$${expectedNetProfitUsd.toFixed(2)}.`
      : `Recovery 100% SIAGA ${inferredSymbol} (loss -$${totalLossToRecoverUsd.toFixed(
          2
        )}): siapkan Martil ${recoveryLots.toFixed(2)} lot arah ${direction} (BE ${breakevenPrice.toFixed(
          decimals
        )} · TP Pulih ${recoveryTp.toFixed(decimals)}) begitu sinyal konfirmasi keluar.`;

  return {
    isActive: true,
    mode,
    triggeredBy,
    direction,
    lossToRecoverUsd: totalLossToRecoverUsd,
    lossStreakCount: Math.max(1, lossStreakCount),
    baseLot: Number(baseLot.toFixed(2)),
    lastLostLot: Number(lastLostLot.toFixed(2)),
    martingaleEnabled: martilOn,
    martingaleMultiplier: mult,
    recoveryLots,
    entryPrice,
    breakevenPrice,
    recoveryTp,
    neededMoveUsd,
    expectedNetProfitUsd,
    achievableWithinAtr,
    rationale,
  };
}
