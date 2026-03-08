/**
 * Google Apps Script - Email Campaign Engine for Pulse
 * 
 * Deploy this as a Google Apps Script Web App to handle email generation and delivery.
 * 
 * Setup Instructions:
 * 1. Go to https://script.google.com
 * 2. Create a new project
 * 3. Paste this code into Code.gs
 * 4. Deploy as Web App (Execute as: Me, Access: Anyone)
 * 5. Copy the deployment URL to your .env.local GOOGLE_APPS_SCRIPT_URL
 */

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    
    var htmlContent = generateEmailHtml(payload);
    
    // Send email using Gmail
    GmailApp.sendEmail(
      payload.to,
      payload.subject,
      stripHtml(htmlContent), // Plain text fallback
      {
        htmlBody: htmlContent,
        name: "Pulse Campaign",
      }
    );
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, message: "Email sent" }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ status: "Pulse Email Engine is running" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function generateEmailHtml(payload) {
  var p = payload.personalization;
  var esc = escapeHtml;

  // ── Cart section ──────────────────────────────────────────────────────────
  var cartHtml = "";
  if (p.cartReminder && p.cartReminder.length > 0) {
    var total = 0;
    var cartRows = "";
    p.cartReminder.forEach(function(item) {
      var lineTotal = item.price * item.quantity;
      total += lineTotal;
      cartRows += '<tr>'
        + '<td style="padding:12px 16px;font-size:14px;color:#374151;border-top:1px solid #e5e7eb;">' + esc(item.productName) + '</td>'
        + '<td style="padding:12px 16px;font-size:14px;color:#374151;text-align:center;border-top:1px solid #e5e7eb;width:60px;">' + item.quantity + '</td>'
        + '<td style="padding:12px 16px;font-size:14px;color:#374151;text-align:right;border-top:1px solid #e5e7eb;width:90px;">$' + lineTotal.toFixed(2) + '</td>'
        + '</tr>';
    });
    cartHtml = '<p style="margin:0 0 10px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;">Your cart</p>'
      + '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #e5e7eb;margin-bottom:28px;">'
      + '<tr style="background:#f9fafb;">'
      + '<td style="padding:10px 16px;font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;">Product</td>'
      + '<td style="padding:10px 16px;font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;text-align:center;width:60px;">Qty</td>'
      + '<td style="padding:10px 16px;font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;text-align:right;width:90px;">Price</td>'
      + '</tr>'
      + cartRows
      + '<tr style="background:#f9fafb;">'
      + '<td colspan="2" style="padding:12px 16px;font-size:14px;font-weight:600;color:#111827;border-top:2px solid #e5e7eb;">Total</td>'
      + '<td style="padding:12px 16px;font-size:15px;font-weight:700;color:#111827;text-align:right;border-top:2px solid #e5e7eb;">$' + total.toFixed(2) + '</td>'
      + '</tr>'
      + '</table>';
  }

  // ── Discount section ──────────────────────────────────────────────────────
  var discountHtml = "";
  if (p.discount) {
    discountHtml = '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f9fafb;border:1px solid #e5e7eb;margin-bottom:28px;">'
      + '<tr><td style="padding:24px 28px;">'
      + '<p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.06em;">Special offer</p>'
      + '<p style="margin:0 0 8px;font-size:28px;font-weight:700;color:#111827;line-height:1;">' + p.discount.percentage + '% off</p>'
      + '<p style="margin:0 0 16px;font-size:14px;color:#6b7280;">' + esc(p.discount.description) + '</p>'
      + '<span style="display:inline-block;background:#ffffff;border:1.5px dashed #d1d5db;padding:8px 16px;font-size:16px;font-weight:700;color:#111827;letter-spacing:0.1em;font-family:monospace;">' + esc(p.discount.code) + '</span>'
      + '</td></tr>'
      + '</table>';
  }

  // ── Inventory alerts ──────────────────────────────────────────────────────
  var inventoryHtml = "";
  if (p.inventoryAlerts && p.inventoryAlerts.length > 0) {
    var alertLines = "";
    p.inventoryAlerts.forEach(function(alert) {
      alertLines += '<p style="margin:4px 0 0;font-size:13px;color:#c2410c;">' + esc(alert) + '</p>';
    });
    inventoryHtml = '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#fff7ed;border:1px solid #fed7aa;margin-bottom:28px;">'
      + '<tr><td style="padding:14px 16px;">'
      + '<p style="margin:0 0 2px;font-size:12px;font-weight:600;color:#c2410c;text-transform:uppercase;letter-spacing:0.05em;">Low stock</p>'
      + alertLines
      + '</td></tr>'
      + '</table>';
  }

  // ── Recommendations ───────────────────────────────────────────────────────
  var recommendationsHtml = "";
  if (p.recommendations && p.recommendations.length > 0) {
    var recCells = "";
    p.recommendations.forEach(function(rec, index) {
      if (index > 0) {
        recCells += '<td style="width:16px;font-size:0;line-height:0;">&nbsp;</td>';
      }
      recCells += '<td valign="top" style="border:1px solid #e5e7eb;padding:16px;text-align:center;">'
        + '<p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#111827;">' + esc(rec.productName) + '</p>'
        + '<p style="margin:0 0 6px;font-size:18px;font-weight:700;color:#111827;">$' + rec.price.toFixed(2) + '</p>'
        + '<p style="margin:0;font-size:12px;color:#9ca3af;">' + esc(rec.reason) + '</p>'
        + '</td>';
    });
    recommendationsHtml = '<p style="margin:0 0 10px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;">Picked for you</p>'
      + '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:28px;">'
      + '<tr>' + recCells + '</tr>'
      + '</table>';
  }

  // ── Full template ─────────────────────────────────────────────────────────
  var html = '<!DOCTYPE html><html>'
    + '<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>'
    + '<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;">'
    + '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f3f4f6;">'
    + '<tr><td align="center" style="padding:40px 16px;">'
    + '<table cellpadding="0" cellspacing="0" border="0" width="560" style="background:#ffffff;border:1px solid #e5e7eb;">'

    // Header
    + '<tr><td style="padding:28px 40px 20px;border-bottom:1px solid #f3f4f6;">'
    + '<p style="margin:0;font-size:20px;font-weight:800;color:#111827;letter-spacing:-0.5px;">Pulse</p>'
    + '</td></tr>'

    // Body
    + '<tr><td style="padding:36px 40px;">'
    + '<p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#374151;">' + esc(p.greeting) + '</p>'
    + cartHtml
    + discountHtml
    + inventoryHtml
    + recommendationsHtml

    // CTA
    + '<table cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td align="center">'
    + '<a href="' + esc(p.ctaUrl) + '" style="display:inline-block;background:#111827;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:13px 32px;letter-spacing:0.01em;">'
    + esc(p.ctaText)
    + '</a>'
    + '</td></tr></table>'
    + '</td></tr>'

    // Footer
    + '<tr><td style="padding:20px 40px;border-top:1px solid #f3f4f6;">'
    + '<p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5;">You\'re receiving this because of your recent activity on Pulse. &copy; 2026 Pulse.</p>'
    + '</td></tr>'

    + '</table>'
    + '</td></tr></table>'
    + '</body></html>';

  return html;
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

// Test function for development
function testEmailGeneration() {
  var testPayload = {
    to: "test@example.com",
    userName: "Test User",
    subject: "You left items in your cart!",
    triggerType: "abandoned_cart",
    personalization: {
      greeting: "Good afternoon, Test User! It looks like you left some great items in your cart.",
      recommendations: [
        { productId: "p1", productName: "Wireless Headphones", price: 79.99, category: "Electronics", reason: "Complements items in your cart" },
        { productId: "p6", productName: "Bluetooth Speaker", price: 59.99, category: "Electronics", reason: "Complements items in your cart" }
      ],
      discount: { code: "PULSE10ABCD", percentage: 10, validUntil: Date.now() + 604800000, description: "10% off your next order" },
      inventoryAlerts: ["Smartwatch - Only 10 left in stock!"],
      cartReminder: [
        { productId: "p2", productName: "Running Shoes", price: 129.99, quantity: 1, addedAt: Date.now() }
      ],
      ctaUrl: "https://shop.example.com",
      ctaText: "Complete Your Purchase"
    }
  };
  
  var html = generateEmailHtml(testPayload);
  Logger.log(html);
}
