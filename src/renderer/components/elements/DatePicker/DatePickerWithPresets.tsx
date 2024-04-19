import * as React from 'react';
import { CalendarIcon } from '@radix-ui/react-icons';
import { addDays, format } from 'date-fns';
import { cn } from '../../shadcn/lib/utils';
import { Calendar } from '../../shadcn/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../../shadcn/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../shadcn/ui/select';
import { Button } from '../../shadcn/ui/button';

export function DatePickerWithPresets({
  date,
  setDate,
  labelSuffix,
  presets,
}: {
  date: Date | undefined;
  setDate: React.Dispatch<React.SetStateAction<Date | undefined>>;
  labelSuffix?: string;
  presets?: { label: string; value: number }[];
}) {
  const datePresets = presets ?? [
    { label: 'Today', value: 0 },
    { label: 'Tomorrow', value: 1 },
    { label: 'In 3 days', value: 3 },
    { label: 'In a week', value: 7 },
  ];

  const getLabel = (date: Date, suffix?: string) => {
    const currentYear = new Date().getFullYear();
    const dateYear = date.getFullYear();
    const formattedDate = dateYear === currentYear ? format(date, 'MMMM d') : format(date, 'PPP');
    return `${formattedDate}${suffix ? suffix : ''}`;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant={'outline'} className={cn('w-[240px] justify-start text-left font-normal', !date && 'text-muted-foreground')}>
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? getLabel(date, labelSuffix) : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="flex w-auto flex-col space-y-2 p-2">
        <Select onValueChange={(value) => setDate(addDays(new Date(), parseInt(value)))}>
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent position="popper">
            {datePresets?.map((preset) => (
              <SelectItem key={preset.value} value={preset.value.toString()}>
                {preset.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="rounded-md border">
          <Calendar mode="single" selected={date} onSelect={setDate} />
        </div>
      </PopoverContent>
    </Popover>
  );
}
