import { GetSpread, RunScreener, ScreenerResults, SpreadParameters } from '../CallCreditSpreads/Screener';
import { ipcMain } from 'electron';
import path from 'path';
import { DataManager } from '../DataStorage/DataManager';
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
    DataManager.cachedSpreads.push(...results.spreads);
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

export interface GetCachedSpread {
  ticker: string;
  expiration: Date;
  shortStrike: number;
  longStrike: number;
}

ipcMain.handle('getCachedSpread', async (event, { ticker, expiration, shortStrike, longStrike }: GetCachedSpread): Promise<CallCreditSpread | undefined> => {
  const spread = DataManager.cachedSpreads.find((spread) => spread.underlying.ticker === ticker && spread.shortLeg.strike === shortStrike && spread.longLeg.strike === longStrike && spread.expiration.getTime() === expiration.getTime());
  return spread;
});

ipcMain.on('ClearCachedSpreads', () => {
  DataManager.cachedSpreads = [];
});
