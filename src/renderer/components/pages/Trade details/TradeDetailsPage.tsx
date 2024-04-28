import { useSearchParams } from 'react-router-dom';
import { DisplayValue } from '../Spread details/SpreadDetailsPage';
import { useEffect, useState } from 'react';
import { CallCreditSpread, CallCreditSpreadTrade } from '@/src/main/CallCreditSpreads/Data/Types';
import { Dialog, DialogContent, DialogTrigger } from '../../shadcn/ui/dialog';
import { Button } from '../../shadcn/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shadcn/ui/card';
import { Separator } from '../../shadcn/ui/separator';
import date from 'date-and-time';
import { ChevronDown, ExternalLink } from 'lucide-react';
import CloseTradePopup from './CloseTradePopup';
import { StatusBadge } from '../My trades/MyTradesPage';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '../../shadcn/ui/dropdown-menu';
import { toast } from 'sonner';

const TradeDetailsPage = () => {
  const [searchParams] = useSearchParams();

  const [trade, setTrade] = useState<CallCreditSpreadTrade | undefined>(undefined);

  async function LoadTrade() {
    const transactionID = searchParams.get('transactionID');
    if (!transactionID) return;
    const trade = await window.api.transaction.retrieve<CallCreditSpreadTrade>(transactionID);
    setTrade(trade);
    if (trade.spreadLive || trade.spreadAtClose) return;

    try {
      const liveSpread = await window.api.spreads.GetSpread({ ticker: trade.spreadAtOpen.shortLeg.underlyingTicker, shortOptionTicker: trade.spreadAtOpen.shortLeg.ticker, longOptionTicker: trade.spreadAtOpen.longLeg.ticker });
      setTrade((prev) => {
        if (!prev) return prev;
        return { ...prev, spreadLive: liveSpread };
      });
    } catch (error: any) {
      if (trade.spreadAtOpen.expiration < new Date()) {
        const spreadAtExpiration = await window.api.spreads.GetExpiredSpread({ shortLegAtOpen: trade.spreadAtOpen.shortLeg, longLegAtOpen: trade.spreadAtOpen.longLeg });
        trade.spreadAtClose = spreadAtExpiration;
        trade.status = 'expired';
        setTrade((prev) => {
          if (!prev) return prev;
          return { ...prev, spreadAtClose: spreadAtExpiration };
        });
        return;
      }
      toast.error(`Failed to get live data for trade ${trade.id}.`);
    }
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
        <StatusBadge status={trade.status} className="-translate-y-0.5" />
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
  async function ExpandSpread() {
    if (!spread) return;
    window.api.app.OpenSpreadDetails(spread);
  }

  return (
    <Card className="w-[255px]">
      <CardHeader className="relative">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <Button onClick={ExpandSpread} variant="ghost" className="absolute top-2 right-3 text-muted-foreground/50 p-3">
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
            <DisplayValue label="Stock price" dollar={spread.underlying.price} />
            <DisplayValue label="Short delta" raw={spread.shortLeg.greeks.delta} />
            <DisplayValue label="Short IV" percent={spread.shortLeg.impliedVolatility} />
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
    <div className="w-full flex justify-end p-3 gap-3">
      <OpenExternalSource ticker={trade.spreadAtOpen.shortLeg.underlyingTicker} />
      <Dialog onOpenChange={(v) => setOpen(v)}>
        <DialogTrigger asChild>
          <Button>Close trade</Button>
        </DialogTrigger>
        <CloseTradePopup open={open} trade={trade} />
      </Dialog>
    </div>
  );
};

const isThisYear = (date: Date) => date.getFullYear() === new Date().getFullYear();

export const OpenExternalSource = ({ ticker }: { ticker: string }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button variant="outline">
          Open <ChevronDown className="ml-2 w-4 h-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Robinhood</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => window.open(`https://robinhood.com/stocks/${ticker}`, '_blank')}>Stock</DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open(`https://robinhood.com/options/chains/${ticker}/builder/short_call_spread`, '_blank')}>Spread builder</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuItem onClick={() => window.open(`https://www.tradingview.com/chart/?symbol=${ticker}`, '_blank')}>TradingView</DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
