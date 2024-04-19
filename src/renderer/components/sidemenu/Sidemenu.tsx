import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '../shadcn/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../shadcn/ui/dropdown-menu';
import SidemenuItem from './SidemenuItem';
import { CandlestickChartIcon, Monitor, Moon, Sun } from 'lucide-react';

const Sidemenu = () => {
  return (
    <div className="flex flex-col items-center justify-between w-[14rem] h-full shrink-0 gap-2">
      <div className="w-full flex flex-col items-center justify-start gap-1">
        <SidemenuItem label="Screener" icon={<Monitor className="max-w-full" />} url="/" />
        <SidemenuItem label="My trades" icon={<CandlestickChartIcon className="max-w-full" />} url="/my-trades" />
      </div>
      <div className="w-full flex items-start">
        <ModeToggle />
      </div>
    </div>
  );
};

export default Sidemenu;

export function ModeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => setTheme('light')}>Light</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>Dark</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>System</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
