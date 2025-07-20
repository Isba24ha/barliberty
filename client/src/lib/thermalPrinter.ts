// Thermal Printer Integration for EPSON Printers
// Supports Web Serial API and fallback methods

export interface PrintReceipt {
  orderNumber: string;
  tableName: string;
  clientName?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: string;
    total: string;
  }>;
  subtotal: string;
  total: string;
  paymentMethod: string;
  receivedAmount?: string;
  change?: string;
  cashier: string;
  timestamp: string;
}

class ThermalPrinter {
  private port: SerialPort | null = null;
  private writer: WritableStreamDefaultWriter | null = null;

  // ESC/POS Commands for EPSON thermal printers
  private readonly ESC = '\x1B';
  private readonly GS = '\x1D';
  private readonly COMMANDS = {
    INIT: '\x1B\x40',          // Initialize printer
    ALIGN_CENTER: '\x1B\x61\x01', // Center alignment
    ALIGN_LEFT: '\x1B\x61\x00',   // Left alignment
    BOLD_ON: '\x1B\x45\x01',      // Bold on
    BOLD_OFF: '\x1B\x45\x00',     // Bold off
    SIZE_NORMAL: '\x1D\x21\x00',  // Normal size
    SIZE_DOUBLE: '\x1D\x21\x11',  // Double size
    CUT_PAPER: '\x1D\x56\x41',    // Cut paper
    LINE_FEED: '\x0A',            // Line feed
    CARRIAGE_RETURN: '\x0D',      // Carriage return
  };

  async connect(): Promise<boolean> {
    if (!navigator.serial) {
      console.warn('Web Serial API not supported');
      return false;
    }

    try {
      // Request a port
      this.port = await navigator.serial.requestPort({
        filters: [
          { usbVendorId: 0x04b8 }, // EPSON
          { usbVendorId: 0x0483 }, // Generic thermal printer
        ]
      });

      // Open the port
      await this.port.open({ 
        baudRate: 9600,
        dataBits: 8,
        parity: 'none',
        stopBits: 1,
        flowControl: 'none'
      });

      this.writer = this.port.writable?.getWriter() || null;
      return true;
    } catch (error) {
      console.error('Failed to connect to printer:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.writer) {
      await this.writer.close();
      this.writer = null;
    }
    if (this.port) {
      await this.port.close();
      this.port = null;
    }
  }

  private async writeCommand(command: string): Promise<void> {
    if (!this.writer) {
      throw new Error('Printer not connected');
    }
    const encoder = new TextEncoder();
    await this.writer.write(encoder.encode(command));
  }

  private async writeText(text: string): Promise<void> {
    if (!this.writer) {
      throw new Error('Printer not connected');
    }
    const encoder = new TextEncoder();
    await this.writer.write(encoder.encode(text));
  }

  async printReceipt(receipt: PrintReceipt): Promise<boolean> {
    try {
      if (!this.writer) {
        // Fallback to browser print if no thermal printer
        return this.fallbackPrint(receipt);
      }

      // Initialize printer
      await this.writeCommand(this.COMMANDS.INIT);
      
      // Header
      await this.writeCommand(this.COMMANDS.ALIGN_CENTER);
      await this.writeCommand(this.COMMANDS.SIZE_DOUBLE);
      await this.writeCommand(this.COMMANDS.BOLD_ON);
      await this.writeText('LIBERTY\n');
      await this.writeText('Cafe - Bar - Lounge\n');
      await this.writeCommand(this.COMMANDS.BOLD_OFF);
      await this.writeCommand(this.COMMANDS.SIZE_NORMAL);
      await this.writeText('================================\n');
      
      // Receipt details
      await this.writeCommand(this.COMMANDS.ALIGN_LEFT);
      await this.writeText(`Recibo: ${receipt.orderNumber}\n`);
      await this.writeText(`Mesa: ${receipt.tableName}\n`);
      if (receipt.clientName) {
        await this.writeText(`Cliente: ${receipt.clientName}\n`);
      }
      await this.writeText(`Data: ${receipt.timestamp}\n`);
      await this.writeText(`Caixa: ${receipt.cashier}\n`);
      await this.writeText('================================\n');
      
      // Items
      for (const item of receipt.items) {
        await this.writeText(`${item.name}\n`);
        await this.writeText(`  ${item.quantity}x ${item.price} = ${item.total} F CFA\n`);
      }
      
      await this.writeText('--------------------------------\n');
      await this.writeText(`Subtotal: ${receipt.subtotal} F CFA\n`);
      await this.writeCommand(this.COMMANDS.BOLD_ON);
      await this.writeText(`TOTAL: ${receipt.total} F CFA\n`);
      await this.writeCommand(this.COMMANDS.BOLD_OFF);
      
      // Payment details
      await this.writeText('--------------------------------\n');
      await this.writeText(`Pagamento: ${receipt.paymentMethod}\n`);
      if (receipt.receivedAmount) {
        await this.writeText(`Recebido: ${receipt.receivedAmount} F CFA\n`);
      }
      if (receipt.change && parseFloat(receipt.change) > 0) {
        await this.writeText(`Troco: ${receipt.change} F CFA\n`);
      }
      
      // Footer
      await this.writeText('\n');
      await this.writeCommand(this.COMMANDS.ALIGN_CENTER);
      await this.writeText('Obrigado pela preferencia!\n');
      await this.writeText('Volte sempre!\n');
      await this.writeText('\n\n');
      
      // Cut paper
      await this.writeCommand(this.COMMANDS.CUT_PAPER);
      
      return true;
    } catch (error) {
      console.error('Failed to print receipt:', error);
      return this.fallbackPrint(receipt);
    }
  }

  private fallbackPrint(receipt: PrintReceipt): boolean {
    try {
      // Create receipt HTML for browser printing
      const receiptHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Recibo - ${receipt.orderNumber}</title>
          <style>
            body { 
              font-family: 'Courier New', monospace; 
              font-size: 12px; 
              width: 58mm; 
              margin: 0; 
              padding: 5mm;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .large { font-size: 16px; }
            .line { border-bottom: 1px dashed #000; margin: 5px 0; }
            @media print {
              body { margin: 0; padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="center bold large">LIBERTY</div>
          <div class="center">Cafe - Bar - Lounge</div>
          <div class="line"></div>
          
          <div>Recibo: ${receipt.orderNumber}</div>
          <div>Mesa: ${receipt.tableName}</div>
          ${receipt.clientName ? `<div>Cliente: ${receipt.clientName}</div>` : ''}
          <div>Data: ${receipt.timestamp}</div>
          <div>Caixa: ${receipt.cashier}</div>
          <div class="line"></div>
          
          ${receipt.items.map(item => `
            <div>${item.name}</div>
            <div>&nbsp;&nbsp;${item.quantity}x ${item.price} = ${item.total} F CFA</div>
          `).join('')}
          
          <div class="line"></div>
          <div>Subtotal: ${receipt.subtotal} F CFA</div>
          <div class="bold">TOTAL: ${receipt.total} F CFA</div>
          <div class="line"></div>
          
          <div>Pagamento: ${receipt.paymentMethod}</div>
          ${receipt.receivedAmount ? `<div>Recebido: ${receipt.receivedAmount} F CFA</div>` : ''}
          ${receipt.change && parseFloat(receipt.change) > 0 ? `<div>Troco: ${receipt.change} F CFA</div>` : ''}
          
          <br>
          <div class="center">Obrigado pela preferencia!</div>
          <div class="center">Volte sempre!</div>
        </body>
        </html>
      `;

      // Open in new window and print
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(receiptHtml);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
        return true;
      }
      
      // Fallback: download as text file
      this.downloadReceiptAsText(receipt);
      return true;
    } catch (error) {
      console.error('Fallback print failed:', error);
      return false;
    }
  }

  private downloadReceiptAsText(receipt: PrintReceipt): void {
    const receiptText = `
LIBERTY
Cafe - Bar - Lounge
================================

Recibo: ${receipt.orderNumber}
Mesa: ${receipt.tableName}
${receipt.clientName ? `Cliente: ${receipt.clientName}\n` : ''}Data: ${receipt.timestamp}
Caixa: ${receipt.cashier}
================================

${receipt.items.map(item => 
  `${item.name}\n  ${item.quantity}x ${item.price} = ${item.total} F CFA`
).join('\n')}

--------------------------------
Subtotal: ${receipt.subtotal} F CFA
TOTAL: ${receipt.total} F CFA
--------------------------------

Pagamento: ${receipt.paymentMethod}
${receipt.receivedAmount ? `Recebido: ${receipt.receivedAmount} F CFA\n` : ''}${receipt.change && parseFloat(receipt.change) > 0 ? `Troco: ${receipt.change} F CFA\n` : ''}

Obrigado pela preferencia!
Volte sempre!
    `;

    const blob = new Blob([receiptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recibo-${receipt.orderNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async testPrinter(): Promise<boolean> {
    try {
      if (!this.writer) {
        console.log('Testing printer connection...');
        const connected = await this.connect();
        if (!connected) {
          return false;
        }
      }

      await this.writeCommand(this.COMMANDS.INIT);
      await this.writeCommand(this.COMMANDS.ALIGN_CENTER);
      await this.writeText('TESTE DE IMPRESSORA\n');
      await this.writeText('LIBERTY - Cafe Bar Lounge\n');
      await this.writeText('Impressora funcionando!\n\n');
      await this.writeCommand(this.COMMANDS.CUT_PAPER);
      
      return true;
    } catch (error) {
      console.error('Printer test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const thermalPrinter = new ThermalPrinter();

// Helper function to format receipt data from order
export function formatReceiptFromOrder(orderData: any, paymentData: any, cashierName: string): PrintReceipt {
  const now = new Date();
  return {
    orderNumber: orderData.id?.toString() || 'N/A',
    tableName: orderData.tableName || 'N/A',
    clientName: orderData.clientName,
    items: orderData.items?.map((item: any) => ({
      name: item.productName || item.name,
      quantity: item.quantity,
      price: parseFloat(item.price || '0').toFixed(2),
      total: (item.quantity * parseFloat(item.price || '0')).toFixed(2),
    })) || [],
    subtotal: orderData.total || '0.00',
    total: paymentData.amount || orderData.total || '0.00',
    paymentMethod: paymentData.method === 'cash' ? 'Dinheiro' : 
                   paymentData.method === 'card' ? 'Cartão' :
                   paymentData.method === 'mobile' ? 'Mobile Money' : 'Crédito',
    receivedAmount: paymentData.receivedAmount,
    change: paymentData.changeAmount,
    cashier: cashierName,
    timestamp: now.toLocaleString('pt-PT'),
  };
}