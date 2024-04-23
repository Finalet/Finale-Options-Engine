import { Option, Stock } from '../Data/Types';
import { roundTo } from '../Data/Utils';

export function filterByDelta(option: Option, maxDelta: number): boolean {
  return option.greeks.delta <= maxDelta;
}

export function filterByIV(option: Option, minIV: number, maxIV?: number): boolean {
  return option.impliedVolatility >= minIV && (!maxIV || option.impliedVolatility <= maxIV);
}

export function filterByVolume(option: Option, minVolume: number): boolean {
  return option.volume >= minVolume;
}

export function filterByDistanceToStrike(option: Option, underlying: Stock, minDistance: number): boolean {
  if (option.contractType === 'call') return (option.strike - underlying.price) / underlying.price >= minDistance;
  return (underlying.price - option.strike) / underlying.price >= minDistance;
}

export function filterByBollingerBands(option: Option, upperBand: number, minDistanceOver: number): boolean {
  const distanceFromBand = roundTo((option.strike - upperBand) / upperBand, 2);
  return distanceFromBand >= minDistanceOver;
}

export function filterByBidAskSpread(option: Option, maxLegBidAskSpread: number): boolean {
  return option.ask && option.bid ? (option.ask - option.bid) / option.ask <= maxLegBidAskSpread : true;
}
