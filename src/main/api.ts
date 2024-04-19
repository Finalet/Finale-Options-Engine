import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import GetCallCreditSpreads, { CallCreditSpreadScreenerResults, ScreenerStatistics, SpreadParameters } from './CallCreditSpreads/CallCreditSpreads';
import { ConfigurePolygon } from './CallCreditSpreads/Data/CallOptionChain';
import { resolveHtmlPath } from './util';
import { CallCreditSpread } from './CallCreditSpreads/Data/Types';
import { DataManager } from './DataStorage/DataManager';
import { CallCreditSpreadTrade } from './Trades/Trade';
import { nanoid } from 'nanoid';

ConfigurePolygon();

export interface GetCallCreditSpreadArgs {
  ticker: string;
  expiration: Date;
  params?: SpreadParameters;
}

ipcMain.handle('getCallCreditSpreads', async (event, { ticker, expiration, params }: GetCallCreditSpreadArgs): Promise<CallCreditSpreadScreenerResults> => {
  try {
    console.log(`[${ticker}] Getting call credit spreads`);
    const results = await GetCallCreditSpreads(ticker, expiration, params);
    DataManager.cachedSpreads.push(...results.spreads);
    return results;
  } catch (error: any) {
    console.error(`[${ticker}] Failed to build call credit spread. Error: ${error}`);
    if (error.message.includes('Quote not found for ticker symbol:')) throw new Error(`[WRONG-TICKER]`);
    if (error.name === 'FailedYahooValidationError') throw new Error(`[FAILED-YAHOO-VALIDATION]`);
    throw new Error(error);
  }
});

export interface GetCachedCallCreditSpreadArgs {
  ticker: string;
  expiration: Date;
  shortStrike: number;
  longStrike: number;
}

ipcMain.handle('getCachedCallCreditSpread', async (event, { ticker, expiration, shortStrike, longStrike }: GetCachedCallCreditSpreadArgs): Promise<CallCreditSpread | undefined> => {
  const spread = DataManager.cachedSpreads.find((spread) => spread.underlying.ticker === ticker && spread.shortLeg.strike === shortStrike && spread.longLeg.strike === longStrike);
  return spread;
});

ipcMain.on('clearCachedSpreads', () => {
  DataManager.cachedSpreads = [];
});

ipcMain.on('open-window', (event, url: string) => {
  const RESOURCES_PATH = app.isPackaged ? path.join(process.resourcesPath, 'assets') : path.join(__dirname, '../../assets');
  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  const newWindow = new BrowserWindow({
    show: false,
    transparent: true,
    backgroundMaterial: 'acrylic',
    vibrancy: 'fullscreen-ui',
    maximizable: false,
    width: 966,
    maxWidth: 966,
    minWidth: 966,
    height: 740, //722,
    maxHeight: 740, //722,
    minHeight: 740, //722,
    resizable: false,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged ? path.join(__dirname, 'preload.js') : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  newWindow.setMenu(null);
  newWindow.loadURL(`${resolveHtmlPath(`index.html`)}#${url}`);

  newWindow.on('ready-to-show', () => {
    if (!newWindow) {
      throw new Error('"newWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      newWindow.minimize();
    } else {
      newWindow.show();
    }
  });
});

export interface ExecuteTradeArgs {
  spread: CallCreditSpread;
}

ipcMain.handle('executeTrade', async (event, { spread }: ExecuteTradeArgs) => {
  const trade: CallCreditSpreadTrade = {
    id: nanoid(),
    type: 'call-credit-spread',
    dateOpened: new Date(),
    underlying: spread.underlying,
    spreadAtOpen: spread,
  };
  DataManager.SaveNewTrade(trade);
  return spread;
});

ipcMain.handle('loadTrades', async () => {
  return DataManager.LoadTrades();
});
