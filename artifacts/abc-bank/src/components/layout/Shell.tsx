import React from 'react';
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

const NAV_ITEMS = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/generator', label: 'Generator', icon: FileSpreadsheet },
  { href: '/transactions', label: 'Ledger', icon: ArrowLeftRight },
  { href: '/exports', label: 'Exports', icon: Download },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { datasets, activeDatasetId, setActiveDataset } = useAppStore();

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
        {/* Mobile Header */}
        <header className="md:hidden h-14 border-b bg-card flex items-center px-4 shrink-0">
          <div className="font-bold">ABC Bank</div>
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
