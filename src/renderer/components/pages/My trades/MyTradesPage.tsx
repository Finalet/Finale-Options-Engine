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
      const liveSpread = await window.api.spreads.GetSpread({ ticker: trade.spreadAtOpen.underlying.ticker, shortOptionTicker: trade.spreadAtOpen.shortLeg.ticker, longOptionTicker: trade.spreadAtOpen.longLeg.ticker });
      trade.spreadLive = liveSpread;
      setOpenTrades((prev) => {
        const index = prev.findIndex((t) => t.id === trade.id);
        prev[index] = trade;
        return [...prev];
      });
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
