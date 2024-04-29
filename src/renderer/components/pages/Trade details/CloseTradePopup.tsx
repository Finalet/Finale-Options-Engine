import { CallCreditSpreadTrade } from '@/src/main/CallCreditSpreads/Data/Types';
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../shadcn/ui/dialog';
import { Button } from '../../shadcn/ui/button';
import date from 'date-and-time';
import { useEffect, useRef, useState } from 'react';
import { DialogClose } from '@radix-ui/react-dialog';
import { toast } from 'sonner';
import { DatePicker } from '../../elements/DatePicker/DatePicker';

const CloseTradePopup = ({ trade, open }: { trade: CallCreditSpreadTrade; open: boolean }) => {
  const [typedPrice, setTypedPrice] = useState<string>((trade.spreadLive ?? trade.spreadAtExpiration ?? trade.spreadAtOpen).price.toFixed(2));
  const [dateClosed, setDateClosed] = useState<Date | undefined>(trade.spreadAtOpen.expiration > new Date() ? new Date() : trade.spreadAtOpen.expiration);

  async function CloseTrade() {
    const price = parseFloat(typedPrice);
    console.log(price);
    if (isNaN(price)) return;

    const closedOn = dateClosed ? new Date(dateClosed.getFullYear(), dateClosed.getMonth(), dateClosed.getDate(), 17, 30) : trade.spreadAtOpen.expiration;
    const promise = window.api.trades.CloseTrade({ trade, atPrice: price, onDate: closedOn });
    toast.promise(promise, {
      loading: 'Closing trade...',
      success: () => `${tradeDisplay} closed at $${price}.`,
      error: 'Failed to close trade',
    });
    await promise;
  }

  const tradeDisplay = `${trade.spreadAtOpen.underlying.ticker} $${trade.spreadAtOpen.shortLeg.strike} / $${trade.spreadAtOpen.longLeg.strike} Call ${date.format(trade.spreadAtOpen.expiration, 'M/D')}`;

  const [priceWidth, setPriceWidth] = useState(0);
  const span = useRef<HTMLSpanElement>(null);

  function TypePrice(price: string) {
    price = price.replace(/[^0-9.]/g, '');
    price = price.replace(/(\.\d{2})\d+/, '$1');
    setTypedPrice(price);
  }

  useEffect(() => {
    if (!span.current) return;
    setPriceWidth(span.current.offsetWidth === 0 ? 115 : span.current.offsetWidth);
  }, [typedPrice, span.current]);

  useEffect(() => {
    if (open) {
      setTypedPrice((trade.spreadLive ?? trade.spreadAtExpiration ?? trade.spreadAtOpen).price.toFixed(2));
      setDateClosed(trade.spreadAtOpen.expiration > new Date() ? new Date() : trade.spreadAtOpen.expiration);
    }
  }, [open]);

  return (
    <DialogContent className="sm:max-w-[350px] select-none">
      <DialogHeader>
        <DialogTitle>{tradeDisplay}</DialogTitle>
        <DialogDescription>Confirm closing details.</DialogDescription>
      </DialogHeader>
      <div className="w-full flex h-56">
        <input autoFocus className="absolute opacity-0 pointer-events-none" /> {/* This is a hack to focus the input */}
        <div className="w-full flex flex-col items-center justify-center gap-2">
          <div className="w-full flex items-center justify-center text-6xl font-semibold my-4">
            <span className="invisible absolute" ref={span}>
              {typedPrice}
            </span>
            <div className="-ml-2">$</div>
            <input
              style={{ width: priceWidth }}
              className="text-center outline-none bg-transparent"
              placeholder={(trade.spreadLive ?? trade.spreadAtOpen).price.toFixed(2)}
              type="text"
              value={typedPrice}
              onChange={(e) => TypePrice(e.currentTarget.value)}
            />
          </div>
          <div className="text-sm text-muted-foreground">on</div>
          <DatePicker className="w-1/2" size="sm" date={dateClosed} setDate={setDateClosed} />
        </div>
      </div>
      <DialogFooter>
        <div className="w-full flex items-center justify-center">
          <DialogClose asChild>
            <Button disabled={isNaN(parseFloat(typedPrice))} onClick={CloseTrade}>
              Confirm close
            </Button>
          </DialogClose>
        </div>
      </DialogFooter>
    </DialogContent>
  );
};

export default CloseTradePopup;
