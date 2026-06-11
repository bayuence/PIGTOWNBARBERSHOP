/**
 * Receipt Generation and Printing Helpers
 * 
 * Utility functions for generating and printing receipts.
 * Supports both browser printing and Bluetooth thermal printers.
 */

import type {
  ReceiptData,
  BluetoothDevice,
  BluetoothRemoteGATTCharacteristic
} from "@/components/pos/types"
import { formatCurrency, formatTransactionNumber } from "./pos-helpers"

// ============================================================================
// RECEIPT GENERATION
// ============================================================================

/**
 * Generate receipt HTML for browser printing
 * 
 * @param data - Receipt data
 * @returns HTML string
 */
export function generateReceiptHTML(data: ReceiptData): string {
  const { transaction, items, template, branch, subtotal, discount, total } = data
  
  const storeName = template?.store_name || branch?.name || "Pigtown Barbershop"
  const storeAddress = template?.store_address || branch?.address || ""
  const storePhone = template?.store_phone || branch?.phone || ""
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Struk - ${transaction.transaction_number}</title>
      <style>
        @media print {
          @page { margin: 0; }
          body { margin: 1cm; }
        }
        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          line-height: 1.4;
          max-width: 300px;
          margin: 0 auto;
          padding: 10px;
        }
        .header {
          text-align: center;
          margin-bottom: 15px;
          border-bottom: 1px dashed #000;
          padding-bottom: 10px;
        }
        .store-name {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .store-info {
          font-size: 10px;
          margin: 2px 0;
        }
        .transaction-info {
          margin: 10px 0;
          font-size: 11px;
        }
        .items {
          margin: 10px 0;
          border-top: 1px dashed #000;
          border-bottom: 1px dashed #000;
          padding: 10px 0;
        }
        .item {
          margin: 5px 0;
        }
        .item-name {
          font-weight: bold;
        }
        .item-detail {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
        }
        .totals {
          margin: 10px 0;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          margin: 5px 0;
        }
        .total-row.grand-total {
          font-weight: bold;
          font-size: 14px;
          border-top: 1px solid #000;
          padding-top: 5px;
          margin-top: 10px;
        }
        .footer {
          text-align: center;
          margin-top: 15px;
          border-top: 1px dashed #000;
          padding-top: 10px;
          font-size: 10px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="store-name">${storeName}</div>
        ${storeAddress ? `<div class="store-info">${storeAddress}</div>` : ''}
        ${storePhone ? `<div class="store-info">Telp: ${storePhone}</div>` : ''}
      </div>
      
      <div class="transaction-info">
        <div>No: ${transaction.transaction_number}</div>
        <div>Tanggal: ${new Date(transaction.created_at).toLocaleString('id-ID')}</div>
        ${transaction.customer_name ? `<div>Customer: ${transaction.customer_name}</div>` : ''}
        ${transaction.server?.name ? `<div>Server: ${transaction.server.name}</div>` : ''}
        ${transaction.cashier?.name ? `<div>Kasir: ${transaction.cashier.name}</div>` : ''}
      </div>
      
      <div class="items">
        ${items.map(item => `
          <div class="item">
            <div class="item-name">${item.service.name}</div>
            <div class="item-detail">
              <span>${item.quantity} x ${formatCurrency(item.service.price)}</span>
              <span>${formatCurrency(item.service.price * item.quantity)}</span>
            </div>
          </div>
        `).join('')}
      </div>
      
      <div class="totals">
        <div class="total-row">
          <span>Subtotal:</span>
          <span>${formatCurrency(subtotal)}</span>
        </div>
        ${discount > 0 ? `
          <div class="total-row">
            <span>Diskon:</span>
            <span>-${formatCurrency(discount)}</span>
          </div>
        ` : ''}
        <div class="total-row grand-total">
          <span>TOTAL:</span>
          <span>${formatCurrency(total)}</span>
        </div>
        <div class="total-row">
          <span>Metode:</span>
          <span>${transaction.payment_method.toUpperCase()}</span>
        </div>
      </div>
      
      <div class="footer">
        ${template?.footer_text || 'Terima kasih atas kunjungan Anda!'}
        <br>
        ${template?.footer_note || 'Semoga hari Anda menyenangkan!'}
      </div>
    </body>
    </html>
  `
}

/**
 * Generate receipt text for thermal printer
 * 
 * @param data - Receipt data
 * @returns Plain text receipt
 */
export function generateReceiptText(data: ReceiptData): string {
  const { transaction, items, template, branch, subtotal, discount, total } = data
  
  const storeName = template?.store_name || branch?.name || "Pigtown Barbershop"
  const storeAddress = template?.store_address || branch?.address || ""
  const storePhone = template?.store_phone || branch?.phone || ""
  
  const width = 32 // Character width for thermal printer
  const line = "=".repeat(width)
  const dashLine = "-".repeat(width)
  
  let receipt = ""
  
  // Header
  receipt += centerText(storeName, width) + "\n"
  if (storeAddress) receipt += centerText(storeAddress, width) + "\n"
  if (storePhone) receipt += centerText(`Telp: ${storePhone}`, width) + "\n"
  receipt += line + "\n"
  
  // Transaction info
  receipt += `No: ${transaction.transaction_number}\n`
  receipt += `Tanggal: ${new Date(transaction.created_at).toLocaleString('id-ID')}\n`
  if (transaction.customer_name) receipt += `Customer: ${transaction.customer_name}\n`
  if (transaction.server?.name) receipt += `Server: ${transaction.server.name}\n`
  if (transaction.cashier?.name) receipt += `Kasir: ${transaction.cashier.name}\n`
  receipt += dashLine + "\n"
  
  // Items
  items.forEach(item => {
    receipt += `${item.service.name}\n`
    const qty = `${item.quantity} x ${formatCurrency(item.service.price)}`
    const itemTotal = formatCurrency(item.service.price * item.quantity)
    receipt += padLine(qty, itemTotal, width) + "\n"
  })
  receipt += dashLine + "\n"
  
  // Totals
  receipt += padLine("Subtotal:", formatCurrency(subtotal), width) + "\n"
  if (discount > 0) {
    receipt += padLine("Diskon:", `-${formatCurrency(discount)}`, width) + "\n"
  }
  receipt += line + "\n"
  receipt += padLine("TOTAL:", formatCurrency(total), width) + "\n"
  receipt += padLine("Metode:", transaction.payment_method.toUpperCase(), width) + "\n"
  receipt += line + "\n"
  
  // Footer
  receipt += "\n"
  receipt += centerText(template?.footer_text || "Terima kasih!", width) + "\n"
  receipt += centerText(template?.footer_note || "Semoga hari Anda menyenangkan!", width) + "\n"
  receipt += "\n\n\n"
  
  return receipt
}

// ============================================================================
// TEXT FORMATTING HELPERS
// ============================================================================

/**
 * Center text within given width
 */
function centerText(text: string, width: number): string {
  const padding = Math.max(0, Math.floor((width - text.length) / 2))
  return " ".repeat(padding) + text
}

/**
 * Pad line with spaces between left and right text
 */
function padLine(left: string, right: string, width: number): string {
  const spaces = Math.max(1, width - left.length - right.length)
  return left + " ".repeat(spaces) + right
}

// ============================================================================
// PRINTING FUNCTIONS
// ============================================================================

/**
 * Print receipt using browser print dialog
 * 
 * @param data - Receipt data
 */
export function printReceipt(data: ReceiptData): void {
  const html = generateReceiptHTML(data)
  
  // Create hidden iframe
  const iframe = document.createElement('iframe')
  iframe.style.display = 'none'
  document.body.appendChild(iframe)
  
  // Write HTML to iframe
  const doc = iframe.contentWindow?.document
  if (doc) {
    doc.open()
    doc.write(html)
    doc.close()
    
    // Wait for content to load, then print
    iframe.contentWindow?.focus()
    setTimeout(() => {
      iframe.contentWindow?.print()
      
      // Remove iframe after printing
      setTimeout(() => {
        document.body.removeChild(iframe)
      }, 1000)
    }, 250)
  }
}

// ============================================================================
// BLUETOOTH PRINTING
// ============================================================================

/**
 * Convert text to ESC/POS commands for thermal printer
 * 
 * @param text - Text to convert
 * @returns Uint8Array of ESC/POS commands
 */
function textToESCPOS(text: string): Uint8Array {
  const encoder = new TextEncoder()
  const encoded = encoder.encode(text)
  
  // ESC/POS commands
  const ESC = 0x1B
  const GS = 0x1D
  
  // Initialize printer
  const init = new Uint8Array([ESC, 0x40])
  
  // Cut paper (if supported)
  const cut = new Uint8Array([GS, 0x56, 0x00])
  
  // Combine all commands
  const result = new Uint8Array(init.length + encoded.length + cut.length)
  result.set(init, 0)
  result.set(encoded, init.length)
  result.set(cut, init.length + encoded.length)
  
  return result
}

/**
 * Print receipt via Bluetooth thermal printer
 * 
 * @param data - Receipt data
 * @param device - Bluetooth device
 * @returns Promise that resolves when printing is complete
 */
export async function printViaBluetooth(
  data: ReceiptData,
  device: BluetoothDevice
): Promise<void> {
  if (!device || !device.gatt?.connected) {
    throw new Error("Printer Bluetooth tidak terhubung")
  }
  
  try {
    // Get GATT server and services
    const server = device.gatt
    const services = await server.getPrimaryServices()
    
    // Find writable characteristic
    let characteristic: BluetoothRemoteGATTCharacteristic | null = null
    
    for (const service of services) {
      const characteristics = await service.getCharacteristics()
      
      for (const char of characteristics) {
        if (char.properties.write || char.properties.writeWithoutResponse) {
          characteristic = char
          break
        }
      }
      
      if (characteristic) break
    }
    
    if (!characteristic) {
      throw new Error("Tidak dapat menemukan characteristic yang dapat ditulis pada printer")
    }
    
    // Generate receipt text
    const receiptText = generateReceiptText(data)
    
    // Convert to ESC/POS commands
    const commands = textToESCPOS(receiptText)
    
    // Send to printer in chunks (max 512 bytes per write)
    const chunkSize = 512
    for (let i = 0; i < commands.length; i += chunkSize) {
      const chunk = commands.slice(i, Math.min(i + chunkSize, commands.length))
      await characteristic.writeValue(chunk)
      
      // Small delay between chunks
      await new Promise(resolve => setTimeout(resolve, 50))
    }
    
  } catch (error) {
    console.error("Error printing via Bluetooth:", error)
    throw error
  }
}

/**
 * Check if browser supports Bluetooth
 * 
 * @returns True if Bluetooth is supported
 */
export function isBluetoothSupported(): boolean {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator
}

/**
 * Request Bluetooth device (printer)
 * 
 * @returns Promise with Bluetooth device
 */
export async function requestBluetoothDevice(): Promise<BluetoothDevice> {
  if (!isBluetoothSupported()) {
    throw new Error("Browser Anda tidak mendukung Bluetooth. Gunakan Chrome atau Edge.")
  }
  
  try {
    const device = await navigator.bluetooth.requestDevice({
      // Accept all devices (printers don't have standard service UUID)
      acceptAllDevices: true,
      optionalServices: ['generic_access', 'generic_attribute']
    })
    
    return device
  } catch (error) {
    console.error("Error requesting Bluetooth device:", error)
    throw new Error("Gagal memilih printer. Pastikan Bluetooth aktif.")
  }
}

/**
 * Connect to Bluetooth device
 * 
 * @param device - Bluetooth device to connect
 * @returns Promise that resolves when connected
 */
export async function connectBluetoothDevice(device: BluetoothDevice): Promise<void> {
  try {
    await device.gatt?.connect()
  } catch (error) {
    console.error("Error connecting to Bluetooth device:", error)
    throw new Error("Gagal terhubung ke printer. Pastikan printer dalam jangkauan.")
  }
}

/**
 * Disconnect from Bluetooth device
 * 
 * @param device - Bluetooth device to disconnect
 */
export function disconnectBluetoothDevice(device: BluetoothDevice): void {
  if (device && device.gatt?.connected) {
    device.gatt.disconnect()
  }
}
