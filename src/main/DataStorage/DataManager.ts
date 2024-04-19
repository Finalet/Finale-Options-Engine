import { app } from 'electron';
import { CallCreditSpread, CallCreditSpreadTrade } from '../CallCreditSpreads/Data/Types';
import jsonFile from 'jsonfile';
import date from 'date-and-time';
import fs from 'fs';

export class DataManager {
  static cachedSpreads: CallCreditSpread[] = [];

  static async LoadTrades(): Promise<CallCreditSpreadTrade[]> {
    const tradesFolderPath = DataManager.getTradesFolderPath();
    if (!fs.existsSync(tradesFolderPath)) return [];
    const files = fs.readdirSync(tradesFolderPath);
    const trades = await Promise.all(
      files.map(async (file) => {
        if (!file.endsWith('.json')) return null;
        return (await jsonFile.readFile(`${tradesFolderPath}/${file}`)) as CallCreditSpreadTrade;
      }),
    );
    return trades.filter((t) => t !== null);
  }

  static async SaveNewTrade(trade: CallCreditSpreadTrade) {
    const folderPath = DataManager.getTradesFolderPath();
    const filePath = DataManager.getTradeFilePath(trade);
    fs.mkdirSync(folderPath, { recursive: true });
    await jsonFile.writeFile(filePath, trade);
  }

  private static getTradesFolderPath() {
    return `${app.getPath('userData')}/Data/Trades`;
  }
  private static getTradeFileName(trade: CallCreditSpreadTrade) {
    return `${trade.underlying.ticker}_${date.format(trade.dateOpened, 'MM-DD-YYYY')}_${trade.id.slice(0, 5)}`;
  }
  private static getTradeFilePath(trade: CallCreditSpreadTrade) {
    return `${DataManager.getTradesFolderPath()}/${DataManager.getTradeFileName(trade)}.json`;
  }
}
