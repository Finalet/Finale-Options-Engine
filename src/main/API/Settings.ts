import { dialog, ipcMain } from 'electron';
import { mainWindow } from '../main';
import { DataManager } from '../DataStorage/DataManager';

ipcMain.handle('ChangeTradesFolder', async () => {
  if (!mainWindow) return;

  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  });
  if (canceled || filePaths.length === 0) return;

  const folderPath = filePaths[0];
  DataManager.setTradesFolderPath(folderPath);

  return folderPath;
});

ipcMain.handle('GetPolygonAPIKey', async () => {
  return DataManager.polygonAPIKey();
});

ipcMain.handle('SetPolygonAPIKey', async (_, key: string) => {
  DataManager.setPolygonAPIKey(key);
});
