import { type ReactNode, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from './components/error-boundary';
import { Toaster } from './components/ui/toaster';
import { TooltipProvider } from './components/ui/tooltip';
import NotFound from './pages/not-found';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

import { AppProvider, useAppStore } from './store';
import { Shell } from './components/layout/Shell';
import { generateDataset } from './lib/generator';

// Pages
import { Home } from './pages/Home';
import { Generator } from './pages/Generator';
import { Transactions } from './pages/Transactions';
import { Exports } from './pages/Exports';

const queryClient = new QueryClient();

function DataInitializer({ children }: { children: ReactNode }) {
  const { datasets, addDataset } = useAppStore();

  useEffect(() => {
    if (datasets.length === 0) {
      // Generate a demo dataset
      const demoProfile = {
        businessName: 'Acme SaaS Corp',
        industry: 'Software',
        description: 'B2B SaaS subscription business with high volume of small transactions.',
        country: 'US',
        currency: 'USD',
        monthlyRevenue: 150000,
        transactionVolume: 'high' as const,
        dateRange: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString(),
        }
      };
      const dataset = generateDataset(demoProfile, 'Demo SaaS Dataset');
      addDataset(dataset);
    }
  }, [datasets.length, addDataset]);

  return <>{children}</>;
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Shell>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/generator" component={Generator} />
          <Route path="/transactions" component={Transactions} />
          <Route path="/exports" component={Exports} />
          <Route component={NotFound} />
        </Switch>
      </Shell>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <DataInitializer>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </DataInitializer>
      </AppProvider>
    </QueryClientProvider>
  );
}

export default App;
