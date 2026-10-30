import { Capacitor, registerPlugin } from '@capacitor/core';

interface RadioNativePlugin {
  getIcy(options: { url: string }): Promise<{ title: string }>;
  setSystemVolume(options: { level: number }): Promise<void>;
}

/** true samo v Android aplikaciji (APK), ne v brskalniku */
export const isNative = Capacitor.isNativePlatform();

const RadioNative = registerPlugin<RadioNativePlugin>('RadioNative');

export async function nativeGetIcyTitle(url: string): Promise<string> {
  if (!isNative) return '';
  try {
    const res = await RadioNative.getIcy({ url });
    return (res.title || '').trim();
  } catch {
    return '';
  }
}

export async function nativeSetSystemVolume(level: number): Promise<void> {
  if (!isNative) return;
  try {
    await RadioNative.setSystemVolume({ level });
  } catch (e) {
    console.warn('setSystemVolume failed:', e);
  }
}
