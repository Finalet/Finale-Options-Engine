import { GetSpread, RunScreener, ScreenerResults, SpreadParameters } from '../CallCreditSpreads/Screener';
import { ipcMain } from 'electron';
import { CallCreditSpread } from '../CallCreditSpreads/Data/Types';

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
