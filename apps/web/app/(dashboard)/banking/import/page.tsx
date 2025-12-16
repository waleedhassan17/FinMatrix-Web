'use client';

// Bank Statement Import Page
// Import CSV/OFX statements with column mapping and preview

import * as React from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  Upload,
  FileSpreadsheet,
  Check,
  X,
  AlertCircle,
  ChevronRight,
  Eye,
  Zap,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { cn } from '@finmatrix/ui/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@finmatrix/ui/components/card';
import { Button } from '@finmatrix/ui/components/button';
import { Badge } from '@finmatrix/ui/components/badge';
import { Skeleton } from '@finmatrix/ui/components/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@finmatrix/ui/components/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@finmatrix/ui/components/select';
import { Label } from '@finmatrix/ui/components/label';
import { Alert, AlertDescription } from '@finmatrix/ui/components/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@finmatrix/ui/components/dialog';
import {
  fetchActiveBankAccounts,
  fetchImportBatches,
  fetchImportedTransactions,
  createImportBatch,
  runAutoMatch,
  processImportedTransaction,
} from '@/actions/banking';

type Step = 'upload' | 'mapping' | 'preview' | 'processing' | 'complete';

interface ColumnMapping {
  date: string;
  amount: string;
  description: string;
  reference: string;
  checkNumber: string;
}

interface ParsedTransaction {
  date: string;
  amount: number;
  description: string;
  reference?: string;
  checkNumber?: string;
  rawData: Record<string, string>;
}

interface ImportedTransaction {
  id: string;
  transactionDate: string;
  amount: string;
  description?: string;
  referenceNumber?: string;
  status: string;
  matchConfidence?: string;
  suggestedMatchId?: string;
}

interface BankAccount {
  id: string;
  accountName: string;
  bankName?: string;
}

export default function ImportPage() {
  const [step, setStep] = React.useState<Step>('upload');
  const [accounts, setAccounts] = React.useState<BankAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = React.useState<string>('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
  // File parsing state
  const [fileName, setFileName] = React.useState<string>('');
  const [headers, setHeaders] = React.useState<string[]>([]);
  const [rawData, setRawData] = React.useState<Record<string, string>[]>([]);
  const [columnMapping, setColumnMapping] = React.useState<ColumnMapping>({
    date: '',
    amount: '',
    description: '',
    reference: '',
    checkNumber: '',
  });
  
  // Preview & processing state
  const [parsedTransactions, setParsedTransactions] = React.useState<ParsedTransaction[]>([]);
  const [batchId, setBatchId] = React.useState<string | null>(null);
  const [importedTxs, setImportedTxs] = React.useState<ImportedTransaction[]>([]);
  const [autoMatchSummary, setAutoMatchSummary] = React.useState<{
    highConfidence: number;
    mediumConfidence: number;
    lowConfidence: number;
    noMatch: number;
  } | null>(null);

  // Load accounts on mount
  React.useEffect(() => {
    async function loadAccounts() {
      const result = await fetchActiveBankAccounts();
      if (result.success && result.data) {
        setAccounts(result.data as BankAccount[]);
      }
    }
    loadAccounts();
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      parseCSV(text);
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsText(file);
  };

  const parseCSV = (text: string) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) {
      setError('File must have at least a header row and one data row');
      return;
    }

    // Parse header
    const headerLine = lines[0];
    const parsedHeaders = parseCSVLine(headerLine);
    setHeaders(parsedHeaders);

    // Parse data rows
    const data: Record<string, string>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length === parsedHeaders.length) {
        const row: Record<string, string> = {};
        parsedHeaders.forEach((header, index) => {
          row[header] = values[index];
        });
        data.push(row);
      }
    }

    setRawData(data);

    // Auto-detect columns
    const mapping = autoDetectColumns(parsedHeaders);
    setColumnMapping(mapping);

    setStep('mapping');
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const autoDetectColumns = (headers: string[]): ColumnMapping => {
    const mapping: ColumnMapping = {
      date: '',
      amount: '',
      description: '',
      reference: '',
      checkNumber: '',
    };

    const datePatterns = ['date', 'trans_date', 'transaction date', 'posted', 'posting date'];
    const amountPatterns = ['amount', 'sum', 'value', 'debit', 'credit'];
    const descPatterns = ['description', 'desc', 'memo', 'narrative', 'details', 'particulars'];
    const refPatterns = ['reference', 'ref', 'ref_no', 'reference number', 'transaction id'];
    const checkPatterns = ['check', 'cheque', 'check_no', 'cheque_no', 'check number'];

    headers.forEach((header) => {
      const lowerHeader = header.toLowerCase();
      if (!mapping.date && datePatterns.some((p) => lowerHeader.includes(p))) {
        mapping.date = header;
      }
      if (!mapping.amount && amountPatterns.some((p) => lowerHeader.includes(p))) {
        mapping.amount = header;
      }
      if (!mapping.description && descPatterns.some((p) => lowerHeader.includes(p))) {
        mapping.description = header;
      }
      if (!mapping.reference && refPatterns.some((p) => lowerHeader.includes(p))) {
        mapping.reference = header;
      }
      if (!mapping.checkNumber && checkPatterns.some((p) => lowerHeader.includes(p))) {
        mapping.checkNumber = header;
      }
    });

    return mapping;
  };

  const handleMappingComplete = () => {
    if (!columnMapping.date || !columnMapping.amount) {
      setError('Date and Amount columns are required');
      return;
    }

    // Parse transactions using mapping
    const transactions: ParsedTransaction[] = rawData.map((row) => {
      const dateStr = row[columnMapping.date];
      const amountStr = row[columnMapping.amount]?.replace(/[^0-9.-]/g, '');
      
      return {
        date: parseDate(dateStr),
        amount: parseFloat(amountStr) || 0,
        description: columnMapping.description ? row[columnMapping.description] : '',
        reference: columnMapping.reference ? row[columnMapping.reference] : undefined,
        checkNumber: columnMapping.checkNumber ? row[columnMapping.checkNumber] : undefined,
        rawData: row,
      };
    }).filter((tx) => tx.date && !isNaN(tx.amount));

    setParsedTransactions(transactions);
    setStep('preview');
  };

  const parseDate = (dateStr: string): string => {
    if (!dateStr) return '';
    
    // Try various date formats
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }

    // Try DD/MM/YYYY format
    const parts = dateStr.split(/[\/\-]/);
    if (parts.length === 3) {
      const [day, month, year] = parts.map((p) => parseInt(p));
      if (day && month && year) {
        const d = new Date(year < 100 ? 2000 + year : year, month - 1, day);
        if (!isNaN(d.getTime())) {
          return d.toISOString().split('T')[0];
        }
      }
    }

    return '';
  };

  const handleImport = async () => {
    if (!selectedAccount) {
      setError('Please select a bank account');
      return;
    }

    setLoading(true);
    setError(null);
    setStep('processing');

    try {
      const result = await createImportBatch(
        selectedAccount,
        fileName,
        'csv',
        parsedTransactions.map((tx) => ({
          transactionDate: tx.date,
          amount: tx.amount,
          description: tx.description,
          referenceNumber: tx.reference,
          checkNumber: tx.checkNumber,
          rawData: tx.rawData,
        })),
        columnMapping as any
      );

      if (result.success && result.data) {
        setBatchId(result.data.batchId);

        // Run auto-matching
        const matchResult = await runAutoMatch(result.data.batchId);
        if (matchResult.success && matchResult.data) {
          setAutoMatchSummary({
            highConfidence: matchResult.data.highConfidenceMatches,
            mediumConfidence: matchResult.data.mediumConfidenceMatches,
            lowConfidence: matchResult.data.lowConfidenceMatches,
            noMatch: matchResult.data.noMatches,
          });
        }

        // Load imported transactions
        const txResult = await fetchImportedTransactions(result.data.batchId);
        if (txResult.success && txResult.data) {
          setImportedTxs(txResult.data as ImportedTransaction[]);
        }

        setStep('complete');
      } else {
        setError(result.error || 'Failed to import');
        setStep('preview');
      }
    } catch (err) {
      console.error('Import error:', err);
      setError('An error occurred during import');
      setStep('preview');
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionAction = async (txId: string, action: 'match' | 'create' | 'ignore') => {
    const result = await processImportedTransaction(txId, action);
    if (result.success && batchId) {
      // Refresh transactions
      const txResult = await fetchImportedTransactions(batchId);
      if (txResult.success && txResult.data) {
        setImportedTxs(txResult.data as ImportedTransaction[]);
      }
    }
  };

  const getStatusBadge = (status: string, confidence?: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case 'matched':
        return (
          <Badge className="bg-green-100 text-green-700 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Matched
          </Badge>
        );
      case 'created':
        return (
          <Badge className="bg-blue-100 text-blue-700 flex items-center gap-1">
            <Check className="h-3 w-3" />
            Created
          </Badge>
        );
      case 'ignored':
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Ignored
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getConfidenceBadge = (confidence?: string) => {
    if (!confidence) return null;
    switch (confidence) {
      case 'high':
        return <Badge className="bg-green-100 text-green-700">High Match</Badge>;
      case 'medium':
        return <Badge className="bg-amber-100 text-amber-700">Medium Match</Badge>;
      case 'low':
        return <Badge className="bg-orange-100 text-orange-700">Low Match</Badge>;
      default:
        return null;
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 py-4 border-b">
      {(['upload', 'mapping', 'preview', 'processing', 'complete'] as Step[]).map((s, i) => (
        <React.Fragment key={s}>
          <div
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium',
              step === s && 'bg-blue-100 text-blue-700',
              ['upload', 'mapping', 'preview', 'processing', 'complete'].indexOf(step) > i &&
                'text-green-600'
            )}
          >
            {['upload', 'mapping', 'preview', 'processing', 'complete'].indexOf(step) > i ? (
              <Check className="h-4 w-4" />
            ) : (
              <span className="w-5 h-5 flex items-center justify-center text-xs rounded-full bg-slate-200">
                {i + 1}
              </span>
            )}
            <span className="capitalize">{s}</span>
          </div>
          {i < 4 && <ChevronRight className="h-4 w-4 text-slate-300" />}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Page Header */}
      <div className="p-6 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/banking">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Banking
            </Link>
          </Button>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Import Bank Statement</h1>
        <p className="mt-1 text-sm text-slate-500">
          Import transactions from CSV or OFX files and match them to your records
        </p>
      </div>

      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Step: Upload */}
          {step === 'upload' && (
            <Card>
              <CardHeader>
                <CardTitle>Upload Statement File</CardTitle>
                <CardDescription>
                  Select a CSV or OFX file exported from your bank
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  <div className="grid gap-2">
                    <Label>Bank Account *</Label>
                    <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((acc) => (
                          <SelectItem key={acc.id} value={acc.id}>
                            {acc.accountName}
                            {acc.bankName && ` (${acc.bankName})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div
                    className={cn(
                      'border-2 border-dashed rounded-lg p-12 text-center transition-colors',
                      'hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer'
                    )}
                  >
                    <input
                      type="file"
                      accept=".csv,.ofx"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-lg font-medium text-slate-900">
                        Drop your file here or click to browse
                      </p>
                      <p className="text-sm text-slate-500 mt-1">Supports CSV and OFX formats</p>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step: Mapping */}
          {step === 'mapping' && (
            <Card>
              <CardHeader>
                <CardTitle>Map Columns</CardTitle>
                <CardDescription>
                  Match the columns in your file to the required fields. Found {rawData.length} rows.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Date Column *</Label>
                      <Select
                        value={columnMapping.date}
                        onValueChange={(v) => setColumnMapping({ ...columnMapping, date: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          {headers.map((h) => (
                            <SelectItem key={h} value={h}>
                              {h}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Amount Column *</Label>
                      <Select
                        value={columnMapping.amount}
                        onValueChange={(v) => setColumnMapping({ ...columnMapping, amount: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          {headers.map((h) => (
                            <SelectItem key={h} value={h}>
                              {h}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label>Description Column</Label>
                      <Select
                        value={columnMapping.description}
                        onValueChange={(v) => setColumnMapping({ ...columnMapping, description: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {headers.map((h) => (
                            <SelectItem key={h} value={h}>
                              {h}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Reference Column</Label>
                      <Select
                        value={columnMapping.reference}
                        onValueChange={(v) => setColumnMapping({ ...columnMapping, reference: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {headers.map((h) => (
                            <SelectItem key={h} value={h}>
                              {h}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Check # Column</Label>
                      <Select
                        value={columnMapping.checkNumber}
                        onValueChange={(v) => setColumnMapping({ ...columnMapping, checkNumber: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {headers.map((h) => (
                            <SelectItem key={h} value={h}>
                              {h}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Preview */}
                  <div>
                    <Label className="mb-2 block">Preview (first 3 rows)</Label>
                    <div className="border rounded-lg overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {headers.map((h) => (
                              <TableHead key={h} className="text-xs">
                                {h}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rawData.slice(0, 3).map((row, i) => (
                            <TableRow key={i}>
                              {headers.map((h) => (
                                <TableCell key={h} className="text-xs">
                                  {row[h]}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setStep('upload')}>
                      Back
                    </Button>
                    <Button onClick={handleMappingComplete}>Continue</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step: Preview */}
          {step === 'preview' && (
            <Card>
              <CardHeader>
                <CardTitle>Review Transactions</CardTitle>
                <CardDescription>
                  {parsedTransactions.length} transactions will be imported
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-x-auto max-h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedTransactions.map((tx, i) => (
                        <TableRow key={i}>
                          <TableCell>{tx.date}</TableCell>
                          <TableCell>{tx.description || '—'}</TableCell>
                          <TableCell>{tx.reference || tx.checkNumber || '—'}</TableCell>
                          <TableCell
                            className={cn(
                              'text-right font-mono',
                              tx.amount < 0 ? 'text-red-600' : 'text-green-600'
                            )}
                          >
                            {tx.amount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={() => setStep('mapping')}>
                    Back
                  </Button>
                  <Button onClick={handleImport} disabled={loading}>
                    {loading ? 'Importing...' : 'Import & Match'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step: Processing */}
          {step === 'processing' && (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900">Processing Transactions</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Importing and running auto-matching algorithm...
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step: Complete */}
          {step === 'complete' && (
            <div className="space-y-6">
              {/* Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Import Complete
                  </CardTitle>
                  <CardDescription>
                    {parsedTransactions.length} transactions imported successfully
                  </CardDescription>
                </CardHeader>
                {autoMatchSummary && (
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {autoMatchSummary.highConfidence}
                        </div>
                        <div className="text-sm text-green-700">High Confidence</div>
                      </div>
                      <div className="text-center p-4 bg-amber-50 rounded-lg">
                        <div className="text-2xl font-bold text-amber-600">
                          {autoMatchSummary.mediumConfidence}
                        </div>
                        <div className="text-sm text-amber-700">Medium Confidence</div>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">
                          {autoMatchSummary.lowConfidence}
                        </div>
                        <div className="text-sm text-orange-700">Low Confidence</div>
                      </div>
                      <div className="text-center p-4 bg-slate-50 rounded-lg">
                        <div className="text-2xl font-bold text-slate-600">
                          {autoMatchSummary.noMatch}
                        </div>
                        <div className="text-sm text-slate-700">No Match</div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Transaction List */}
              <Card>
                <CardHeader>
                  <CardTitle>Imported Transactions</CardTitle>
                  <CardDescription>Review and process each transaction</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>Match</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {importedTxs.map((tx) => (
                          <TableRow key={tx.id}>
                            <TableCell>{new Date(tx.transactionDate).toLocaleDateString()}</TableCell>
                            <TableCell>{tx.description || tx.referenceNumber || '—'}</TableCell>
                            <TableCell
                              className={cn(
                                'text-right font-mono',
                                parseFloat(tx.amount) < 0 ? 'text-red-600' : 'text-green-600'
                              )}
                            >
                              {parseFloat(tx.amount).toLocaleString('en-PK', {
                                minimumFractionDigits: 2,
                              })}
                            </TableCell>
                            <TableCell>{getConfidenceBadge(tx.matchConfidence)}</TableCell>
                            <TableCell>{getStatusBadge(tx.status, tx.matchConfidence)}</TableCell>
                            <TableCell>
                              {tx.status === 'pending' && (
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleTransactionAction(tx.id, 'create')}
                                  >
                                    Create
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleTransactionAction(tx.id, 'ignore')}
                                  >
                                    Ignore
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="outline" asChild>
                  <Link href="/banking">Back to Banking</Link>
                </Button>
                <Button
                  onClick={() => {
                    setStep('upload');
                    setFileName('');
                    setHeaders([]);
                    setRawData([]);
                    setParsedTransactions([]);
                    setImportedTxs([]);
                    setBatchId(null);
                    setAutoMatchSummary(null);
                  }}
                >
                  Import Another
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
