import { ipcMain } from 'electron';
import { DataManager } from '../DataStorage/DataManager';
import { CallCreditSpread, CallCreditSpreadTrade, Option } from '../CallCreditSpreads/Data/Types';
import { nanoid } from 'nanoid';
import { mainWindow } from '../main';
import { GetStock } from '../CallCreditSpreads/Data/Stock';
import { GetExistingCallOption } from '../CallCreditSpreads/Data/Option';
import { BuildCallCreditSpread } from '../CallCreditSpreads/Data/BuildCallCreditSpread';
import date from 'date-and-time';

ipcMain.handle('LoadTrades', async () => {
  return await DataManager.LoadTrades();
});
export interface ExecuteTradeArgs {
  spread: CallCreditSpread;
  quantity: number;
  atPrice?: number;
}

ipcMain.handle('ExecuteTrade', async (event, { spread, atPrice, quantity }: ExecuteTradeArgs) => {
  spread.underlying.historicalPrices = spread.underlying.historicalPrices?.slice(-90);

  if (atPrice !== undefined) {
    spread.price = atPrice;
    const distance = spread.longLeg.strike - spread.shortLeg.strike;
    spread.maxProfit = atPrice * 100;
    spread.maxLoss = distance * 100 - spread.maxProfit;
  }
  const trade: CallCreditSpreadTrade = {
    id: nanoid(),
    status: 'open',
    quantity: quantity,
    credit: spread.price * 100 * quantity,
    collateral: spread.collateral * quantity,
    dateOpened: new Date(),
    spreadAtOpen: spread,
  };
  DataManager.SaveTrade(trade);
  return spread;
});

export interface CloseTradeArgs {
  trade: CallCreditSpreadTrade;
  atPrice: number;
  onDate: Date;
}

ipcMain.handle('CloseTrade', async (event, { trade, atPrice, onDate }: CloseTradeArgs) => {
  let spreadAtClose;
  if (trade.spreadLive && Math.floor(date.subtract(new Date(), onDate).toDays()) === 0) {
    spreadAtClose = trade.spreadLive;
  } else if (trade.spreadAtExpiration && Math.floor(date.subtract(trade.spreadAtOpen.expiration, onDate).toDays()) === 0) {
    spreadAtClose = trade.spreadAtExpiration;
  } else {
    const spreadOnDate = await GetExistingSpread(trade.spreadAtOpen.underlying.ticker, trade.spreadAtOpen.shortLeg, trade.spreadAtOpen.longLeg, onDate);
    spreadAtClose = spreadOnDate;
  }

  delete trade.spreadAtExpiration;
  delete trade.spreadLive;

  spreadAtClose.underlying.historicalPrices = spreadAtClose.underlying.historicalPrices?.slice(-90);
  spreadAtClose.price = atPrice;
  const distance = spreadAtClose.longLeg.strike - spreadAtClose.shortLeg.strike;
  spreadAtClose.maxProfit = atPrice * 100;
  spreadAtClose.maxLoss = distance * 100 - spreadAtClose.maxProfit;

  trade.status = 'closed';
  trade.spreadAtClose = spreadAtClose;
  trade.dateClosed = onDate;
  await DataManager.SaveTrade(trade);

  mainWindow?.webContents.send('tradeClosed', trade);
});

ipcMain.handle('LoadLiveTrade', async (event, trade: CallCreditSpreadTrade): Promise<CallCreditSpreadTrade> => {
  try {
    const liveSpread = await GetExistingSpread(trade.spreadAtOpen.underlying.ticker, trade.spreadAtOpen.shortLeg, trade.spreadAtOpen.longLeg);
    trade.spreadLive = liveSpread;
    return trade;
  } catch (error: any) {
    if (trade.spreadAtOpen.expiration > new Date()) {
      throw new Error(`Failed to get live data trade ${trade.spreadAtOpen.underlying.ticker} ${trade.spreadAtOpen.shortLeg.strike}/${trade.spreadAtOpen.longLeg.strike}.`);
    }
    const expiredSpread = await GetExistingSpread(trade.spreadAtOpen.underlying.ticker, trade.spreadAtOpen.shortLeg, trade.spreadAtOpen.longLeg, trade.spreadAtOpen.expiration);
    trade.spreadAtExpiration = expiredSpread;
    trade.status = 'expired';
    return trade;
  }
});

const GetExistingSpread = async (underlyingTicker: string, shortLeg: Option, longLeg: Option, onDate?: Date): Promise<CallCreditSpread> => {
  const stock = await GetStock(underlyingTicker, onDate);
  const [shortOption, longOption] = await Promise.all([GetExistingCallOption(shortLeg, stock, onDate), GetExistingCallOption(longLeg, stock, onDate)]);
  return BuildCallCreditSpread(stock, shortOption, longOption);
};
