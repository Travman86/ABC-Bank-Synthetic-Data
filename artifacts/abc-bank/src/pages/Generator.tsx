import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, subMonths } from 'date-fns';
import { useAppStore } from '../store';
import { generateDataset } from '../lib/generator';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../components/ui/form';
import { Loader2, Plus } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const generatorSchema = z.object({
  datasetName: z.string().min(2, "Dataset name must be at least 2 characters"),
  businessName: z.string().min(2, "Business name is required"),
  industry: z.string().min(2, "Industry is required"),
  monthlyRevenue: z.coerce.number().min(1000, "Revenue should be realistic"),
  transactionVolume: z.enum(['low', 'medium', 'high']),
  durationMonths: z.coerce.number().min(1).max(24),
});

type GeneratorFormValues = z.infer<typeof generatorSchema>;

export function Generator() {
  const [, setLocation] = useLocation();
  const { addDataset } = useAppStore();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const form = useForm<GeneratorFormValues>({
    resolver: zodResolver(generatorSchema),
    defaultValues: {
      datasetName: 'New Test Dataset',
      businessName: 'Acme Corp',
      industry: 'Software',
      monthlyRevenue: 50000,
      transactionVolume: 'medium',
      durationMonths: 3,
    },
  });

  const onSubmit = async (data: GeneratorFormValues) => {
    setIsGenerating(true);
    
    try {
      // Simulate slight delay for "generation"
      await new Promise(r => setTimeout(r, 800));

      const endDate = new Date();
      const startDate = subMonths(endDate, data.durationMonths);

      const profile = {
        businessName: data.businessName,
        industry: data.industry,
        description: `A ${data.industry} company generating ${data.monthlyRevenue}/mo`,
        country: 'US',
        currency: 'USD',
        monthlyRevenue: data.monthlyRevenue,
        transactionVolume: data.transactionVolume,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        }
      };

      const dataset = generateDataset(profile, data.datasetName);
      addDataset(dataset);
      
      toast({
        title: "Dataset generated",
        description: `Successfully generated ${dataset.transactions.length} synthetic transactions.`,
      });
      
      setLocation('/');
    } catch (error) {
      toast({
        title: "Generation failed",
        description: "An error occurred while generating data.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dataset Generator</h1>
        <p className="text-muted-foreground">Configure business parameters to generate realistic synthetic banking data.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Business Profile</CardTitle>
          <CardDescription>
            These parameters dictate the volume, amounts, and merchant categories of the generated transactions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="datasetName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dataset Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Q3 Tech Startup Demo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="businessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Entity Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="industry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Industry</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="monthlyRevenue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expected Monthly Revenue ($)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="transactionVolume"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Transaction Volume</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select volume" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low (B2B, fewer invoices)</SelectItem>
                            <SelectItem value="medium">Medium (Standard)</SelectItem>
                            <SelectItem value="high">High (B2C, high volume)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="durationMonths"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Duration (Months)</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" max="24" {...field} />
                      </FormControl>
                      <FormDescription>How many months of history to generate.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t">
                <Button type="button" variant="outline" onClick={() => setLocation('/')}>Cancel</Button>
                <Button type="submit" disabled={isGenerating}>
                  {isGenerating ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                  ) : (
                    <><Plus className="w-4 h-4 mr-2" /> Generate Dataset</>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
