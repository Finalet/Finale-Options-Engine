export interface Option {
  dateUpdated: Date;
  ticker: string;
  underlyingTicker: string;
  contractType: 'call' | 'put';
  strike: number;
  expiration: Date;
  price: number;
  bid?: number;
  ask?: number;
  impliedVolatility?: number;
  greeks?: {
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
  };
  volume: number;
  distanceToStrike: number;
  distanceOverBollingerBand: number;
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
  historicalPrices?: StockHistoricalPrice[];
  bollingerBands: {
    upperBand: number;
    middleBand: number;
    lowerBand: number;
  };
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
  price: number;
  maxProfit: number;
  maxLoss: number;
  returnAtExpiration: number;
  daysToExpiration: number;
  collateral: number;
}

export interface CallCreditSpreadTrade {
  id: string;
  status: 'open' | 'closed' | 'expired';
  quantity: number;
  credit: number;
  collateral: number;
  dateOpened: Date;
  dateClosed?: Date;
  debit?: number;
  spreadAtOpen: CallCreditSpread;
  spreadAtClose?: CallCreditSpread;
  spreadAtExpiration?: CallCreditSpread;
  spreadLive?: CallCreditSpread;
}
