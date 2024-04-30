import { useEffect, useRef, useState } from 'react';
import Setup, { ColorDictionary } from './Setup';
import Parameters from './Parameters';
import { screenerCache } from './ScreenerPage';
import { SpreadParameters } from '@/src/main/CallCreditSpreads/Screener';

const ScreenerControls = ({ running, Run }: { running: boolean; Run: (tickers: string[], colors: ColorDictionary, params?: SpreadParameters) => Promise<void> }) => {
  const [tickers, setTickers] = useState<string[]>(screenerCache.parameters.tickers);
  const [expiration, setExpiration] = useState<Date | undefined>(screenerCache.parameters.expiration);

  const tickerColorDict = useRef<ColorDictionary>(screenerCache.colors);

  useEffect(() => {
    screenerCache.parameters.tickers = tickers;
    screenerCache.parameters.expiration = expiration;
  }, [tickers, expiration]);

  return (
    <div className="w-full h-full flex flex-col gap-3 overflow-auto">
      <Setup tickers={tickers} setTickers={setTickers} expiration={expiration} setExpiration={setExpiration} tickerColorDict={tickerColorDict} />
      <Parameters tickers={tickers} expiration={expiration} running={running} Run={(tickers, params) => Run(tickers, tickerColorDict.current, params)} />
    </div>
  );
};

export default ScreenerControls;
