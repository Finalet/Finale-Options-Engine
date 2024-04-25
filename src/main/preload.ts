// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer } from 'electron';
import { ScreenerResults } from './CallCreditSpreads/Screener';
import { CallCreditSpread, CallCreditSpreadTrade } from './CallCreditSpreads/Data/Types';
import { GetSpreadArgs, RunScreenerResultsArgs } from './API/Spreads';
import { ExecuteTradeArgs } from './API/Trades';

const API = {
  spreads: {
    RunScreener: (args: RunScreenerResultsArgs): Promise<ScreenerResults> => ipcRenderer.invoke('RunScreener', args),
    GetSpread: (args: GetSpreadArgs): Promise<CallCreditSpread> => ipcRenderer.invoke('GetSpread', args),
  },
  trades: {
    LoadTrades: (): Promise<CallCreditSpreadTrade[]> => ipcRenderer.invoke('LoadTrades'),
    ExecuteTrade: (args: ExecuteTradeArgs) => ipcRenderer.invoke('ExecuteTrade', args),
  },
  app: {
    OpenSpreadDetails: (args: CallCreditSpread) => ipcRenderer.send('OpenSpreadDetails', args),
    OpenTradeDetails: (args: CallCreditSpreadTrade) => ipcRenderer.send('OpenTradeDetails', args),
  },
  transaction: {
    retrieve: <T>(id: string): Promise<T> => ipcRenderer.invoke('transactionRetrieve', id),
  },
};

contextBridge.exposeInMainWorld('api', API);
export type API = typeof API;
