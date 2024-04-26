import { CallCreditSpread } from '@/src/main/CallCreditSpreads/Data/Types';
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../shadcn/ui/dialog';
import { toast } from 'sonner';
import { Button } from '../../shadcn/ui/button';
import date from 'date-and-time';
import { useEffect, useRef, useState } from 'react';
import { DialogClose } from '@radix-ui/react-dialog';
import { MinusIcon, PlusIcon } from 'lucide-react';

const ExecuteTradePopup = ({ spread, open }: { spread: CallCreditSpread; open: boolean }) => {
  const [typedPrice, setTypedPrice] = useState<string>(spread.price.toFixed(2));
  const [quantity, setQuantity] = useState<number>(1);

  async function ExecuteTrade() {
    const price = parseFloat(typedPrice);
    console.log(price);
    if (isNaN(price)) return;

    const promise = window.api.trades.ExecuteTrade({ spread, atPrice: price, quantity });
    toast.promise(promise, {
      loading: 'Executing trade...',
      success: () => `${tradeDisplay} executed at $${price}.`,
      error: 'Failed to execute trade',
    });
    await promise;
  }

  const tradeDisplay = `${spread.underlying.ticker} $${spread.shortLeg.strike} / $${spread.longLeg.strike} Call ${date.format(spread.expiration, 'M/D')}`;

  const [priceWidth, setPriceWidth] = useState(0);
  const span = useRef<HTMLSpanElement>(null);

  function TypePrice(price: string) {
    price = price.replace(/[^0-9.]/g, '');
    price = price.replace(/(\.\d{2})\d+/, '$1');
    setTypedPrice(price);
  }

  function ChangeQuantity(up: boolean) {
    if (up) setQuantity(quantity + 1);
    else if (quantity > 1) setQuantity(quantity - 1);
  }

  useEffect(() => {
    if (!span.current) return;
    setPriceWidth(span.current.offsetWidth === 0 ? 115 : span.current.offsetWidth);
  }, [typedPrice, span.current]);

  useEffect(() => {
    if (open) {
      setTypedPrice(spread.price.toFixed(2));
      setQuantity(1);
    }
  }, [open]);

  return (
    <DialogContent className="sm:max-w-[350px] select-none">
      <DialogHeader>
        <DialogTitle>{tradeDisplay}</DialogTitle>
        <DialogDescription>Confirm received credit.</DialogDescription>
      </DialogHeader>
      <div className="w-full flex h-48">
        <input autoFocus className="absolute opacity-0 pointer-events-none" /> {/* This is a hack to focus the input */}
        <div className="w-full flex flex-col items-center justify-center gap-4">
          <div className="w-full flex items-center justify-center text-6xl font-semibold">
            <span className="invisible absolute" ref={span}>
              {typedPrice}
            </span>
            <div className="-ml-2">$</div>
            <input style={{ width: priceWidth }} className="text-center outline-none bg-transparent" placeholder={spread.price.toFixed(2)} type="text" value={typedPrice} onChange={(e) => TypePrice(e.currentTarget.value)} />
          </div>
          <div className="grid grid-cols-3 gap-4 justify-between items-center">
            <Button disabled={quantity <= 1} onClick={() => ChangeQuantity(false)} className="text-muted-foreground" variant="ghost">
              <MinusIcon className="w-4 h-4" />
            </Button>
            <div className="text-center">{quantity}</div>
            <Button onClick={() => ChangeQuantity(true)} className="text-muted-foreground" variant="ghost">
              <PlusIcon className="w-4 h-4" />
            </Button>
          </div>
          <div className="text-muted-foreground/50 text-xs -mt-5">Quantity</div>
        </div>
      </div>
      <DialogFooter>
        <div className="w-full flex items-center justify-center">
          <DialogClose asChild>
            <Button disabled={isNaN(parseFloat(typedPrice))} onClick={ExecuteTrade}>
              Execute
            </Button>
          </DialogClose>
        </div>
      </DialogFooter>
    </DialogContent>
  );
};

export default ExecuteTradePopup;
