import { ReloadIcon, TrashIcon } from '@radix-ui/react-icons';
import { RangeSlider } from '../../elements/RangeSlider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shadcn/ui/card';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '../../shadcn/ui/context-menu';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '../../shadcn/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '../../shadcn/ui/popover';
import { Label } from '../../shadcn/ui/label';
import { allParameters, Parameter, ParameterPreset, parameterPresets } from './ParameterTypes';
import { Button } from '../../shadcn/ui/button';
import { ChevronDown } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { Input } from '../../shadcn/ui/input';
import { SpreadParameters } from '@/src/main/CallCreditSpreads/Screener';
import { screenerCache } from './ScreenerPage';

interface ParametersProps {
  tickers: string[];
  expiration: Date | undefined;
  running: boolean;
  Run: (tickers: string[], params?: SpreadParameters) => Promise<void>;
}

const Parameters = ({ tickers, expiration, running, Run }: ParametersProps) => {
  const [parameters, setParameters] = useState<Parameter[]>(screenerCache.parameters.parameters);
  const [values, setValues] = useState<SpreadParameters>(screenerCache.parameters.values);

  function AddParameters(newParameters: Parameter[]) {
    const currentParams = parameters;
    const newParams = newParameters.filter((param) => !currentParams.map((p) => p.id).includes(param.id));
    setParameters([...currentParams, ...newParams]);
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

  function UpdateValue(param: keyof SpreadParameters, value: number | undefined) {
    setValues((prev) => ({ ...prev, [param]: value }));
  }

  async function ClickRun() {
    if (!expiration || tickers.length === 0) return;

    const valuesWithDefaults: SpreadParameters = {};
    parameters.forEach((param) => {
      valuesWithDefaults[param.id] = values[param.id] ?? param.defaultValue;
      if (param.unit === 'percentage') {
        valuesWithDefaults[param.id]! /= 100;
      }
    });

    await Run(tickers, valuesWithDefaults);
  }

  const getValue = (param: keyof SpreadParameters): number | undefined => values[param];

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

  useEffect(() => {
    screenerCache.parameters.parameters = parameters;
    screenerCache.parameters.values = values;
  }, [parameters, values]);

  return (
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
  );
};

export default Parameters;

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
