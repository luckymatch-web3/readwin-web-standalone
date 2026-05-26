type PluginShape = Record<string, unknown>

export const Capacitor = {
  Plugins: {} as PluginShape,
  isNativePlatform: () => false,
  getPlatform: () => 'web',
}

export function registerPlugin<T extends object = PluginShape>(_name: string): T {
  return {} as T
}
