import { CallCreditSpread } from '../Data/Types';
import date from 'date-and-time';

export function filterByReturn(spread: CallCreditSpread, minReturn: number): boolean {
  return spread.returnAtExpiration >= minReturn;
}

export function filterByDaysToEarnings(spread: CallCreditSpread, minDays: number): boolean {
  if (!spread.underlying.earningsDate) return true;

  const daysBetween = date.subtract(spread.underlying.earningsDate, spread.expiration).toDays();

  return Math.abs(daysBetween) >= minDays;
}
