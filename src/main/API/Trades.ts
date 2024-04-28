import { ipcMain } from 'electron';
import { DataManager } from '../DataStorage/DataManager';
import { CallCreditSpread, CallCreditSpreadTrade } from '../CallCreditSpreads/Data/Types';
import { nanoid } from 'nanoid';
import { mainWindow } from '../main';

ipcMain.handle('LoadTrades', async () => {
  return await DataManager.LoadTrades();
});
export interface ExecuteTradeArgs {
  spread: CallCreditSpread;
  quantity: number;
  atPrice?: number;
}

ipcMain.handle('ExecuteTrade', async (event, { spread, atPrice, quantity }: ExecuteTradeArgs) => {
  const underlying = spread.underlying;
  delete underlying.historicalPrices;

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
  atPrice?: number;
  atDate?: Date;
}

ipcMain.handle('CloseTrade', async (event, { trade, atPrice, atDate }: CloseTradeArgs) => {
  const liveSpread = trade.spreadLive;
  if (!liveSpread) throw new Error('Trade is not live');

  if (atPrice !== undefined) {
    liveSpread.price = atPrice;
    const distance = liveSpread.longLeg.strike - liveSpread.shortLeg.strike;
    liveSpread.maxProfit = atPrice * 100;
    liveSpread.maxLoss = distance * 100 - liveSpread.maxProfit;
  }
  trade.status = 'closed';
  delete trade.spreadLive;
  trade.spreadAtClose = liveSpread;
  trade.dateClosed = atDate ?? new Date();
  await DataManager.SaveTrade(trade);

  mainWindow?.webContents.send('tradeClosed', trade);
});
