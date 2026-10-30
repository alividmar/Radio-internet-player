import { Capacitor, registerPlugin } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';

interface RadioNativePlugin {
  getIcy(options: { url: string }): Promise<{ title: string }>;
  getSystemVolume(): Promise<{ level: number }>;
  setSystemVolume(options: { level: number }): Promise<void>;
  startService(options: { station: string }): Promise<void>;
  stopService(): Promise<void>;
  addListener(
    eventName: 'volumeChanged',
    cb: (data: { level: number }) => void
  ): Promise<PluginListenerHandle>;
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

export async function nativeGetSystemVolume(): Promise<number | null> {
  if (!isNative) return null;
  try {
    return (await RadioNative.getSystemVolume()).level;
  } catch {
    return null;
  }
}

/** Sproži se, ko uporabnik spremeni glasnost s tipkami na telefonu */
export function onSystemVolumeChange(cb: (level: number) => void): () => void {
  if (!isNative) return () => {};
  let handle: PluginListenerHandle | null = null;
  let cancelled = false;
  RadioNative.addListener('volumeChanged', (d) => cb(d.level))
    .then((h) => {
      if (cancelled) h.remove();
      else handle = h;
    })
    .catch(() => {});
  return () => {
    cancelled = true;
    handle?.remove();
  };
}

export async function nativeStartService(station: string): Promise<void> {
  if (!isNative) return;
  try {
    await RadioNative.startService({ station });
  } catch (e) {
    console.warn('startService failed:', e);
  }
}

export async function nativeStopService(): Promise<void> {
  if (!isNative) return;
  try {
    await RadioNative.stopService();
  } catch {
    /* ignore */
  }
}
