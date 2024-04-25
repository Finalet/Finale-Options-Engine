import { DataManager } from '../DataStorage/DataManager';
import { ipcMain, IpcMainInvokeEvent } from 'electron';

ipcMain.handle('transactionRetrieve', async <T>(event: IpcMainInvokeEvent, id: string): Promise<T> => {
  return DataManager.RetrieveTransaction<T>(id);
});
