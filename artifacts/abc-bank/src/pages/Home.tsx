import React, { useMemo } from 'react';
import { useAppStore } from '../store';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowUpRight, ArrowDownRight, Wallet, Activity, ArrowRight, FileSpreadsheet } from 'lucide-react';
import { format } from 'date-fns';

export function Home() {
  const { datasets, activeDatasetId } = useAppStore();
  const dataset = useMemo(() => datasets.find(d => d.id === activeDatasetId), [datasets, activeDatasetId]);
  const { totalIn, totalOut } = useMemo(() => {
    let inAmt = 0;
    let outAmt = 0;
    dataset?.transactions.forEach(t => {
      if (t.type === 'credit') inAmt += t.amount;
      else outAmt += t.amount;
    });
    return { totalIn: inAmt, totalOut: outAmt };
  }, [dataset]);

  if (!dataset) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-6 text-center pt-20">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center">
          <FileSpreadsheet className="w-12 h-12 text-muted-foreground" />
        </div>
        <div className="space-y-2 max-w-md">
          <h2 className="text-2xl font-bold tracking-tight">Welcome to ABC Bank Studio</h2>
          <p className="text-muted-foreground">You don't have any active datasets yet. Create a business profile to generate synthetic banking data.</p>
        </div>
        <Link href="/generator">
          <Button size="lg" className="gap-2">
            Generate Dataset <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    );
  }

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: dataset.profile.currency }).format(val);

  const recentTxs = dataset.transactions.slice(-5).reverse();

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground">Displaying data for <strong className="text-foreground">{dataset.name}</strong> ({dataset.profile.businessName})</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{formatCurrency(dataset.closingBalance)}</div>
            <p className="text-xs text-muted-foreground mt-1">Starting balance: {formatCurrency(dataset.openingBalance)}</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Inflow</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalIn)}</div>
            <p className="text-xs text-muted-foreground mt-1">Over {dataset.transactions.filter(t => t.type === 'credit').length} credits</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Outflow</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-rose-600 dark:text-rose-400">{formatCurrency(totalOut)}</div>
            <p className="text-xs text-muted-foreground mt-1">Over {dataset.transactions.filter(t => t.type === 'debit').length} debits</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-sm col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest activity in this dataset.</CardDescription>
            </div>
            <Link href="/transactions">
              <Button variant="outline" size="sm" className="gap-2">View All <ArrowRight className="w-3 h-3"/></Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTxs.map(tx => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-md hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full flex shrink-0 ${tx.type === 'credit' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30'}`}>
                      {tx.type === 'credit' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-none">{tx.merchant}</p>
                      <p className="text-xs text-muted-foreground mt-1">{format(new Date(tx.date), 'MMM dd, yyyy')} &middot; {tx.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-semibold ${tx.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 font-mono">
                      {formatCurrency(tx.balance)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle>Business Profile</CardTitle>
            <CardDescription>Current dataset parameters</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4 text-sm">
              <div className="flex justify-between border-b pb-2">
                <dt className="text-muted-foreground">Entity Name</dt>
                <dd className="font-medium text-right">{dataset.profile.businessName}</dd>
              </div>
              <div className="flex justify-between border-b pb-2">
                <dt className="text-muted-foreground">Industry</dt>
                <dd className="font-medium text-right">{dataset.profile.industry}</dd>
              </div>
              <div className="flex justify-between border-b pb-2">
                <dt className="text-muted-foreground">Mo. Revenue</dt>
                <dd className="font-medium text-right">{formatCurrency(dataset.profile.monthlyRevenue)}</dd>
              </div>
              <div className="flex justify-between border-b pb-2">
                <dt className="text-muted-foreground">Volume</dt>
                <dd className="font-medium text-right capitalize">{dataset.profile.transactionVolume}</dd>
              </div>
              <div className="flex justify-between border-b pb-2">
                <dt className="text-muted-foreground">Date Range</dt>
                <dd className="font-medium text-right">
                  {format(new Date(dataset.profile.dateRange.start), 'MMM yyyy')} - {format(new Date(dataset.profile.dateRange.end), 'MMM yyyy')}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
