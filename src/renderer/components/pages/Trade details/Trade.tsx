import { DisplayValue } from '../Spread details/SpreadDetailsPage';
import { CallCreditSpreadTrade } from '@/src/main/CallCreditSpreads/Data/Types';
import { Card, CardContent, CardDescription, CardTitle } from '../../shadcn/ui/card';
import { Separator } from '../../shadcn/ui/separator';
import date from 'date-and-time';
import { Badge } from '../../shadcn/ui/badge';
import { isThisYear } from './TradeDetailsPage';

export const Trade = ({ trade }: { trade: CallCreditSpreadTrade }) => {
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
        <StatusBadge status={trade.status} />
        <Badge variant={trade.status === 'closed' ? 'outline' : 'default'} className={'-translate-y-0.5'}>
          {trade.status.toUpperCase()}
        </Badge>
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
