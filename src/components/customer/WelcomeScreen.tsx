import { useSessionStore } from '@/stores/sessionStore';
import { useUIStore } from '@/stores/uiStore';

export function WelcomeScreen() {
  const { session } = useSessionStore();
  const { setScreen } = useUIStore();

  return (
    <div className="min-h-screen bg-dark-900 text-white flex flex-col items-center justify-center p-6">
      <div className="w-24 h-24 bg-primary-500/20 rounded-full flex items-center justify-center mb-6">
        <span className="text-5xl">🍽️</span>
      </div>
      <h1 className="text-3xl font-bold mb-2">Welcome!</h1>
      <p className="text-dark-400 text-center mb-2">
        You are at <span className="text-primary-400 font-medium">Table {session?.tableNumber}</span>
      </p>
      <p className="text-dark-400 text-center mb-8">
        {session?.restaurantName || 'FoodZone'} - {session?.branchName || 'Sahil'}
      </p>

      <button
        onClick={() => setScreen('home')}
        className="w-full max-w-sm bg-primary-500 hover:bg-primary-600 py-4 rounded-xl font-bold text-lg"
      >
        View Menu
      </button>
    </div>
  );
}
