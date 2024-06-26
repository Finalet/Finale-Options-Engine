import { HashRouter, MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import HomePage from './components/pages/HomePage';
import ScreenerPage from './components/pages/Screener/ScreenerPage';
import { ThemeProvider } from './contexts/ThemeContext';
import MyTradesPage from './components/pages/My trades/MyTradesPage';
import SpreadDetailsPage from './components/pages/Spread details/SpreadDetailsPage';
import { Toaster } from './components/shadcn/ui/sonner';
import TradeDetailsPage from './components/pages/Trade details/TradeDetailsPage';
import { HelmetProvider } from 'react-helmet-async';

export default function App() {
  return (
    <HelmetProvider>
      <ThemeProvider defaultTheme="light">
        <HashRouter>
          <Routes>
            <Route path="/" element={<HomePage />}>
              <Route path="" element={<ScreenerPage />} />
              <Route path="my-trades" element={<MyTradesPage />} />
            </Route>
            <Route path="/spread-details" element={<SpreadDetailsPage />} />
            <Route path="/trade-details" element={<TradeDetailsPage />} />
          </Routes>
        </HashRouter>
        <Toaster visibleToasts={5} position="bottom-left" />
      </ThemeProvider>
    </HelmetProvider>
  );
}
