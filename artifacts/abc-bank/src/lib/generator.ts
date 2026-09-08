import { format, addDays, isAfter, isBefore, differenceInDays } from 'date-fns';
import type { BusinessProfile, Transaction, Dataset, TransactionCategory } from '../store/types';

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

const CATEGORIES: TransactionCategory[] = ['revenue', 'payroll', 'software', 'utilities', 'rent', 'marketing', 'travel', 'equipment', 'other'];

const MERCHANTS = {
  software: ['AWS', 'Google Cloud', 'GitHub', 'Stripe', 'Slack', 'Notion', 'Figma', 'Linear', 'Vercel'],
  utilities: ['ConEdison', 'PG&E', 'Comcast Business', 'Verizon', 'AT&T'],
  rent: ['WeWork', 'Regus', 'HQ Global Workplaces', 'CBRE Property'],
  marketing: ['Google Ads', 'Facebook Ads', 'LinkedIn Ads', 'Mailchimp', 'HubSpot'],
  travel: ['Delta Air Lines', 'United Airlines', 'Uber', 'Lyft', 'Marriott', 'Hilton'],
  equipment: ['Apple Store', 'Dell', 'Best Buy', 'CDW'],
  other: ['Staples', 'Office Depot', 'USPS', 'FedEx', 'UPS', 'Grubhub', 'Sweetgreen']
};

export function generateDataset(profile: BusinessProfile, name: string): Dataset {
  const transactions: Transaction[] = [];
  const startDate = new Date(profile.dateRange.start);
  const endDate = new Date(profile.dateRange.end);
  const totalDays = differenceInDays(endDate, startDate) || 1;
  const months = totalDays / 30;

  let volMultiplier = 1;
  if (profile.transactionVolume === 'low') volMultiplier = 0.5;
  if (profile.transactionVolume === 'high') volMultiplier = 2;

  // Monthly breakdown
  const txPerMonth = 30 * volMultiplier;
  const totalTransactions = Math.floor(txPerMonth * months);

  const revenueTxCount = Math.floor(totalTransactions * 0.4);
  const expenseTxCount = totalTransactions - revenueTxCount;

  const totalExpectedRevenue = profile.monthlyRevenue * months;
  let accumulatedRevenue = 0;

  let currentDate = new Date(startDate);
  
  // Generating Revenue Transactions
  for (let i = 0; i < revenueTxCount; i++) {
    const txDate = addDays(startDate, randomInt(0, totalDays));
    const isLast = i === revenueTxCount - 1;
    const avgAmount = totalExpectedRevenue / revenueTxCount;
    const amount = isLast ? Math.max(10, totalExpectedRevenue - accumulatedRevenue) : Math.max(10, avgAmount * randomFloat(0.5, 1.5));
    accumulatedRevenue += amount;

    transactions.push({
      id: crypto.randomUUID(),
      date: txDate.toISOString(),
      postedDate: addDays(txDate, randomInt(0, 2)).toISOString(),
      description: `Invoice ${randomInt(1000, 9999)} - ${profile.industry} Services`,
      merchant: `Client ${randomInt(100, 999)}`,
      category: 'revenue',
      type: 'credit',
      amount: parseFloat(amount.toFixed(2)),
      balance: 0,
      status: 'completed',
      reference: `REV-${randomInt(100000, 999999)}`,
      channel: randomChoice(['ach', 'wire', 'card'])
    });
  }

  // Generate Expense Transactions
  const targetExpenseRatio = randomFloat(0.6, 0.85); // Expenses are 60-85% of revenue
  const totalExpectedExpense = totalExpectedRevenue * targetExpenseRatio;
  let accumulatedExpense = 0;

  for (let i = 0; i < expenseTxCount; i++) {
    const txDate = addDays(startDate, randomInt(0, totalDays));
    const isLast = i === expenseTxCount - 1;
    const avgAmount = totalExpectedExpense / expenseTxCount;
    const amount = isLast ? Math.max(5, totalExpectedExpense - accumulatedExpense) : Math.max(5, avgAmount * randomFloat(0.3, 2.0));
    accumulatedExpense += amount;

    const category = randomChoice(CATEGORIES.filter(c => c !== 'revenue'));
    const merchantList = MERCHANTS[category as keyof typeof MERCHANTS] || MERCHANTS.other;
    const merchant = randomChoice(merchantList);

    transactions.push({
      id: crypto.randomUUID(),
      date: txDate.toISOString(),
      postedDate: addDays(txDate, randomInt(0, 2)).toISOString(),
      description: `${category.charAt(0).toUpperCase() + category.slice(1)} Expense`,
      merchant: merchant,
      category: category,
      type: 'debit',
      amount: parseFloat(amount.toFixed(2)),
      balance: 0,
      status: 'completed',
      reference: `EXP-${randomInt(100000, 999999)}`,
      channel: randomChoice(['ach', 'card', 'internal'])
    });
  }

  // Sort by date ascending
  transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Running balance
  const initialBalance = profile.monthlyRevenue * 1.5; // Starts with 1.5x monthly revenue
  let runningBalance = initialBalance;
  
  for (const tx of transactions) {
    if (tx.type === 'credit') {
      runningBalance += tx.amount;
    } else {
      runningBalance -= tx.amount;
    }
    tx.balance = parseFloat(runningBalance.toFixed(2));
  }

  return {
    id: crypto.randomUUID(),
    name,
    profile,
    transactions,
    createdAt: new Date().toISOString(),
    openingBalance: parseFloat(initialBalance.toFixed(2)),
    closingBalance: parseFloat(runningBalance.toFixed(2)),
  };
}
