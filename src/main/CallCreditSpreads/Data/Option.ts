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
      polygonOptions
        .map((polygonOption) => {
          const yahooOption = yahooOptions.options[0].calls.find((option: CallOrPut) => `O:${option.contractSymbol}` === polygonOption.details?.ticker);
          return optionFromPolygonAndYahoo(polygonOption, yahooOption, underlyingStock);
        })
        .filter((option) => !isNaN(option.price)) ?? [],
  };

  return optionChain;
}

export async function GetExistingCallOption(option: Option, underlying: Stock, on?: Date): Promise<Option> {
  if (on) return await GetPartialExistingCallOptionOn(option, underlying, on);

  yahooFinance.setGlobalConfig({ validation: { logErrors: false } });

  // const polygonResults = await polygon.options.snapshotOptionContract(underlying.ticker, `O:${optionTicker}`);
  // const polygonOption = polygonResults.results;
  const polygonOption = await fetchFromPolygon<any>(`https://api.polygon.io/v3/snapshot/options/${underlying.ticker}/O:${option.ticker}?apiKey=${process.env.POLYGON_API_KEY}`, option.ticker);

  const yahooOptions = await yahooFinance.options(underlying.ticker, { date: polygonOption.details?.expiration_date, formatted: true });
  const yahooOption = yahooOptions.options[0].calls.find((option: CallOrPut) => `O:${option.contractSymbol}` === polygonOption.details?.ticker);

  return optionFromPolygonAndYahoo(polygonOption, yahooOption, underlying);
}

export const optionFromPolygonAndYahoo = (polygonOption: any, yahooOption: CallOrPut | undefined, underlying: Stock): Option => {
  const lastUpdated = new Date(polygonOption.day.last_updated / 1000000);
  const updatedToday = date.isSameDay(new Date(), lastUpdated);

  const yahooLastTraded = yahooOption?.lastTradeDate;
  const yahooUpdatedToday = yahooLastTraded ? date.isSameDay(new Date(), yahooLastTraded) : undefined;

  const [year, month, day] = polygonOption.details.expiration_date.split('-').map(Number);
  const expiration = new Date(year, month - 1, day, 17, 30, 0);

  const contractType = polygonOption.details.contract_type;
  const strike = polygonOption.details.strike_price;

  const distanceToStrike = getDistanceToStrike(contractType, strike, underlying.price);
  const distanceOverBollingerBand = getDistanceOverBollingerBand(strike, underlying.bollingerBands.upperBand);

  let volume = 0;
  if (yahooOption?.volume !== undefined && yahooUpdatedToday) {
    volume = yahooOption?.volume;
  } else if (polygonOption.day.volume !== undefined && updatedToday) {
    volume = polygonOption.day.volume;
  }

  const greeks =
    Object.keys(polygonOption.greeks).length === 0
      ? undefined
      : {
          delta: roundTo(polygonOption.greeks.delta, 4),
          gamma: roundTo(polygonOption.greeks.gamma, 4),
          theta: roundTo(polygonOption.greeks.theta, 4),
          vega: roundTo(polygonOption.greeks.vega, 4),
        };

  return {
    dateUpdated: new Date(),
    ticker: polygonOption.details.ticker.split(':')[1],
    underlyingTicker: underlying.ticker,
    contractType: contractType,
    strike: strike,
    expiration: expiration,
    bid: yahooOption?.bid !== undefined ? roundTo(yahooOption?.bid, 2) : undefined,
    ask: yahooOption?.ask !== undefined ? roundTo(yahooOption?.ask, 2) : undefined,
    price: yahooOption?.bid !== undefined && yahooOption?.ask !== undefined ? roundTo((yahooOption.bid + yahooOption.ask) / 2, 2) : roundTo(polygonOption.day.close, 2),
    impliedVolatility: polygonOption.implied_volatility !== undefined ? roundTo(polygonOption.implied_volatility, 4) : undefined,
    greeks: greeks,
    distanceToStrike: roundTo(distanceToStrike, 4),
    distanceOverBollingerBand: roundTo(distanceOverBollingerBand, 4),
    volume,
  };
};

const getDateOnly = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

async function GetPartialExistingCallOptionOn(option: Option, underlying: Stock, on: Date): Promise<Option> {
  const polygonOptionQuote = await polygon.options.dailyOpenClose(`O:${option.ticker}`, date.format(on, 'YYYY-MM-DD'));

  const distanceToStrike = getDistanceToStrike(option.contractType, option.strike, underlying.price);
  const distanceOverBollingerBand = getDistanceOverBollingerBand(option.strike, underlying.bollingerBands.upperBand);

  const isExpired = option.expiration <= on;
  const otm = underlying.price < option.strike;

  const returnOption: Option = {
    ticker: option.ticker,
    contractType: 'call',
    expiration: option.expiration,
    underlyingTicker: underlying.ticker,
    dateUpdated: on,
    strike: option.strike,
    price: isExpired && otm ? 0 : polygonOptionQuote.close ?? 0,
    volume: polygonOptionQuote.volume ?? 0,
    distanceToStrike: roundTo(distanceToStrike, 2),
    distanceOverBollingerBand: roundTo(distanceOverBollingerBand, 2),
    bid: undefined,
    ask: undefined,
    impliedVolatility: undefined,
    greeks: undefined,
  };
  return returnOption;
}

const fetchFromPolygon = async <T>(url: string, ticker: string): Promise<T> => {
  const response = await fetch(url);
  const polygonOptionResults: any = response.ok ? await response.json() : undefined;
  if (!polygonOptionResults) throw new Error(`Option with ticker ${ticker} not found.`);
  const polygonOption = polygonOptionResults.results;
  if (!polygonOption) throw new Error(`Option with ticker ${ticker} not found.`);
  return polygonOption;
};

const getDistanceToStrike = (contractType: string, strike: number, underlyingPrice: number): number => {
  return (contractType === 'call' ? strike - underlyingPrice : underlyingPrice - strike) / underlyingPrice;
};
const getDistanceOverBollingerBand = (strike: number, upperBand: number): number => {
  return (strike - upperBand) / strike;
};
