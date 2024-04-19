// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer } from 'electron';
import { ExecuteTradeArgs, GetCachedCallCreditSpreadArgs, GetCallCreditSpreadArgs } from './api';
import { CallCreditSpreadScreenerResults } from './CallCreditSpreads/CallCreditSpreads';
import { CallCreditSpread } from './CallCreditSpreads/Data/Types';

const API = {
  getCallCreditSpreads: (args: GetCallCreditSpreadArgs): Promise<CallCreditSpreadScreenerResults> => ipcRenderer.invoke('getCallCreditSpreads', args),
  getCachedCallCreditSpread: (args: GetCachedCallCreditSpreadArgs): Promise<CallCreditSpread> => ipcRenderer.invoke('getCachedCallCreditSpread', args),
  clearCachedSpreads: () => ipcRenderer.send('clearCachedSpreads'),
  executeTrade: (args: ExecuteTradeArgs) => ipcRenderer.invoke('executeTrade', args),
  loadTrades: () => ipcRenderer.invoke('loadTrades'),
  openWindow: (url: string) => ipcRenderer.send('open-window', url),
};

contextBridge.exposeInMainWorld('api', API);
export type API = typeof API;
