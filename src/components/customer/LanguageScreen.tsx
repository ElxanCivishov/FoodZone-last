import { useSessionStore } from '@/stores/sessionStore';
import { useUIStore } from '@/stores/uiStore';
import { LANGUAGES } from '@/utils/constants';

export function LanguageScreen() {
  const { updateLanguage } = useSessionStore();
  const { setScreen } = useUIStore();

  const handleSelect = (code: string) => {
    updateLanguage(code);
    setScreen('welcome');
  };

  return (
    <div className="min-h-screen bg-dark-900 text-white flex flex-col items-center justify-center p-6">
      <h1 className="text-2xl font-bold mb-2">Select Language</h1>
      <p className="text-dark-400 mb-8">Dil seçin / Выберите язык</p>

      <div className="w-full max-w-sm space-y-3">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleSelect(lang.code)}
            className="w-full flex items-center gap-4 bg-dark-800 hover:bg-dark-700 border border-dark-700 rounded-xl p-4 transition-colors"
          >
            <span className="text-2xl">{lang.flag}</span>
            <div className="text-left">
              <p className="font-medium">{lang.name}</p>
              <p className="text-sm text-dark-400">{lang.native}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
