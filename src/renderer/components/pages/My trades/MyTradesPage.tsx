import { createColumnHelper } from '@tanstack/react-table';
import { useEffect, useState } from 'react';
import { DataTable } from '../../elements/DataTable/DataTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shadcn/ui/card';
import { DataTableColumnHeader } from '../../elements/DataTable/DataTableColumnHeader';
import { Badge } from '../../shadcn/ui/badge';
import { CallCreditSpreadTrade } from '@/src/main/CallCreditSpreads/Data/Types';

const MyTradesPage = () => {
  const [trades, setTrades] = useState<CallCreditSpreadTrade[]>([]);

  async function LoadTrades() {
    const trades = await window.api.loadTrades();
    setTrades(trades);
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
  columnHelper.accessor((row) => row.underlying.ticker, {
    id: 'ticker',
    header: 'Ticker',
    cell: ({ row }) => {
      return <Badge>{row.original.underlying.ticker}</Badge>;
    },
  }),
  columnHelper.accessor((row) => row.spreadAtOpen.shortLeg.strike, {
    id: 'spread',
    header: 'Spread',
    cell: ({ row }) => {
      return (
        <span className="font-semibold">
          {row.original.spreadAtOpen.shortLeg.strike} / {row.original.spreadAtOpen.longLeg.strike}
        </span>
      );
    },
  }),
  columnHelper.accessor((row) => row.underlying.price, {
    id: 'price',
    header: 'Price',
  }),
  columnHelper.accessor((row) => row.spreadAtOpen.returnAtExpiration, {
    id: 'return',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Return" />,
    cell: ({ row }) => {
      return <span className="font-semibold">{Math.round(row.original.spreadAtOpen.returnAtExpiration * 100)}%</span>;
    },
    sortingFn: (a, b) => a.original.spreadAtOpen.returnAtExpiration - b.original.spreadAtOpen.returnAtExpiration,
  }),
];
