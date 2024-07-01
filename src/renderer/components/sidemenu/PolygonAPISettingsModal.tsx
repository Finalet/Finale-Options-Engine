import { CheckIcon, FilesIcon, KeyRoundIcon, RefreshCcw, XIcon } from 'lucide-react';
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../shadcn/ui/dialog';
import { useEffect, useState } from 'react';
import { cn } from '../shadcn/lib/utils';
import { WaitFor } from '../../Utils';
import { Button } from '../shadcn/ui/button';
import { Input } from '../shadcn/ui/input';
import { toast } from 'sonner';

const PolygonAPISettingsModal = () => {
  const [obscuredKey, setObscuredKey] = useState<string | undefined>(undefined);
  const [inputedKey, setInputedKey] = useState<string | undefined>(undefined);
  const [copySucces, setCopySuccess] = useState(false);

  const [editing, setEditing] = useState(false);
  const [keyValid, setKeyValid] = useState<boolean>(false);

  const getObscuredKey = async () => {
    const key = await window.api.settings.GetPolygonAPIKey();
    if (!key) return undefined;
    const obscuredKey = key.slice(0, 4) + '*'.repeat(Math.min(16, key.length - 8)) + key.slice(-4);
    return obscuredKey;
  };

  useEffect(() => {
    getObscuredKey().then((key) => setObscuredKey(key));
  }, [editing]);

  async function CopyKey() {
    const key = await window.api.settings.GetPolygonAPIKey();
    if (!key) return;
    await navigator.clipboard.writeText(key);
    setCopySuccess(true);
    await WaitFor(1);
    setCopySuccess(false);
  }

  async function SetKey() {
    if (!inputedKey || !isKeyValid(inputedKey)) return setEditing(false);

    try {
      await window.api.settings.SetPolygonAPIKey(inputedKey);
    } catch (e) {
      toast.error(`Failed to set Polygon API key. ${e}`);
      console.error(e);
    }
    setEditing(false);
  }

  const isKeyValid = (key: string) => {
    return key.length >= 12;
  };

  useEffect(() => {
    if (editing) {
      setInputedKey('');
      setKeyValid(false);
    }
  }, [editing]);

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Polygon API</DialogTitle>
        <DialogDescription>A service used to fetch stock options data.</DialogDescription>
      </DialogHeader>
      <div className="w-full flex flex-col gap-4 py-8">
        <div className="w-full flex items-center justify-between gap-16">
          <div className="flex items-center justify-start gap-2 shrink-0">
            <KeyRoundIcon className="w-4 h-4 text-muted-foreground" /> <span>API Key</span>
          </div>
          <div className="w-full flex items-center justify-end gap-2">
            {editing ? (
              <>
                <Input
                  value={inputedKey}
                  onChange={(e) => {
                    setInputedKey(e.target.value);
                    setKeyValid(isKeyValid(e.target.value));
                  }}
                  placeholder="Paste key here"
                  className="w-full font-mono"
                />
                <Button onClick={SetKey} size="icon" className="shrink-0" variant={keyValid ? 'default' : 'outline'}>
                  {keyValid ? <CheckIcon className="w-4 h-4" /> : <XIcon className="w-4 h-4" />}
                </Button>
              </>
            ) : obscuredKey ? (
              <>
                <button onClick={CopyKey} className="px-2 py-1 font-mono rounded-md bg-muted hover:bg-muted/80 active:bg-muted/60 transition-colors text-muted-foreground border flex items-center gap-2 relative">
                  {obscuredKey} <FilesIcon className={cn('w-4 h-4 duration-300 ease-out-back', copySucces ? 'opacity-0 scale-50' : 'opacity-100 scale-100')} />
                  <CheckIcon className={cn('absolute right-2 w-4 h-4 duration-300 ease-out-back', copySucces ? 'opacity-100 scale-100' : 'opacity-0 scale-50')} />
                </button>
                <Button onClick={() => setEditing(true)} size="icon" className="shrink-0" variant={'outline'}>
                  <RefreshCcw className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Button onClick={() => setEditing(true)}>Add key</Button>
            )}
          </div>
        </div>
      </div>
    </DialogContent>
  );
};

export default PolygonAPISettingsModal;
