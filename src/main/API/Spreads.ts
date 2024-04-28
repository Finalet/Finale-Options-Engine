import { GetSpread, RunScreener, ScreenerResults, SpreadParameters } from '../CallCreditSpreads/Screener';
import { ipcMain } from 'electron';
import { CallCreditSpread } from '../CallCreditSpreads/Data/Types';
import { GetStockOnDate } from '../CallCreditSpreads/Data/Stock';
import { BuildCallCreditSpread } from '../CallCreditSpreads/Data/BuildCallCreditSpread';
import { GetCallOptionOn } from '../CallCreditSpreads/Data/Option';

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

export interface GetSpreadOnDateArgs {
  underlyingTicker: string;
  shortLegTicker: string;
  longLegTicker: string;
  onDate: Date;
}

ipcMain.handle('GetSpreadOnDate', async (event, { underlyingTicker, shortLegTicker, longLegTicker, onDate }: GetSpreadOnDateArgs): Promise<CallCreditSpread> => {
  const stock = await GetStockOnDate(underlyingTicker, onDate);

  const [shortOption, longOption] = await Promise.all([GetCallOptionOn(shortLegTicker, stock, onDate), GetCallOptionOn(longLegTicker, stock, onDate)]);
  return BuildCallCreditSpread(stock, shortOption, longOption);
});
