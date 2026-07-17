// jsdom test environment does not provide TextEncoder/TextDecoder by default,
// but lib/utils/receipt-helpers.ts (ESC/POS encoding for Bluetooth printers)
// relies on the standard Web API TextEncoder that is available in real browsers.
const { TextEncoder, TextDecoder } = require('util')

if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder
}
