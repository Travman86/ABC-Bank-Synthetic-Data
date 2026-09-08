import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Search, Filter, Download, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Link } from 'wouter';

export function Transactions() {
  const { datasets, activeDatasetId } = useAppStore();
  const dataset = useMemo(() => datasets.find(d => d.id === activeDatasetId), [datasets, activeDatasetId]);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filteredTransactions = useMemo(() => {
    if (!dataset) return [];
    let filtered = dataset.transactions;

    if (search.trim()) {
      const s = search.toLowerCase();
      filtered = filtered.filter(t => 
        t.merchant.toLowerCase().includes(s) || 
        t.description.toLowerCase().includes(s) ||
        t.reference.toLowerCase().includes(s)
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(t => t.type === typeFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(t => t.category === categoryFilter);
    }

    // Sort descending by date
    return [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [dataset, search, typeFilter, categoryFilter]);

  if (!dataset) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No active dataset. Please select or generate one.
      </div>
    );
  }

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: dataset.profile.currency }).format(val);

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ledger</h1>
          <p className="text-muted-foreground">Detailed transaction history for {dataset.name}.</p>
        </div>
        <Link href="/exports">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" /> Export Data
          </Button>
        </Link>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="p-4 border-b">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search merchant, description, ref..."
                className="pl-9 bg-background"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px] bg-background">
                  <Filter className="w-4 h-4 mr-2 text-muted-foreground"/>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="credit">Credit (In)</SelectItem>
                  <SelectItem value="debit">Debit (Out)</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[160px] bg-background">
                  <Filter className="w-4 h-4 mr-2 text-muted-foreground"/>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="revenue">Revenue</SelectItem>
                  <SelectItem value="software">Software</SelectItem>
                  <SelectItem value="payroll">Payroll</SelectItem>
                  <SelectItem value="rent">Rent</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="utilities">Utilities</SelectItem>
                  <SelectItem value="travel">Travel</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <div className="relative w-full overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-[120px]">Date</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No transactions found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map(tx => (
                  <TableRow key={tx.id} className="cursor-default">
                    <TableCell className="font-mono text-xs whitespace-nowrap">
                      {format(new Date(tx.date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm leading-tight">{tx.merchant}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{tx.description}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize text-[10px] font-medium tracking-wide">
                        {tx.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-[10px] text-muted-foreground">
                      {tx.reference}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className={`flex items-center justify-end gap-1.5 font-semibold text-sm ${tx.type === 'credit' ? 'text-emerald-600' : 'text-foreground'}`}>
                        {tx.type === 'credit' ? <ArrowDownRight className="w-3 h-3 text-emerald-500" /> : <ArrowUpRight className="w-3 h-3 text-muted-foreground" />}
                        {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-muted-foreground">
                      {formatCurrency(tx.balance)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <div className="p-4 border-t text-xs text-muted-foreground text-center bg-muted/20">
          Showing {filteredTransactions.length} of {dataset.transactions.length} transactions
        </div>
      </Card>
    </div>
  );
}
