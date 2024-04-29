import { useEffect, useState } from 'react';
import { DataTable } from '../../elements/DataTable/DataTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shadcn/ui/card';
import { CallCreditSpreadTrade } from '@/src/main/CallCreditSpreads/Data/Types';
import { ReloadIcon } from '@radix-ui/react-icons';
import { Button } from '../../shadcn/ui/button';
import { cn } from '../../shadcn/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '../../shadcn/ui/tabs';
import { closedColumns, openColumns } from './TradesTableColumns';
import { Badge } from '../../shadcn/ui/badge';
import { toast } from 'sonner';

const MyTradesPage = () => {
  const [loading, setLoading] = useState(false);

  const [openTrades, setOpenTrades] = useState<CallCreditSpreadTrade[]>(myTradesCache.openTrades);
  const [closedTrades, setClosedTrades] = useState<CallCreditSpreadTrade[]>(myTradesCache.closedTrades);

  const [tab, setTab] = useState<'open' | 'closed'>(myTradesCache.tab);

  async function LoadTrades(refresh: boolean = false) {
    if (refresh) {
      myTradesCache.openTrades = [];
      myTradesCache.closedTrades = [];
    }
    if (myTradesCache.openTrades.length > 0 || myTradesCache.closedTrades.length > 0) return;

    const trades = await window.api.trades.LoadTrades();
    const openTrades = trades.filter((t) => t.status !== 'closed');
    const closedTrades = trades.filter((t) => t.status === 'closed');

    setOpenTrades(openTrades);
    setClosedTrades(closedTrades);

    if (openTrades.some((t) => t.spreadLive === undefined)) await GetLiveData(openTrades);
  }

  async function GetLiveData(trades: CallCreditSpreadTrade[]) {
    setLoading(true);
    for (const trade of trades) {
      try {
        const updatedTrade = await LoadLiveTrade(trade);
        setOpenTrades((prev) => {
          const index = prev.findIndex((t) => t.id === updatedTrade.id);
          prev[index] = updatedTrade;
          return [...prev];
        });
      } catch (error: any) {
        toast.error(error.message);
      }
    }
    setLoading(false);
  }

  function onTradeClose(closedTrade: CallCreditSpreadTrade) {
    setClosedTrades((prev) => [closedTrade, ...prev]);
    setOpenTrades((prev) => prev.filter((t) => t.id !== closedTrade.id));
  }

  useEffect(() => {}, []);

  useEffect(() => {
    myTradesCache.tab = tab;
    if (!loading) {
      myTradesCache.openTrades = openTrades;
      myTradesCache.closedTrades = closedTrades;
    }
  }, [tab, loading]);

  useEffect(() => {
    LoadTrades();
    const unsub = window.api.trades.onTradeClosed(onTradeClose);
    return () => unsub();
  }, []);

  return (
    <div className="w-full h-full">
      <Card className="w-full h-full flex flex-col">
        <CardHeader className="relative">
          <CardTitle>My trades</CardTitle>
          <CardDescription>List of open and closed positions.</CardDescription>
          <Tabs className="absolute top-6 right-6" onValueChange={(t) => setTab(t as 'open' | 'closed')} defaultValue={myTradesCache.tab}>
            <TabsList>
              <TabsTrigger value="open">Open</TabsTrigger>
              <TabsTrigger value="closed">Closed</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="flex flex-col h-full overflow-auto">
          <DataTable
            data={tab === 'open' ? openTrades : closedTrades}
            columns={tab === 'open' ? openColumns : closedColumns}
            onRowClick={(t) => window.api.app.OpenTradeDetails(t)}
            searchColumnID="trade"
            searchPlaceholder="Search trade"
            headerButtons={
              tab === 'open' && (
                <Button disabled={loading} onClick={() => LoadTrades(true)} variant="outline" size="icon">
                  <ReloadIcon className={cn(loading && 'animate-spin')} />
                </Button>
              )
            }
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default MyTradesPage;

export const StatusBadge = ({ status, className }: { status: CallCreditSpreadTrade['status']; className?: string }) => {
  return (
    <Badge className={className} variant={status === 'open' ? 'default' : status === 'closed' ? 'outline' : 'destructive'}>
      {status.toUpperCase()}
    </Badge>
  );
};

interface IMyTradesCache {
  tab: 'open' | 'closed';
  openTrades: CallCreditSpreadTrade[];
  closedTrades: CallCreditSpreadTrade[];
}

const myTradesCache: IMyTradesCache = {
  tab: 'open',
  openTrades: [],
  closedTrades: [],
};

export async function LoadLiveTrade(trade: CallCreditSpreadTrade): Promise<CallCreditSpreadTrade> {
  try {
    const liveSpread = await window.api.spreads.GetSpread({
      underlyingTicker: trade.spreadAtOpen.underlying.ticker,
      shortLeg: trade.spreadAtOpen.shortLeg,
      longLeg: trade.spreadAtOpen.longLeg,
    });
    trade.spreadLive = liveSpread;
    const updatedTrade = { ...trade };
    return updatedTrade;
  } catch (error: any) {
    if (trade.spreadAtOpen.expiration < new Date()) {
      return await LoadExpiredSpread(trade);
    }
    throw new Error(`Failed to get live data trade ${trade.spreadAtOpen.underlying.ticker} ${trade.spreadAtOpen.shortLeg.strike}/${trade.spreadAtOpen.longLeg.strike}.`);
  }
}
async function LoadExpiredSpread(trade: CallCreditSpreadTrade): Promise<CallCreditSpreadTrade> {
  const spreadAtExpiration = await window.api.spreads.GetSpread({
    shortLeg: trade.spreadAtOpen.shortLeg,
    longLeg: trade.spreadAtOpen.longLeg,
    underlyingTicker: trade.spreadAtOpen.underlying.ticker,
    onDate: trade.spreadAtOpen.expiration,
  });
  trade.spreadAtExpiration = spreadAtExpiration;
  trade.status = 'expired';
  const updatedTrade: CallCreditSpreadTrade = { ...trade };
  return updatedTrade;
}
