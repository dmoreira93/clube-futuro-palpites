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
      serverClientId: 'SEU_CLIENT_ID_DO_GOOGLE_CLOUD.apps.googleusercontent.com', 
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;