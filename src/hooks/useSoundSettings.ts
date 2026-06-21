import { useEffect, useRef, useState } from "react";

export const SOUND_DURATION_OPTIONS = [5, 10, 15, 30] as const;
export type SoundDuration = (typeof SOUND_DURATION_OPTIONS)[number];

export function useSoundSettings(storagePrefix: string) {
  const [soundEnabled, setSoundEnabled] = useState(
    () => localStorage.getItem(`${storagePrefix}-sound`) !== "off",
  );
  const [soundDuration, setSoundDuration] = useState<SoundDuration>(() => {
    const saved = Number(localStorage.getItem(`${storagePrefix}-sound-duration`));
    return SOUND_DURATION_OPTIONS.includes(saved as SoundDuration)
      ? (saved as SoundDuration)
      : 5;
  });

  const soundEnabledRef = useRef(soundEnabled);
  const soundDurationRef = useRef(soundDuration);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
    localStorage.setItem(
      `${storagePrefix}-sound`,
      soundEnabled ? "on" : "off",
    );
  }, [soundEnabled, storagePrefix]);

  useEffect(() => {
    soundDurationRef.current = soundDuration;
    localStorage.setItem(
      `${storagePrefix}-sound-duration`,
      String(soundDuration),
    );
  }, [soundDuration, storagePrefix]);

  return {
    soundEnabled,
    setSoundEnabled,
    soundDuration,
    setSoundDuration,
    soundEnabledRef,
    soundDurationRef,
  };
}
