import type { OrderWithItems } from "@shared/schema";
import { formatCurrency } from "./currency";

export interface ThermalPrinterConfig {
  printerName?: string;
  paperWidth?: number;
  lineSpacing?: number;
  fontSize?: number;
}

export class ThermalPrinter {
  private config: ThermalPrinterConfig;

  constructor(config: ThermalPrinterConfig = {}) {
    this.config = {
      printerName: config.printerName || 'EPSON TM-T20',
      paperWidth: config.paperWidth || 48,
      lineSpacing: config.lineSpacing || 1,
      fontSize: config.fontSize || 12,
      ...config
    };
  }

  private formatLine(text: string, width: number = this.config.paperWidth || 48): string {
    if (text.length <= width) {
      return text;
    }
    return text.substring(0, width - 3) + '...';
  }

  private centerText(text: string, width: number = this.config.paperWidth || 48): string {
    const padding = Math.max(0, Math.floor((width - text.length) / 2));
    return ' '.repeat(padding) + text;
  }

  private rightAlign(text: string, width: number = this.config.paperWidth || 48): string {
    const padding = Math.max(0, width - text.length);
    return ' '.repeat(padding) + text;
  }

  private formatItemLine(name: string, qty: number, price: string, width: number = this.config.paperWidth || 48): string {
    const qtyStr = `${qty}x`;
    const priceStr = price;
    const maxNameWidth = width - qtyStr.length - priceStr.length - 2; // 2 spaces
    
    const truncatedName = name.length > maxNameWidth ? 
      name.substring(0, maxNameWidth - 3) + '...' : 
      name;
    
    const spacesNeeded = width - qtyStr.length - truncatedName.length - priceStr.length;
    return `${qtyStr} ${truncatedName}${' '.repeat(Math.max(0, spacesNeeded))}${priceStr}`;
  }

  generateReceiptText(order: OrderWithItems): string {
    const width = this.config.paperWidth || 48;
    const lines: string[] = [];
    
    // Header
    lines.push(this.centerText('LIBERTY', width));
    lines.push(this.centerText('Cafe - Bar - Lounge', width));
    lines.push('');
    lines.push(this.centerText('Recibo de Venda', width));
    lines.push('-'.repeat(width));
    
    // Order info
    lines.push(`Recibo #${order.id}`);
    lines.push(`Data: ${new Date(order.createdAt).toLocaleString('pt-PT')}`);
    lines.push(`Mesa: ${order.table?.number || 'N/A'}`);
    lines.push(`Servidor: ${order.server?.firstName || 'N/A'}`);
    lines.push(`Cliente: ${order.clientName || 'Cliente Anônimo'}`);
    lines.push('-'.repeat(width));
    
    // Items
    lines.push('ITENS:');
    order.items.forEach(item => {
      lines.push(this.formatItemLine(
        item.product.name,
        item.quantity,
        formatCurrency(parseFloat(item.totalPrice)),
        width
      ));
    });
    
    lines.push('-'.repeat(width));
    
    // Total
    lines.push(this.rightAlign(`TOTAL: ${formatCurrency(order.totalAmount)}`, width));
    
    // Payment method
    if (order.paymentMethod) {
      const paymentMethods = {
        cash: 'Dinheiro',
        mobile_money: 'Mobile Money',
        credit: 'Crédito',
        partial: 'Parcial'
      };
      lines.push(`Pagamento: ${paymentMethods[order.paymentMethod as keyof typeof paymentMethods] || order.paymentMethod}`);
    }
    
    lines.push('-'.repeat(width));
    lines.push(this.centerText('Obrigado pela preferência!', width));
    lines.push('');
    lines.push('');
    lines.push('');
    
    return lines.join('\n');
  }

  async printReceipt(order: OrderWithItems): Promise<void> {
    const receiptText = this.generateReceiptText(order);
    
    try {
      // Check if Web Serial API is available (modern browsers)
      if ('serial' in navigator) {
        await this.printViaWebSerial(receiptText);
      } else {
        // Fallback to print dialog
        await this.printViaDialog(receiptText);
      }
    } catch (error) {
      console.error('Erro ao imprimir recibo:', error);
      // Fallback to download as text file
      this.downloadAsText(receiptText, `recibo-${order.id}.txt`);
      throw new Error('Não foi possível imprimir. Recibo foi baixado como arquivo de texto.');
    }
  }

  private async printViaWebSerial(text: string): Promise<void> {
    try {
      // Request serial port access
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 9600 });
      
      const writer = port.writable.getWriter();
      
      // Send print commands for EPSON thermal printers
      const encoder = new TextEncoder();
      
      // Initialize printer
      await writer.write(encoder.encode('\x1B@')); // ESC @ - Initialize
      
      // Set font size
      await writer.write(encoder.encode('\x1B!0')); // ESC ! 0 - Normal font
      
      // Print text
      await writer.write(encoder.encode(text));
      
      // Cut paper
      await writer.write(encoder.encode('\x1DV\x42\x00')); // GS V B 0 - Full cut
      
      writer.releaseLock();
      await port.close();
      
    } catch (error) {
      console.error('Erro na impressão serial:', error);
      throw error;
    }
  }

  private async printViaDialog(text: string): Promise<void> {
    // Create a temporary window with the receipt for printing
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) {
      throw new Error('Não foi possível abrir janela de impressão');
    }
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Recibo #${Date.now()}</title>
          <style>
            body { 
              font-family: 'Courier New', monospace; 
              font-size: 12px; 
              margin: 0; 
              padding: 10px; 
              white-space: pre-wrap;
            }
            @media print {
              body { margin: 0; padding: 5px; }
            }
          </style>
        </head>
        <body>${text}</body>
      </html>
    `);
    
    printWindow.document.close();
    
    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 100);
  }

  private downloadAsText(text: string, filename: string): void {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Preview receipt text
  previewReceipt(order: OrderWithItems): string {
    return this.generateReceiptText(order);
  }
}

// Export a default instance
export const thermalPrinter = new ThermalPrinter();