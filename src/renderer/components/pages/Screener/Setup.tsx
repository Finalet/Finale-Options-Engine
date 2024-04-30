import { PlusIcon } from 'lucide-react';
import { Button } from '../../shadcn/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shadcn/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '../../shadcn/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '../../shadcn/ui/command';
import { favoriteETFTickers, favoriteStockTickers, iwmTickers, snp500Tickers, top100Tickers } from '@/src/main/CallCreditSpreads/Data/Tickers';
import { ReloadIcon, TrashIcon } from '@radix-ui/react-icons';
import { Dispatch, MutableRefObject, useEffect, useRef, useState } from 'react';
import { screenerCache } from './ScreenerPage';
import { Badge } from '../../shadcn/ui/badge';
import { Label } from '../../shadcn/ui/label';
import { DatePicker } from '../../elements/DatePicker/DatePicker';
import date from 'date-and-time';
import { toast } from 'sonner';

interface SetupProps {
  tickers: string[];
  setTickers: Dispatch<React.SetStateAction<string[]>>;
  expiration: Date | undefined;
  setExpiration: Dispatch<React.SetStateAction<Date | undefined>>;
  tickerColorDict: MutableRefObject<ColorDictionary>;
}

const Setup = ({ tickers, expiration, setTickers, setExpiration, tickerColorDict }: SetupProps) => {
  const [loading, setLoading] = useState(false);
  const [nLoaded, setNLoaded] = useState(screenerCache.parameters.nLoadedChains);

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

  async function LoadOptionChains() {
    if (!expiration || tickers.length === 0) return;

    setLoading(true);
    for (const ticker of tickers) {
      try {
        const expirationWithoutTime = new Date(expiration.getFullYear(), expiration.getMonth(), expiration.getDate(), 17, 30);
        const totalLoaded = await window.api.screener.LoadOptionChain({ underlyingTicker: ticker, expiration: expirationWithoutTime });
        setNLoaded(totalLoaded);
      } catch (error: any) {
        if (error.message.includes('[WRONG-TICKER]')) toast.error(`[${ticker}] Ticker does not exist.`);
        else if (error.message.includes('[FAILED-YAHOO-VALIDATION]')) toast.error(`[${ticker}] Failed Yahoo validation.`);
        else toast.error(error.message);
      }
    }
    setLoading(false);
  }

  function ClearLoadedChains() {
    window.api.screener.ClearLoadedChains();
    setNLoaded(0);
  }

  useEffect(() => {
    screenerCache.parameters.colors.pool = tickerColorPool.current;
    screenerCache.parameters.nLoadedChains = nLoaded;
  }, [tickerColorPool.current, nLoaded]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Setup</CardTitle>
        <CardDescription>Load desired option chains</CardDescription>
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
            <DatePicker date={expiration} setDate={setExpiration} labelSuffix={expiration && ` (${Math.ceil(date.subtract(expiration, new Date()).toDays()).toString()}d)`} presets={datePresets()} />
          </div>
          <div className="w-full flex items-end justify-between gap-4">
            <div className="text-xs text-muted-foreground/50">{nLoaded} loaded chains</div>
            <div className="flex items-center justify-end gap-2">
              {nLoaded > 0 && !loading && (
                <Button onClick={ClearLoadedChains} size="icon" variant="ghost" disabled={loading}>
                  <TrashIcon />
                </Button>
              )}
              <Button disabled={tickers.length === 0 || !expiration || loading} onClick={LoadOptionChains}>
                {loading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? 'Loading...' : 'Load'}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Setup;

const AddTickerButton = ({ AddTickers }: { AddTickers: (ticker: string | string[]) => void }) => {
  const [open, setOpen] = useState(false);
  const [typedTicker, setTypedTicker] = useState('');

  const emptyRef = useRef(null);

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
