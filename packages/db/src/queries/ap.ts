// Accounts Payable (AP) Queries
import { db } from '../client';
import { eq, and, desc, sql, gte, lte, or, ilike, asc } from 'drizzle-orm';
import {
  vendors,
  bills,
  billLineItems,
  vendorPayments,
  vendorPaymentApplications,
} from '../schema/ap';
import { chartOfAccounts, journalEntries, transactionLines } from '../schema/gl';
import type {
  VendorInput,
  VendorListItem,
  VendorDetail,
  BillInput,
  BillListItem,
  BillDetail,
  VendorPaymentInput,
  VendorPaymentListItem,
  APAgingRow,
  APAgingReport,
  APDashboardStats,
  APActivityItem,
  OutstandingBill,
} from '../types/ap';

// ==================== VENDOR QUERIES ====================

export async function getVendors(
  tenantId: string,
  options?: {
    search?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }
): Promise<VendorListItem[]> {
  try {
    const conditions = [eq(vendors.tenantId, tenantId)];

    if (options?.isActive !== undefined) {
      conditions.push(eq(vendors.isActive, options.isActive));
    }

    if (options?.search) {
      conditions.push(
        or(
          ilike(vendors.companyName, `%${options.search}%`),
          ilike(vendors.vendorNumber, `%${options.search}%`),
          ilike(vendors.contactName, `%${options.search}%`),
          ilike(vendors.email, `%${options.search}%`)
        )!
      );
    }

    // Get vendors with outstanding balance calculation
    const result = await db
      .select({
        id: vendors.id,
        vendorNumber: vendors.vendorNumber,
        companyName: vendors.companyName,
        contactName: vendors.contactName,
        email: vendors.email,
        phone: vendors.phone,
        city: vendors.city,
        isActive: vendors.isActive,
      })
      .from(vendors)
      .where(and(...conditions))
      .orderBy(asc(vendors.companyName))
      .limit(options?.limit || 100)
      .offset(options?.offset || 0);

    // Get outstanding balances for each vendor
    const vendorIds = result.map((v) => v.id);
    const balances = await db
      .select({
        vendorId: bills.vendorId,
        totalBalance: sql<string>`COALESCE(SUM(${bills.balance}), 0)`,
      })
      .from(bills)
      .where(
        and(
          sql`${bills.vendorId} = ANY(${vendorIds})`,
          sql`${bills.status} NOT IN ('paid', 'cancelled')`
        )
      )
      .groupBy(bills.vendorId);

    const balanceMap = new Map(balances.map((b) => [b.vendorId, b.totalBalance]));

    return result.map((vendor) => ({
      ...vendor,
      isActive: vendor.isActive ?? true,
      outstandingBalance: balanceMap.get(vendor.id) || '0.00',
    }));
  } catch (error) {
    console.error('Error fetching vendors:', error);
    throw error;
  }
}

export async function getVendorById(
  tenantId: string,
  vendorId: string
): Promise<VendorDetail | null> {
  try {
    const vendor = await db.query.vendors.findFirst({
      where: and(eq(vendors.id, vendorId), eq(vendors.tenantId, tenantId)),
    });

    if (!vendor) return null;

    // Get outstanding balance
    const balanceResult = await db
      .select({
        total: sql<string>`COALESCE(SUM(${bills.balance}), 0)`,
      })
      .from(bills)
      .where(
        and(
          eq(bills.vendorId, vendorId),
          sql`${bills.status} NOT IN ('paid', 'cancelled')`
        )
      );

    // Get total purchases
    const purchasesResult = await db
      .select({
        total: sql<string>`COALESCE(SUM(${bills.total}), 0)`,
        lastDate: sql<string | null>`MAX(${bills.billDate})`,
      })
      .from(bills)
      .where(
        and(eq(bills.vendorId, vendorId), sql`${bills.status} != 'cancelled'`)
      );

    // Get recent bills
    const vendorBills = await db
      .select({
        id: bills.id,
        billNumber: bills.billNumber,
        vendorInvoiceNumber: bills.vendorInvoiceNumber,
        billDate: bills.billDate,
        dueDate: bills.dueDate,
        status: bills.status,
        total: bills.total,
        balance: bills.balance,
      })
      .from(bills)
      .where(eq(bills.vendorId, vendorId))
      .orderBy(desc(bills.billDate))
      .limit(20);

    // Get recent payments
    const vendorPaymentsList = await db
      .select({
        id: vendorPayments.id,
        paymentNumber: vendorPayments.paymentNumber,
        paymentDate: vendorPayments.paymentDate,
        amount: vendorPayments.amount,
        paymentMethod: vendorPayments.paymentMethod,
        status: vendorPayments.status,
      })
      .from(vendorPayments)
      .where(eq(vendorPayments.vendorId, vendorId))
      .orderBy(desc(vendorPayments.paymentDate))
      .limit(20);

    const today = new Date().toISOString().split('T')[0];

    return {
      ...vendor,
      outstandingBalance: balanceResult[0]?.total || '0.00',
      totalPurchases: purchasesResult[0]?.total || '0.00',
      lastPurchaseDate: purchasesResult[0]?.lastDate || null,
      bills: vendorBills.map((b) => ({
        id: b.id,
        billNumber: b.billNumber,
        vendorInvoiceNumber: b.vendorInvoiceNumber,
        vendorId: vendorId,
        vendorName: vendor.companyName,
        billDate: b.billDate,
        dueDate: b.dueDate,
        status: b.status,
        total: b.total,
        balance: b.balance,
        isOverdue: b.dueDate < today && b.status !== 'paid' && b.status !== 'cancelled',
      })),
      payments: vendorPaymentsList.map((p) => ({
        id: p.id,
        paymentNumber: p.paymentNumber,
        vendorId: vendorId,
        vendorName: vendor.companyName,
        paymentDate: p.paymentDate,
        amount: p.amount,
        paymentMethod: p.paymentMethod,
        status: p.status,
      })),
    };
  } catch (error) {
    console.error('Error fetching vendor:', error);
    throw error;
  }
}

export async function createVendor(
  tenantId: string,
  input: VendorInput
): Promise<{ id: string }> {
  try {
    // Generate vendor number if not provided
    let vendorNumber = input.vendorNumber;
    if (!vendorNumber) {
      vendorNumber = await getNextVendorNumber(tenantId);
    }

    const [vendor] = await db
      .insert(vendors)
      .values({
        tenantId,
        vendorNumber,
        companyName: input.companyName,
        contactName: input.contactName,
        email: input.email,
        phone: input.phone,
        address: input.address,
        city: input.city,
        country: input.country || 'Pakistan',
        postalCode: input.postalCode,
        ntn: input.ntn,
        strn: input.strn,
        paymentTerms: input.paymentTerms || 30,
        defaultExpenseAccountId: input.defaultExpenseAccountId,
        bankDetails: input.bankDetails,
        notes: input.notes,
        website: input.website,
        isActive: input.isActive ?? true,
      })
      .returning({ id: vendors.id });

    return vendor;
  } catch (error) {
    console.error('Error creating vendor:', error);
    throw error;
  }
}

export async function updateVendor(
  tenantId: string,
  vendorId: string,
  input: Partial<VendorInput>
): Promise<{ id: string }> {
  try {
    const [vendor] = await db
      .update(vendors)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(and(eq(vendors.id, vendorId), eq(vendors.tenantId, tenantId)))
      .returning({ id: vendors.id });

    return vendor;
  } catch (error) {
    console.error('Error updating vendor:', error);
    throw error;
  }
}

async function getNextVendorNumber(tenantId: string): Promise<string> {
  try {
    const result = await db
      .select({
        maxNumber: sql<string>`MAX(${vendors.vendorNumber})`,
      })
      .from(vendors)
      .where(eq(vendors.tenantId, tenantId));

    const lastNumber = result[0]?.maxNumber;
    if (!lastNumber) {
      return 'V-0001';
    }

    const match = lastNumber.match(/V-(\d+)/);
    if (match) {
      const nextNum = parseInt(match[1], 10) + 1;
      return `V-${nextNum.toString().padStart(4, '0')}`;
    }

    return 'V-0001';
  } catch (error) {
    console.error('Error generating vendor number:', error);
    return `V-${Date.now()}`;
  }
}

// ==================== BILL QUERIES ====================

export async function getBills(
  tenantId: string,
  options?: {
    vendorId?: string;
    status?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }
): Promise<BillListItem[]> {
  try {
    const conditions = [eq(bills.tenantId, tenantId)];

    if (options?.vendorId) {
      conditions.push(eq(bills.vendorId, options.vendorId));
    }

    if (options?.status) {
      conditions.push(eq(bills.status, options.status as any));
    }

    if (options?.search) {
      conditions.push(
        or(
          ilike(bills.billNumber, `%${options.search}%`),
          ilike(bills.vendorInvoiceNumber, `%${options.search}%`)
        )!
      );
    }

    if (options?.startDate) {
      conditions.push(gte(bills.billDate, options.startDate));
    }

    if (options?.endDate) {
      conditions.push(lte(bills.billDate, options.endDate));
    }

    const result = await db
      .select({
        id: bills.id,
        billNumber: bills.billNumber,
        vendorInvoiceNumber: bills.vendorInvoiceNumber,
        vendorId: bills.vendorId,
        vendorName: vendors.companyName,
        billDate: bills.billDate,
        dueDate: bills.dueDate,
        status: bills.status,
        total: bills.total,
        balance: bills.balance,
      })
      .from(bills)
      .leftJoin(vendors, eq(bills.vendorId, vendors.id))
      .where(and(...conditions))
      .orderBy(desc(bills.billDate))
      .limit(options?.limit || 100)
      .offset(options?.offset || 0);

    const today = new Date().toISOString().split('T')[0];

    return result.map((bill) => ({
      ...bill,
      vendorName: bill.vendorName || 'Unknown Vendor',
      isOverdue:
        bill.dueDate < today &&
        bill.status !== 'paid' &&
        bill.status !== 'cancelled',
    }));
  } catch (error) {
    console.error('Error fetching bills:', error);
    throw error;
  }
}

export async function getBillById(
  tenantId: string,
  billId: string
): Promise<BillDetail | null> {
  try {
    const bill = await db.query.bills.findFirst({
      where: and(eq(bills.id, billId), eq(bills.tenantId, tenantId)),
      with: {
        vendor: true,
        lineItems: {
          with: {
            expenseAccount: true,
          },
        },
      },
    });

    if (!bill) return null;

    // Get payments for this bill
    const payments = await db
      .select({
        id: vendorPayments.id,
        paymentNumber: vendorPayments.paymentNumber,
        paymentDate: vendorPayments.paymentDate,
        amount: vendorPaymentApplications.amountApplied,
        paymentMethod: vendorPayments.paymentMethod,
      })
      .from(vendorPaymentApplications)
      .innerJoin(
        vendorPayments,
        eq(vendorPaymentApplications.paymentId, vendorPayments.id)
      )
      .where(eq(vendorPaymentApplications.billId, billId));

    return {
      ...bill,
      vendor: {
        id: bill.vendor.id,
        companyName: bill.vendor.companyName,
        vendorNumber: bill.vendor.vendorNumber,
        email: bill.vendor.email,
        phone: bill.vendor.phone,
        address: bill.vendor.address,
      },
      lineItems: bill.lineItems.map((item: any) => ({
        id: item.id,
        expenseAccountId: item.expenseAccountId,
        expenseAccountName: item.expenseAccount?.name || 'Unknown',
        expenseAccountNumber: item.expenseAccount?.accountNumber || '',
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        taxAmount: item.taxAmount,
        lineTotal: item.lineTotal,
      })),
      payments: payments.map((p) => ({
        id: p.id,
        paymentNumber: p.paymentNumber,
        paymentDate: p.paymentDate,
        amount: p.amount,
        paymentMethod: p.paymentMethod,
      })),
    };
  } catch (error) {
    console.error('Error fetching bill:', error);
    throw error;
  }
}

export async function createBill(
  tenantId: string,
  input: BillInput
): Promise<{ id: string; billNumber: string }> {
  try {
    return await db.transaction(async (tx) => {
      // Generate bill number
      const billNumber = await getNextBillNumber(tenantId);

      // Calculate totals
      let subtotal = 0;
      let taxAmount = 0;

      const lineItemsData = input.lineItems.map((item) => {
        const lineSubtotal = item.quantity * item.unitPrice;
        const lineTax = lineSubtotal * (item.taxRate / 100);
        const lineTotal = lineSubtotal + lineTax;

        subtotal += lineSubtotal;
        taxAmount += lineTax;

        return {
          expenseAccountId: item.expenseAccountId,
          description: item.description,
          quantity: item.quantity.toString(),
          unitPrice: item.unitPrice.toString(),
          taxRate: item.taxRate.toString(),
          taxAmount: lineTax.toFixed(2),
          lineTotal: lineTotal.toFixed(2),
        };
      });

      const total = subtotal + taxAmount;

      // Create bill
      const [bill] = await tx
        .insert(bills)
        .values({
          tenantId,
          vendorId: input.vendorId,
          billNumber,
          vendorInvoiceNumber: input.vendorInvoiceNumber,
          billDate: input.billDate,
          dueDate: input.dueDate,
          status: 'draft',
          subtotal: subtotal.toFixed(2),
          taxAmount: taxAmount.toFixed(2),
          total: total.toFixed(2),
          balance: total.toFixed(2),
          notes: input.notes,
          attachmentUrl: input.attachmentUrl,
          apAccountId: input.apAccountId,
        })
        .returning({ id: bills.id, billNumber: bills.billNumber });

      // Create line items
      await tx.insert(billLineItems).values(
        lineItemsData.map((item) => ({
          billId: bill.id,
          ...item,
        }))
      );

      return bill;
    });
  } catch (error) {
    console.error('Error creating bill:', error);
    throw error;
  }
}

export async function finalizeBill(
  tenantId: string,
  billId: string,
  apAccountId: string,
  inputGstAccountId?: string
): Promise<{ success: boolean; journalEntryId?: string }> {
  try {
    return await db.transaction(async (tx) => {
      // Get bill with line items
      const bill = await tx.query.bills.findFirst({
        where: and(eq(bills.id, billId), eq(bills.tenantId, tenantId)),
        with: {
          vendor: true,
          lineItems: true,
        },
      });

      if (!bill) {
        throw new Error('Bill not found');
      }

      if (bill.status !== 'draft') {
        throw new Error('Only draft bills can be finalized');
      }

      // Create journal entry for the bill
      // Debit: Expense Accounts
      // Debit: Input GST (if applicable)
      // Credit: Accounts Payable
      const journalEntryNumber = `JE-BILL-${bill.billNumber}`;

      const [journalEntry] = await tx
        .insert(journalEntries)
        .values({
          tenantId,
          entryNumber: journalEntryNumber,
          date: bill.billDate,
          memo: `Bill ${bill.billNumber} - ${bill.vendor.companyName}`,
          status: 'posted',
          sourceType: 'bill',
          sourceId: billId,
          fiscalYear: new Date(bill.billDate).getFullYear(),
          fiscalPeriod: new Date(bill.billDate).getMonth() + 1,
          createdBy: tenantId, // Use tenantId as placeholder for system user
          isAutoGenerated: true,
        })
        .returning({ id: journalEntries.id });

      const journalLines: {
        journalEntryId: string;
        accountId: string;
        memo: string;
        debit: string;
        credit: string;
        lineNumber: number;
      }[] = [];

      // Debit expense accounts
      let lineNum = 0;
      for (const lineItem of bill.lineItems) {
        // Expense amount (without tax)
        const expenseAmount =
          parseFloat(lineItem.lineTotal) - parseFloat(lineItem.taxAmount);
        if (expenseAmount > 0) {
          journalLines.push({
            journalEntryId: journalEntry.id,
            accountId: lineItem.expenseAccountId,
            memo: lineItem.description,
            debit: expenseAmount.toFixed(2),
            credit: '0',
            lineNumber: ++lineNum,
          });
        }
      }

      // Debit Input GST if applicable
      if (inputGstAccountId && parseFloat(bill.taxAmount) > 0) {
        journalLines.push({
          journalEntryId: journalEntry.id,
          accountId: inputGstAccountId,
          memo: `Input GST - Bill ${bill.billNumber}`,
          debit: bill.taxAmount,
          credit: '0',
          lineNumber: ++lineNum,
        });
      }

      // Credit Accounts Payable
      journalLines.push({
        journalEntryId: journalEntry.id,
        accountId: apAccountId,
        memo: `Bill ${bill.billNumber} - ${bill.vendor.companyName}`,
        debit: '0',
        credit: bill.total,
        lineNumber: ++lineNum,
      });

      await tx.insert(transactionLines).values(journalLines);

      // Update bill status and journal entry reference
      await tx
        .update(bills)
        .set({
          status: 'approved',
          apAccountId,
          journalEntryId: journalEntry.id,
          updatedAt: new Date(),
        })
        .where(eq(bills.id, billId));

      return { success: true, journalEntryId: journalEntry.id };
    });
  } catch (error) {
    console.error('Error finalizing bill:', error);
    throw error;
  }
}

async function getNextBillNumber(tenantId: string): Promise<string> {
  try {
    const result = await db
      .select({
        maxNumber: sql<string>`MAX(${bills.billNumber})`,
      })
      .from(bills)
      .where(eq(bills.tenantId, tenantId));

    const lastNumber = result[0]?.maxNumber;
    if (!lastNumber) {
      return 'BILL-0001';
    }

    const match = lastNumber.match(/BILL-(\d+)/);
    if (match) {
      const nextNum = parseInt(match[1], 10) + 1;
      return `BILL-${nextNum.toString().padStart(4, '0')}`;
    }

    return 'BILL-0001';
  } catch (error) {
    console.error('Error generating bill number:', error);
    return `BILL-${Date.now()}`;
  }
}

export async function getNextBillNumberForDisplay(
  tenantId: string
): Promise<string> {
  return getNextBillNumber(tenantId);
}

// ==================== VENDOR PAYMENT QUERIES ====================

export async function getVendorPayments(
  tenantId: string,
  options?: {
    vendorId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }
): Promise<VendorPaymentListItem[]> {
  try {
    const conditions = [eq(vendorPayments.tenantId, tenantId)];

    if (options?.vendorId) {
      conditions.push(eq(vendorPayments.vendorId, options.vendorId));
    }

    if (options?.startDate) {
      conditions.push(gte(vendorPayments.paymentDate, options.startDate));
    }

    if (options?.endDate) {
      conditions.push(lte(vendorPayments.paymentDate, options.endDate));
    }

    const result = await db
      .select({
        id: vendorPayments.id,
        paymentNumber: vendorPayments.paymentNumber,
        vendorId: vendorPayments.vendorId,
        vendorName: vendors.companyName,
        paymentDate: vendorPayments.paymentDate,
        amount: vendorPayments.amount,
        paymentMethod: vendorPayments.paymentMethod,
        status: vendorPayments.status,
      })
      .from(vendorPayments)
      .leftJoin(vendors, eq(vendorPayments.vendorId, vendors.id))
      .where(and(...conditions))
      .orderBy(desc(vendorPayments.paymentDate))
      .limit(options?.limit || 100)
      .offset(options?.offset || 0);

    return result.map((payment) => ({
      ...payment,
      vendorName: payment.vendorName || 'Unknown Vendor',
    }));
  } catch (error) {
    console.error('Error fetching vendor payments:', error);
    throw error;
  }
}

export async function getOutstandingBills(
  tenantId: string,
  vendorId: string
): Promise<OutstandingBill[]> {
  try {
    const today = new Date().toISOString().split('T')[0];

    const result = await db
      .select({
        id: bills.id,
        billNumber: bills.billNumber,
        vendorInvoiceNumber: bills.vendorInvoiceNumber,
        billDate: bills.billDate,
        dueDate: bills.dueDate,
        total: bills.total,
        balance: bills.balance,
      })
      .from(bills)
      .where(
        and(
          eq(bills.tenantId, tenantId),
          eq(bills.vendorId, vendorId),
          sql`${bills.balance} > 0`,
          sql`${bills.status} NOT IN ('paid', 'cancelled', 'draft')`
        )
      )
      .orderBy(asc(bills.dueDate));

    return result.map((bill) => {
      const isOverdue = bill.dueDate < today;
      const daysOverdue = isOverdue
        ? Math.floor(
            (new Date().getTime() - new Date(bill.dueDate).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : 0;

      return {
        ...bill,
        isOverdue,
        daysOverdue,
      };
    });
  } catch (error) {
    console.error('Error fetching outstanding bills:', error);
    throw error;
  }
}

export async function createVendorPayment(
  tenantId: string,
  input: VendorPaymentInput
): Promise<{ id: string; paymentNumber: string }> {
  try {
    return await db.transaction(async (tx) => {
      // Generate payment number
      const paymentNumber = await getNextVendorPaymentNumber(tenantId);

      // Get vendor info
      const vendor = await tx.query.vendors.findFirst({
        where: eq(vendors.id, input.vendorId),
      });

      if (!vendor) {
        throw new Error('Vendor not found');
      }

      // Create payment
      const [payment] = await tx
        .insert(vendorPayments)
        .values({
          tenantId,
          vendorId: input.vendorId,
          paymentNumber,
          paymentDate: input.paymentDate,
          amount: input.amount.toFixed(2),
          paymentMethod: input.paymentMethod,
          chequeNumber: input.chequeNumber,
          bankAccountId: input.bankAccountId,
          reference: input.reference,
          notes: input.notes,
          status: 'completed',
        })
        .returning({
          id: vendorPayments.id,
          paymentNumber: vendorPayments.paymentNumber,
        });

      // Apply payment to bills
      for (const allocation of input.allocations) {
        // Create payment application
        await tx.insert(vendorPaymentApplications).values({
          paymentId: payment.id,
          billId: allocation.billId,
          amountApplied: allocation.amountApplied.toFixed(2),
        });

        // Update bill amounts
        const bill = await tx.query.bills.findFirst({
          where: eq(bills.id, allocation.billId),
        });

        if (bill) {
          const newAmountPaid =
            parseFloat(bill.amountPaid) + allocation.amountApplied;
          const newBalance = parseFloat(bill.total) - newAmountPaid;
          const newStatus = newBalance <= 0 ? 'paid' : 'partially_paid';

          await tx
            .update(bills)
            .set({
              amountPaid: newAmountPaid.toFixed(2),
              balance: newBalance.toFixed(2),
              status: newStatus,
              updatedAt: new Date(),
            })
            .where(eq(bills.id, allocation.billId));
        }
      }

      // Create journal entry for payment
      // Debit: Accounts Payable
      // Credit: Bank Account
      const journalEntryNumber = `JE-VPMT-${paymentNumber}`;

      // Get AP account from first bill
      let apAccountId: string | null = null;
      if (input.allocations.length > 0) {
        const firstBill = await tx.query.bills.findFirst({
          where: eq(bills.id, input.allocations[0].billId),
        });
        apAccountId = firstBill?.apAccountId || null;
      }

      if (apAccountId && input.bankAccountId) {
        const paymentDate = new Date(input.paymentDate);
        const [journalEntry] = await tx
          .insert(journalEntries)
          .values({
            tenantId,
            entryNumber: journalEntryNumber,
            date: input.paymentDate,
            memo: `Payment to ${vendor.companyName} - ${paymentNumber}`,
            status: 'posted',
            sourceType: 'payment',
            sourceId: payment.id,
            fiscalYear: paymentDate.getFullYear(),
            fiscalPeriod: paymentDate.getMonth() + 1,
            createdBy: tenantId, // Use tenantId as placeholder for system user
            isAutoGenerated: true,
          })
          .returning({ id: journalEntries.id });

        await tx.insert(transactionLines).values([
          {
            journalEntryId: journalEntry.id,
            accountId: apAccountId,
            memo: `Payment to ${vendor.companyName}`,
            debit: input.amount.toFixed(2),
            credit: '0',
            lineNumber: 1,
          },
          {
            journalEntryId: journalEntry.id,
            accountId: input.bankAccountId,
            memo: `Payment to ${vendor.companyName} - ${paymentNumber}`,
            debit: '0',
            credit: input.amount.toFixed(2),
            lineNumber: 2,
          },
        ]);

        // Update payment with journal entry reference
        await tx
          .update(vendorPayments)
          .set({ journalEntryId: journalEntry.id })
          .where(eq(vendorPayments.id, payment.id));
      }

      return payment;
    });
  } catch (error) {
    console.error('Error creating vendor payment:', error);
    throw error;
  }
}

async function getNextVendorPaymentNumber(tenantId: string): Promise<string> {
  try {
    const result = await db
      .select({
        maxNumber: sql<string>`MAX(${vendorPayments.paymentNumber})`,
      })
      .from(vendorPayments)
      .where(eq(vendorPayments.tenantId, tenantId));

    const lastNumber = result[0]?.maxNumber;
    if (!lastNumber) {
      return 'VPMT-0001';
    }

    const match = lastNumber.match(/VPMT-(\d+)/);
    if (match) {
      const nextNum = parseInt(match[1], 10) + 1;
      return `VPMT-${nextNum.toString().padStart(4, '0')}`;
    }

    return 'VPMT-0001';
  } catch (error) {
    console.error('Error generating vendor payment number:', error);
    return `VPMT-${Date.now()}`;
  }
}

export async function getNextVendorPaymentNumberForDisplay(
  tenantId: string
): Promise<string> {
  return getNextVendorPaymentNumber(tenantId);
}

// ==================== AP AGING REPORT ====================

export async function getAPAgingReport(
  tenantId: string,
  asOfDate?: string
): Promise<APAgingReport> {
  try {
    const reportDate = asOfDate || new Date().toISOString().split('T')[0];
    const reportDateObj = new Date(reportDate);

    // Get all unpaid bills
    const unpaidBills = await db
      .select({
        vendorId: bills.vendorId,
        vendorNumber: vendors.vendorNumber,
        vendorName: vendors.companyName,
        dueDate: bills.dueDate,
        balance: bills.balance,
      })
      .from(bills)
      .leftJoin(vendors, eq(bills.vendorId, vendors.id))
      .where(
        and(
          eq(bills.tenantId, tenantId),
          sql`${bills.balance} > 0`,
          sql`${bills.status} NOT IN ('paid', 'cancelled', 'draft')`,
          lte(bills.billDate, reportDate)
        )
      );

    // Group by vendor and calculate aging buckets
    const vendorMap = new Map<string, APAgingRow>();

    for (const bill of unpaidBills) {
      const dueDate = new Date(bill.dueDate);
      const daysPastDue = Math.floor(
        (reportDateObj.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const balance = parseFloat(bill.balance);

      if (!vendorMap.has(bill.vendorId)) {
        vendorMap.set(bill.vendorId, {
          vendorId: bill.vendorId,
          vendorNumber: bill.vendorNumber || '',
          vendorName: bill.vendorName || 'Unknown',
          current: '0',
          days1_30: '0',
          days31_60: '0',
          days61_90: '0',
          over90: '0',
          total: '0',
        });
      }

      const row = vendorMap.get(bill.vendorId)!;

      if (daysPastDue <= 0) {
        row.current = (parseFloat(row.current) + balance).toFixed(2);
      } else if (daysPastDue <= 30) {
        row.days1_30 = (parseFloat(row.days1_30) + balance).toFixed(2);
      } else if (daysPastDue <= 60) {
        row.days31_60 = (parseFloat(row.days31_60) + balance).toFixed(2);
      } else if (daysPastDue <= 90) {
        row.days61_90 = (parseFloat(row.days61_90) + balance).toFixed(2);
      } else {
        row.over90 = (parseFloat(row.over90) + balance).toFixed(2);
      }

      row.total = (parseFloat(row.total) + balance).toFixed(2);
    }

    const rows = Array.from(vendorMap.values()).sort((a, b) =>
      a.vendorName.localeCompare(b.vendorName)
    );

    // Calculate totals
    const totals = rows.reduce(
      (acc, row) => ({
        current: (parseFloat(acc.current) + parseFloat(row.current)).toFixed(2),
        days1_30: (parseFloat(acc.days1_30) + parseFloat(row.days1_30)).toFixed(
          2
        ),
        days31_60: (
          parseFloat(acc.days31_60) + parseFloat(row.days31_60)
        ).toFixed(2),
        days61_90: (
          parseFloat(acc.days61_90) + parseFloat(row.days61_90)
        ).toFixed(2),
        over90: (parseFloat(acc.over90) + parseFloat(row.over90)).toFixed(2),
        total: (parseFloat(acc.total) + parseFloat(row.total)).toFixed(2),
      }),
      {
        current: '0',
        days1_30: '0',
        days31_60: '0',
        days61_90: '0',
        over90: '0',
        total: '0',
      }
    );

    return {
      asOfDate: reportDate,
      rows,
      totals,
    };
  } catch (error) {
    console.error('Error generating AP aging report:', error);
    throw error;
  }
}

// ==================== DASHBOARD STATS ====================

export async function getAPDashboardStats(
  tenantId: string
): Promise<APDashboardStats> {
  try {
    const today = new Date();
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const todayStr = today.toISOString().split('T')[0];
    const weekFromNowStr = weekFromNow.toISOString().split('T')[0];
    const startOfMonthStr = startOfMonth.toISOString().split('T')[0];

    // Total vendors
    const vendorCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(vendors)
      .where(eq(vendors.tenantId, tenantId));

    // Active vendors
    const activeVendorCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(vendors)
      .where(and(eq(vendors.tenantId, tenantId), eq(vendors.isActive, true)));

    // Outstanding AP
    const outstandingAP = await db
      .select({
        total: sql<string>`COALESCE(SUM(${bills.balance}), 0)`,
      })
      .from(bills)
      .where(
        and(
          eq(bills.tenantId, tenantId),
          sql`${bills.status} NOT IN ('paid', 'cancelled', 'draft')`
        )
      );

    // Due this week
    const dueThisWeek = await db
      .select({
        total: sql<string>`COALESCE(SUM(${bills.balance}), 0)`,
      })
      .from(bills)
      .where(
        and(
          eq(bills.tenantId, tenantId),
          sql`${bills.status} NOT IN ('paid', 'cancelled', 'draft')`,
          gte(bills.dueDate, todayStr),
          lte(bills.dueDate, weekFromNowStr)
        )
      );

    // Overdue amount
    const overdueAmount = await db
      .select({
        total: sql<string>`COALESCE(SUM(${bills.balance}), 0)`,
      })
      .from(bills)
      .where(
        and(
          eq(bills.tenantId, tenantId),
          sql`${bills.status} NOT IN ('paid', 'cancelled', 'draft')`,
          sql`${bills.dueDate} < ${todayStr}`
        )
      );

    // This month's purchases
    const thisMonthPurchases = await db
      .select({
        total: sql<string>`COALESCE(SUM(${bills.total}), 0)`,
      })
      .from(bills)
      .where(
        and(
          eq(bills.tenantId, tenantId),
          sql`${bills.status} != 'cancelled'`,
          gte(bills.billDate, startOfMonthStr)
        )
      );

    return {
      totalVendors: Number(vendorCount[0]?.count) || 0,
      activeVendors: Number(activeVendorCount[0]?.count) || 0,
      outstandingAP: outstandingAP[0]?.total || '0.00',
      dueThisWeek: dueThisWeek[0]?.total || '0.00',
      overdueAmount: overdueAmount[0]?.total || '0.00',
      thisMonthPurchases: thisMonthPurchases[0]?.total || '0.00',
    };
  } catch (error) {
    console.error('Error fetching AP dashboard stats:', error);
    return {
      totalVendors: 0,
      activeVendors: 0,
      outstandingAP: '0.00',
      dueThisWeek: '0.00',
      overdueAmount: '0.00',
      thisMonthPurchases: '0.00',
    };
  }
}

export async function getRecentAPActivity(
  tenantId: string,
  limit: number = 10
): Promise<APActivityItem[]> {
  try {
    // Get recent bills
    const recentBills = await db
      .select({
        id: bills.id,
        description: bills.billNumber,
        amount: bills.total,
        date: bills.createdAt,
        vendorName: vendors.companyName,
      })
      .from(bills)
      .leftJoin(vendors, eq(bills.vendorId, vendors.id))
      .where(eq(bills.tenantId, tenantId))
      .orderBy(desc(bills.createdAt))
      .limit(limit);

    // Get recent payments
    const recentPayments = await db
      .select({
        id: vendorPayments.id,
        description: vendorPayments.paymentNumber,
        amount: vendorPayments.amount,
        date: vendorPayments.createdAt,
        vendorName: vendors.companyName,
      })
      .from(vendorPayments)
      .leftJoin(vendors, eq(vendorPayments.vendorId, vendors.id))
      .where(eq(vendorPayments.tenantId, tenantId))
      .orderBy(desc(vendorPayments.createdAt))
      .limit(limit);

    const activities: APActivityItem[] = [
      ...recentBills.map((bill) => ({
        id: bill.id,
        type: 'bill' as const,
        description: `Bill ${bill.description}`,
        amount: bill.amount,
        date: bill.date.toISOString(),
        vendorName: bill.vendorName || 'Unknown',
      })),
      ...recentPayments.map((payment) => ({
        id: payment.id,
        type: 'payment' as const,
        description: `Payment ${payment.description}`,
        amount: payment.amount,
        date: payment.date.toISOString(),
        vendorName: payment.vendorName || 'Unknown',
      })),
    ];

    // Sort by date descending and take the most recent
    return activities
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  } catch (error) {
    console.error('Error fetching recent AP activity:', error);
    return [];
  }
}

export async function getVendorsToPay(
  tenantId: string,
  limit: number = 10
): Promise<
  {
    vendorId: string;
    vendorName: string;
    totalDue: string;
    billsDue: number;
    oldestDueDate: string;
  }[]
> {
  try {
    const today = new Date().toISOString().split('T')[0];

    const result = await db
      .select({
        vendorId: bills.vendorId,
        vendorName: vendors.companyName,
        totalDue: sql<string>`SUM(${bills.balance})`,
        billsDue: sql<number>`COUNT(*)`,
        oldestDueDate: sql<string>`MIN(${bills.dueDate})`,
      })
      .from(bills)
      .leftJoin(vendors, eq(bills.vendorId, vendors.id))
      .where(
        and(
          eq(bills.tenantId, tenantId),
          sql`${bills.balance} > 0`,
          sql`${bills.status} NOT IN ('paid', 'cancelled', 'draft')`
        )
      )
      .groupBy(bills.vendorId, vendors.companyName)
      .orderBy(sql`MIN(${bills.dueDate})`)
      .limit(limit);

    return result.map((row) => ({
      vendorId: row.vendorId,
      vendorName: row.vendorName || 'Unknown',
      totalDue: row.totalDue,
      billsDue: Number(row.billsDue),
      oldestDueDate: row.oldestDueDate,
    }));
  } catch (error) {
    console.error('Error fetching vendors to pay:', error);
    return [];
  }
}
