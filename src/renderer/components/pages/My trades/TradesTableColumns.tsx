import { CallCreditSpreadTrade } from '@/src/main/CallCreditSpreads/Data/Types';
import { createColumnHelper } from '@tanstack/react-table';
import { DataTableColumnHeader } from '../../elements/DataTable/DataTableColumnHeader';
import date from 'date-and-time';
import { roundTo } from '@/src/main/CallCreditSpreads/Data/Utils';
import { Skeleton } from '../../shadcn/ui/skeleton';
import { StatusBadge } from './MyTradesPage';

const columnHelper = createColumnHelper<CallCreditSpreadTrade>();

export const openColumns: any = [
  columnHelper.accessor((row) => row.status, {
    id: 'status',
    header: 'Status',
    size: 100,
    cell: ({ row }) => {
      return <StatusBadge status={row.original.status} />;
    },
  }),
  columnHelper.accessor((row) => row.dateOpened, {
    id: 'dateOpened',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Opened" />,
    maxSize: 130,
    cell: ({ row }) => {
      const isThisYear = new Date().getFullYear() === row.original.dateOpened.getFullYear();
      return <span>{date.format(row.original.dateOpened, isThisYear ? 'MMMM D' : 'MMMM D, YYYY')}</span>;
    },
  }),
  columnHelper.accessor((row) => row.spreadAtOpen.underlying.ticker, {
    id: 'trade',
    header: 'Trade',
    cell: ({ row }) => {
      return (
        <span className="whitespace-nowrap">
          {row.original.spreadAtOpen.underlying.ticker}{' '}
          <span className="text-muted-foreground">
            {row.original.spreadAtOpen.shortLeg.strike} / {row.original.spreadAtOpen.longLeg.strike}
          </span>
        </span>
      );
    },
  }),
  columnHelper.accessor((row) => row.quantity, {
    id: 'quantity',
    header: 'Qty',
    size: 70,
  }),
  columnHelper.accessor((row) => row.spreadAtOpen.price, {
    id: 'openPrice',
    header: 'Open price',
    cell: ({ row }) => {
      return <span>${row.original.spreadAtOpen.price}</span>;
    },
  }),
  columnHelper.accessor((row) => row.spreadAtOpen.maxProfit, {
    id: 'credit',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Credit" />,
    size: 70,
    cell: ({ row }) => {
      return <span>${row.original.credit.toFixed(0)}</span>;
    },
  }),
  columnHelper.accessor((row) => row.spreadAtOpen.expiration, {
    id: 'expiration',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Expiration" />,
    cell: ({ row }) => {
      const isThisYear = new Date().getFullYear() === row.original.dateOpened.getFullYear();
      const dte = row.original.spreadLive?.daysToExpiration ?? Math.ceil(date.subtract(row.original.spreadAtOpen.expiration, new Date()).toDays());
      return (
        <span>
          {date.format(row.original.spreadAtOpen.expiration, isThisYear ? 'MMMM D' : 'MMMM D, YYYY')} <span className="text-muted-foreground">({dte}d)</span>
        </span>
      );
    },
  }),
  columnHelper.accessor((row) => row.spreadLive?.price, {
    id: 'DTS',
    header: 'DTS',
    cell: ({ row }) => {
      const dts = row.original.spreadLive?.shortLeg.distanceToStrike ?? row.original.spreadAtExpiration?.shortLeg.distanceToStrike;
      return <span>{dts !== undefined ? `${roundTo(100 * dts, 1)}%` : <Placeholder width={2} />}</span>;
    },
  }),
  columnHelper.accessor((row) => row.spreadLive?.price, {
    id: 'livePrice',
    header: 'Live price',
    cell: ({ row }) => {
      const price = row.original.spreadLive?.price ?? row.original.spreadAtExpiration?.price;
      return <span>{price !== undefined ? `$${price.toFixed(2)}` : <Placeholder width={2} />}</span>;
    },
  }),
  columnHelper.accessor((row) => row.spreadLive?.returnAtExpiration, {
    id: 'change',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Change" />,
    cell: ({ row }) => {
      const currentChange = getTradeCurrentChange(row.original);
      if (currentChange === undefined) return <Placeholder />;
      return <span className={`${currentChange > 0 ? 'text-red-600' : currentChange === 0 ? 'text-foreground' : 'text-primary'} font-semibold`}>{currentChange}%</span>;
    },
    sortingFn: (a, b) => {
      const aReturn = getTradeCurrentChange(a.original);
      const bReturn = getTradeCurrentChange(b.original);
      if (aReturn === undefined || bReturn === undefined) return 0;
      return aReturn - bReturn;
    },
  }),
  columnHelper.accessor((row) => row.spreadLive?.returnAtExpiration, {
    id: 'return',
    size: 30,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Return" />,
    cell: ({ row }) => {
      const currentReturn = getTradeCurrentReturn(row.original);
      if (currentReturn === undefined) return <Placeholder />;
      return <span className={`${currentReturn > 0 ? 'text-primary' : currentReturn === 0 ? 'text-foreground' : 'text-red-600'} font-semibold`}>{currentReturn}%</span>;
    },
    sortingFn: (a, b) => {
      const aReturn = getTradeCurrentReturn(a.original);
      const bReturn = getTradeCurrentReturn(b.original);
      if (aReturn === undefined || bReturn === undefined) return 0;
      return bReturn - aReturn;
    },
  }),
];

export const closedColumns: any = [
  columnHelper.accessor((row) => row.dateOpened, {
    id: 'dateOpened',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Opened" />,
    maxSize: 130,
    cell: ({ row }) => {
      const isThisYear = new Date().getFullYear() === row.original.dateOpened.getFullYear();
      return <span>{date.format(row.original.dateOpened, isThisYear ? 'MMMM D' : 'MMMM D, YYYY')}</span>;
    },
  }),
  columnHelper.accessor((row) => row.spreadAtOpen.underlying.ticker, {
    id: 'trade',
    header: 'Trade',
    cell: ({ row }) => {
      return (
        <span className="whitespace-nowrap">
          {row.original.spreadAtOpen.underlying.ticker}{' '}
          <span className="text-muted-foreground">
            {row.original.spreadAtOpen.shortLeg.strike} / {row.original.spreadAtOpen.longLeg.strike}
          </span>
        </span>
      );
    },
  }),
  columnHelper.accessor((row) => row.quantity, {
    id: 'quantity',
    header: 'Qty',
    size: 70,
  }),
  columnHelper.accessor((row) => row.spreadAtOpen.price, {
    id: 'openPrice',
    header: 'Price',
    cell: ({ row }) => {
      return <span>${row.original.spreadAtOpen.price.toFixed(2)}</span>;
    },
  }),
  columnHelper.accessor((row) => row.spreadAtOpen.maxProfit, {
    id: 'credit',
    header: 'Credit',
    size: 70,
    cell: ({ row }) => {
      return <span>${row.original.credit.toFixed(0)}</span>;
    },
  }),
  columnHelper.accessor((row) => row.spreadAtOpen.expiration, {
    id: 'expiration',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Expiration" />,
    cell: ({ row }) => {
      const isThisYear = new Date().getFullYear() === row.original.dateOpened.getFullYear();
      const dte = row.original.spreadLive?.daysToExpiration ?? Math.ceil(date.subtract(row.original.spreadAtOpen.expiration, new Date()).toDays());
      return <span>{date.format(row.original.spreadAtOpen.expiration, isThisYear ? 'MMMM D' : 'MMMM D, YYYY')}</span>;
    },
  }),
  columnHelper.accessor((row) => row.spreadAtOpen?.shortLeg.greeks?.delta, {
    id: 'openDelta',
    header: 'Delta',
  }),
  columnHelper.accessor((row) => row.spreadAtOpen?.shortLeg.distanceToStrike, {
    id: 'openDTS',
    header: 'DTS',
    cell: ({ row }) => {
      return <span>{roundTo(100 * row.original.spreadAtOpen.shortLeg.distanceToStrike, 1)}%</span>;
    },
  }),
  columnHelper.accessor((row) => row.spreadAtOpen?.shortLeg.distanceOverBollingerBand, {
    id: 'openDOB',
    header: 'DOB',
    cell: ({ row }) => {
      return <span>{roundTo(100 * row.original.spreadAtOpen.shortLeg.distanceOverBollingerBand, 1)}%</span>;
    },
  }),
  columnHelper.accessor((row) => row.dateClosed, {
    id: 'dateClosed',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Closed" />,
    cell: ({ row }) => {
      const dte = row.original.spreadAtClose?.daysToExpiration;
      if (!row.original.dateClosed || dte === undefined) return <Placeholder />;
      const isThisYear = new Date().getFullYear() === row.original.dateClosed.getFullYear();
      return (
        <span>
          {date.format(row.original.dateClosed, isThisYear ? 'MMMM D' : 'MMMM D, YYYY')} <span className="text-muted-foreground">({dte}d)</span>
        </span>
      );
    },
  }),
  columnHelper.accessor((row) => row.spreadAtOpen?.shortLeg.distanceToStrike, {
    id: 'closeDTS',
    header: 'Close DTS',
    cell: ({ row }) => {
      if (!row.original.spreadAtClose) return <Placeholder />;
      return <span>{roundTo(100 * row.original.spreadAtClose.shortLeg.distanceToStrike, 1)}%</span>;
    },
  }),
  columnHelper.accessor((row) => row.spreadAtOpen?.shortLeg.distanceOverBollingerBand, {
    id: 'closeDOB',
    header: 'Close DOB',
    cell: ({ row }) => {
      if (!row.original.spreadAtClose) return <Placeholder />;
      return <span>{roundTo(100 * row.original.spreadAtClose.shortLeg.distanceOverBollingerBand, 1)}%</span>;
    },
  }),
  columnHelper.accessor((row) => row.spreadAtClose?.price, {
    id: 'closePrice',
    header: 'Close price',
    cell: ({ row }) => {
      if (!row.original.spreadAtClose) return <Placeholder />;
      return <span>${row.original.spreadAtClose.price.toFixed(2)}</span>;
    },
  }),
  columnHelper.accessor((row) => row.debit, {
    id: 'debit',
    size: 70,
    header: 'Debit',
    cell: ({ row }) => {
      if (row.original.debit === undefined) return <Placeholder />;
      return <span>${row.original.debit?.toFixed(0)}</span>;
    },
  }),
  columnHelper.accessor((row) => row.spreadLive?.returnAtExpiration, {
    id: 'change',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Change" />,
    size: 70,
    cell: ({ row }) => {
      const currentChange = getTradeCurrentChange(row.original);
      if (currentChange === undefined) return <Placeholder />;
      return <span className={`${currentChange > 0 ? 'text-red-600' : currentChange === 0 ? 'text-foreground' : 'text-primary'} font-semibold`}>{currentChange}%</span>;
    },
    sortingFn: (a, b) => {
      const aReturn = getTradeCurrentChange(a.original);
      const bReturn = getTradeCurrentChange(b.original);
      if (aReturn === undefined || bReturn === undefined) return 0;
      return aReturn - bReturn;
    },
  }),
  columnHelper.accessor((row) => row.spreadLive?.returnAtExpiration, {
    id: 'return',
    size: 30,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Return" />,
    cell: ({ row }) => {
      const currentReturn = getTradeCurrentReturn(row.original);
      if (currentReturn === undefined) return <Placeholder />;
      return <span className={`${currentReturn > 0 ? 'text-primary' : currentReturn === 0 ? 'text-foreground' : 'text-red-600'} font-semibold`}>{currentReturn}%</span>;
    },
    sortingFn: (a, b) => {
      const aReturn = getTradeCurrentReturn(a.original);
      const bReturn = getTradeCurrentReturn(b.original);
      if (aReturn === undefined || bReturn === undefined) return 0;
      return bReturn - aReturn;
    },
  }),
];

const Placeholder = ({ dynamicWidth, width }: { dynamicWidth?: string; width?: number }) => {
  return (
    <Skeleton
      style={{
        width: `${width ?? 2.5}rem`,
      }}
      className="h-5"
    />
  );
};

export const getTradeCurrentChange = (trade: CallCreditSpreadTrade): number | undefined => {
  const openPrice = trade.spreadAtOpen.price;
  const currentPrice = trade.spreadLive?.price ?? trade.spreadAtExpiration?.price ?? trade.spreadAtClose?.price;
  if (currentPrice === undefined) return undefined;
  return roundTo((100 * (currentPrice - openPrice)) / openPrice, 1);
};

export const getTradeCurrentReturn = (trade: CallCreditSpreadTrade): number | undefined => {
  const openPrice = trade.spreadAtOpen.price;
  const currentPrice = trade.spreadLive?.price ?? trade.spreadAtExpiration?.price ?? trade.spreadAtClose?.price;
  if (currentPrice === undefined) return undefined;
  const earned = (100 * (openPrice - currentPrice)) / trade.spreadAtOpen.collateral;
  return roundTo(100 * earned);
};
