import { createColumnHelper } from '@tanstack/react-table';
import { useEffect, useState } from 'react';
import { DataTable } from '../../elements/DataTable/DataTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shadcn/ui/card';
import { DataTableColumnHeader } from '../../elements/DataTable/DataTableColumnHeader';
import { Badge } from '../../shadcn/ui/badge';
import { CallCreditSpreadTrade } from '@/src/main/CallCreditSpreads/Data/Types';
import { Skeleton } from '../../shadcn/ui/skeleton';
import date from 'date-and-time';
import { roundTo } from '@/src/main/CallCreditSpreads/Data/Utils';

const MyTradesPage = () => {
  const [trades, setTrades] = useState<CallCreditSpreadTrade[]>([]);

  async function LoadTrades() {
    const trades = await window.api.loadTrades();
    setTrades(trades);
    GetLiveData(trades);
  }

  async function GetLiveData(trades: CallCreditSpreadTrade[]) {
    for (const trade of trades) {
      const liveSpread = await window.api.getCallCreditSpread({ ticker: trade.underlying.ticker, expiration: trade.spreadAtOpen.expiration, shortStrike: trade.spreadAtOpen.shortLeg.strike, longStrike: trade.spreadAtOpen.longLeg.strike });
      trade.spreadLive = liveSpread;
      setTrades((prev) => {
        const index = prev.findIndex((t) => t.id === trade.id);
        prev[index] = trade;
        return [...prev];
      });
    }
  }

  useEffect(() => {
    LoadTrades();
  }, []);

  return (
    <div className="w-full h-full">
      <Card className="w-full h-full flex flex-col">
        <CardHeader>
          <CardTitle>My trades</CardTitle>
          <CardDescription>List of open and closed positions.</CardDescription>
        </CardHeader>
        <CardContent className="h-full">
          <DataTable data={trades} columns={columns} />
        </CardContent>
      </Card>
    </div>
  );
};

export default MyTradesPage;

const columnHelper = createColumnHelper<CallCreditSpreadTrade>();
const columns: any = [
  columnHelper.accessor((row) => row.status, {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => {
      return <Badge variant={row.original.status === 'closed' ? 'outline' : 'default'}>{row.original.status.toUpperCase()}</Badge>;
    },
  }),
  columnHelper.accessor((row) => row.dateOpened, {
    id: 'dateOpened',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Opened" />,
    cell: ({ row }) => {
      const isThisYear = new Date().getFullYear() === row.original.dateOpened.getFullYear();
      return <span>{date.format(row.original.spreadAtOpen.expiration, isThisYear ? 'MMMM D' : 'MMMM D, YYYY')}</span>;
    },
  }),
  columnHelper.accessor((row) => row.underlying.ticker, {
    id: 'ticker',
    header: 'Ticker',
  }),
  columnHelper.accessor((row) => row.spreadAtOpen.shortLeg.strike, {
    id: 'spread',
    header: 'Spread',
    cell: ({ row }) => {
      return (
        <span>
          {row.original.spreadAtOpen.shortLeg.strike} / {row.original.spreadAtOpen.longLeg.strike}
        </span>
      );
    },
  }),
  columnHelper.accessor((row) => row.underlying.price, {
    id: 'stockPrice',
    header: 'Stock Price',
    cell: ({ row }) => {
      return <span>${row.original.underlying.price.toFixed(2)}</span>;
    },
  }),
  columnHelper.accessor((row) => row.spreadAtOpen.maxProfit, {
    id: 'Credit',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Credit" />,
    cell: ({ row }) => {
      return <span>${row.original.spreadAtOpen.maxProfit.toFixed(0)}</span>;
    },
  }),
  columnHelper.accessor((row) => row.spreadAtOpen.price, {
    id: 'openPrice',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Open price" />,
    cell: ({ row }) => {
      return <span>${row.original.spreadAtOpen.price}</span>;
    },
  }),
  columnHelper.accessor((row) => row.spreadLive?.price, {
    id: 'currentPrice',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Price" />,
    cell: ({ row }) => {
      return <span>{row.original.spreadLive?.price !== undefined ? `$${row.original.spreadLive?.price}` : <Placeholder />}</span>;
    },
  }),
  columnHelper.accessor((row) => row.spreadAtOpen.expiration, {
    id: 'expiration',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Expiration" />,
    cell: ({ row }) => {
      const isThisYear = new Date().getFullYear() === row.original.dateOpened.getFullYear();
      const dte = row.original.spreadLive?.stats.daysToExpiration ?? Math.ceil(date.subtract(row.original.spreadAtOpen.expiration, new Date()).toDays());
      return (
        <span>
          {date.format(row.original.spreadAtOpen.expiration, isThisYear ? 'MMMM D' : 'MMMM D, YYYY')} ({dte}d)
        </span>
      );
    },
  }),
  columnHelper.accessor((row) => row.spreadLive?.returnAtExpiration, {
    id: 'return',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Return" />,
    cell: ({ row }) => {
      const credit = row.original.spreadAtOpen.maxProfit;
      const currentPrice = row.original.spreadLive?.maxProfit;
      if (currentPrice === undefined) return <Placeholder />;
      const currentReturn = roundTo((100 * (credit - currentPrice)) / credit, 2);
      return <span className={`${currentReturn > 0 ? 'text-primary' : currentReturn === 0 ? 'text-foreground' : 'text-red-600'} font-semibold`}>{currentReturn}%</span>;
    },
    sortingFn: (a, b) => (a.original.spreadLive === undefined || b.original.spreadLive === undefined ? 0 : a.original.spreadLive.returnAtExpiration - b.original.spreadLive.returnAtExpiration),
  }),
];

const Placeholder = () => {
  return <Skeleton className="w-10 h-5" />;
};
