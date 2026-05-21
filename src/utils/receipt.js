import { formatCurrency, formatDateTime } from './formatters'

export function printReceipt(order, settings) {
  const win = window.open('', '_blank', 'width=400,height=600')
  if (!win) return

  const items = order.items.map(item => `
    <tr>
      <td style="padding:2px 0">${item.name}</td>
      <td style="text-align:center;padding:2px 4px">${item.quantity}</td>
      <td style="text-align:right;padding:2px 0">${formatCurrency(item.price * item.quantity, settings.currency)}</td>
    </tr>
  `).join('')

  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipt - ${order.orderNumber}</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: 'Courier New', monospace; font-size: 12px; width: 80mm; padding: 8px; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .divider { border-top: 1px dashed #000; margin: 6px 0; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; font-weight: bold; padding: 2px 0; }
        .total-row td { font-weight: bold; font-size: 13px; padding-top: 4px; }
      </style>
    </head>
    <body>
      <div class="center bold" style="font-size:16px;margin-bottom:4px">${settings.storeName}</div>
      <div class="center">${settings.storeAddress}</div>
      <div class="center">${settings.storePhone}</div>
      <div class="divider"></div>
      <div>Receipt: <strong>${order.orderNumber}</strong></div>
      <div>Date: ${formatDateTime(order.createdAt)}</div>
      <div>Cashier: ${order.cashierName || 'N/A'}</div>
      ${order.customerName ? `<div>Customer: ${order.customerName}</div>` : ''}
      <div class="divider"></div>
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th style="text-align:center">Qty</th>
            <th style="text-align:right">Amount</th>
          </tr>
        </thead>
        <tbody>${items}</tbody>
      </table>
      <div class="divider"></div>
      <table>
        <tr><td>Subtotal</td><td style="text-align:right">${formatCurrency(order.subtotal, settings.currency)}</td></tr>
        ${order.discount > 0 ? `<tr><td>Discount</td><td style="text-align:right">-${formatCurrency(order.discount, settings.currency)}</td></tr>` : ''}
        ${order.tax > 0 ? `<tr><td>Tax (${settings.taxRate}%)</td><td style="text-align:right">${formatCurrency(order.tax, settings.currency)}</td></tr>` : ''}
        <tr class="total-row"><td>TOTAL</td><td style="text-align:right">${formatCurrency(order.total, settings.currency)}</td></tr>
        <tr><td>Payment (${order.paymentMethod})</td><td style="text-align:right">${formatCurrency(order.amountPaid, settings.currency)}</td></tr>
        ${order.change > 0 ? `<tr><td>Change</td><td style="text-align:right">${formatCurrency(order.change, settings.currency)}</td></tr>` : ''}
      </table>
      <div class="divider"></div>
      <div class="center" style="margin-top:8px">${settings.receiptFooter}</div>
      <div class="center" style="margin-top:4px;font-size:10px">Powered by Nexus POS</div>
    </body>
    </html>
  `)
  win.document.close()
  win.focus()
  setTimeout(() => { win.print(); win.close() }, 500)
}
