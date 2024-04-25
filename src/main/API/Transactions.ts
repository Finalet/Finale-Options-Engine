import { ipcMain } from 'electron';
import { nanoid } from 'nanoid';

const transactions: { [key: string]: any } = {};

ipcMain.handle('transactionDeposit', async <T>(event: Electron.IpcMainInvokeEvent, object: T): Promise<string> => {
  const id = nanoid();
  transactions[id] = object;
  return id;
});

ipcMain.handle('transactionRetrieve', async <T>(event: Electron.IpcMainInvokeEvent, id: string): Promise<T> => {
  const object = transactions[id];
  delete transactions[id];
  return object;
});
