import { CallCreditSpread, Stock } from '../CallCreditSpreads/Data/Types';

export interface CallCreditSpreadTrade {
  id: string;
  type: 'call-credit-spread';
  underlying: Stock;
  dateOpened: Date;
  spreadAtOpen: CallCreditSpread;
  spreadAtClose?: CallCreditSpread;
}
