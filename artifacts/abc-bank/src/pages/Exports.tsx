import React, { useMemo, useState } from 'react';
import { useAppStore } from '../store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { generateCSV, generatePDF, downloadFile } from '../lib/export';
import { FileText, FileSpreadsheet, Download, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import type { ExportFormat, ExportVariant, ExportRecord } from '../store/types';

export function Exports() {
  const { datasets, activeDatasetId, exports, addExport } = useAppStore();
  const dataset = useMemo(() => datasets.find(d => d.id === activeDatasetId), [datasets, activeDatasetId]);
  const { toast } = useToast();
  
  const [isExporting, setIsExporting] = useState<string | null>(null);

  if (!dataset) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No active dataset. Please select or generate one.
      </div>
    );
  }

  const handleExport = async (format: ExportFormat, variant: ExportVariant) => {
    const exportId = `${format}-${variant}`;
    setIsExporting(exportId);
    
    try {
      // Small artificial delay for perceived work
      await new Promise(r => setTimeout(r, 600));

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const baseName = `ABC_Bank_${dataset.profile.businessName.replace(/\s+/g, '_')}_${timestamp}`;

      if (format === 'csv') {
        const content = generateCSV(dataset, variant);
        downloadFile(content, `${baseName}_${variant}.csv`, 'text/csv');
      } else {
        const content = generatePDF(dataset, variant);
        downloadFile(content, `${baseName}_${variant}.pdf`, 'application/pdf');
      }

      const newRecord: ExportRecord = {
        id: crypto.randomUUID(),
        datasetId: dataset.id,
        format,
        variant,
        fileName: `${baseName}_${variant}.${format}`,
        createdAt: new Date().toISOString(),
        rowCount: dataset.transactions.length,
      };

      addExport(newRecord);
      
      toast({
        title: 'Export Successful',
        description: `Your ${format.toUpperCase()} file has been downloaded.`,
      });

    } catch (error) {
      console.error(error);
      toast({
        title: 'Export Failed',
        description: 'An error occurred during file generation.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(null);
    }
  };

  const csvVariants: { id: ExportVariant; title: string; desc: string }[] = [
    { id: 'variant1', title: 'Standard Export', desc: 'Date, Description, Amount, Balance.' },
    { id: 'variant2', title: 'Detailed Feed', desc: 'Includes Posted Date, Category, Reference, and Type.' },
    { id: 'variant3', title: 'Accounting Format', desc: 'Strict signed amounts, Counterparty, Channel.' },
  ];

  const pdfVariants: { id: ExportVariant; title: string; desc: string }[] = [
    { id: 'variant1', title: 'Classic Statement', desc: 'Traditional bank statement look.' },
    { id: 'variant2', title: 'Modern Statement', desc: 'Clean, striped rows, colored headers.' },
    { id: 'variant3', title: 'Audit Report', desc: 'Dense tabular data with UUIDs.' },
  ];

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Export Studio</h1>
        <p className="text-muted-foreground">Download synthetic data variants for dataset <strong className="text-foreground">{dataset.name}</strong>.</p>
      </div>

      <div className="bg-orange-500/10 border border-orange-500/20 rounded-md p-4 flex gap-3 items-start">
        <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-orange-600 dark:text-orange-400">Fictional Data Warning</h4>
          <p className="text-sm text-orange-600/80 dark:text-orange-400/80 leading-relaxed">
            All exported files will contain prominent watermarks and markings indicating they are synthetic. 
            Do not remove these markings. This data is entirely fictional and does not represent real financial transactions.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* CSV Exports */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <div className="bg-primary/10 p-1.5 rounded">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">CSV Schemas</h3>
          </div>
          <div className="space-y-4">
            {csvVariants.map(v => (
              <Card key={`csv-${v.id}`} className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{v.title}</CardTitle>
                  <CardDescription>{v.desc}</CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button 
                    variant="secondary" 
                    className="w-full gap-2"
                    onClick={() => handleExport('csv', v.id)}
                    disabled={isExporting !== null}
                  >
                    {isExporting === `csv-${v.id}` ? (
                      <><Loader2 className="w-4 h-4 animate-spin"/> Generating...</>
                    ) : (
                      <><Download className="w-4 h-4"/> Download CSV</>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>

        {/* PDF Exports */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <div className="bg-rose-500/10 p-1.5 rounded">
              <FileText className="w-5 h-5 text-rose-500" />
            </div>
            <h3 className="text-xl font-semibold">PDF Templates</h3>
          </div>
          <div className="space-y-4">
            {pdfVariants.map(v => (
              <Card key={`pdf-${v.id}`} className="shadow-sm border-t-4 border-t-rose-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{v.title}</CardTitle>
                  <CardDescription>{v.desc}</CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    className="w-full gap-2 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 dark:hover:bg-rose-950/30"
                    onClick={() => handleExport('pdf', v.id)}
                    disabled={isExporting !== null}
                  >
                    {isExporting === `pdf-${v.id}` ? (
                      <><Loader2 className="w-4 h-4 animate-spin"/> Rendering...</>
                    ) : (
                      <><Download className="w-4 h-4"/> Generate PDF</>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
