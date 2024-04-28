import { IOptionsChainQuery, IOptionsSnapshotChain, IOptionsSnapshotContract, IRestClient, restClient } from '@polygon.io/client-js';
import { Option, OptionChain, Stock } from './Types';
import yahooFinance from 'yahoo-finance2';
import { CallOrPut } from 'yahoo-finance2/dist/esm/src/modules/options';
import { roundTo } from './Utils';
import { GetStock } from './Stock';
import date from 'date-and-time';

let polygon: IRestClient;

export function ConfigurePolygon() {
  polygon = restClient(process.env.POLYGON_API_KEY, undefined, { pagination: true });
}

export async function GetCallOptionChain(stock: string | Stock, expiration: Date | string, strikes?: number[], onlyOTM?: boolean): Promise<OptionChain> {
  yahooFinance.setGlobalConfig({ validation: { logErrors: false } });

  const expirationDate = typeof expiration === 'string' ? expiration : getDateOnly(expiration);
  const underlyingStock: Stock = typeof stock === 'string' ? await GetStock(stock) : stock;
  const yahooOptions = await yahooFinance.options(underlyingStock.ticker, { date: expirationDate, formatted: true });

  let polygonChain: IOptionsSnapshotChain[] = [];
  const query: IOptionsChainQuery = {
    contract_type: 'call',
    sort: 'strike_price',
    order: 'asc',
    expiration_date: expirationDate,
  };
  if (!strikes) {
    const chain = await polygon.options.snapshotOptionChain(underlyingStock.ticker, {
      ...query,
      'strike_price.gte': onlyOTM === false ? undefined : underlyingStock.price,
    });
    polygonChain.push(chain);
  } else {
    for (const strike of strikes) {
      const chain = await polygon.options.snapshotOptionChain(underlyingStock.ticker, {
        ...query,
        strike_price: strike,
      });
      chain.results;
      polygonChain.push(chain);
    }
  }

  const polygonOptions = polygonChain.flatMap((chain) => chain.results).filter((option) => option !== undefined);

  const optionChain: OptionChain = {
    underlying: underlyingStock,
    options:
      polygonOptions.map((polygonOption) => {
        const yahooOption = yahooOptions.options[0].calls.find((option: CallOrPut) => `O:${option.contractSymbol}` === polygonOption.details?.ticker);
        return optionFromPolygonAndYahoo(polygonOption, yahooOption, underlyingStock);
      }) ?? [],
  };

  return optionChain;
}

export async function GetCallOption(optionTicker: string, underlying: Stock): Promise<Option> {
  yahooFinance.setGlobalConfig({ validation: { logErrors: false } });

  // const polygonResults = await polygon.options.snapshotOptionContract(underlying.ticker, `O:${optionTicker}`);
  // const polygonOption = polygonResults.results;
  const response = await fetch(`https://api.polygon.io/v3/snapshot/options/${underlying.ticker}/O:${optionTicker}?apiKey=${process.env.POLYGON_API_KEY}`);
  const polygonResults: IOptionsSnapshotContract = response.ok ? await response.json() : undefined;
  if (!polygonResults) throw new Error(`[404] Option with ticker ${optionTicker} not found.`);
  const polygonOption = polygonResults.results;
  if (!polygonOption) throw new Error(`[404] Option with ticker ${optionTicker} not found.`);

  const yahooOptions = await yahooFinance.options(underlying.ticker, { date: polygonOption.details?.expiration_date, formatted: true });
  const yahooOption = yahooOptions.options[0].calls.find((option: CallOrPut) => `O:${option.contractSymbol}` === polygonOption.details?.ticker);

  return optionFromPolygonAndYahoo(polygonOption, yahooOption, underlying);
}

export const optionFromPolygonAndYahoo = (polygonOption: any, yahooOption: CallOrPut | undefined, underlying: Stock): Option => {
  const lastUpdated = new Date(polygonOption.day.last_updated / 1000000);
  const daysSinceUpdate = date.subtract(new Date(), lastUpdated).toDays();

  const [year, month, day] = polygonOption.details.expiration_date.split('-').map(Number);
  const expiration = new Date(year, month - 1, day, 17, 30, 0);

  const contractType = polygonOption.details.contract_type;
  const strike = polygonOption.details.strike_price;

  const distanceToStrike = (contractType === 'call' ? strike - underlying.price : underlying.price - strike) / underlying.price;
  const distanceOverBollingerBand = (strike - underlying.bollingerBands.upperBand) / strike;

  return {
    ticker: polygonOption.details.ticker.split(':')[1],
    underlyingTicker: underlying.ticker,
    contractType: contractType,
    strike: strike,
    expiration: expiration,
    bid: yahooOption?.bid !== undefined ? roundTo(yahooOption?.bid, 2) : undefined,
    ask: yahooOption?.ask !== undefined ? roundTo(yahooOption?.ask, 2) : undefined,
    price: yahooOption?.bid !== undefined && yahooOption?.ask !== undefined ? roundTo((yahooOption.bid + yahooOption.ask) / 2, 2) : roundTo(polygonOption.day.close, 2),
    impliedVolatility: roundTo(polygonOption.implied_volatility, 4),
    greeks: {
      delta: roundTo(polygonOption.greeks.delta, 4),
      gamma: roundTo(polygonOption.greeks.gamma, 4),
      theta: roundTo(polygonOption.greeks.theta, 4),
      vega: roundTo(polygonOption.greeks.vega, 4),
    },
    distanceToStrike: roundTo(distanceToStrike, 2),
    distanceOverBollingerBand: roundTo(distanceOverBollingerBand, 2),
    volume: yahooOption?.volume ?? (daysSinceUpdate > 1 ? 0 : polygonOption.day.volume),
  };
};

const getDateOnly = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export async function GetExpiredCallOption(optionAtOpen: Option, underlying: Stock): Promise<Option> {
  const polygonOption = await polygon.options.dailyOpenClose(`O:${optionAtOpen.ticker}`, date.format(optionAtOpen.expiration, 'YYYY-MM-DD'));

  const distanceToStrike = (optionAtOpen.contractType === 'call' ? optionAtOpen.strike - underlying.price : underlying.price - optionAtOpen.strike) / underlying.price;
  const distanceOverBollingerBand = (optionAtOpen.strike - underlying.bollingerBands.upperBand) / optionAtOpen.strike;

  const option: Option = {
    ...optionAtOpen,
    bid: undefined,
    ask: undefined,
    price: polygonOption.close ?? 0,
    volume: polygonOption.volume ?? 0,
    impliedVolatility: 0,
    greeks: {
      delta: 0,
      gamma: 0,
      theta: 0,
      vega: 0,
    },
    distanceToStrike: roundTo(distanceToStrike, 2),
    distanceOverBollingerBand: roundTo(distanceOverBollingerBand, 2),
  };
  return option;
}
