import { useEffect, useState } from 'react';
import { DataTable } from '../../elements/DataTable/DataTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shadcn/ui/card';
import { CallCreditSpreadTrade } from '@/src/main/CallCreditSpreads/Data/Types';
import { ReloadIcon } from '@radix-ui/react-icons';
import { Button } from '../../shadcn/ui/button';
import { cn } from '../../shadcn/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '../../shadcn/ui/tabs';
import { closedColumns, getTradeCurrentChange, getTradeCurrentReturn, openColumns } from './TradesTableColumns';
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
        const updatedTrade = await window.api.trades.LoadLiveTrade(trade);
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
    <div className="flex flex-col gap-3 w-full h-full overflow-auto">
      {tab === 'open' ? <OpenTradesStats trades={openTrades} /> : <ClosedTradesStats trades={closedTrades} />}
      <Card className="w-full h-full flex flex-col overflow-auto">
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
            defaultSort={{ id: 'dateOpened', dir: 'desc' }}
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

const OpenTradesStats = ({ trades }: { trades: CallCreditSpreadTrade[] }) => {
  const getAvgReturn = () => {
    let n = 0;
    const allReturns = trades.reduce((acc, trade) => {
      const currentReturn = getTradeCurrentReturn(trade);
      if (currentReturn !== undefined) {
        n++;
        return acc + currentReturn;
      }
      return acc;
    }, 0);
    if (n === 0) return 0;
    return allReturns / n;
  };
  const getAvgChange = () => {
    let n = 0;
    const allReturns = trades.reduce((acc, trade) => {
      const currentChange = getTradeCurrentChange(trade);
      if (currentChange !== undefined) {
        n++;
        return acc + currentChange;
      }
      return acc;
    }, 0);
    if (n === 0) return 0;
    return allReturns / n;
  };
  const totalCredit = trades.reduce((acc, trade) => acc + trade.credit, 0);
  const avgReturn = getAvgReturn();
  const avgChange = getAvgChange();

  return (
    <div className="w-full flex items-start justify-start gap-3">
      <StatCard title="Trades" value={trades.length.toString()} />
      <StatCard title="Credit" value={`$${totalCredit}`} />
      <StatCard title="Change" value={`${avgChange.toFixed(1)}%`} positive={avgChange === 0 ? undefined : avgChange < 0} />
      <StatCard title="Return" value={`${avgReturn.toFixed(1)}%`} positive={avgReturn === 0 ? undefined : avgReturn > 0} />
    </div>
  );
};

const ClosedTradesStats = ({ trades }: { trades: CallCreditSpreadTrade[] }) => {
  const getAvgReturn = () => {
    let n = 0;
    const allReturns = trades.reduce((acc, trade) => {
      const currentReturn = getTradeCurrentReturn(trade);
      if (currentReturn !== undefined) {
        n++;
        return acc + currentReturn;
      }
      return acc;
    }, 0);
    if (n === 0) return 0;
    return allReturns / n;
  };
  const totalCredit = trades.reduce((acc, trade) => acc + trade.credit, 0);
  const avgReturn = getAvgReturn();

  const weekTrades = trades.filter((trade) => {
    return trade.dateOpened >= prevMonday() && trade.dateOpened <= prevSunday();
  });

  const weekCredit = weekTrades.reduce((acc, trade) => acc + trade.credit, 0);

  const getWeekAvgReturn = () => {
    let n = 0;
    const allReturns = weekTrades.reduce((acc, trade) => {
      const currentReturn = getTradeCurrentReturn(trade);
      if (currentReturn !== undefined) {
        n++;
        return acc + currentReturn;
      }
      return acc;
    }, 0);
    if (n === 0) return 0;
    return allReturns / n;
  };
  const weekAvgReturn = getWeekAvgReturn();

  return (
    <div className="w-full flex items-center justify-between gap-3">
      <div className="flex items-start justify-start gap-3">
        <StatCard title="Week trades" value={weekTrades.length.toString()} />
        <StatCard title="Week credit" value={`$${weekCredit}`} />
        <StatCard title="Week return" value={`${weekAvgReturn.toFixed(1)}%`} positive={avgReturn === 0 ? undefined : avgReturn > 0} />
      </div>
      <div className="flex items-start justify-start gap-3">
        <StatCard title="All trades" value={trades.length.toString()} />
        <StatCard title="All credit" value={`$${totalCredit}`} />
        <StatCard title="All return" value={`${avgReturn.toFixed(1)}%`} positive={avgReturn === 0 ? undefined : avgReturn > 0} />
      </div>
    </div>
  );
};

const prevMonday = () => {
  let prevMonday = new Date();
  prevMonday.setDate(prevMonday.getDate() - ((prevMonday.getDay() + 6) % 7) - 7);
  return prevMonday;
};
const prevSunday = () => {
  const prevSunday = prevMonday();
  prevSunday.setDate(prevSunday.getDate() + 6);
  return prevSunday;
};

const StatCard = ({ title, value, positive }: { title: string; value: string; positive?: boolean }) => {
  return (
    <Card className="py-4 px-6 flex flex-col items-start justify-between w-[150px]">
      <div className="font-medium text-sm text-muted-foreground">{title}</div>
      <div className={cn('font-bold text-2xl', positive === undefined ? 'text-foreground' : positive ? 'text-primary' : 'text-red-600')}>{value}</div>
    </Card>
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
