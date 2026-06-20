import { motion } from 'framer-motion';
import { ArrowLeft, Wifi, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useSessionStore } from '@/stores/sessionStore';
import toast from 'react-hot-toast';

export function WifiConnectScreen() {
  const setScreen = useUIStore((s) => s.setScreen);
  const [copied, setCopied] = useState(false);
  const wifiName = 'FoodZone-Guest';
  const wifiPassword = 'Welcome2024!';

  const copyPassword = () => {
    navigator.clipboard.writeText(wifiPassword);
    setCopied(true);
    toast.success('Password copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col">
      <div className="sticky top-0 z-30 bg-dark-900/95 backdrop-blur-lg border-b border-dark-800 px-4 py-4 flex items-center gap-4">
        <button onClick={() => setScreen('home')} className="text-dark-400 hover:text-white"><ArrowLeft size={24} /></button>
        <h1 className="text-xl font-bold text-white">Wi-Fi</h1>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-sm w-full">
          <div className="w-24 h-24 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Wifi size={48} className="text-primary-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Free Wi-Fi</h2>
          <p className="text-dark-400 mb-8">Connect to our guest network</p>
          <div className="glass-panel p-6 space-y-4">
            <div><p className="text-dark-400 text-sm mb-1">Network Name</p><p className="text-white font-bold text-lg">{wifiName}</p></div>
            <div><p className="text-dark-400 text-sm mb-1">Password</p>
              <div className="flex items-center justify-between bg-dark-700 rounded-xl px-4 py-3">
                <p className="text-white font-mono text-lg">{wifiPassword}</p>
                <button onClick={copyPassword} className="text-primary-400 hover:text-primary-300">{copied ? <Check size={20} /> : <Copy size={20} />}</button>
              </div>
            </div>
          </div>
          <p className="text-dark-500 text-sm mt-6">Ask staff if you have trouble connecting</p>
        </motion.div>
      </div>
    </div>
  );
}
