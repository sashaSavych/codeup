export const environment = {
  production: false,
  supabaseUrl: '',
  supabasePublishableKey: '',
  /** POST endpoint for AI chat; JSON body `{ messages: { role, content }[] }`, response `{ reply?: string }`. */
  chatAiEndpoint: '' as string | undefined,
};
