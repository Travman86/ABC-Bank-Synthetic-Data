import React, { useMemo, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  Building2, 
  LayoutDashboard, 
  FileSpreadsheet, 
  ArrowLeftRight, 
  Download,
  AlertTriangle
} from 'lucide-react';
import { useAppStore } from '../../store';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { generateCSV, generatePDF, downloadFile } from '../../lib/export';
import { useToast } from '../../hooks/use-toast';
import type { Dataset, ExportFormat, ExportRecord } from '../../store/types';

const NAV_ITEMS = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/generator', label: 'Generator', icon: FileSpreadsheet },
  { href: '/transactions', label: 'Ledger', icon: ArrowLeftRight },
  { href: '/exports', label: 'Exports', icon: Download },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { datasets, activeDatasetId, setActiveDataset, addExport } = useAppStore();
  const dataset = useMemo(() => datasets.find(item => item.id === activeDatasetId), [datasets, activeDatasetId]);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [startDate, setStartDate] = useState(dataset?.profile.dateRange.start ?? '');
  const [endDate, setEndDate] = useState(dataset?.profile.dateRange.end ?? '');
  const { toast } = useToast();

  const openDownload = () => {
    setStartDate(dataset?.profile.dateRange.start ?? '');
    setEndDate(dataset?.profile.dateRange.end ?? '');
    setDownloadOpen(true);
  };

  const handleStatementDownload = async () => {
    if (!dataset || !startDate || !endDate || startDate > endDate) return;
    const transactions = dataset.transactions.filter(transaction => {
      const date = transaction.date.slice(0, 10);
      return date >= startDate && date <= endDate;
    });

    if (transactions.length === 0) {
      toast({ title: 'No transactions found', description: 'Choose a date range containing account activity.', variant: 'destructive' });
      return;
    }

    const first = transactions[0];
    const openingBalance = first.balance - (first.type === 'credit' ? first.amount : -first.amount);
    const statement: Dataset = {
      ...dataset,
      transactions,
      openingBalance,
      closingBalance: transactions[transactions.length - 1].balance,
      profile: { ...dataset.profile, dateRange: { start: startDate, end: endDate } },
    };
    const safeBusinessName = dataset.profile.businessName.replace(/\s+/g, '_');
    const fileName = `ABC_Bank_${safeBusinessName}_${startDate}_to_${endDate}.${format}`;
    try {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (format === 'pdf' && isMobile) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/api/statements/pdf';
        form.target = '_blank';
        const payload = document.createElement('input');
        payload.type = 'hidden';
        payload.name = 'payload';
        payload.value = JSON.stringify({
          businessName: statement.profile.businessName,
          currency: statement.profile.currency,
          startDate,
          endDate,
          openingBalance: statement.openingBalance,
          closingBalance: statement.closingBalance,
          transactions: statement.transactions,
        });
        form.appendChild(payload);
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
      } else if (format === 'pdf') {
        await downloadFile(generatePDF(statement, 'variant1'), fileName, 'application/pdf');
      } else {
        await downloadFile(generateCSV(statement, 'variant1'), fileName, 'text/csv');
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      toast({ title: 'Download failed', description: 'The statement could not be prepared on this device.', variant: 'destructive' });
      return;
    }
    const record: ExportRecord = {
      id: crypto.randomUUID(),
      datasetId: dataset.id,
      format,
      variant: 'variant1',
      fileName,
      createdAt: new Date().toISOString(),
      rowCount: transactions.length,
    };
    addExport(record);
    setDownloadOpen(false);
    toast({ title: 'Statement downloaded', description: `${transactions.length} transactions exported as ${format.toUpperCase()}.` });
  };

  return (
    <div className="flex min-h-[100dvh] w-full bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-sidebar-border bg-sidebar text-sidebar-foreground flex flex-col hidden md:flex shrink-0">
        <div className="p-6 flex items-center gap-3 border-b border-sidebar-border/50">
          <div className="bg-primary/20 p-2 rounded-lg text-primary">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-tight">ABC Bank</h1>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">Synthetic Studio</p>
          </div>
        </div>

        <div className="p-4 border-b border-sidebar-border/50">
          <p className="text-xs font-semibold uppercase text-sidebar-foreground/50 mb-2">Active Dataset</p>
          {datasets.length > 0 ? (
            <Select 
              value={activeDatasetId || undefined} 
              onValueChange={setActiveDataset}
            >
              <SelectTrigger className="w-full bg-sidebar-accent border-sidebar-accent-border h-9 text-sm">
                <SelectValue placeholder="Select dataset" />
              </SelectTrigger>
              <SelectContent>
                {datasets.map(ds => (
                  <SelectItem key={ds.id} value={ds.id}>
                    {ds.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="text-xs text-sidebar-foreground/50 italic py-1">No datasets available</div>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = location === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="block">
                <div className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${active ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}`}>
                  <Icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border/50">
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-md p-3 flex gap-2 items-start">
            <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
            <p className="text-[10px] leading-tight text-orange-400">
              This environment generates FICTIONAL data for testing and demo purposes only. Do not use real customer identities.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-[100dvh] overflow-hidden">
        <header className="h-16 border-b bg-card/95 backdrop-blur flex items-center justify-between px-4 md:px-8 shrink-0">
          <div className="font-bold md:hidden">ABC Bank</div>
          <div className="hidden md:block text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Fictional business banking environment
          </div>
          <Dialog open={downloadOpen} onOpenChange={setDownloadOpen}>
            <DialogTrigger asChild>
              <Button onClick={openDownload} disabled={!dataset} className="gap-2 shadow-sm">
                <Download className="w-4 h-4" />
                Download bank statement
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Download bank statement</DialogTitle>
                <DialogDescription>
                  Choose a file format and statement period. The download will be clearly marked as fictional synthetic data.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-5 py-2">
                <div className="space-y-2">
                  <Label>File format</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" variant={format === 'pdf' ? 'default' : 'outline'} onClick={() => setFormat('pdf')}>PDF</Button>
                    <Button type="button" variant={format === 'csv' ? 'default' : 'outline'} onClick={() => setFormat('csv')}>CSV</Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="statement-start">From</Label>
                    <Input id="statement-start" type="date" value={startDate} onChange={event => setStartDate(event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="statement-end">To</Label>
                    <Input id="statement-end" type="date" value={endDate} onChange={event => setEndDate(event.target.value)} />
                  </div>
                </div>
                {startDate && endDate && startDate > endDate && (
                  <p className="text-sm text-destructive">The start date must be before the end date.</p>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDownloadOpen(false)}>Cancel</Button>
                <Button onClick={handleStatementDownload} disabled={!startDate || !endDate || startDate > endDate} className="gap-2">
                  <Download className="w-4 h-4" />
                  Download {format.toUpperCase()}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          <div className="max-w-6xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
