import { CallCreditSpreadTrade } from '@/src/main/CallCreditSpreads/Data/Types';
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../shadcn/ui/dialog';
import { Button } from '../../shadcn/ui/button';
import date from 'date-and-time';
import { useEffect, useRef, useState } from 'react';
import { DialogClose } from '@radix-ui/react-dialog';
import { toast } from 'sonner';

const CloseTradePopup = ({ trade, open }: { trade: CallCreditSpreadTrade; open: boolean }) => {
  const [typedPrice, setTypedPrice] = useState<string>((trade.spreadLive ?? trade.spreadAtOpen).price.toFixed(2));

  async function CloseTrade() {
    const price = parseFloat(typedPrice);
    console.log(price);
    if (isNaN(price)) return;

    const promise = window.api.trades.CloseTrade({ trade, atPrice: price });
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
      setTypedPrice((trade.spreadLive ?? trade.spreadAtOpen).price.toFixed(2));
    }
  }, [open]);

  return (
    <DialogContent className="sm:max-w-[350px] select-none">
      <DialogHeader>
        <DialogTitle>{tradeDisplay}</DialogTitle>
        <DialogDescription>Confirm paid debit.</DialogDescription>
      </DialogHeader>
      <div className="w-full flex h-48">
        <input autoFocus className="absolute opacity-0 pointer-events-none" /> {/* This is a hack to focus the input */}
        <div className="w-full flex flex-col items-center justify-center gap-4">
          <div className="w-full flex items-center justify-center text-6xl font-semibold">
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