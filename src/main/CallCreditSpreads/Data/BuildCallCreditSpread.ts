import { CallCreditSpread, Option, OptionChain, Stock } from './Types';
import { roundTo } from './Utils';
import date from 'date-and-time';

export function BuildCallCreditSpreads(chain: OptionChain, minDistance: number, maxDistance: number): CallCreditSpread[] {
  const spreads: CallCreditSpread[] = [];

  for (let i = 0; i < chain.options.length; i++) {
    const shortLeg = chain.options[i];
    if (shortLeg.bid === 0 || shortLeg.ask === 0) continue;

    for (let j = i + 1; j < chain.options.length; j++) {
      const longLeg = chain.options[j];
      const distance = longLeg.strike - shortLeg.strike;
      if (longLeg.bid === 0 || longLeg.ask === 0) continue;
      if (distance < minDistance) continue;
      if (distance > maxDistance) break;

      spreads.push(BuildCallCreditSpread(chain.underlying, shortLeg, longLeg));
    }
  }

  return spreads;
}

export function BuildCallCreditSpread(underlying: Stock, shortLeg: Option, longLeg: Option): CallCreditSpread {
  const distance = longLeg.strike - shortLeg.strike;
  const price = roundTo(shortLeg.price - longLeg.price, 2);
  const maxProfit = 100 * price;
  const maxLoss = 100 * distance - maxProfit;
  const collateral = distance * 100;

  const spread = {
    dateUpdated: new Date(),
    underlying,
    shortLeg,
    longLeg,
    price,
    maxProfit,
    maxLoss,
    expiration: shortLeg.expiration,
    returnAtExpiration: roundTo(maxProfit / collateral, 2),
    collateral,
    daysToExpiration: Math.ceil(date.subtract(shortLeg.expiration, new Date()).toDays()),
  };
  return spread;
}
