import { ChevronDown, PlusIcon } from 'lucide-react';
import { Button } from '../../shadcn/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shadcn/ui/card';
import { useEffect, useMemo, useRef, useState } from 'react';
import { allParameters, Parameter, ParameterPreset, parameterPresets } from './ParameterTypes';
import { Popover, PopoverContent, PopoverTrigger } from '../../shadcn/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '../../shadcn/ui/command';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '../../shadcn/ui/context-menu';
import { Input } from '../../shadcn/ui/input';
import { RangeSlider } from '../../elements/RangeSlider';
import { ReloadIcon, TrashIcon } from '@radix-ui/react-icons';
import React from 'react';
import { DatePicker } from '../../elements/DatePicker/DatePicker';
import { Badge } from '../../shadcn/ui/badge';
import { SpreadParameters } from '@/src/main/CallCreditSpreads/Screener';
import { favoriteETFTickers, favoriteStockTickers, iwmTickers, snp500Tickers, top100Tickers } from '@/src/main/CallCreditSpreads/Data/Tickers';
import date from 'date-and-time';
import { Label } from '../../shadcn/ui/label';
import { screenerCache } from './ScreenerPage';
import { toast } from 'sonner';

const SearchParameters = ({ running, Run }: { running: boolean; Run: (tickers: string[], expiration: Date, colors: ColorDictionary, params?: SpreadParameters) => void }) => {
  const [loading, setLoading] = useState(false);

  const [tickers, setTickers] = useState<string[]>(screenerCache.parameters.tickers);
  const [expiration, setExpiration] = useState<Date | undefined>(screenerCache.parameters.expiration);

  const [parameters, setParameters] = useState<Parameter[]>(screenerCache.parameters.parameters);
  const [values, setValues] = useState<SpreadParameters>(screenerCache.parameters.values);

  const tickerColorDict = useRef<ColorDictionary>(screenerCache.parameters.colors.dict);
  const tickerColorPool = useRef<string[]>(screenerCache.parameters.colors.pool);

  function AddTickers(ticker: string | string[]) {
    if (Array.isArray(ticker)) {
      const finalTickers = ticker.map((t) => t.toUpperCase()).filter((t) => !tickers.includes(t));
      for (const finalTicker of finalTickers) {
        if (tickerColorPool.current.length === 0) tickerColorPool.current = bgColors.slice();
        const color = tickerColorPool.current.shift() ?? bgColors[0];
        tickerColorDict.current[finalTicker] = color;
      }
      setTickers((prev) => [...prev, ...finalTickers]);
      return;
    }
    const finalTicker = ticker.toUpperCase();
    if (!tickers.includes(finalTicker)) {
      if (tickerColorPool.current.length === 0) tickerColorPool.current = bgColors.slice();
      const color = tickerColorPool.current.shift() ?? bgColors[0];
      tickerColorDict.current[finalTicker] = color;
      setTickers((prev) => [...prev, finalTicker]);
    }
  }
  function RemoveTicker(ticker: string) {
    if (tickerColorDict.current[ticker]) {
      const color = tickerColorDict.current[ticker];
      delete tickerColorDict.current[ticker];
      if (!tickerColorPool.current.includes(color)) tickerColorPool.current.unshift(color);
    }
    setTickers(tickers.filter((t) => t !== ticker));
  }
  function RemoveAllTickers() {
    tickerColorDict.current = {};
    tickerColorPool.current = bgColors.slice();
    setTickers([]);
  }

  const processedParameters = useMemo(() => {
    const output: (Parameter | Parameter[])[] = [];
    for (const parameter of parameters) {
      if (!parameter.group) {
        output.push(parameter);
        continue;
      }
      if (output.some((p) => Array.isArray(p) && p[0].group === parameter.group)) {
        continue;
      }
      const group = parameters.filter((p) => p.group === parameter.group);
      if (group.length > 1) {
        output.push(group);
      } else {
        output.push(parameter);
      }
    }
    return output;
  }, [parameters]);

  function AddParameters(newParameters: Parameter[]) {
    const currentParams = parameters;
    const newParams = newParameters.filter((param) => !currentParams.map((p) => p.id).includes(param.id));
    setParameters([...currentParams, ...newParams]);
  }

  function AddPreset(preset: ParameterPreset) {
    const currentParams = parameters;

    const newValues: SpreadParameters = {};
    preset.values
      .filter((value) => !currentParams.map((p) => p.id).includes(value.id))
      .forEach((value) => {
        newValues[value.id] = value.value;
      });

    AddParameters(preset.parameters);
    setValues((prev) => ({ ...prev, ...newValues }));
  }

  function RemoveParameter(parameter: Parameter | Parameter[]) {
    if (Array.isArray(parameter)) {
      setParameters(parameters.filter((param) => !parameter.includes(param)));
      setValues((prev) => {
        const newValues = { ...prev };
        parameter.forEach((p) => delete newValues[p.id]);
        return newValues;
      });
      return;
    }
    setParameters(parameters.filter((param) => param !== parameter));
    setValues((prev) => ({ ...prev, [parameter.id]: undefined }));
  }

  function UpdateValue(param: keyof SpreadParameters, value: number | undefined) {
    setValues((prev) => ({ ...prev, [param]: value }));
  }

  const getValue = (param: keyof SpreadParameters): number | undefined => values[param];

  function ClickRun() {
    if (!expiration || tickers.length === 0) return;
    const expirationWithoutTime = new Date(expiration.getFullYear(), expiration.getMonth(), expiration.getDate(), 17, 30);

    const valuesWithDefaults: SpreadParameters = {};
    parameters.forEach((param) => {
      valuesWithDefaults[param.id] = values[param.id] ?? param.defaultValue;
      if (param.unit === 'percentage') {
        valuesWithDefaults[param.id]! /= 100;
      }
    });

    Run(tickers, expirationWithoutTime, tickerColorDict.current, valuesWithDefaults);
  }

  const datePresets = () => {
    const today = new Date();
    const currentDay = today.getDay();
    let daysUntilFriday = 5 - currentDay;
    if (daysUntilFriday < 0) {
      daysUntilFriday += 7;
    }
    return [
      { label: `Upcoming friday (${daysUntilFriday}d)`, value: daysUntilFriday },
      { label: `Friday in 1 weeks (${daysUntilFriday + 7}d)`, value: daysUntilFriday + 7 },
      { label: `Friday in 2 weeks (${daysUntilFriday + 14}d)`, value: daysUntilFriday + 14 },
      { label: `Friday in 3 weeks (${daysUntilFriday + 21}d)`, value: daysUntilFriday + 21 },
      { label: `Friday in 1 month (${daysUntilFriday + 28}d)`, value: daysUntilFriday + 28 },
    ];
  };
  const getDte = (to: Date) => {
    return Math.ceil(date.subtract(to, new Date()).toDays());
  };

  async function LoadOptionChains() {
    if (!expiration || tickers.length === 0) return;

    setLoading(true);
    for (const ticker of tickers) {
      try {
        await window.api.screener.LoadOptionChain({ underlyingTicker: ticker, expiration });
      } catch (error: any) {
        if (error.message.includes('[WRONG-TICKER]')) toast.error(`[${ticker}] Ticker does not exist.`);
        else if (error.message.includes('[FAILED-YAHOO-VALIDATION]')) toast.error(`[${ticker}] Failed Yahoo validation.`);
        else toast.error(error.message);
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    screenerCache.parameters.parameters = parameters;
    screenerCache.parameters.values = values;
    screenerCache.parameters.tickers = tickers;
    screenerCache.parameters.expiration = expiration;
    screenerCache.parameters.colors.dict = tickerColorDict.current;
    screenerCache.parameters.colors.pool = tickerColorPool.current;
  }, [parameters, values, tickers, expiration, tickerColorDict.current, tickerColorPool.current]);

  return (
    <div className="w-full h-full flex flex-col gap-3 overflow-auto">
      <Card>
        <CardHeader>
          <CardTitle>Setup</CardTitle>
          <CardDescription>Required parameters for the screener</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full flex flex-col items-start justify-start gap-4">
            <div className="w-full flex items-center justify-center gap-2">
              <AddTickerButton AddTickers={AddTickers} />
              {tickers.length > 5 && (
                <Button onClick={RemoveAllTickers} variant="ghost">
                  <TrashIcon />
                </Button>
              )}
            </div>
            {tickers.length > 0 && (
              <div className="w-full flex gap-1 flex-wrap">
                {tickers.slice(0, 10).map((ticker, index) => (
                  <Badge className={`${tickerColorDict.current[ticker]} hover:bg-red-600`} onClick={() => RemoveTicker(ticker)} key={index}>
                    {ticker}
                  </Badge>
                ))}
                {tickers.length > 10 && <Badge variant="outline">+{tickers.length - 10}</Badge>}
              </div>
            )}
            <div className="w-full flex items-center justify-center gap-2">
              <div className="w-1/2 truncate">
                <Label>Expiration</Label>
              </div>
              <DatePicker date={expiration} setDate={setExpiration} labelSuffix={expiration && ` (${getDte(expiration).toString()}d)`} presets={datePresets()} />
            </div>
            <div className="w-full flex justify-end">
              <Button disabled={tickers.length === 0 || !expiration || loading} onClick={LoadOptionChains}>
                {loading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? 'Loading...' : 'Load'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="w-full h-full flex flex-col overflow-auto">
        <CardHeader>
          <CardTitle>Parameters</CardTitle>
          <CardDescription>Optional screener parameters</CardDescription>
        </CardHeader>
        <CardContent className="max-h-full h-full flex flex-col gap-4 overflow-auto">
          {processedParameters.length > 0 && (
            <div className="w-full flex flex-col items-start justify-start overflow-auto">
              {processedParameters.map((parameter, index) =>
                Array.isArray(parameter) ? (
                  <RangeParameterInput
                    key={index}
                    parameters={parameter}
                    values={parameter.map((p) => getValue(p.id))}
                    OnValuesChange={(v) => {
                      for (let i = 0; i < parameter.length; i++) {
                        UpdateValue(parameter[i].id, v[i]);
                      }
                    }}
                    Remove={() => RemoveParameter(parameter)}
                  />
                ) : (
                  <SingleParameterInput key={index} parameter={parameter} value={getValue(parameter.id)} Remove={() => RemoveParameter(parameter)} OnValueChange={(v) => UpdateValue(parameter.id, v)} />
                ),
              )}
            </div>
          )}
          <AddParameterButton excludeParameters={parameters} AddParameters={AddParameters} AddPreset={AddPreset} addedParameters={parameters} />
          <div className="flex justify-end mt-auto">
            <Button disabled={tickers.length === 0 || !expiration || running} onClick={ClickRun}>
              {running && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
              {running ? 'Filtering...' : 'Filter'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SearchParameters;

const AddTickerButton = ({ AddTickers }: { AddTickers: (ticker: string | string[]) => void }) => {
  const [open, setOpen] = React.useState(false);
  const [typedTicker, setTypedTicker] = React.useState('');

  const emptyRef = React.useRef(null);

  function SelectTicker(ticker: string | string[]) {
    AddTickers(ticker);
    setOpen(false);
  }

  function OnOpenChange(open: boolean) {
    if (open) setTypedTicker('');
    setOpen(open);
  }

  return (
    <Popover open={open} onOpenChange={OnOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
          Add tickers
          <PlusIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="end">
        <Command>
          <CommandInput
            onKeyDownCapture={(e) => {
              if (e.key === 'Enter') {
                if (emptyRef.current) SelectTicker(typedTicker);
              }
            }}
            value={typedTicker}
            onValueChange={(v) => setTypedTicker(v)}
            placeholder="Search ticker..."
            className="h-9"
          />
          <CommandEmpty ref={emptyRef} className="p-1" onClick={() => SelectTicker(typedTicker)}>
            <div className="bg-accent relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:opacity-50">
              {typedTicker.toUpperCase()}
            </div>
          </CommandEmpty>
          <CommandList>
            {typedTicker.length === 0 && (
              <>
                <CommandGroup>
                  <CommandItem key={'favoriteStockTickers'} value={favoriteStockTickers.length.toString()} onSelect={() => SelectTicker(favoriteStockTickers)}>
                    Favorite stocks
                  </CommandItem>
                  <CommandItem key={'favoriteETFTickers'} value={favoriteETFTickers.length.toString()} onSelect={() => SelectTicker(favoriteETFTickers)}>
                    Favorite ETFs
                  </CommandItem>
                  <CommandItem key={'top100Tickers'} value={top100Tickers.length.toString()} onSelect={() => SelectTicker(top100Tickers)}>
                    Top 100 tickers
                  </CommandItem>
                  <CommandItem key={'allSNP500'} value={snp500Tickers.length.toString()} onSelect={() => SelectTicker(snp500Tickers)}>
                    All S&P 500
                  </CommandItem>
                  <CommandItem key={'allIsharesRussell200'} value={iwmTickers.length.toString()} onSelect={() => SelectTicker(iwmTickers)}>
                    All iShares Russell 2000
                  </CommandItem>
                </CommandGroup>
                <CommandSeparator />
              </>
            )}
            <CommandGroup>
              {top100Tickers.map((ticker) => (
                <CommandItem key={ticker} value={ticker} onSelect={SelectTicker}>
                  {ticker}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

interface AddParameterButtonProps {
  addedParameters: Parameter[];
  className?: string;
  excludeParameters: Parameter[];
  AddParameters: (p: Parameter[]) => void;
  AddPreset: (p: ParameterPreset) => void;
}

const AddParameterButton = ({ addedParameters, excludeParameters, AddParameters, AddPreset, className }: AddParameterButtonProps) => {
  const [open, setOpen] = useState(false);

  function SelectParameters(parameters: Parameter[]) {
    setOpen(false);
    AddParameters(parameters);
  }

  function SelectPreset(preset: ParameterPreset) {
    setOpen(false);
    AddPreset(preset);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {addedParameters.length < allParameters.flatMap((g) => g.parameters).length && (
          <Button variant="outline" role="combobox" aria-expanded={open} className={`w-full justify-between ${className}`}>
            Add Parameter
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-[18em] p-0">
        <Command>
          <CommandInput placeholder="Search parameters..." />
          <CommandEmpty>No parameters found.</CommandEmpty>
          <CommandList>
            <CommandGroup heading="Presets">
              {parameterPresets.map((group, index) => (
                <CommandItem
                  key={index}
                  onSelect={() => {
                    SelectPreset(group);
                  }}
                >
                  {group.name}
                </CommandItem>
              ))}
            </CommandGroup>

            {allParameters
              .filter((group) => group.parameters.filter((param) => !excludeParameters.includes(param)).length !== 0)
              .map((group, index) => (
                <React.Fragment key={index}>
                  <CommandSeparator />
                  <CommandGroup heading={group.name}>
                    {group.parameters
                      .filter((param) => !excludeParameters.includes(param))
                      .map((parameter, index) => (
                        <CommandItem
                          key={index}
                          onSelect={() => {
                            SelectParameters([parameter]);
                          }}
                        >
                          {parameter.name}
                        </CommandItem>
                      ))}
                  </CommandGroup>
                </React.Fragment>
              ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const SingleParameterInput = ({ parameter, value, OnValueChange, Remove }: { parameter: Parameter; value: number | undefined; OnValueChange: (v: number | undefined) => void; Remove: () => void }) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger className="w-full flex items-center justify-center group gap-2 py-2 first:pt-0 shrink-0">
        <Label className="w-full text-muted-foreground group-hover:text-foreground transition-colors">{parameter.name}</Label>
        <Input
          value={value}
          onChange={(e) => {
            const value = e.target.value === '' ? undefined : Number(e.target.value);
            OnValueChange(value);
          }}
          type="number"
          className="text-center w-16 h-8 px-2"
          placeholder={parameter.defaultValue.toString()}
        />
        <div className="shrink-0 text-xs text-muted-foreground w-3">{parameter.unit === 'percentage' ? '%' : ''}</div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={Remove} className="text-red-600 cursor-pointer">
          Remove <TrashIcon className="ml-auto" />
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

const RangeParameterInput = ({ parameters, values, OnValuesChange, Remove }: { parameters: Parameter[]; values: (number | undefined)[]; OnValuesChange: (v: (number | undefined)[]) => void; Remove: () => void }) => {
  const config = rangeParameters.find((c) => c.name === parameters[0].group);

  function handleChange(values: number[]) {
    if (values.length < 2) return OnValuesChange(values);

    let [min, max] = values;
    if (min >= max) max = min + (config?.step ?? 0);
    OnValuesChange([min, max]);
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger className="w-full flex items-center justify-center group gap-8 py-2 first:pt-0 overflow-y-hidden shrink-0">
        <Label className="text-muted-foreground group-hover:text-foreground transition-colors whitespace-nowrap">{parameters[0].group}</Label>
        <RangeSlider
          thumb1Label={`${values[0] ?? parameters[0].defaultValue}${parameters[0].unit === 'percentage' ? '%' : ''}`}
          thumb2Label={`${values[1] ?? parameters[1].defaultValue}${parameters[1].unit === 'percentage' ? '%' : ''}`}
          defaultValue={[parameters[0].defaultValue, parameters[1].defaultValue]}
          min={config?.minValue}
          max={config?.maxValue}
          step={config?.step}
          value={values.map((v, index) => v ?? parameters[index].defaultValue)}
          onValueChange={handleChange}
          className="w-full h-8"
        />
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={Remove} className="text-red-600 cursor-pointer">
          Remove <TrashIcon className="ml-auto" />
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

interface RangeParameterConfig {
  name: string;
  minValue: number;
  maxValue: number;
  step: number;
}

const rangeParameters: RangeParameterConfig[] = [
  {
    name: 'IV range',
    minValue: 0,
    maxValue: 200,
    step: 1,
  },
  {
    name: 'Spread step range',
    minValue: 0.5,
    maxValue: 5,
    step: 0.5,
  },
];

export const bgColors: string[] = [
  'bg-primary hover:bg-primary/80',
  'bg-green-500 hover:bg-green-500/80',

  'bg-blue-500 hover:bg-blue-500/80',
  'bg-sky-500 hover:bg-sky-500/80',

  'bg-violet-500 hover:bg-violet-500/80',
  'bg-fuchsia-500 hover:bg-fuchsia-500/80',
  'bg-pink-500 hover:bg-pink-500/80',

  'bg-rose-500 hover:bg-rose-500/80',
  'bg-amber-500 hover:bg-amber-500/80',
];

export interface ColorDictionary {
  [key: string]: string;
}
