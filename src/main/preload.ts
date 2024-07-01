// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { CallCreditSpread, CallCreditSpreadTrade } from './CallCreditSpreads/Data/Types';
import { CloseTradeArgs, ExecuteTradeArgs } from './API/Trades';
import { LoadOptionChainArgs, RunScreenerArgs } from './API/Screener';
import { ScreenerResults } from './CallCreditSpreads/Screener';

const API = {
  screener: {
    LoadOptionChain: (args: LoadOptionChainArgs): Promise<number> => ipcRenderer.invoke('LoadOptionChain', args),
    ClearLoadedChains: () => ipcRenderer.send('ClearLoadedChains'),
    RunScreener: (args: RunScreenerArgs): Promise<ScreenerResults> => ipcRenderer.invoke('RunScreener', args),
  },
  trades: {
    LoadTrades: (): Promise<CallCreditSpreadTrade[]> => ipcRenderer.invoke('LoadTrades'),
    LoadLiveTrade: (trade: CallCreditSpreadTrade): Promise<CallCreditSpreadTrade> => ipcRenderer.invoke('LoadLiveTrade', trade),
    ExecuteTrade: (args: ExecuteTradeArgs) => ipcRenderer.invoke('ExecuteTrade', args),
    CloseTrade: (args: CloseTradeArgs) => ipcRenderer.invoke('CloseTrade', args),
    onTradeClosed: (callback: (trade: CallCreditSpreadTrade) => void) => {
      const channel = 'tradeClosed';
      const subscription = (_: IpcRendererEvent, trade: CallCreditSpreadTrade) => callback(trade);
      ipcRenderer.on(channel, subscription);
      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
  },
  app: {
    OpenSpreadDetails: (args: CallCreditSpread) => ipcRenderer.send('OpenSpreadDetails', args),
    OpenTradeDetails: (args: CallCreditSpreadTrade) => ipcRenderer.send('OpenTradeDetails', args),
    OpenTradesFolder: () => ipcRenderer.send('OpenTradesFolder'),
    OpenTradeFile: (trade: CallCreditSpreadTrade) => ipcRenderer.send('OpenTradeFile', trade),
  },
  settings: {
    ChangeTradesFolder: (): Promise<string | undefined> => ipcRenderer.invoke('ChangeTradesFolder'),
    GetPolygonAPIKey: (): Promise<string | undefined> => ipcRenderer.invoke('GetPolygonAPIKey'),
    SetPolygonAPIKey: (key: string) => ipcRenderer.invoke('SetPolygonAPIKey', key),
  },
  transaction: {
    retrieve: <T>(id: string): Promise<T> => ipcRenderer.invoke('transactionRetrieve', id),
  },
};

contextBridge.exposeInMainWorld('api', API);
export type API = typeof API;
