import { ipcMain } from 'electron';
import { DataManager } from '../DataStorage/DataManager';
import { CallCreditSpread, CallCreditSpreadTrade } from '../CallCreditSpreads/Data/Types';
import { nanoid } from 'nanoid';

ipcMain.handle('LoadTrades', async () => {
  const trades = await DataManager.LoadTrades();
  DataManager.cachedTrades = trades;
  return trades;
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
  DataManager.SaveNewTrade(trade);
  return spread;
});

export interface GetCachedTradeArgs {
  tradeID: string;
}

ipcMain.handle('getCachedTrade', async (event, { tradeID }: GetCachedTradeArgs): Promise<CallCreditSpreadTrade | undefined> => {
  const trade = DataManager.cachedTrades.find((t) => t.id === tradeID);
  return trade;
});
