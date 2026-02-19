import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.pos.mobile',
    appName: 'pos-mobile-capacitor',
    webDir: 'dist',
    server: {
        androidScheme: 'https'
    }
};

export default config;
