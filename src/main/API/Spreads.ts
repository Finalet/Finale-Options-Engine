import { RunScreener, ScreenerResults, SpreadParameters } from '../CallCreditSpreads/Screener';
import { ipcMain } from 'electron';
import { CallCreditSpread, Option } from '../CallCreditSpreads/Data/Types';
import { GetStock } from '../CallCreditSpreads/Data/Stock';
import { BuildCallCreditSpread } from '../CallCreditSpreads/Data/BuildCallCreditSpread';
import { GetCallOption } from '../CallCreditSpreads/Data/Option';

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
  underlyingTicker: string;
  shortLeg: string | Option;
  longLeg: string | Option;
  onDate?: Date;
}

ipcMain.handle('GetSpread', async (event, { underlyingTicker, shortLeg, longLeg, onDate }: GetSpreadArgs): Promise<CallCreditSpread> => {
  const stock = await GetStock(underlyingTicker, onDate);
  const [shortOption, longOption] = await Promise.all([GetCallOption(shortLeg, stock, onDate), GetCallOption(longLeg, stock, onDate)]);
  return BuildCallCreditSpread(stock, shortOption, longOption);
});
