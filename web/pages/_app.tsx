import type { AppProps } from 'next/app';
import AppThemeProvider from '../components/AppThemeProvider';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AppThemeProvider>
      <Component {...pageProps} />
    </AppThemeProvider>
  );
}
