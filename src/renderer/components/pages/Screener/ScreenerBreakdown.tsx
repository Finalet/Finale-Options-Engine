import { Popover, PopoverContent, PopoverTrigger } from '../../shadcn/ui/popover';
import { Button } from '../../shadcn/ui/button';
import { CaretSortIcon, CheckIcon } from '@radix-ui/react-icons';
import { Command, CommandGroup, CommandItem, CommandList } from '../../shadcn/ui/command';
import { cn } from '../../shadcn/lib/utils';
import { useState } from 'react';
import { ScreenerStatistics } from '@/src/main/CallCreditSpreads/Screener';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shadcn/ui/card';

const ScreenerBreakdown = ({ statistics }: { statistics?: ScreenerStatistics | undefined }) => {
  const [mode, setMode] = useState<'Options' | 'Spreads'>('Options');
  const [open, setOpen] = useState<boolean>(false);

  return (
    <Card className="w-full min-h-60 h-1/5 flex flex-col">
      <div className="w-full flex justify-between items-start gap-2 p-6">
        <CardHeader className="p-0">
          <CardTitle>Screener breakdown</CardTitle>
          <CardDescription>Counts after each filter step</CardDescription>
        </CardHeader>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" aria-expanded={open} className="justify-between">
              {mode}
              <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-[100px]">
            <Command>
              <CommandList>
                <CommandGroup>
                  {['Options', 'Spreads'].map((option) => (
                    <CommandItem
                      key={option}
                      value={option}
                      onSelect={(v) => {
                        setMode(v as 'Options' | 'Spreads');
                        setOpen(false);
                      }}
                    >
                      {option}
                      <CheckIcon className={cn('ml-auto h-4 w-4', mode === option ? 'opacity-100' : 'opacity-0')} />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      <CardContent className="h-full">
        {(mode === 'Options' && statistics?.optionsFilterSteps) || (mode === 'Spreads' && statistics?.spreadsFilterSteps) ? (
          <BarChart
            data={(mode === 'Options' ? statistics.optionsFilterSteps : statistics.spreadsFilterSteps).map((v) => {
              return { label: v.step, count: v.count };
            })}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No data.</div>
        )}
      </CardContent>
    </Card>
  );
};

export default ScreenerBreakdown;

const BarChart = ({ data }: { data: { label: string; count: number }[] }) => {
  const [highlighted, setHighlighted] = useState<number | null>(null);
  return (
    <div className="h-full w-full flex pt-6">
      {data.map((value, index) => (
        <div
          onMouseEnter={() => setHighlighted(index)}
          onMouseLeave={() => setHighlighted(null)}
          key={index}
          className={`${highlighted === null || highlighted === index ? 'opacity-100' : 'opacity-50'} duration-100 w-full h-full flex flex-col justify-end items-center gap-0.5 px-2`}
        >
          <div className="text-muted-foreground text-xs">{value.count}</div>
          <div
            style={{
              height: `${(100 * data[index].count) / data[0].count}%`,
            }}
            className="w-full bg-primary rounded-t-md shrink-0"
          />
          <div className="text-muted-foreground text-xs whitespace-nowrap">{value.label}</div>
        </div>
      ))}
    </div>
  );
};
