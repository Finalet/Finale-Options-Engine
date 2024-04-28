import { GetSpread, RunScreener, ScreenerResults, SpreadParameters } from '../CallCreditSpreads/Screener';
import { ipcMain } from 'electron';
import { Option, CallCreditSpread } from '../CallCreditSpreads/Data/Types';
import { GetStockAtDate } from '../CallCreditSpreads/Data/Stock';
import { GetExpiredCallOption } from '../CallCreditSpreads/Data/CallOptionChain';
import { BuildCallCreditSpread } from '../CallCreditSpreads/Data/BuildCallCreditSpread';

export interface RunScreenerResultsArgs {
  ticker: string;
  expiration: Date;
  params?: SpreadParameters;
}

ipcMain.handle('RunScreener', async (event, { ticker, expiration, params }: RunScreenerResultsArgs): Promise<ScreenerResults> => {
  try {
    console.log(`[${ticker}] Getting call credit spreads`);
    const results = await RunScreener(ticker, expiration, params);
    return results;
  } catch (error: any) {
    console.error(`[${ticker}] Failed to build call credit spread. Error: ${error}`);
    if (error.message.includes('Quote not found for ticker symbol:')) throw new Error(`[WRONG-TICKER]`);
    if (error.name === 'FailedYahooValidationError') throw new Error(`[FAILED-YAHOO-VALIDATION]`);
    throw new Error(error);
  }
});

export interface GetSpreadArgs {
  ticker: string;
  shortOptionTicker: string;
  longOptionTicker: string;
}

ipcMain.handle('GetSpread', async (event, { ticker, shortOptionTicker, longOptionTicker }: GetSpreadArgs): Promise<CallCreditSpread> => {
  const spread = await GetSpread(ticker, shortOptionTicker, longOptionTicker);
  return spread;
});

export interface GetExpiredSpreadArgs {
  shortLegAtOpen: Option;
  longLegAtOpen: Option;
}

ipcMain.handle('GetExpiredSpread', async (event, { shortLegAtOpen, longLegAtOpen }: GetExpiredSpreadArgs): Promise<CallCreditSpread> => {
  const stock = await GetStockAtDate(shortLegAtOpen.underlyingTicker, shortLegAtOpen.expiration);

  const [shortOption, longOption] = await Promise.all([GetExpiredCallOption(shortLegAtOpen, stock), GetExpiredCallOption(longLegAtOpen, stock)]);
  return BuildCallCreditSpread(stock, shortOption, longOption);
});
