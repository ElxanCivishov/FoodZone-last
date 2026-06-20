import { useUIStore } from '@/stores/uiStore';

export function RewardsScreen() {
  const { setScreen } = useUIStore();

  return (
    <div className="min-h-screen bg-dark-900 text-white flex flex-col items-center justify-center p-6">
      <span className="text-5xl mb-4">🎁</span>
      <h1 className="text-2xl font-bold mb-2">Rewards</h1>
      <p className="text-dark-400 text-center mb-8">Coming soon! Earn points with every order.</p>
      <button onClick={() => setScreen('home')} className="bg-primary-500 px-6 py-3 rounded-xl font-medium">
        Back to Menu
      </button>
    </div>
  );
}
