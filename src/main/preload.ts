// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer } from 'electron';
import { ExecuteTradeArgs, GetCachedCallCreditSpreadArgs, GetCachedCallCreditSpreadTradeArgs, GetCallCreditSpreadArgs, GetCallCreditSpreadsArgs, OpenWindowArgs } from './api';
import { CallCreditSpreadScreenerResults } from './CallCreditSpreads/CallCreditSpreads';
import { CallCreditSpread, CallCreditSpreadTrade } from './CallCreditSpreads/Data/Types';

const API = {
  getCallCreditSpreads: (args: GetCallCreditSpreadsArgs): Promise<CallCreditSpreadScreenerResults> => ipcRenderer.invoke('getCallCreditSpreads', args),
  getCallCreditSpread: (args: GetCallCreditSpreadArgs): Promise<CallCreditSpread> => ipcRenderer.invoke('getCallCreditSpread', args),
  getCachedCallCreditSpread: (args: GetCachedCallCreditSpreadArgs): Promise<CallCreditSpread> => ipcRenderer.invoke('getCachedCallCreditSpread', args),
  getCachedCallCreditSpreadTrade: (args: GetCachedCallCreditSpreadTradeArgs): Promise<CallCreditSpreadTrade> => ipcRenderer.invoke('getCachedCallCreditSpreadTrade', args),
  clearCachedSpreads: () => ipcRenderer.send('clearCachedSpreads'),
  executeTrade: (args: ExecuteTradeArgs) => ipcRenderer.invoke('executeTrade', args),
  loadTrades: () => ipcRenderer.invoke('loadTrades'),
  openWindow: (args: OpenWindowArgs) => ipcRenderer.send('open-window', args),
};

contextBridge.exposeInMainWorld('api', API);
export type API = typeof API;
