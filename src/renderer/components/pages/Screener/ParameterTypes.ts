import { SpreadParameters } from '@/src/main/CallCreditSpreads/Screener';

export const MinReturn: Parameter = { id: 'minReturn', name: 'Min return', defaultValue: 5, unit: 'percentage' };
export const MaxDelta: Parameter = { id: 'maxDelta', name: 'Max delta', defaultValue: 0.1, unit: 'absolute' };

export const MinIV: Parameter = { id: 'minIV', group: 'IV range', name: 'Min IV', defaultValue: 40, unit: 'percentage' };
export const MaxIV: Parameter = { id: 'maxIV', group: 'IV range', name: 'Max IV', defaultValue: 120, unit: 'percentage' };

export const MinSpreadStep: Parameter = { id: 'minSpreadDistance', group: 'Spread step range', name: 'Min spread step', defaultValue: 1, unit: 'absolute' };
export const MaxSpreadStep: Parameter = { id: 'maxSpreadDistance', group: 'Spread step range', name: 'Max spread step', defaultValue: 3, unit: 'absolute' };

export const MinVolume: Parameter = { id: 'minVolume', name: 'Min volume', defaultValue: 5, unit: 'absolute' };
export const MinDistanceOverBollingerBand: Parameter = { id: 'minDistanceOverBollingerBand', name: 'Min distance over Bollinger Band', defaultValue: 0, unit: 'percentage' };
export const MinDistanceToStrike: Parameter = { id: 'minDistanceToStrike', name: 'Min distance to strike', defaultValue: 8, unit: 'percentage' };
export const MinDaysToEarnings: Parameter = { id: 'minDaysToEarnings', name: 'Min days to earnings', defaultValue: 7, unit: 'absolute' };
export const MaxLegBidAskSpread: Parameter = { id: 'maxLegBidAskSpread', name: 'Max leg bid-ask spread', defaultValue: 40, unit: 'percentage' };

export const parameterPresets: ParameterPreset[] = [
  {
    name: 'Weekly Stock Options',
    parameters: [MinReturn, MaxDelta, MinIV, MaxIV, MinSpreadStep, MaxSpreadStep, MinVolume, MinDistanceOverBollingerBand, MinDistanceToStrike, MinDaysToEarnings, MaxLegBidAskSpread],
    values: [
      { id: 'minReturn', value: 3 },
      { id: 'maxDelta', value: 0.1 },
      { id: 'minIV', value: 40 },
      { id: 'maxIV', value: 120 },
      { id: 'minSpreadDistance', value: 1 },
      { id: 'maxSpreadDistance', value: 5 },
      { id: 'minDistanceToStrike', value: 8 },
      { id: 'minDistanceOverBollingerBand', value: 0 },
      { id: 'minDaysToEarnings', value: 7 },
      { id: 'maxLegBidAskSpread', value: 40 },
      { id: 'minVolume', value: 2 },
    ],
  },
  {
    name: 'Weekly ETF Options',
    parameters: [MinReturn, MaxDelta, MinSpreadStep, MaxSpreadStep, MinVolume, MinDistanceOverBollingerBand, MinDistanceToStrike, MaxLegBidAskSpread],
    values: [
      { id: 'minReturn', value: 3 },
      { id: 'maxDelta', value: 0.1 },
      { id: 'minSpreadDistance', value: 1 },
      { id: 'maxSpreadDistance', value: 1.5 },
      { id: 'minDistanceToStrike', value: 1.5 },
      { id: 'minDistanceOverBollingerBand', value: -5 },
      { id: 'maxLegBidAskSpread', value: 40 },
      { id: 'minVolume', value: 2 },
    ],
  },
];

export const allParameters: ParameterGroup[] = [
  {
    name: 'Return',
    parameters: [MinReturn],
  },
  {
    name: 'Delta',
    parameters: [MaxDelta],
  },
  {
    name: 'IV',
    parameters: [MinIV, MaxIV],
  },
  {
    name: 'Spread',
    parameters: [MinSpreadStep, MaxSpreadStep],
  },
  {
    name: 'Other',
    parameters: [MinVolume, MinDistanceOverBollingerBand, MinDistanceToStrike, MinDaysToEarnings, MaxLegBidAskSpread],
  },
];

export type ParameterGroup = {
  name: string;
  parameters: Parameter[];
};

export type ParameterPreset = {
  name: string;
  parameters: Parameter[];
  values: ParameterValue[];
};

export type Parameter = {
  id: keyof SpreadParameters;
  name: string;
  defaultValue: number;
  unit: 'absolute' | 'percentage';
  group?: string;
};

export type ParameterValue = {
  id: keyof SpreadParameters;
  value: number;
};
