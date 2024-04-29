import yahooFinance from 'yahoo-finance2';
import { Stock, StockHistoricalPrice } from './Types';
import date from 'date-and-time';
import { bollingerBands } from 'indicatorts';
// import * as finvizor from 'finvizor';

export async function GetStock(ticker: string, on?: Date): Promise<Stock> {
  yahooFinance.setGlobalConfig({ validation: { logErrors: false } });

  const quote = await yahooFinance.quote(ticker);
  const calendarEvents = quote.quoteType === 'EQUITY' ? await yahooFinance.quoteSummary(ticker, { modules: ['calendarEvents'] }) : undefined;
  const earningsDate = calendarEvents?.calendarEvents?.earnings?.earningsDate && calendarEvents?.calendarEvents.earnings.earningsDate.length > 0 ? calendarEvents.calendarEvents.earnings.earningsDate[0] : undefined;

  // const finvizorQuote: any = await finvizor.stock(ticker);

  const periodStart = date.addDays(on ?? new Date(), -365);
  const historicalPrices = await getPricesFromTo(ticker, periodStart, on);

  const stockPrice = on === undefined ? quote.regularMarketPrice : historicalPrices.find((price) => Math.floor(date.subtract(on, price.date).toDays()) === 0)?.price;
  if (stockPrice === undefined) throw new Error(`Failed to get price at ${on}`);

  const { lower, middle, upper } = bollingerBands(historicalPrices.map((price) => price.price));

  const stock: Stock = {
    dateUpdated: on ?? new Date(),
    ticker: ticker,
    name: quote.displayName ?? quote.shortName ?? ticker,
    // name: finvizorQuote.name,
    price: stockPrice ?? 0,
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

const getPricesFromTo = async (ticker: string, from: Date, to?: Date): Promise<StockHistoricalPrice[]> => {
  const results = await yahooFinance.chart(ticker, { period1: from, period2: to, interval: '1d' });
  return results.quotes
    .map((quote) => {
      return {
        date: quote.date,
        price: quote.close,
      };
    })
    .filter((price) => price.price !== null) as StockHistoricalPrice[];
};
