import { GearIcon } from '@radix-ui/react-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '../shadcn/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '../shadcn/ui/dropdown-menu';
import SidemenuItem from './SidemenuItem';
import { CandlestickChartIcon, FolderOpen, FolderSync, Monitor, Moon, Sun, SunMoon } from 'lucide-react';
import { toast } from 'sonner';

const Sidemenu = () => {
  return (
    <div className="flex flex-col items-center justify-between w-[14rem] h-full shrink-0 gap-2">
      <div className="w-full flex flex-col items-center justify-start gap-1">
        <SidemenuItem label="Screener" icon={<Monitor className="max-w-full" />} url="/" />
        <SidemenuItem label="My trades" icon={<CandlestickChartIcon className="max-w-full" />} url="/my-trades" />
      </div>
      <div className="w-full flex items-start">
        <SettingsDropdown />
      </div>
    </div>
  );
};

export default Sidemenu;

function SettingsDropdown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <GearIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuGroup>
          <TradesFolder />
          <ThemeToggle />
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ThemeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>Theme</DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent>
          <DropdownMenuItem onClick={() => setTheme('light')}>
            Light <Sun className="ml-auto w-4 h-4 text-muted-foreground" />
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme('dark')}>
            Dark <Moon className="ml-auto w-4 h-4 text-muted-foreground" />
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setTheme('system')}>
            System <SunMoon className="ml-auto w-4 h-4 text-muted-foreground" />
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
}

function TradesFolder() {
  async function ChangeFolder() {
    try {
      const folderPath = await window.api.app.ChangeTradesFolder();
      if (!folderPath) return;

      toast.success(`Changed trades folder to ${folderPath}`);
    } catch (error) {
      toast.error(`Failed to change trades folder. ${error}`);
    }
  }

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>Trades folder</DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent>
          <DropdownMenuItem onSelect={() => window.api.app.OpenTradesFolder()}>
            Open
            <FolderOpen className="ml-auto w-4 h-4 text-muted-foreground" />
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={ChangeFolder}>
            Change
            <FolderSync className="ml-auto w-4 h-4 text-muted-foreground" />
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
}
