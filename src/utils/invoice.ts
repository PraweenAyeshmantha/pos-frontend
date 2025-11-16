import type { InvoiceData } from '../types/invoice';
import { formatCurrency } from './currency';

const formatDate = (value?: string): string => {
  if (!value) {
    return '—';
  }
  try {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return value;
  }
};

export const buildInvoiceHtml = (data: InvoiceData): string => {
  const rows = (data.items ?? [])
    .map(
      (item) => `
        <tr>
          <td>${item.productName}</td>
          <td>${item.quantity ?? 0}</td>
          <td>${formatCurrency(item.unitPrice ?? 0)}</td>
          <td>${formatCurrency(item.totalAmount ?? 0)}</td>
        </tr>`,
    )
    .join('');

  const payments = (data.payments ?? [])
    .map(
      (payment) => `
        <tr>
          <td>${payment.paymentMethod ?? 'Payment'}</td>
          <td>${formatCurrency(payment.amount)}</td>
          <td>${formatDate(payment.paymentDate)}</td>
          <td>${payment.referenceNumber ?? '—'}</td>
        </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <title>Invoice ${data.orderNumber}</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 24px; color: #0f172a; }
        header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        h1 { font-size: 20px; margin: 0; }
        .meta { margin-bottom: 16px; }
        .meta div { margin-bottom: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th { text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #475569; border-bottom: 1px solid #cbd5f5; padding-bottom: 6px; }
        td { padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
        .totals { margin-top: 20px; width: 260px; margin-left: auto; }
        .totals div { display: flex; justify-content: space-between; margin-bottom: 4px; }
        .badge { padding: 4px 10px; border-radius: 999px; background: #e2e8f0; font-size: 12px; }
        footer { margin-top: 32px; font-size: 12px; text-align: center; color: #475569; }
      </style>
    </head>
    <body>
      <header>
        <div>
          <h1>${data.invoiceTemplate?.name ?? 'Invoice'}</h1>
          <div class="badge">${data.status ?? 'PENDING'}</div>
        </div>
        <div style="text-align:right;">
          <div><strong>${data.outletName ?? ''}</strong></div>
          <div>${data.outletAddress ?? ''}</div>
          <div>${data.outletPhone ?? ''}</div>
          <div>${data.outletEmail ?? ''}</div>
        </div>
      </header>
      <section class="meta">
        <div><strong>Order #:</strong> ${data.orderNumber}</div>
        <div><strong>Order Date:</strong> ${formatDate(data.orderDate)}</div>
        <div><strong>Completed:</strong> ${formatDate(data.completedDate)}</div>
        ${
          data.customerName
            ? `<div><strong>Customer:</strong> ${data.customerName} (${data.customerPhone ?? '—'})</div>`
            : ''
        }
        ${
          data.tableNumber
            ? `<div><strong>Table:</strong> ${data.tableNumber}</div>`
            : ''
        }
        ${
          data.cashierName
            ? `<div><strong>Cashier:</strong> ${data.cashierName}</div>`
            : ''
        }
      </section>

      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Unit Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <div class="totals">
        <div><span>Subtotal</span><span>${formatCurrency(data.subtotal)}</span></div>
        <div><span>Discount</span><span>${formatCurrency(data.discountAmount)}</span></div>
        <div><span>Tax</span><span>${formatCurrency(data.taxAmount)}</span></div>
        <div style="font-weight:600;border-top:1px solid #cbd5f5;padding-top:8px;">
          <span>Total</span><span>${formatCurrency(data.totalAmount)}</span>
        </div>
        <div><span>Paid</span><span>${formatCurrency(data.paidAmount)}</span></div>
        <div><span>Change</span><span>${formatCurrency(data.changeAmount)}</span></div>
      </div>

      ${
        payments
          ? `<h3 style="margin-top:24px;font-size:15px;">Payments</h3>
      <table>
        <thead>
          <tr>
            <th>Method</th>
            <th>Amount</th>
            <th>Date</th>
            <th>Reference</th>
          </tr>
        </thead>
        <tbody>${payments}</tbody>
      </table>`
          : ''
      }

      ${
        data.notes
          ? `<section style="margin-top:24px;">
        <strong>Notes:</strong>
        <p>${data.notes}</p>
      </section>`
          : ''
      }

      ${
        data.invoiceTemplate?.footerText
          ? `<footer>${data.invoiceTemplate.footerText}</footer>`
          : ''
      }
    </body>
  </html>`;
};

export default buildInvoiceHtml;
