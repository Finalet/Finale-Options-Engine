import { CallCreditSpread, OptionChain } from './Types';
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

      const price = roundTo(shortLeg.price - longLeg.price, 2);
      const maxProfit = 100 * price;
      const maxLoss = 100 * distance - maxProfit;

      const distanceToShortStrike = (shortLeg.contractType === 'call' ? shortLeg.strike - chain.underlying.price : chain.underlying.price - shortLeg.strike) / chain.underlying.price;
      const distanceToLongStrike = (longLeg.contractType === 'call' ? longLeg.strike - chain.underlying.price : chain.underlying.price - longLeg.strike) / chain.underlying.price;

      spreads.push({
        dateUpdated: new Date(),
        underlying: chain.underlying,
        shortLeg,
        longLeg,
        price,
        maxProfit,
        maxLoss,
        expiration: shortLeg.expiration,
        returnAtExpiration: roundTo(maxProfit / (distance * 100), 2),
        stats: {
          collateral: distance * 100,
          daysToExpiration: Math.ceil(date.subtract(shortLeg.expiration, new Date()).toDays()),
          distanceToShortStrike: roundTo(distanceToShortStrike, 2),
          distanceToLongStrike: roundTo(distanceToLongStrike, 2),
          distanceOverBollingerBand: roundTo((shortLeg.strike - chain.underlying.bollingerBands.upperBand) / shortLeg.strike, 2),
        },
      });
    }
  }

  return spreads;
}
