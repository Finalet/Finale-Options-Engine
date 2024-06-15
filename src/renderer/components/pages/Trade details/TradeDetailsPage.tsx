import { useSearchParams } from 'react-router-dom';
import { DisplayValue } from '../Spread details/SpreadDetailsPage';
import { useEffect, useState } from 'react';
import { CallCreditSpread, CallCreditSpreadTrade } from '@/src/main/CallCreditSpreads/Data/Types';
import { Dialog, DialogTrigger } from '../../shadcn/ui/dialog';
import { Button } from '../../shadcn/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shadcn/ui/card';
import { Separator } from '../../shadcn/ui/separator';
import date from 'date-and-time';
import { ChevronDown, ExternalLink, FolderOpen } from 'lucide-react';
import CloseTradePopup from './CloseTradePopup';
import { StatusBadge } from '../My trades/MyTradesPage';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '../../shadcn/ui/dropdown-menu';
import { toast } from 'sonner';
import { Skeleton } from '../../shadcn/ui/skeleton';
import { Helmet } from 'react-helmet-async';
import { FileIcon } from '@radix-ui/react-icons';

const TradeDetailsPage = () => {
  const [searchParams] = useSearchParams();

  const [trade, setTrade] = useState<CallCreditSpreadTrade | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);

  async function Init() {
    setLoading(true);
    try {
      await LoadTrade();
    } catch (error: any) {
      toast.error(`Failed to load trade. ${error}`);
    }
    setLoading(false);
  }

  async function LoadTrade() {
    const transactionID = searchParams.get('transactionID');
    if (!transactionID) return;

    const trade = await window.api.transaction.retrieve<CallCreditSpreadTrade>(transactionID);
    setTrade(trade);

    if (trade.spreadLive || trade.spreadAtExpiration || trade.spreadAtClose) return;

    const updatedTrade = await window.api.trades.LoadLiveTrade(trade);
    setTrade(updatedTrade);
  }

  useEffect(() => {
    Init();
  }, []);

  if (!trade) return null;

  return (
    <div className="w-screen h-screen flex flex-col items-start justify-start gap-3 select-none p-3 overflow-clip">
      <Helmet>
        <title>{`${trade.spreadAtOpen.underlying.ticker} $${trade.spreadAtOpen.shortLeg.strike} / $${trade.spreadAtOpen.longLeg.strike} x${trade.quantity} | ${
          trade.status === 'open'
            ? `Expires on ${date.format(trade.spreadAtOpen.expiration, isThisYear(trade.spreadAtOpen.expiration) ? 'MMM D' : 'MMM D, YYYY')}`
            : trade.dateClosed !== undefined
            ? `Closed on ${date.format(trade.dateClosed, isThisYear(trade.dateClosed) ? 'MMM D' : 'MMM D, YYYY')}`
            : ''
        }`}</title>
      </Helmet>
      <div className="w-full flex items-start justify-start gap-3">
        <Trade trade={trade} />
        <div className="w-full flex flex-col gap-3">
          <div className="w-full flex items-start justify-start gap-3">
            <SpreadPreview title="Opened" description={`${date.format(trade.spreadAtOpen.dateUpdated, isThisYear(trade.spreadAtOpen.dateUpdated) ? 'MMM D at HH:mm' : 'MMM D, YYYY at HH:mm')}`} spread={trade.spreadAtOpen} />
            {loading ? (
              <SpreadPreviewPlaceholder />
            ) : (
              <>
                {trade.spreadLive && (
                  <SpreadPreview title="Live" description={`${date.format(trade.spreadLive.dateUpdated, isThisYear(trade.spreadLive.dateUpdated) ? 'MMM D at HH:mm' : 'MMM D, YYYY at HH:mm')}`} spread={trade.spreadLive} />
                )}
                {trade.spreadAtExpiration && (
                  <SpreadPreview
                    title="Expired"
                    description={`${date.format(trade.spreadAtExpiration.dateUpdated, isThisYear(trade.spreadAtExpiration.dateUpdated) ? 'MMM D at HH:mm' : 'MMM D, YYYY at HH:mm')}`}
                    spread={trade.spreadAtExpiration}
                  />
                )}
                {trade.spreadAtClose && (
                  <SpreadPreview title="Closed" description={`${date.format(trade.spreadAtClose.dateUpdated, isThisYear(trade.spreadAtClose.dateUpdated) ? 'MMM D at HH:mm' : 'MMM D, YYYY at HH:mm')}`} spread={trade.spreadAtClose} />
                )}
              </>
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
    if (!trade) return undefined;
    if (trade.spreadLive) {
      const earned = (100 * (trade.spreadAtOpen.price - trade.spreadLive.price)) / trade.spreadAtOpen.collateral;
      return earned;
    } else if (trade.spreadAtExpiration) {
      const earned = (100 * (trade.spreadAtOpen.price - trade.spreadAtExpiration.price)) / trade.spreadAtOpen.collateral;
      return earned;
    } else if (trade.spreadAtClose) {
      const earned = (100 * (trade.spreadAtOpen.price - trade.spreadAtClose.price)) / trade.spreadAtOpen.collateral;
      return earned;
    }
    return undefined;
  };
  const calculateChange = (): number | undefined => {
    if (!trade) return undefined;
    if (trade.spreadLive) {
      const earned = (trade.spreadLive.price - trade.spreadAtOpen.price) / trade.spreadAtOpen.price;
      return earned;
    } else if (trade.spreadAtExpiration) {
      const earned = (trade.spreadAtExpiration.price - trade.spreadAtOpen.price) / trade.spreadAtOpen.price;
      return earned;
    } else if (trade.spreadAtClose) {
      const earned = (trade.spreadAtClose.price - trade.spreadAtOpen.price) / trade.spreadAtOpen.price;
      return earned;
    }
    return undefined;
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
          <DisplayValue label="Open price" dollar={trade.spreadAtOpen.price} />
          <DisplayValue label={trade.dateClosed ? 'Closed price' : 'Live price'} dollar={trade.spreadLive?.price ?? trade.spreadAtExpiration?.price ?? trade.spreadAtClose?.price} />
          <DisplayValue
            label={trade.dateClosed === undefined ? 'Days to expiration' : 'Days held'}
            raw={trade.spreadLive?.daysToExpiration ?? trade.spreadAtExpiration?.daysToExpiration ?? (trade.dateClosed && Math.round(date.subtract(trade.dateClosed, trade.dateOpened).toDays())) ?? undefined}
          />
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
            <DisplayValue label="Short delta" raw={spread.shortLeg.greeks?.delta} />
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
      <OpenExternalSource trade={trade} />
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

export const OpenExternalSource = ({ trade }: { trade: CallCreditSpreadTrade }) => {
  const ticker = trade.spreadAtOpen.shortLeg.underlyingTicker;

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
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => window.api.app.OpenTradeFile(trade)}>
            Trade file <FileIcon className="ml-auto" />
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const SpreadPreviewPlaceholder = () => {
  const randomWidth = () => `${(0.2 + Math.random() * 0.5) * 100}%`;
  return (
    <Card className="w-[255px] h-[349px]">
      <CardHeader>
        <Skeleton className="w-full h-4" />
        <Skeleton className="w-1/2 h-4" />
      </CardHeader>
      <CardContent>
        <div className="w-full flex flex-col gap-2">
          <Skeleton
            style={{
              width: randomWidth(),
            }}
            className="w-1/2 h-4"
          />
          <Skeleton
            style={{
              width: randomWidth(),
            }}
            className="w-1/2 h-4"
          />
          <Skeleton
            style={{
              width: randomWidth(),
            }}
            className="w-1/2 h-4"
          />
          <Skeleton
            style={{
              width: randomWidth(),
            }}
            className="w-1/2 h-4"
          />
          <Skeleton
            style={{
              width: randomWidth(),
            }}
            className="w-1/2 h-4"
          />
          <Skeleton
            style={{
              width: randomWidth(),
            }}
            className="w-1/2 h-4"
          />
          <Skeleton
            style={{
              width: randomWidth(),
            }}
            className="w-1/2 h-4"
          />
          <Skeleton
            style={{
              width: randomWidth(),
            }}
            className="w-1/2 h-4"
          />
        </div>
      </CardContent>
    </Card>
  );
};
