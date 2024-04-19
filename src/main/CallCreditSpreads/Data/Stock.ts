import yahooFinance from 'yahoo-finance2';
import { Stock, StockHistoricalPrice } from './Types';
import date from 'date-and-time';
import { bollingerBands } from 'indicatorts';
import * as finvizor from 'finvizor';

export async function GetStock(ticker: string): Promise<Stock> {
  yahooFinance.setGlobalConfig({ validation: { logErrors: false } });

  const quote = await yahooFinance.quote(ticker);
  const calendarEvents = quote.quoteType === 'EQUITY' ? await yahooFinance.quoteSummary(ticker, { modules: ['calendarEvents'] }) : undefined;
  const earningsDate = calendarEvents?.calendarEvents?.earnings?.earningsDate && calendarEvents?.calendarEvents.earnings.earningsDate.length > 0 ? calendarEvents.calendarEvents.earnings.earningsDate[0] : undefined;

  // const finvizorQuote: any = await finvizor.stock(ticker);

  const historicalPrices = await lastNDayClosingPrices(ticker, 365);
  const { lower, middle, upper } = bollingerBands(historicalPrices.map((price) => price.price));

  const stock: Stock = {
    dateUpdated: new Date(),
    ticker: ticker,
    name: quote.displayName ?? quote.shortName ?? ticker,
    // name: finvizorQuote.name,
    price: quote.regularMarketPrice ?? 0,
    // price: finvizorQuote.price ?? 0,
    earningsDate: earningsDate ?? quote.earningsTimestamp ?? quote.earningsTimestampStart,
    // earningsDate: finvizorQuote.earnings.date ? new Date(finvizorQuote.earnings.date) : undefined,
    exDividendDate: calendarEvents?.calendarEvents?.exDividendDate,
    // exDividendDate: finvizorQuote.dividendExDate !== null ? new Date(finvizorQuote.dividendExDate) : undefined,
    // dividendDate: undefined,
    dividendDate: calendarEvents?.calendarEvents?.dividendDate ?? quote.dividendDate,
    bollingerBands: {
      upperBand: upper[lower.length - 1],
      middleBand: middle[middle.length - 1],
      lowerBand: lower[upper.length - 1],
    },
    historicalPrices: historicalPrices,
  };

  return stock;
}

async function lastNDayClosingPrices(ticker: string, days: number): Promise<StockHistoricalPrice[]> {
  const periodStart = date.addDays(new Date(), -days);
  const result = await yahooFinance.chart(ticker, { period1: periodStart, interval: '1d' });

  return result.quotes
    .map((quote) => {
      return {
        date: quote.date,
        price: quote.close,
      };
    })
    .filter((price) => price.price !== null) as StockHistoricalPrice[];
}
