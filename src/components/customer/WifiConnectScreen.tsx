import { useSessionStore } from '@/stores/sessionStore';
import { useUIStore } from '@/stores/uiStore';
import { Copy, Wifi } from 'lucide-react';

export function WifiConnectScreen() {
  const { session } = useSessionStore();
  const { setScreen } = useUIStore();
  const wifiName = session?.branchName || 'FoodZone';
  const wifiPassword = 'welcome2024';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-dark-900 text-white flex flex-col items-center justify-center p-6">
      <div className="w-20 h-20 bg-primary-500/20 rounded-full flex items-center justify-center mb-6">
        <Wifi className="w-10 h-10 text-primary-400" />
      </div>
      <h1 className="text-2xl font-bold mb-2">Free WiFi</h1>
      <p className="text-dark-400 text-center mb-8">Connect to our network</p>

      <div className="w-full max-w-sm bg-dark-800 rounded-xl border border-dark-700 p-6 space-y-4">
        <div>
          <label className="text-sm text-dark-400 mb-1 block">Network Name</label>
          <div className="flex items-center gap-2 bg-dark-900 rounded-lg px-4 py-3">
            <span className="flex-1">{wifiName}</span>
            <button onClick={() => copyToClipboard(wifiName)} className="text-primary-400">
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div>
          <label className="text-sm text-dark-400 mb-1 block">Password</label>
          <div className="flex items-center gap-2 bg-dark-900 rounded-lg px-4 py-3">
            <span className="flex-1">{wifiPassword}</span>
            <button onClick={() => copyToClipboard(wifiPassword)} className="text-primary-400">
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <button onClick={() => setScreen('home')} className="mt-8 bg-dark-800 hover:bg-dark-700 px-6 py-3 rounded-xl font-medium">
        Back to Menu
      </button>
    </div>
  );
}
