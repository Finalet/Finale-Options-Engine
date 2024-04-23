import { BuildCallCreditSpread, BuildCallCreditSpreads } from './Data/BuildCallCreditSpread';
import { GetCallOption, GetCallOptionChain } from './Data/CallOptionChain';
import { GetStock } from './Data/Stock';
import { CallCreditSpread, Option, OptionChain } from './Data/Types';
import { filterByDaysToEarnings, filterByReturn } from './Filters/CallCreditSpreadFilters';
import { filterByBidAskSpread, filterByBollingerBands, filterByDelta, filterByDistanceToStrike, filterByIV, filterByVolume } from './Filters/OptionFilters';

export interface ScreenerResults {
  spreads: CallCreditSpread[];
  statistics: ScreenerStatistics;
}

export async function RunScreener(stock: string, expiration: Date | string, params?: SpreadParameters): Promise<ScreenerResults> {
  const { minSpreadDistance, maxSpreadDistance, minDistanceToStrike, minIV, maxIV, maxDelta, minVolume, minDistanceOverBollingerBand, minDaysToEarnings, maxLegBidAskSpread, minReturn } = params ?? {};

  const chain = await GetCallOptionChain(stock, expiration);

  const statistics: ScreenerStatistics = {
    optionsFilterSteps: [{ step: 'All', count: chain.options.length }],
    spreadsFilterSteps: [],
  };

  if (minDistanceToStrike !== undefined) {
    chain.options = chain.options.filter((option: Option) => filterByDistanceToStrike(option, chain.underlying, minDistanceToStrike));
    statistics.optionsFilterSteps?.push({ step: 'DTS', count: chain.options.length });
  }
  if (minDistanceOverBollingerBand !== undefined) {
    chain.options = chain.options.filter((option: Option) => filterByBollingerBands(option, chain.underlying.bollingerBands.upperBand, minDistanceOverBollingerBand));
    statistics.optionsFilterSteps?.push({ step: 'DOB', count: chain.options.length });
  }
  if (minIV !== undefined || maxIV !== undefined) {
    chain.options = chain.options.filter((option: Option) => filterByIV(option, minIV ?? 0, maxIV ?? 999));
    statistics.optionsFilterSteps?.push({ step: 'IV', count: chain.options.length });
  }
  if (maxDelta !== undefined) {
    chain.options = chain.options.filter((option: Option) => filterByDelta(option, maxDelta));
    statistics.optionsFilterSteps?.push({ step: 'Delta', count: chain.options.length });
  }
  if (minVolume !== undefined) {
    chain.options = chain.options.filter((option: Option) => filterByVolume(option, minVolume));
    statistics.optionsFilterSteps?.push({ step: 'Volume', count: chain.options.length });
  }
  if (maxLegBidAskSpread !== undefined) {
    chain.options = chain.options.filter((option: Option) => filterByBidAskSpread(option, maxLegBidAskSpread));
    statistics.optionsFilterSteps?.push({ step: 'Bid-Ask', count: chain.options.length });
  }

  let spreads = BuildCallCreditSpreads(chain, minSpreadDistance ?? 0.5, maxSpreadDistance ?? 999);
  statistics.spreadsFilterSteps = [{ step: 'All', count: spreads.length }];

  if (minReturn !== undefined) {
    spreads = spreads.filter((spread: CallCreditSpread) => filterByReturn(spread, minReturn));
    statistics.spreadsFilterSteps?.push({ step: 'Return', count: spreads.length });
  }
  if (minDaysToEarnings !== undefined) {
    spreads = spreads.filter((spread: CallCreditSpread) => filterByDaysToEarnings(spread, minDaysToEarnings));
    statistics.spreadsFilterSteps?.push({ step: 'Near earnings', count: spreads.length });
  }

  return {
    spreads,
    statistics,
  };
}

export async function GetSpread(underlyingTicker: string, shortOptionTicker: string, longOptionTicker: string): Promise<CallCreditSpread> {
  const stock = await GetStock(underlyingTicker);
  const [shortOption, longOption] = await Promise.all([GetCallOption(shortOptionTicker, stock), GetCallOption(longOptionTicker, stock)]);
  return BuildCallCreditSpread(stock, shortOption, longOption);
}

export interface SpreadParameters {
  minSpreadDistance?: number;
  maxSpreadDistance?: number;
  minDistanceToStrike?: number;
  minIV?: number;
  maxIV?: number;
  maxDelta?: number;
  minVolume?: number;
  minDistanceOverBollingerBand?: number;
  minDaysToEarnings?: number;
  maxLegBidAskSpread?: number;
  minReturn?: number;
}

export interface ScreenerStatistics {
  optionsFilterSteps: { step: string; count: number }[];
  spreadsFilterSteps: { step: string; count: number }[];
}
