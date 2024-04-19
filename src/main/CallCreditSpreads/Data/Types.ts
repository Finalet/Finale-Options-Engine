export interface Option {
  ticker: string;
  underlying: Stock;
  contractType: 'call' | 'put';
  strike: number;
  expiration: Date;
  price: number;
  bid?: number;
  ask?: number;
  impliedVolatility: number;
  greeks: {
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
  };
  volume: number;
}

export interface OptionChain {
  underlying: Stock;
  options: Option[];
}

export interface Stock {
  dateUpdated: Date;
  ticker: string;
  name: string;
  price: number;
  earningsDate?: Date;
  exDividendDate?: Date;
  dividendDate?: Date;
  bollingerBands: {
    upperBand: number;
    middleBand: number;
    lowerBand: number;
  };
  historicalPrices: StockHistoricalPrice[];
}

export interface StockHistoricalPrice {
  date: Date;
  price: number;
}

export interface CallCreditSpread {
  dateUpdated: Date;
  underlying: Stock;
  shortLeg: Option;
  longLeg: Option;
  expiration: Date;
  maxProfit: number;
  maxLoss: number;
  returnAtExpiration: number;
  stats: {
    collateral: number;
    daysToExpiration: number;
    distanceToShortStrike: number;
    distanceToLongStrike: number;
    distanceOverBollingerBand: number;
  };
}
