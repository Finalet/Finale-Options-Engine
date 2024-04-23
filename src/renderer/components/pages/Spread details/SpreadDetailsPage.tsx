import { CallCreditSpread, Option, Stock, StockHistoricalPrice } from '@/src/main/CallCreditSpreads/Data/Types';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../shadcn/ui/card';
import { roundTo } from '@/src/main/CallCreditSpreads/Data/Utils';
import { Separator } from '../../shadcn/ui/separator';
import dateAndTime from 'date-and-time';
import PriceChart, { ChartTimeFrame } from './PriceChart';
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '../../shadcn/ui/dropdown-menu';
import { Button } from '../../shadcn/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogTrigger } from '../../shadcn/ui/dialog';
import ExecuteTradePopup from './ExecuteTradePopup';

const SpreadDetailsPage = () => {
  const [searchParams] = useSearchParams();

  const [spread, setSpread] = useState<CallCreditSpread | undefined>(undefined);

  async function LoadSpread() {
    const ticker = searchParams.get('ticker');
    const expiration = searchParams.get('expiration');
    const shortStrike = searchParams.get('shortStrike');
    const longStrike = searchParams.get('longStrike');
    if (!ticker || !expiration || !shortStrike || !longStrike) return;

    const spread = await window.api.getCachedCallCreditSpread({ ticker, expiration: new Date(expiration), shortStrike: parseFloat(shortStrike), longStrike: parseFloat(longStrike) });
    setSpread(spread);
  }

  useEffect(() => {
    LoadSpread();
  }, []);

  if (!spread) return null;

  return (
    <div className="w-screen h-screen flex items-start justify-start gap-3 select-none p-3 overflow-clip">
      <div className="min-w-[300px] flex flex-col items-start justify-start gap-3">
        <StockDetails stock={spread.underlying} />
        <SpreadDetails spread={spread} />
      </div>
      <div className="h-full flex flex-col items-end justify-between gap-3">
        <div className="flex flex-col items-start justify-start gap-3">
          <OptionDetails title="Short leg" option={spread.shortLeg} />
          <OptionDetails title="Long leg" option={spread.longLeg} />
        </div>
        <Actions spread={spread} />
      </div>
    </div>
  );
};

export default SpreadDetailsPage;

export const DisplayValue = ({ label, date, dollar, raw, percent, valueClassName }: { label: string; date?: Date; dollar?: number; raw?: string | number; percent?: number; valueClassName?: string }) => {
  return (
    <div className="w-full flex justify-between gap-8 text-sm">
      <div className="text-muted-foreground shrink-0 truncate">{label}</div>
      <div className={`text-right shrink-0 truncate ${valueClassName}`}>
        {raw !== undefined ? (
          raw
        ) : dollar !== undefined ? (
          `$${roundTo(dollar, 2)}`
        ) : percent !== undefined ? (
          `${Math.round(percent * 100)}%`
        ) : date !== undefined ? (
          `${dateAndTime.format(date, 'MMMM D, YYYY')}`
        ) : (
          <span className="text-muted-foreground/50">none</span>
        )}
      </div>
    </div>
  );
};

export const StockDetails = ({ stock }: { stock: Stock }) => {
  const [highlightedPoint, setHighlightedPoint] = useState<StockHistoricalPrice | undefined>(undefined);
  const [priceChange, setPriceChange] = useState<{ change: number; percent: number } | undefined>(undefined);

  return (
    <Card className="w-full">
      <div className="w-full flex items-start justify-between p-6 gap-2">
        <div className="w-full flex flex-col space-y-1.5">
          <div className="font-semibold leading-none tracking-tight">{stock.name}</div>
          <CardDescription>{dateAndTime.format(highlightedPoint?.date ?? stock.dateUpdated, 'MMMM D, YYYY')}</CardDescription>
        </div>
        <div className={`-translate-y-2 flex flex-col items-end justify-end ${priceChange && priceChange?.change < 0 ? 'text-red-600' : 'text-primary'}`}>
          <div className="font-semibold text-lg">{(highlightedPoint?.price ?? stock.price).toFixed(2)}</div>
          {priceChange && (
            <div className={`flex items-center text-xs`}>
              {priceChange?.change > 0 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {priceChange?.percent.toFixed(2)}%
            </div>
          )}
        </div>
      </div>
      <CardContent>
        <div className="w-full flex flex-col gap-1">
          {stock.historicalPrices && (
            <PriceCharts
              prices={stock.historicalPrices}
              setPriceChange={setPriceChange}
              onHover={(p, change) => {
                setHighlightedPoint(p);
                setPriceChange(change);
              }}
              onHoverEnd={() => {
                setHighlightedPoint(undefined);
                setPriceChange(undefined);
              }}
            />
          )}
          <DisplayValue label="Next earnings" date={stock.earningsDate} />
          <DisplayValue label="Next dividend" date={stock.dividendDate} />
          <DisplayValue label="Ex dividend" date={stock.exDividendDate} />
          <DisplayValue label="Bollinger Upper" dollar={roundTo(stock.bollingerBands.upperBand, 2)} />
        </div>
      </CardContent>
    </Card>
  );
};

const SpreadDetails = ({ spread }: { spread: CallCreditSpread }) => {
  return (
    <Card className="w-full">
      <CardHeader className="relative">
        <CardTitle>Spread details</CardTitle>
        <div className="absolute top-3 right-6 font-semibold text-lg text-primary">
          ${spread.shortLeg.strike} / ${spread.longLeg.strike}
        </div>
      </CardHeader>
      <CardContent>
        <div className="w-full flex flex-col gap-1">
          <DisplayValue label="Return" percent={spread.returnAtExpiration} />
          <DisplayValue label="Price" dollar={spread.price} />
          <DisplayValue label="Expiration" date={spread.expiration} />
          <DisplayValue label="Days to expiration" raw={spread.daysToExpiration} />
          <Separator className="my-2" />
          <DisplayValue label="Max profit" dollar={spread.maxProfit} />
          <DisplayValue label="Max loss" dollar={spread.maxLoss} />
          <DisplayValue label="Collateral" dollar={spread.collateral} />
          <Separator className="my-2" />
          <DisplayValue label="Distance to strike" percent={spread.shortLeg.distanceToStrike} />
          <DisplayValue label="Distance over Bollinger" percent={spread.shortLeg.distanceOverBollingerBand} />
        </div>
      </CardContent>
    </Card>
  );
};

const OptionDetails = ({ title, option }: { title: string; option: Option }) => {
  return (
    <Card className="w-full">
      <CardHeader className="relative">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{option.ticker}</CardDescription>
        <div className="absolute top-3 right-6 text-muted-foreground text-sm">{`${option.underlying.ticker} $${option.strike} ${option.contractType.slice(0, 1).toUpperCase()}${option.contractType.slice(1)} ${dateAndTime.format(
          option.expiration,
          'M/D',
        )}`}</div>
      </CardHeader>
      <CardContent>
        <div className="w-full flex justify-between gap-8">
          <div className="flex flex-col gap-1">
            <DisplayValue label="Price" dollar={option.price} />
            <DisplayValue label="Bid" dollar={option.bid} />
            <DisplayValue label="Ask" dollar={option.ask} />
            {option.ask !== undefined && option.bid !== undefined && <DisplayValue label="Bid-ask spread" percent={(option.ask - option.bid) / option.ask} />}
          </div>
          <div>
            <Separator orientation="vertical" />
          </div>
          <div className="flex flex-col gap-1">
            <DisplayValue label="Strike" dollar={option.strike} />
            <DisplayValue label="Expiration" date={option.expiration} />
            <DisplayValue label="Implied Volatility" percent={option.impliedVolatility} />
            <DisplayValue label="Volume" raw={option.volume} />
          </div>
          <div>
            <Separator orientation="vertical" />
          </div>
          <div className="flex flex-col gap-1">
            <DisplayValue label="Delta" raw={option.greeks.delta} />
            <DisplayValue label="Gamma" raw={option.greeks.gamma} />
            <DisplayValue label="Theta" raw={option.greeks.theta} />
            <DisplayValue label="Vega" raw={option.greeks.vega} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface PriceChartProps {
  prices: StockHistoricalPrice[];
  setPriceChange?: (change: { change: number; percent: number }) => void;
  onHover?: (point: StockHistoricalPrice, change: { change: number; percent: number }) => void;
  onHoverEnd?: () => void;
  className?: string;
}

const PriceCharts = ({ prices, setPriceChange, onHover, onHoverEnd, className }: PriceChartProps) => {
  const [timeFrame, setTimeFrame] = useState<ChartTimeFrame>('3 months');

  const getDisplayTimeframe = (from: string) => {
    if (from === '1 week') return '1W';
    if (from === '1 month') return '1M';
    if (from === '3 months') return '3M';
    if (from === '6 months') return '6M';
    if (from === '1 year') return '1Y';
  };

  return (
    <div className={`w-full flex flex-col items-center justify-center relative ${className}`}>
      {timeFrame === '1 week' && <PriceChart timeFrame="1 week" className="mb-2" prices={prices} setPriceChange={setPriceChange} onHover={onHover} onHoverEnd={onHoverEnd} />}
      {timeFrame === '1 month' && <PriceChart timeFrame="1 month" className="mb-2" prices={prices} setPriceChange={setPriceChange} onHover={onHover} onHoverEnd={onHoverEnd} />}
      {timeFrame === '3 months' && <PriceChart timeFrame="3 months" className="mb-2" prices={prices} setPriceChange={setPriceChange} onHover={onHover} onHoverEnd={onHoverEnd} />}
      {timeFrame === '6 months' && <PriceChart timeFrame="6 months" className="mb-2" prices={prices} setPriceChange={setPriceChange} onHover={onHover} onHoverEnd={onHoverEnd} />}
      {timeFrame === '1 year' && <PriceChart timeFrame="1 year" className="mb-2" prices={prices} setPriceChange={setPriceChange} onHover={onHover} onHoverEnd={onHoverEnd} />}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="absolute -top-2 -right-2 text-xs text-muted-foreground/50 p-2 h-6">
            {getDisplayTimeframe(timeFrame)}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-min min-w-0">
          <DropdownMenuRadioGroup value={timeFrame} onValueChange={(e) => setTimeFrame(e as ChartTimeFrame)}>
            {['1 week', '1 month', '3 months', '6 months', '1 year'].map((value) => (
              <DropdownMenuRadioItem className="whitespace-nowrap" value={value}>
                {value}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

const Actions = ({ spread }: { spread: CallCreditSpread }) => {
  const [open, setOpen] = useState<boolean>(false);
  return (
    <div className="p-3">
      <Dialog onOpenChange={(v) => setOpen(v)}>
        <DialogTrigger asChild>
          <Button>Execute trade</Button>
        </DialogTrigger>
        <ExecuteTradePopup spread={spread} open={open} />
      </Dialog>
    </div>
  );
};
