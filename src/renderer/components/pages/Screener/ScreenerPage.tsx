import { createColumnHelper } from '@tanstack/react-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shadcn/ui/card';
import { DataTable } from '../../elements/DataTable/DataTable';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CallCreditSpread } from '@/src/main/CallCreditSpreads/Data/Types';
import { Badge } from '../../shadcn/ui/badge';
import { DataTableColumnHeader } from '../../elements/DataTable/DataTableColumnHeader';
import { ScreenerStatistics, SpreadParameters } from '@/src/main/CallCreditSpreads/Screener';
import ScreenerBreakdown from './ScreenerBreakdown';
import { Button } from '../../shadcn/ui/button';
import { ExternalLink } from 'lucide-react';
import dateAndTime from 'date-and-time';
import { Separator } from '../../shadcn/ui/separator';
import { DisplayValue } from '../Spread details/SpreadDetailsPage';
import { Parameter } from './ParameterTypes';
import { ColorDictionary } from './Setup';
import ScreenerControls from './ScreenerControls';
import { toast } from 'sonner';

const ScreenerPage = () => {
  const [spreads, setSpreads] = useState<CallCreditSpread[]>(screenerCache.spreads);
  const [statistics, setStatistics] = useState<ScreenerStatistics | undefined>(screenerCache.statistics);

  const [running, setRunning] = useState<boolean>(false);

  const colorDict = useRef<ColorDictionary>(screenerCache.colors);

  async function RunScreener(tickers: string[], colors: ColorDictionary, params?: SpreadParameters) {
    setSpreads([]);
    setStatistics(undefined);
    setRunning(true);

    colorDict.current = colors;
    for (const ticker of tickers) {
      try {
        const { spreads, statistics } = await window.api.screener.RunScreener({ underlyingTicker: ticker, params });
        setStatistics((prev) => {
          if (!prev) return statistics;
          prev.optionsFilterSteps = prev.optionsFilterSteps.map((v, i) => {
            return { step: v.step, count: v.count + (statistics.optionsFilterSteps.length > 0 ? statistics.optionsFilterSteps[i].count : 0) };
          });
          prev.spreadsFilterSteps = prev.spreadsFilterSteps.map((v, i) => {
            return { step: v.step, count: v.count + (statistics.spreadsFilterSteps.length > 0 ? statistics.spreadsFilterSteps[i].count : 0) };
          });
          return prev;
        });
        setSpreads((prev) => [...prev, ...spreads]);
      } catch (error: any) {
        console.log(error);
        if (error.message.includes('[OPTION-CHAIN-NOT-LOADED]')) {
          toast.error(`Option chain for ${ticker} is not loaded.`);
        } else {
          toast.error(`Failed to run screener for ${ticker}.`);
        }
        continue;
      }
    }
    setRunning(false);
  }

  function StoreCache() {
    screenerCache.colors = colorDict.current;
    screenerCache.spreads = spreads;
    screenerCache.statistics = statistics;
  }

  useEffect(() => {
    if (!running) StoreCache();
  }, [running]);

  return (
    <div className="w-full h-full flex gap-3 select-none">
      <Results spreads={spreads} colors={colorDict.current} />
      <div className="w-1/3 max-w-[30rem] flex flex-col h-full gap-3">
        <ScreenerControls Run={RunScreener} running={running} />
        <ScreenerBreakdown statistics={statistics} />
      </div>
    </div>
  );
};

export default ScreenerPage;

const Results = ({ spreads, colors }: { spreads: CallCreditSpread[]; colors: ColorDictionary }) => {
  const [previewingSpread, setPreviewingSpread] = useState<CallCreditSpread | undefined>(undefined);
  const [previewPosition, setPreviewPosition] = useState<{ x: number; y: number } | undefined>(undefined);
  const [animatingPreviewOut, setAnimatingPreviewOut] = useState<boolean>(false);
  const parentRef = useRef<HTMLDivElement>(null);

  const tickerColumn = useMemo(() => {
    return columnHelper.accessor((row) => row.underlying.ticker, {
      id: 'ticker',
      header: 'Ticker',
      cell: ({ row }) => {
        return <Badge className={colors[row.original.underlying.ticker]}>{row.original.underlying.ticker}</Badge>;
      },
    });
  }, [colors]);

  function OpenSpreadDetails(spread: CallCreditSpread) {
    window.api.app.OpenSpreadDetails(spread);
    setPreviewingSpread(undefined);
  }

  function HidePreview() {
    setAnimatingPreviewOut(true);
    setTimeout(() => {
      setPreviewingSpread(undefined);
      setAnimatingPreviewOut(false);
    }, 145);
  }

  const getPreviewPos = (rawY: number, rawX: number): { x: number; y: number } => {
    if (!parentRef.current) return { x: rawY, y: rawX };
    const rect = parentRef.current.getBoundingClientRect();
    const previewHeight = 439;
    const previewWidth = 256;
    const xOffset = 50;
    const yOffset = 70;
    const padding = 26;

    let x = rawX - rect.x - xOffset;
    let y = rawY - rect.y - yOffset;

    const overflowY = y + previewHeight - rect.height;
    if (overflowY >= 0) y -= overflowY + padding;
    if (y < 0) y = padding;

    const overflowX = x + previewWidth - rect.width;
    if (overflowX >= 0) x -= overflowX + padding;
    if (x < 0) x = padding;

    return { x, y };
  };

  return (
    <Card ref={parentRef} className="w-full h-full overflow-hidden flex flex-col relative">
      <CardHeader>
        <CardTitle>Screener</CardTitle>
        <CardDescription>Results of the screener</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col h-full overflow-auto">
        <DataTable
          searchColumnID="ticker"
          searchPlaceholder="Search ticker"
          onRowClick={OpenSpreadDetails}
          onRowContextMenu={(s, e): void => {
            if (!parentRef.current) return;
            setPreviewPosition(getPreviewPos(e.clientY, e.clientX));
            setPreviewingSpread(s);
          }}
          columns={[tickerColumn, ...columns]}
          data={spreads}
          defaultSort={{ id: 'return', dir: 'desc' }}
        />
      </CardContent>
      {previewingSpread && (
        <div
          style={{
            left: `${previewPosition?.x}px`,
            top: `${previewPosition?.y}px`,
          }}
          className="absolute"
        >
          <SpreadPreview
            className={`animate-in fade-in slide-in-from-bottom-4 zoom-in-95 fade-out slide-out-to-bottom-2 zoom-out-95  ${animatingPreviewOut && 'animate-out'}`}
            spread={previewingSpread}
            onExpandClick={OpenSpreadDetails}
            onMouseLeave={HidePreview}
          />
        </div>
      )}
    </Card>
  );
};

const columnHelper = createColumnHelper<CallCreditSpread>();
const columns: any = [
  columnHelper.accessor((row) => row.shortLeg.strike, {
    id: 'spread',
    header: 'Spread',
    cell: ({ row }) => {
      return (
        <span className="font-semibold text-nowrap">
          {row.original.shortLeg.strike} / {row.original.longLeg.strike}
        </span>
      );
    },
  }),
  columnHelper.accessor((row) => row.price, {
    id: 'price',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Price" />,
    cell: ({ row }) => {
      return <span>${row.original.price}</span>;
    },
  }),
  columnHelper.accessor((row) => row.shortLeg.greeks?.delta, {
    id: 'delta',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Delta" />,
  }),
  columnHelper.accessor((row) => row.shortLeg.distanceToStrike, {
    id: 'DTS',
    header: ({ column }) => <DataTableColumnHeader column={column} title="DTS" />,
    sortingFn: (a, b) => a.original.shortLeg.distanceToStrike - b.original.shortLeg.distanceToStrike,
    cell: ({ row }) => {
      return <span>{Math.round(row.original.shortLeg.distanceToStrike * 100)}%</span>;
    },
  }),
  columnHelper.accessor((row) => row.shortLeg.distanceOverBollingerBand, {
    id: 'DOB',
    header: ({ column }) => <DataTableColumnHeader column={column} title="DOB" />,
    sortingFn: (a, b) => a.original.shortLeg.distanceOverBollingerBand - b.original.shortLeg.distanceOverBollingerBand,
    cell: ({ row }) => {
      return <span>{Math.round(row.original.shortLeg.distanceOverBollingerBand * 100)}%</span>;
    },
  }),
  columnHelper.accessor((row) => row.returnAtExpiration, {
    id: 'return',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Return" />,
    cell: ({ row }) => {
      return <span className="font-semibold">{Math.round(row.original.returnAtExpiration * 100)}%</span>;
    },
    sortingFn: (a, b) => a.original.returnAtExpiration - b.original.returnAtExpiration,
  }),
];

interface SpreadPreviewProps {
  spread: CallCreditSpread;
  onExpandClick?: (s: CallCreditSpread) => void;
  onMouseLeave?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  className?: string;
}

export const SpreadPreview = ({ spread, onExpandClick, onMouseLeave, className }: SpreadPreviewProps) => {
  return (
    <Card className={`bg-card/80 backdrop-blur-md shadow-2xl ${className}`} onMouseLeave={(e) => onMouseLeave?.(e)}>
      <CardHeader className="relative">
        <CardTitle>
          {spread.underlying.ticker} ${spread.shortLeg.strike} / ${spread.longLeg.strike}
        </CardTitle>
        <CardDescription>Expires on {dateAndTime.format(spread.expiration, 'MMM D, YYYY')}</CardDescription>
        <Button onClick={() => onExpandClick?.(spread)} variant="ghost" className="absolute top-2 right-3 text-muted-foreground/50 p-3">
          <ExternalLink className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="w-full flex flex-col gap-1">
          <DisplayValue label="Return" percent={spread.returnAtExpiration} />
          <DisplayValue label="Price" dollar={spread.price} />
          <DisplayValue label="Days to expiration" raw={spread.daysToExpiration} />
          <Separator className="my-2" />
          <DisplayValue label="Profit / Loss" raw={`$${spread.maxProfit.toFixed(0)} / $${spread.maxLoss.toFixed(0)}`} />
          <DisplayValue label="Collateral" dollar={spread.collateral} />
          <Separator className="my-2" />
          <DisplayValue label="Short delta" raw={spread.shortLeg.greeks?.delta} />
          <DisplayValue label="Short IV" percent={spread.shortLeg.impliedVolatility} />
          <DisplayValue label="Distance to strike" percent={spread.shortLeg.distanceToStrike} />
          <DisplayValue label="Distance over Bollinger" percent={spread.shortLeg.distanceOverBollingerBand} />
          <Separator className="my-2" />
          <DisplayValue label="Next earnings" date={spread.underlying.earningsDate} />
          <DisplayValue label="Ex divident" date={spread.underlying.exDividendDate} />
        </div>
      </CardContent>
    </Card>
  );
};

interface IScreenerCache {
  colors: ColorDictionary;
  spreads: CallCreditSpread[];
  statistics: ScreenerStatistics | undefined;
  parameters: {
    tickers: string[];
    expiration: Date | undefined;
    parameters: Parameter[];
    values: SpreadParameters;
    colors: {
      dict: ColorDictionary;
      pool: string[];
    };
  };
}

export const screenerCache: IScreenerCache = {
  colors: {},
  spreads: [],
  statistics: undefined,
  parameters: {
    tickers: [],
    expiration: undefined,
    parameters: [],
    values: {},
    colors: {
      dict: {},
      pool: [],
    },
  },
};
