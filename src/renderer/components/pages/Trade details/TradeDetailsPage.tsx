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
import { roundTo } from '@/src/main/CallCreditSpreads/Data/Utils';
import { ExternalLink } from 'lucide-react';

const TradeDetailsPage = () => {
  const [searchParams] = useSearchParams();

  const [trade, setTrade] = useState<CallCreditSpreadTrade | undefined>(undefined);

  async function LoadTrade() {
    const tradeID = searchParams.get('id');
    if (!tradeID) return;

    const trade = await window.api.getCachedCallCreditSpreadTrade({ tradeID });
    const liveSpread = await window.api.getCallCreditSpread({ ticker: trade.underlying.ticker, expiration: trade.spreadAtOpen.expiration, shortStrike: trade.spreadAtOpen.shortLeg.strike, longStrike: trade.spreadAtOpen.longLeg.strike });
    trade.spreadLive = liveSpread;
    setTrade(trade);
  }

  useEffect(() => {
    LoadTrade();
  }, []);

  if (!trade) return null;

  return (
    <div className="w-screen h-screen flex flex-col items-start justify-start gap-3 select-none p-3 overflow-clip">
      <div className="flex items-start justify-start gap-3">
        <Trade trade={trade} />
        <SpreadPreview title="Open" description={`As of ${date.format(trade.spreadAtOpen.dateUpdated, 'MMM D, YYYY')}`} spread={trade.spreadAtOpen} />
        {trade.spreadLive && <SpreadPreview title="Live" description={`As of ${date.format(trade.spreadLive.dateUpdated, 'MMM D, YYYY')}`} spread={trade.spreadLive} />}
        {trade.spreadAtClose && <SpreadPreview title="Close" description={`As of ${date.format(trade.spreadAtClose.dateUpdated, 'MMM D, YYYY')}`} spread={trade.spreadAtClose} />}
      </div>
      <Actions trade={trade} />
    </div>
  );
};

export default TradeDetailsPage;

const Trade = ({ trade }: { trade: CallCreditSpreadTrade }) => {
  const calculateChange = (): number | undefined => {
    if (!trade || !trade.spreadLive) return undefined;
    const earned = (100 * (trade.spreadAtOpen.price - trade.spreadLive.price)) / trade.spreadAtOpen.collateral;
    return roundTo(earned);
  };
  const currentReturn = calculateChange();

  return (
    <Card>
      <div className="w-full flex items-start justify-between p-6 gap-8">
        <div className="w-full flex flex-col space-y-1.5">
          <CardTitle>
            {trade.spreadAtOpen.underlying.ticker} ${trade.spreadAtOpen.shortLeg.strike} / ${trade.spreadAtOpen.longLeg.strike} x{trade.quantity}
          </CardTitle>
          <CardDescription>
            {trade.status === 'open' ? `Expires on ${date.format(trade.spreadAtOpen.expiration, 'MMM D, YYYY')}` : trade.dateClosed !== undefined ? `Closed on ${date.format(trade.dateClosed, 'MMM D, YYYY')}` : ''}
          </CardDescription>
        </div>
        <Badge>{trade.status.toUpperCase()}</Badge>
      </div>
      <CardContent>
        <div className="w-full flex flex-col gap-1">
          {trade.status === 'open' ? (
            <>
              <DisplayValue label="Current return" percent={currentReturn} valueClassName={(currentReturn ?? 0) === 0 ? 'text-foreground' : (currentReturn ?? 0) > 0 ? 'text-primary' : 'text-red-600'} />
              <DisplayValue label="Price" dollar={trade.spreadLive?.price} />
              <DisplayValue label="Open price" dollar={trade.spreadAtOpen.price} />
              <DisplayValue label="Days to expiration" raw={trade.spreadLive?.daysToExpiration} />
            </>
          ) : (
            <>
              <DisplayValue label="Return" percent={currentReturn} valueClassName={(currentReturn ?? 0) === 0 ? 'text-foreground' : (currentReturn ?? 0) > 0 ? 'text-primary' : 'text-red-600'} />
              <DisplayValue label="Price" dollar={trade.spreadAtClose?.price} />
              <DisplayValue label="Open price" dollar={trade.spreadAtOpen.price} />
              {trade.dateClosed !== undefined && <DisplayValue label="Days held" raw={Math.ceil(date.subtract(trade.dateClosed, trade.dateOpened).toDays())} />}
            </>
          )}
          <Separator className="my-2" />
          <DisplayValue label="Spread" raw={`${trade.spreadAtOpen.shortLeg.strike} / ${trade.spreadAtOpen.longLeg.strike}`} />
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
  function ExpandSpread(spread: CallCreditSpread) {
    // window.api.openWindow(`spread-details?ticker=${spread.underlying.ticker}&expiration=${date.format(spread.expiration, 'YYYY-MM-DD')}&shortStrike=${spread.shortLeg.strike}&longStrike=${spread.longLeg.strike}`);
  }

  return (
    <Card>
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
    <div className="w-full flex justify-end">
      <Dialog onOpenChange={(v) => setOpen(v)}>
        <DialogTrigger asChild>
          <Button>Close trade</Button>
        </DialogTrigger>
      </Dialog>
    </div>
  );
};