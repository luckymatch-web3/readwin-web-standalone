export const GoogleAuth = {
  initialize: () => {},
  signIn: async (): Promise<{ authentication?: { idToken?: string } }> => {
    throw new Error('Google Sign-In is not configured in the standalone web build.')
  },
}
