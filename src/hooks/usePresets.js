import { useState, useEffect } from 'react';

const PRESETS_STORAGE_KEY = 'lt_custom_presets';

export function usePresets() {
  const [presets, setPresets] = useState([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PRESETS_STORAGE_KEY);
      if (stored) {
        setPresets(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load presets:', e);
    }
  }, []);

  // Save to localStorage whenever presets change
  const savePresets = (newPresets) => {
    setPresets(newPresets);
    try {
      localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(newPresets));
    } catch (e) {
      console.error('Failed to save presets:', e);
    }
  };

  const addPreset = (preset) => {
    // Generate a simple unique ID
    const newPreset = { ...preset, id: Date.now().toString() };
    savePresets([...presets, newPreset]);
  };

  const removePreset = (id) => {
    savePresets(presets.filter(p => p.id !== id));
  };

  return {
    presets,
    addPreset,
    removePreset
  };
}
