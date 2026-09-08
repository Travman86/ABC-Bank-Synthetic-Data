export type BusinessProfile = {
  businessName: string;
  industry: string;
  description: string;
  country: string;
  currency: string;
  monthlyRevenue: number;
  transactionVolume: 'low' | 'medium' | 'high';
  dateRange: {
    start: string;
    end: string;
  };
};

export type TransactionStatus = 'completed' | 'pending' | 'failed';
export type TransactionType = 'credit' | 'debit';
export type TransactionCategory = 
  | 'revenue' | 'payroll' | 'software' | 'utilities' 
  | 'rent' | 'marketing' | 'travel' | 'equipment' | 'other';

export type Transaction = {
  id: string;
  date: string; // ISO format
  postedDate: string; // ISO format
  description: string;
  merchant: string;
  category: TransactionCategory;
  type: TransactionType;
  amount: number;
  balance: number;
  status: TransactionStatus;
  reference: string;
  channel: 'ach' | 'wire' | 'card' | 'check' | 'internal';
};

export type Dataset = {
  id: string;
  name: string;
  profile: BusinessProfile;
  transactions: Transaction[];
  createdAt: string; // ISO format
  openingBalance: number;
  closingBalance: number;
};

export type ExportFormat = 'pdf' | 'csv';
export type ExportVariant = 'variant1' | 'variant2' | 'variant3';

export type ExportRecord = {
  id: string;
  datasetId: string;
  format: ExportFormat;
  variant: ExportVariant;
  fileName: string;
  createdAt: string;
  rowCount: number;
};
