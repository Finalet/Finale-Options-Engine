import { useSearchParams } from 'react-router-dom';
import { DisplayValue, StockDetails } from '../Spread details/SpreadDetailsPage';
import { useEffect, useState } from 'react';
import { CallCreditSpread, CallCreditSpreadTrade } from '@/src/main/CallCreditSpreads/Data/Types';
import { Dialog, DialogTrigger } from '../../shadcn/ui/dialog';
import { Button } from '../../shadcn/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shadcn/ui/card';
import { Separator } from '../../shadcn/ui/separator';
import date from 'date-and-time';
import { Badge } from '../../shadcn/ui/badge';
import { ExternalLink } from 'lucide-react';
import { Skeleton } from '../../shadcn/ui/skeleton';

const TradeDetailsPage = () => {
  const [searchParams] = useSearchParams();

  const [trade, setTrade] = useState<CallCreditSpreadTrade | undefined>(undefined);

  async function LoadTrade() {
    const tradeID = searchParams.get('tradeID');
    if (!tradeID) return;

    const trade = await window.api.trades.getCachedTrade({ tradeID });
    setTrade(trade);
    if (trade.spreadLive) return;

    const liveSpread = await window.api.spreads.GetSpread({ ticker: trade.spreadAtOpen.shortLeg.underlyingTicker, shortOptionTicker: trade.spreadAtOpen.shortLeg.ticker, longOptionTicker: trade.spreadAtOpen.longLeg.ticker });
    setTrade((prev) => {
      if (!prev) return prev;
      return { ...prev, spreadLive: liveSpread };
    });
  }

  useEffect(() => {
    LoadTrade();
  }, []);

  if (!trade) return null;

  return (
    <div className="w-screen h-screen flex flex-col items-start justify-start gap-3 select-none p-3 overflow-clip">
      <div className="w-full flex items-start justify-start gap-3">
        <Trade trade={trade} />
        <div className="w-full flex flex-col gap-3">
          <div className="w-full flex items-start justify-start gap-3">
            <SpreadPreview title="Opened" description={`${date.format(trade.spreadAtOpen.dateUpdated, isThisYear(trade.spreadAtOpen.dateUpdated) ? 'MMM D at HH:mm' : 'MMM D, YYYY at HH:mm')}`} spread={trade.spreadAtOpen} />
            {trade.spreadLive && <SpreadPreview title="Live" description={`${date.format(trade.spreadLive.dateUpdated, isThisYear(trade.spreadLive.dateUpdated) ? 'MMM D at HH:mm' : 'MMM D, YYYY at HH:mm')}`} spread={trade.spreadLive} />}
            {trade.spreadAtClose && (
              <SpreadPreview title="Closed" description={`${date.format(trade.spreadAtClose.dateUpdated, isThisYear(trade.spreadAtClose.dateUpdated) ? 'MMM D at HH:mm' : 'MMM D, YYYY at HH:mm')}`} spread={trade.spreadAtClose} />
            )}
          </div>
          <Actions trade={trade} />
        </div>
      </div>
    </div>
  );
};

export default TradeDetailsPage;

const Trade = ({ trade }: { trade: CallCreditSpreadTrade }) => {
  const calculateReturn = (): number | undefined => {
    if (!trade || !trade.spreadLive) return undefined;
    const earned = (100 * (trade.spreadAtOpen.price - trade.spreadLive.price)) / trade.spreadAtOpen.collateral;
    return earned;
  };
  const calculateChange = (): number | undefined => {
    if (!trade || !trade.spreadLive) return undefined;
    const earned = (trade.spreadLive.price - trade.spreadAtOpen.price) / trade.spreadAtOpen.price;
    return earned;
  };
  const currentReturn = calculateReturn();
  const currentChange = calculateChange();

  return (
    <Card className="w-[276px] shrink-0">
      <div className="w-full flex items-start justify-between p-6 gap-1">
        <div className="w-full flex flex-col space-y-1.5">
          <CardTitle>
            {trade.spreadAtOpen.underlying.ticker} ${trade.spreadAtOpen.shortLeg.strike} / ${trade.spreadAtOpen.longLeg.strike} x{trade.quantity}
          </CardTitle>
          <CardDescription>
            {trade.status === 'open'
              ? `Expires on ${date.format(trade.spreadAtOpen.expiration, isThisYear(trade.spreadAtOpen.expiration) ? 'MMM D' : 'MMM D, YYYY')}`
              : trade.dateClosed !== undefined
              ? `Closed on ${date.format(trade.dateClosed, isThisYear(trade.dateClosed) ? 'MMM D' : 'MMM D, YYYY')}`
              : ''}
          </CardDescription>
        </div>
        <Badge className="-translate-y-0.5">{trade.status.toUpperCase()}</Badge>
      </div>
      <CardContent>
        <div className="w-full flex flex-col gap-1">
          <DisplayValue label="Change" percent={currentChange} valueClassName={(currentChange ?? 0) === 0 ? 'text-foreground' : (currentChange ?? 0) < 0 ? 'text-primary' : 'text-red-600'} />
          <DisplayValue label="Return" percent={currentReturn} valueClassName={(currentReturn ?? 0) === 0 ? 'text-foreground' : (currentReturn ?? 0) > 0 ? 'text-primary' : 'text-red-600'} />
          <DisplayValue label="Price" dollar={trade.spreadAtClose?.price ?? trade.spreadLive?.price} />
          <DisplayValue label="Open price" dollar={trade.spreadAtOpen.price} />
          <DisplayValue label={trade.dateClosed === undefined ? 'Days to expiration' : 'Days held'} raw={trade.spreadLive?.daysToExpiration ?? trade.spreadAtOpen.daysToExpiration} />
          <Separator className="my-2" />
          <DisplayValue label="Spread" raw={`$${trade.spreadAtOpen.shortLeg.strike} / $${trade.spreadAtOpen.longLeg.strike}`} />
          <DisplayValue label="Quantity" raw={trade.quantity} />
          <DisplayValue label="Credit" dollar={trade.credit} />
          <DisplayValue label="Collateral" dollar={trade.collateral} />
          <DisplayValue label="Opened" date={trade.dateOpened} />
        </div>
      </CardContent>
    </Card>
  );
};

const SpreadPreview = ({ title, description, spread }: { title: string; description: string; spread?: CallCreditSpread }) => {
  async function ExpandSpread(spread: CallCreditSpread) {
    const transactionID = await window.api.transaction.deposit(spread);
    window.api.app.OpenSpreadDetails({ transactionID });
  }

  return (
    <Card className="w-[255px]">
      <CardHeader className="relative">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <Button onClick={() => spread && ExpandSpread(spread)} variant="ghost" className="absolute top-2 right-3 text-muted-foreground/50 p-3">
          <ExternalLink className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {spread && (
          <div className="w-full flex flex-col justify-between gap-1">
            <DisplayValue label="Expected return" percent={spread.returnAtExpiration} />
            <DisplayValue label="Price" dollar={spread.price} />
            <DisplayValue label="Profit / Loss" raw={`$${spread.maxProfit.toFixed(0)} / $${spread.maxLoss.toFixed(0)}`} />
            <DisplayValue label="Days to expiration" raw={spread.daysToExpiration} />
            <Separator className="my-2" />
            <DisplayValue label="Short delta" raw={spread.shortLeg.greeks.delta} />
            <DisplayValue label="Short IV" percent={spread.shortLeg.impliedVolatility} />
            <DisplayValue label="Stock price" dollar={spread.underlying.price} />
            <DisplayValue label="Distance to strike" percent={spread.shortLeg.distanceToStrike} />
            <DisplayValue label="Distance over Bollinger" percent={spread.shortLeg.distanceOverBollingerBand} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const Actions = ({ trade }: { trade: CallCreditSpreadTrade }) => {
  const [open, setOpen] = useState<boolean>(false);
  return (
    <div className="w-full flex justify-end p-3">
      <Dialog onOpenChange={(v) => setOpen(v)}>
        <DialogTrigger asChild>
          <Button>Close trade</Button>
        </DialogTrigger>
      </Dialog>
    </div>
  );
};

const isThisYear = (date: Date) => date.getFullYear() === new Date().getFullYear();
