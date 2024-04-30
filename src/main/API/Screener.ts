import { ipcMain } from 'electron';
import { RunScreener, ScreenerResults, SpreadParameters } from '../CallCreditSpreads/Screener';
import { GetCallOptionChain } from '../CallCreditSpreads/Data/Option';
import { DataManager } from '../DataStorage/DataManager';
import { OptionChain } from '../CallCreditSpreads/Data/Types';

export interface LoadOptionChainArgs {
  underlyingTicker: string;
  expiration: Date;
}

ipcMain.handle('LoadOptionChain', async (event, { underlyingTicker, expiration }: LoadOptionChainArgs): Promise<number> => {
  try {
    console.log(`[${underlyingTicker}] Getting call credit spreads`);
    const chain: OptionChain = await GetCallOptionChain(underlyingTicker, expiration);
    DataManager.chains[underlyingTicker] = chain;
    return Object.keys(DataManager.chains).length;
  } catch (error: any) {
    console.error(`[${underlyingTicker}] Failed to build call credit spread. Error: ${error}`);
    if (error.message.includes('Quote not found for ticker symbol:')) throw new Error(`[WRONG-TICKER]`);
    if (error.name === 'FailedYahooValidationError') throw new Error(`[FAILED-YAHOO-VALIDATION]`);
    throw new Error(error);
  }
});

ipcMain.on('ClearLoadedChains', () => {
  DataManager.chains = {};
});

export interface RunScreenerArgs {
  underlyingTicker: string;
  params?: SpreadParameters;
}
ipcMain.handle('RunScreener', async (event, { underlyingTicker, params }): Promise<ScreenerResults> => {
  const result = await RunScreener(underlyingTicker, params);
  return result;
});
