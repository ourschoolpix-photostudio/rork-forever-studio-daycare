import * as Print from 'expo-print';
import { Platform } from 'react-native';
import type { Sale, PhotoSession, Daycare, Expense } from '@/context/DataContext';
import { calculateSessionGrandTotal, calculateSessionProductionCost, calculateSessionTotalExpenses, calculateSessionNetProfit, ExpenseData } from '@/utils/salesCalculator';

interface InvoiceData {
  daycare: Daycare;
  session: PhotoSession;
  sales: Sale[];
  expenses: Expense[];
  photographerCost: number;
}

export async function generateInvoicePDF(data: InvoiceData): Promise<void> {
  const { daycare, session, sales, expenses, photographerCost } = data;
  
  const earlyBirdSales = sales.filter(s => s.type === 'early-bird');
  const regularSales = sales.filter(s => s.type === 'regular');
  
  const subtotal = sales.reduce((sum, sale) => sum + (sale.total_price || 0), 0);
  const tax = subtotal * 0.06;
  const shipping = session.shipping || 0;
  const earlyBirdDiscount = session.early_bird_discount || 0;
  const regularDiscount = session.regular_discount || 0;
  const grandTotal = calculateSessionGrandTotal(sales, session, 0.06);
  
  const productionCost = calculateSessionProductionCost(sales);
  const totalDaycareExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  
  const expenseData: ExpenseData = {
    daycareExpenses: totalDaycareExpenses,
    photographerCost,
  };
  
  const totalExpenses = calculateSessionTotalExpenses(sales, session, expenseData);
  const netProfit = calculateSessionNetProfit(sales, session, expenseData);
  
  const invoiceDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  const sessionDate = session.scheduled_date 
    ? new Date(session.scheduled_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'N/A';

  const renderSalesRows = (salesList: Sale[], type: string) => {
    if (salesList.length === 0) return '';
    
    const rows = salesList.map(sale => `
      <tr>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb;">${sale.item_name || 'Item'}</td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${sale.quantity}</td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${sale.unit_price.toFixed(2)}</td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${sale.total_price.toFixed(2)}</td>
      </tr>
    `).join('');
    
    return `
      <tr style="background-color: #065f46;">
        <td colspan="4" style="padding: 8px; color: white; font-weight: 600; font-size: 12px; text-transform: uppercase;">${type} Sales</td>
      </tr>
      ${rows}
    `;
  };

  const renderExpenseRows = () => {
    const expenseRows: string[] = [];
    
    if (totalDaycareExpenses > 0) {
      expenseRows.push(`
        <tr>
          <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb;">Daycare Expenses</td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${totalDaycareExpenses.toFixed(2)}</td>
        </tr>
      `);
    }
    
    if (productionCost > 0) {
      expenseRows.push(`
        <tr>
          <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb;">Production Cost</td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${productionCost.toFixed(2)}</td>
        </tr>
      `);
    }
    
    if (shipping > 0) {
      expenseRows.push(`
        <tr>
          <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb;">Shipping</td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${shipping.toFixed(2)}</td>
        </tr>
      `);
    }
    
    if (photographerCost > 0) {
      expenseRows.push(`
        <tr>
          <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb;">Photographer</td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${photographerCost.toFixed(2)}</td>
        </tr>
      `);
    }
    
    return expenseRows.join('');
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice - ${daycare.name}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          font-size: 14px;
          color: #1a1a1a;
          line-height: 1.5;
          padding: 40px;
          background: white;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 3px solid #065f46;
        }
        .company-info h1 {
          font-size: 28px;
          font-weight: 700;
          color: #065f46;
          margin-bottom: 4px;
        }
        .company-info p {
          color: #666;
          font-size: 13px;
        }
        .invoice-info {
          text-align: right;
        }
        .invoice-info h2 {
          font-size: 24px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 8px;
        }
        .invoice-info p {
          font-size: 13px;
          color: #666;
        }
        .invoice-info .account {
          font-size: 15px;
          font-weight: 600;
          color: #065f46;
          margin-top: 8px;
        }
        .client-section {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 30px;
        }
        .client-section h3 {
          font-size: 12px;
          text-transform: uppercase;
          color: #666;
          margin-bottom: 8px;
          letter-spacing: 0.5px;
        }
        .client-section .name {
          font-size: 18px;
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 4px;
        }
        .client-section .address {
          color: #666;
          font-size: 13px;
        }
        .section-title {
          font-size: 16px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 2px solid #e5e7eb;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        th {
          background: #f3f4f6;
          padding: 12px 8px;
          text-align: left;
          font-weight: 600;
          font-size: 12px;
          text-transform: uppercase;
          color: #666;
          border-bottom: 2px solid #e5e7eb;
        }
        th:nth-child(2), th:nth-child(3), th:nth-child(4) {
          text-align: center;
        }
        th:last-child {
          text-align: right;
        }
        .summary-table {
          width: 350px;
          margin-left: auto;
        }
        .summary-table td {
          padding: 8px 12px;
        }
        .summary-table .label {
          text-align: left;
          color: #666;
        }
        .summary-table .value {
          text-align: right;
          font-weight: 600;
        }
        .summary-table .discount {
          color: #dc2626;
        }
        .summary-table .total-row td {
          padding-top: 12px;
          border-top: 2px solid #065f46;
          font-size: 18px;
          font-weight: 700;
        }
        .summary-table .total-row .value {
          color: #065f46;
        }
        .expenses-section {
          margin-top: 40px;
          padding-top: 30px;
          border-top: 2px solid #e5e7eb;
        }
        .expenses-table {
          width: 100%;
        }
        .expenses-table th {
          background: #fff5f5;
          color: #dc2626;
        }
        .profit-section {
          margin-top: 30px;
          display: flex;
          gap: 20px;
        }
        .profit-card {
          flex: 1;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
        }
        .profit-card.revenue {
          background: #f0f7ff;
          border: 2px solid #0066cc;
        }
        .profit-card.expenses {
          background: #fff5f5;
          border: 2px solid #dc2626;
        }
        .profit-card.profit {
          background: #f0fdf4;
          border: 2px solid #16a34a;
        }
        .profit-card h4 {
          font-size: 12px;
          text-transform: uppercase;
          color: #666;
          margin-bottom: 8px;
        }
        .profit-card .amount {
          font-size: 24px;
          font-weight: 700;
        }
        .profit-card.revenue .amount { color: #0066cc; }
        .profit-card.expenses .amount { color: #dc2626; }
        .profit-card.profit .amount { color: #16a34a; }
        .footer {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          color: #999;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-info">
          <h1>Forever Studio</h1>
          <p>School Picture Day</p>
        </div>
        <div class="invoice-info">
          <h2>INVOICE</h2>
          <p>Date: ${invoiceDate}</p>
          <p>Session Date: ${sessionDate}</p>
          ${session.account_number ? `<p class="account">Account #: ${session.account_number}</p>` : ''}
        </div>
      </div>
      
      <div class="client-section">
        <h3>Bill To</h3>
        <p class="name">${daycare.name}</p>
        <p class="address">
          ${daycare.address ? `${daycare.address}<br>` : ''}
          ${daycare.city ? `${daycare.city}, ` : ''}${daycare.state || ''} ${daycare.zip_code || ''}
          ${daycare.phone ? `<br>Phone: ${daycare.phone}` : ''}
        </p>
      </div>
      
      <h3 class="section-title">Sales Items</h3>
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Unit Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${renderSalesRows(earlyBirdSales, 'Early Bird')}
          ${renderSalesRows(regularSales, 'Regular')}
          ${sales.length === 0 ? '<tr><td colspan="4" style="padding: 20px; text-align: center; color: #999;">No sales items</td></tr>' : ''}
        </tbody>
      </table>
      
      <table class="summary-table">
        <tr>
          <td class="label">Subtotal</td>
          <td class="value">$${subtotal.toFixed(2)}</td>
        </tr>
        <tr>
          <td class="label">Tax (6%)</td>
          <td class="value">$${tax.toFixed(2)}</td>
        </tr>
        ${shipping > 0 ? `
        <tr>
          <td class="label">Shipping</td>
          <td class="value">$${shipping.toFixed(2)}</td>
        </tr>
        ` : ''}
        ${earlyBirdDiscount > 0 ? `
        <tr>
          <td class="label">Early Bird Discount</td>
          <td class="value discount">-$${earlyBirdDiscount.toFixed(2)}</td>
        </tr>
        ` : ''}
        ${regularDiscount > 0 ? `
        <tr>
          <td class="label">Other Discounts</td>
          <td class="value discount">-$${regularDiscount.toFixed(2)}</td>
        </tr>
        ` : ''}
        <tr class="total-row">
          <td class="label">Grand Total</td>
          <td class="value">$${grandTotal.toFixed(2)}</td>
        </tr>
      </table>
      
      <div class="expenses-section">
        <h3 class="section-title">Expenses</h3>
        <table class="expenses-table">
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${renderExpenseRows()}
            ${totalExpenses === 0 ? '<tr><td colspan="2" style="padding: 20px; text-align: center; color: #999;">No expenses</td></tr>' : ''}
          </tbody>
        </table>
        
        ${totalExpenses > 0 ? `
        <table class="summary-table">
          <tr class="total-row">
            <td class="label">Total Expenses</td>
            <td class="value" style="color: #dc2626;">$${totalExpenses.toFixed(2)}</td>
          </tr>
        </table>
        ` : ''}
      </div>
      
      <div class="profit-section">
        <div class="profit-card revenue">
          <h4>Total Revenue</h4>
          <p class="amount">$${grandTotal.toFixed(2)}</p>
        </div>
        <div class="profit-card expenses">
          <h4>Total Expenses</h4>
          <p class="amount">$${totalExpenses.toFixed(2)}</p>
        </div>
        <div class="profit-card profit">
          <h4>Net Profit</h4>
          <p class="amount">$${netProfit.toFixed(2)}</p>
        </div>
      </div>
      
      <div class="footer">
        <p>Generated on ${invoiceDate} • Forever Studio - School Picture Day</p>
      </div>
    </body>
    </html>
  `;

  console.log('[InvoiceGenerator] Generating PDF...');
  console.log('[InvoiceGenerator] Platform:', Platform.OS);
  
  try {
    if (Platform.OS === 'web') {
      console.log('[InvoiceGenerator] Using expo-print for web...');
      await Print.printAsync({ html });
      return;
    } else {
      // On native, generate file and share
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });
      
      console.log('[InvoiceGenerator] PDF generated at:', uri);
      
      // Dynamically import sharing to avoid web issues
      const Sharing = await import('expo-sharing');
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Invoice - ${daycare.name}`,
          UTI: 'com.adobe.pdf',
        });
      } else {
        await Print.printAsync({ html });
      }
    }
  } catch (error) {
    console.error('[InvoiceGenerator] Error generating PDF:', error);
    throw error;
  }
}
