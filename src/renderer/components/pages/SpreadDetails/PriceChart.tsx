import { StockHistoricalPrice } from '@/src/main/CallCreditSpreads/Data/Types';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Line } from 'react-chartjs-2';
import dateAndTime from 'date-and-time';
import { CategoryScale, Chart, Legend, LinearScale, LineElement, Point, PointElement, Title, Tooltip } from 'chart.js';
import { roundTo } from '@/src/main/CallCreditSpreads/Data/Utils';

interface PriceChartProps {
  prices: StockHistoricalPrice[];
  timeFrame?: ChartTimeFrame;
  setPriceChange?: (change: { change: number; percent: number }) => void;
  onHover?: (point: StockHistoricalPrice, change: { change: number; percent: number }) => void;
  onHoverEnd?: () => void;
  className?: string;
}

export type ChartTimeFrame = '1 week' | '1 month' | '3 months' | '6 months' | '1 year';

const PriceChart = ({ prices, setPriceChange, onHover, onHoverEnd, timeFrame, className }: PriceChartProps) => {
  const isMouseInside = useRef(false);

  const cutoffDate = (): Date | undefined => {
    const now = new Date();
    if (!timeFrame) return undefined;

    switch (timeFrame) {
      case '1 week':
        return dateAndTime.addDays(now, -7);
      case '1 month':
        return dateAndTime.addMonths(now, -1);
      case '3 months':
        return dateAndTime.addMonths(now, -3);
      case '6 months':
        return dateAndTime.addMonths(now, -6);
      case '1 year':
        return dateAndTime.addYears(now, -1);
    }
  };

  function reduceArraySize(array: any[], maxLength: number) {
    if (array.length <= maxLength) return array;

    const nToRemove = array.length - maxLength;
    const removeInterval = array.length / nToRemove;
    const indicesToRemove = Array.from({ length: nToRemove }, (_, i) => Math.round(removeInterval * i));
    return array.filter((_, i) => !indicesToRemove.includes(i));
  }

  const percentChange = (prices: StockHistoricalPrice[], point?: StockHistoricalPrice): { change: number; percent: number } => {
    if (prices.length < 2) return { change: 0, percent: 0 };
    const firstPrice = prices[0].price;
    const lastPrice = point?.price ?? prices[prices.length - 1].price;
    return {
      change: lastPrice - firstPrice,
      percent: roundTo((100 * (lastPrice - firstPrice)) / firstPrice),
    };
  };

  const pricesWithCutoff: StockHistoricalPrice[] = useMemo(() => {
    const date = cutoffDate();
    if (!date) return prices;
    let index = prices.findIndex((p) => p.date >= date);
    if (index === -1) index = prices.length - 1;

    const slicedArray = prices.slice(index);
    const maxLength = 100;
    const reduce = reduceArraySize(slicedArray, maxLength);
    return reduce;
  }, [prices, timeFrame]);

  const drawLine = useCallback(
    (chart: Chart<'line', (number | Point | null)[], unknown>) => {
      if (!isMouseInside.current) return;

      const ctx = chart.ctx;
      const yAxis = chart.scales.y;
      const tooltipItems = chart.tooltip?.dataPoints ?? [];
      if (tooltipItems.length > 0) {
        const x = tooltipItems[0].element.x;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x, yAxis.top);
        ctx.lineTo(x, yAxis.bottom);
        ctx.lineWidth = 0.5;
        ctx.strokeStyle = '#71717a';
        ctx.stroke();
        ctx.restore();

        const point = pricesWithCutoff[tooltipItems[0].dataIndex];
        if (point) onHover?.(point, percentChange(pricesWithCutoff, point));
      }
    },
    [prices, timeFrame, pricesWithCutoff],
  );

  useEffect(() => {
    setPriceChange?.(percentChange(pricesWithCutoff));
  }, [pricesWithCutoff]);

  return (
    <div className={`w-full h-24 ${className}`}>
      <Line
        onMouseLeave={() => {
          isMouseInside.current = false;
          onHoverEnd?.();
          setPriceChange?.(percentChange(pricesWithCutoff));
        }}
        onMouseEnter={() => {
          isMouseInside.current = true;
        }}
        data={{
          labels: pricesWithCutoff.map((p) => dateAndTime.format(p.date, 'M/D')),
          datasets: [
            {
              data: pricesWithCutoff.map((p) => p.price),
              type: 'line',
              showLine: true,
              animation: false,
            },
          ],
        }}
        options={{
          maintainAspectRatio: false,
          elements: {
            point: {
              radius: 0,
            },
            line: {
              borderColor: percentChange(pricesWithCutoff, pricesWithCutoff[pricesWithCutoff.length - 1]).change >= 0 ? '#16a34a' : '#dc2626',
              tension: 0.1,
              borderWidth: 1.5,
            },
          },
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              mode: 'nearest',
              axis: 'x',
              intersect: false,
              displayColors: false,
              callbacks: {
                title: () => '',
                label: () => '',
                footer: () => '',
              },
              backgroundColor: 'rgba(0, 0, 0, 0)',
            },
          },
          scales: {
            x: {
              display: false,
              bounds: 'data',
            },
            y: {
              display: false,
            },
          },
        }}
        plugins={[
          {
            id: 'vertical-line',
            beforeDraw: drawLine,
          },
        ]}
      />
    </div>
  );
};

Chart.register({
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
});

export default PriceChart;
