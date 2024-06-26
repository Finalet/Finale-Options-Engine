import { app } from 'electron';
import { CallCreditSpread, CallCreditSpreadTrade, Option, OptionChain, Stock } from '../CallCreditSpreads/Data/Types';
import jsonFile from 'jsonfile';
import date from 'date-and-time';
import fs from 'fs';
import { nanoid } from 'nanoid';
import Store from 'electron-store';
import { ConfigurePolygon } from '../CallCreditSpreads/Data/Option';

const configStore = new Store();

export class DataManager {
  private static transactions: { [key: string]: any } = {};
  static chains: { [key: string]: OptionChain } = {};

  static async LoadTrades(): Promise<CallCreditSpreadTrade[]> {
    const folderPath = DataManager.getTradesFolderPath();
    if (!fs.existsSync(folderPath)) return [];
    const files = fs.readdirSync(folderPath);
    let trades = await Promise.all(
      files.map(async (file) => {
        if (!file.endsWith('.json')) return null;
        return (await jsonFile.readFile(`${folderPath}/${file}`)) as CallCreditSpreadTrade;
      }),
    );

    const filteredTrades = trades.filter((t) => t !== null);
    filteredTrades.forEach((t) => this.processTradeDates(t as CallCreditSpreadTrade));
    filteredTrades.forEach((t) => {
      if (t.status === 'open' && t.spreadAtOpen.expiration.getTime() < new Date().getTime()) t.status = 'expired';
    });
    return filteredTrades;
  }

  static async SaveTrade(trade: CallCreditSpreadTrade) {
    const folderPath = this.getTradesFolderPath();
    const filePath = this.getTradeFilePath(trade);
    fs.mkdirSync(folderPath, { recursive: true });
    await jsonFile.writeFile(filePath, trade, { spaces: 2 });
  }

  static getTradesFolderPath() {
    return (configStore.get(configKeys.tradesFolderPath, undefined) as string | undefined) ?? `${app.getPath('userData')}/Data/Trades`;
  }
  static setTradesFolderPath(path: string) {
    configStore.set(configKeys.tradesFolderPath, path);
  }
  private static getTradeFileName(trade: CallCreditSpreadTrade) {
    return `${trade.spreadAtOpen.underlying.ticker}_${date.format(trade.dateOpened, 'MM-DD-YYYY')}_${trade.id.slice(0, 5)}`;
  }
  static getTradeFilePath(trade: CallCreditSpreadTrade) {
    return `${this.getTradesFolderPath()}/${this.getTradeFileName(trade)}.json`;
  }

  private static processOptionDates(option: Option) {
    option.expiration = new Date(option.expiration);
  }
  private static processStockDates(stock: Stock) {
    stock.dateUpdated = new Date(stock.dateUpdated);
    if (stock.earningsDate) stock.earningsDate = new Date(stock.earningsDate);
    if (stock.exDividendDate) stock.exDividendDate = new Date(stock.exDividendDate);
    if (stock.dividendDate) stock.dividendDate = new Date(stock.dividendDate);
    stock.historicalPrices?.forEach((h) => (h.date = new Date(h.date)));
  }
  private static processSpreadDates(spread: CallCreditSpread) {
    spread.dateUpdated = new Date(spread.dateUpdated);
    spread.expiration = new Date(spread.expiration);
    this.processOptionDates(spread.shortLeg);
    this.processOptionDates(spread.longLeg);
    this.processStockDates(spread.underlying);
  }
  private static processTradeDates(trade: CallCreditSpreadTrade) {
    trade.dateOpened = new Date(trade.dateOpened);
    if (trade.dateClosed) trade.dateClosed = new Date(trade.dateClosed);
    this.processSpreadDates(trade.spreadAtOpen);
    if (trade.spreadAtClose) this.processSpreadDates(trade.spreadAtClose);
    if (trade.spreadLive) this.processSpreadDates(trade.spreadLive);
  }

  static DepositTransaction<T>(object: T): string {
    const id = nanoid();
    this.transactions[id] = object;
    return id;
  }

  static RetrieveTransaction<T>(id: string): T {
    const object = this.transactions[id];
    return object;
  }

  static polygonAPIKey() {
    return configStore.get(configKeys.polygonApiKey, undefined) as string | undefined;
  }
  static setPolygonAPIKey(key: string) {
    configStore.set(configKeys.polygonApiKey, key);
    ConfigurePolygon();
  }
}

const configKeys = {
  tradesFolderPath: 'trades-folder-path',
  polygonApiKey: 'polygon-api-key',
};
