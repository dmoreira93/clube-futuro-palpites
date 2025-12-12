import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.clubefuturo.app',
  appName: 'Clube Futuro Palpites',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      // Cole aqui o SEU "Client ID" do Google Cloud
      serverClientId: '708828307783-c9hlvi74c4tm5kn5g38gmi5gdp0ke388.apps.googleusercontent.com', 
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;