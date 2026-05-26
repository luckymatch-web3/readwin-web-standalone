type ListenerHandle = {
  remove: () => Promise<void>
}

export const App = {
  addListener: async (_eventName: string, _listener: (...args: any[]) => void): Promise<ListenerHandle> => ({
    remove: async () => {},
  }),
  exitApp: async () => {},
}
