// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { CallCreditSpread, CallCreditSpreadTrade, OptionChain } from './CallCreditSpreads/Data/Types';
import { CloseTradeArgs, ExecuteTradeArgs } from './API/Trades';
import { LoadOptionChainArgs, RunScreenerArgs } from './API/Screener';
import { RunScreener, ScreenerResults } from './CallCreditSpreads/Screener';

const API = {
  screener: {
    LoadOptionChain: (args: LoadOptionChainArgs): Promise<OptionChain> => ipcRenderer.invoke('LoadOptionChain', args),
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
  },
  transaction: {
    retrieve: <T>(id: string): Promise<T> => ipcRenderer.invoke('transactionRetrieve', id),
  },
};

contextBridge.exposeInMainWorld('api', API);
export type API = typeof API;
