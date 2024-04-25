import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { resolveHtmlPath } from '../util';
import { CallCreditSpread, CallCreditSpreadTrade } from '../CallCreditSpreads/Data/Types';

interface OpenWindowArgs {
  url: string;
  width?: number;
  height?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

function OpenNewWindow({ url, width, minWidth, maxWidth, height, minHeight, maxHeight }: OpenWindowArgs) {
  const RESOURCES_PATH = app.isPackaged ? path.join(process.resourcesPath, 'assets') : path.join(__dirname, '../../assets');
  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  const newWindow = new BrowserWindow({
    show: false,
    transparent: true,
    backgroundMaterial: 'acrylic',
    vibrancy: 'fullscreen-ui',
    maximizable: false,
    width: width,
    maxWidth: maxWidth,
    minWidth: minWidth,
    height: height,
    maxHeight: maxHeight,
    minHeight: minHeight,
    resizable: false,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged ? path.join(__dirname, 'preload.js') : path.join(__dirname, '../../../.erb/dll/preload.js'),
    },
  });

  newWindow.setMenu(null);
  newWindow.loadURL(`${resolveHtmlPath(`index.html`)}#${url}`);

  newWindow.on('ready-to-show', () => {
    if (!newWindow) {
      throw new Error('"newWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      newWindow.minimize();
    } else {
      newWindow.show();
    }
  });
}

export interface OpenSpreadDetailsArgs {
  transactionID?: string;
  spread?: CallCreditSpread;
}

ipcMain.on('OpenSpreadDetails', (event, { transactionID, spread }: OpenSpreadDetailsArgs) => {
  const url = transactionID
    ? `/spread-details?transactionID=${transactionID}`
    : spread
    ? `/spread-details?ticker=${spread.underlying.ticker}&expiration=${spread.expiration}&shortStrike=${spread.shortLeg.strike}&longStrike=${spread.longLeg.strike}`
    : undefined;
  if (!url) return;

  OpenNewWindow({
    url,
    width: 980,
    minWidth: 980,
    maxWidth: 980,
    height: 762,
    minHeight: 762,
    maxHeight: 762,
  });
});

export interface OpenTradeDetailsArgs {
  transactionID?: string;
  trade?: CallCreditSpreadTrade;
}

ipcMain.on('OpenTradeDetails', (event, { transactionID, trade }: OpenTradeDetailsArgs) => {
  const url = transactionID ? `/trade-details?transactionID=${transactionID}` : trade ? `/trade-details?tradeID=${trade.id}` : undefined;
  if (!url) return;

  OpenNewWindow({
    url,
    width: 840,
    minWidth: 840,
    maxWidth: 840,
    height: 494,
    minHeight: 494,
    maxHeight: 494,
  });
});
