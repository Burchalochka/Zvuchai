let storage: { getString: (key: string) => string | undefined; set: (key: string, value: string) => void } | null = null;
try {
  const { MMKV } = require('react-native-mmkv');
  storage = new MMKV();
} catch {
  // Native module not ready or unavailable
}

export { storage };
