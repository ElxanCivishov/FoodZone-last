import { motion } from 'framer-motion';
import { Gift, Star, History } from 'lucide-react';

export function RewardsScreen() {
  const rewards = [
    { id: '1', name: 'Free Dessert', points: 100, description: 'Get any dessert for free', icon: '🍰' },
    { id: '2', name: '10% Discount', points: 200, description: '10% off your next order', icon: '🎉' },
    { id: '3', name: 'Free Drink', points: 50, description: 'Any soft drink free', icon: '🥤' },
  ];
  const history = [
    { id: '1', points: 25, type: 'earned' as const, description: 'Order #12345', date: '2024-06-15' },
    { id: '2', points: 10, type: 'earned' as const, description: 'Order #12344', date: '2024-06-10' },
  ];

  return (
    <div className="min-h-screen bg-dark-900 pb-24">
      <div className="sticky top-0 z-30 bg-dark-900/95 backdrop-blur-lg border-b border-dark-800 px-4 py-4">
        <h1 className="text-xl font-bold text-white">Rewards</h1>
      </div>
      <div className="px-4 py-6">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel p-6 mb-6 text-center">
          <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Star size={32} className="text-primary-400" />
          </div>
          <p className="text-dark-400 mb-1">Your Points</p>
          <p className="text-4xl font-bold text-white mb-2">350</p>
          <p className="text-dark-400 text-sm">Earn points with every order</p>
        </motion.div>
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2"><Gift size={20} /> Available Rewards</h2>
        <div className="space-y-3 mb-8">
          {rewards.map((reward) => (
            <div key={reward.id} className="bg-dark-800 rounded-2xl p-4 border border-dark-700 flex items-center gap-4">
              <span className="text-3xl">{reward.icon}</span>
              <div className="flex-1">
                <h3 className="text-white font-medium">{reward.name}</h3>
                <p className="text-dark-400 text-sm">{reward.description}</p>
              </div>
              <div className="text-right">
                <p className="text-primary-400 font-bold">{reward.points} pts</p>
                <button className="text-xs bg-primary-500/20 text-primary-400 px-3 py-1 rounded-lg mt-1">Redeem</button>
              </div>
            </div>
          ))}
        </div>
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2"><History size={20} /> Points History</h2>
        <div className="space-y-2">
          {history.map((item) => (
            <div key={item.id} className="bg-dark-800 rounded-xl p-4 flex items-center justify-between">
              <div><p className="text-white text-sm">{item.description}</p><p className="text-dark-500 text-xs">{item.date}</p></div>
              <span className="text-green-400 font-medium">+{item.points} pts</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
