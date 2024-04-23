import { app } from 'electron';
import { CallCreditSpread, CallCreditSpreadTrade, Option, Stock } from '../CallCreditSpreads/Data/Types';
import jsonFile from 'jsonfile';
import date from 'date-and-time';
import fs from 'fs';

export class DataManager {
  static cachedSpreads: CallCreditSpread[] = [];
  static cachedTrades: CallCreditSpreadTrade[] = [];

  static async LoadTrades(): Promise<CallCreditSpreadTrade[]> {
    const tradesFolderPath = DataManager.getTradesFolderPath();
    if (!fs.existsSync(tradesFolderPath)) return [];
    const files = fs.readdirSync(tradesFolderPath);
    let trades = await Promise.all(
      files.map(async (file) => {
        if (!file.endsWith('.json')) return null;
        return (await jsonFile.readFile(`${tradesFolderPath}/${file}`)) as CallCreditSpreadTrade;
      }),
    );

    trades.filter((t) => t !== null).forEach((t) => this.processTradeDates(t as CallCreditSpreadTrade));
    return trades as CallCreditSpreadTrade[];
  }

  static async SaveNewTrade(trade: CallCreditSpreadTrade) {
    const folderPath = this.getTradesFolderPath();
    const filePath = this.getTradeFilePath(trade);
    fs.mkdirSync(folderPath, { recursive: true });
    await jsonFile.writeFile(filePath, trade, { spaces: 2 });
  }

  private static getTradesFolderPath() {
    return `${app.getPath('userData')}/Data/Trades`;
  }
  private static getTradeFileName(trade: CallCreditSpreadTrade) {
    return `${trade.underlying.ticker}_${date.format(trade.dateOpened, 'MM-DD-YYYY')}_${trade.id.slice(0, 5)}`;
  }
  private static getTradeFilePath(trade: CallCreditSpreadTrade) {
    return `${this.getTradesFolderPath()}/${this.getTradeFileName(trade)}.json`;
  }

  private static processOptionDates(option: Option) {
    option.expiration = new Date(option.expiration);
    this.processStockDates(option.underlying);
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
    this.processStockDates(trade.underlying);
    this.processSpreadDates(trade.spreadAtOpen);
    if (trade.spreadAtClose) this.processSpreadDates(trade.spreadAtClose);
    if (trade.spreadLive) this.processSpreadDates(trade.spreadLive);
  }
}
