// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer } from 'electron';
import { ScreenerResults } from './CallCreditSpreads/Screener';
import { CallCreditSpread, CallCreditSpreadTrade } from './CallCreditSpreads/Data/Types';
import { GetCachedSpread, GetSpreadArgs, RunScreenerResultsArgs } from './API/Spreads';
import { ExecuteTradeArgs, GetCachedTradeArgs } from './API/Trades';
import { OpenSpreadDetailsArgs, OpenTradeDetailsArgs } from './API/App';

const API = {
  spreads: {
    RunScreener: (args: RunScreenerResultsArgs): Promise<ScreenerResults> => ipcRenderer.invoke('RunScreener', args),
    GetSpread: (args: GetSpreadArgs): Promise<CallCreditSpread> => ipcRenderer.invoke('GetSpread', args),
    getCachedSpread: (args: GetCachedSpread): Promise<CallCreditSpread> => ipcRenderer.invoke('getCachedSpread', args),
    ClearCachedSpreads: () => ipcRenderer.send('ClearCachedSpreads'),
  },
  trades: {
    LoadTrades: (): Promise<CallCreditSpreadTrade[]> => ipcRenderer.invoke('LoadTrades'),
    ExecuteTrade: (args: ExecuteTradeArgs) => ipcRenderer.invoke('ExecuteTrade', args),
    CacheTrade: (trade: CallCreditSpreadTrade) => ipcRenderer.invoke('CacheTrade', trade),
    getCachedTrade: (args: GetCachedTradeArgs): Promise<CallCreditSpreadTrade> => ipcRenderer.invoke('getCachedTrade', args),
  },
  app: {
    OpenSpreadDetails: (args: OpenSpreadDetailsArgs) => ipcRenderer.send('OpenSpreadDetails', args),
    OpenTradeDetails: (args: OpenTradeDetailsArgs) => ipcRenderer.send('OpenTradeDetails', args),
  },
  transaction: {
    deposit: <T>(object: T): Promise<string> => ipcRenderer.invoke('transactionDeposit', object),
    retrieve: <T>(id: string): Promise<T> => ipcRenderer.invoke('transactionRetrieve', id),
  },
};

contextBridge.exposeInMainWorld('api', API);
export type API = typeof API;
