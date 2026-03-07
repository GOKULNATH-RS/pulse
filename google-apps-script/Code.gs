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
  
  var recommendationsHtml = "";
  if (p.recommendations && p.recommendations.length > 0) {
    recommendationsHtml = '<h2 style="color: #1a1a2e; font-size: 20px; margin-top: 30px;">Recommended For You</h2>';
    recommendationsHtml += '<div style="display: flex; flex-wrap: wrap; gap: 16px; margin-top: 16px;">';
    
    p.recommendations.forEach(function(rec) {
      recommendationsHtml += '<div style="flex: 1; min-width: 200px; border: 1px solid #e0e0e0; border-radius: 12px; padding: 16px; text-align: center;">';
      recommendationsHtml += '<h3 style="color: #1a1a2e; font-size: 16px; margin: 8px 0;">' + escapeHtml(rec.productName) + '</h3>';
      recommendationsHtml += '<p style="color: #16213e; font-size: 18px; font-weight: bold;">$' + rec.price.toFixed(2) + '</p>';
      recommendationsHtml += '<p style="color: #666; font-size: 12px;">' + escapeHtml(rec.reason) + '</p>';
      recommendationsHtml += '</div>';
    });
    
    recommendationsHtml += '</div>';
  }
  
  var discountHtml = "";
  if (p.discount) {
    discountHtml = '<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">';
    discountHtml += '<h2 style="font-size: 24px; margin: 0 0 8px 0;">Special Offer!</h2>';
    discountHtml += '<p style="font-size: 36px; font-weight: bold; margin: 0;">' + p.discount.percentage + '% OFF</p>';
    discountHtml += '<p style="margin: 8px 0 0 0;">' + escapeHtml(p.discount.description) + '</p>';
    discountHtml += '<p style="background: rgba(255,255,255,0.2); display: inline-block; padding: 8px 16px; border-radius: 8px; margin-top: 12px; font-family: monospace; font-size: 18px;">' + escapeHtml(p.discount.code) + '</p>';
    discountHtml += '</div>';
  }
  
  var inventoryHtml = "";
  if (p.inventoryAlerts && p.inventoryAlerts.length > 0) {
    inventoryHtml = '<div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 12px; margin: 16px 0;">';
    inventoryHtml += '<strong style="color: #856404;">⚡ Limited Stock Alert</strong>';
    p.inventoryAlerts.forEach(function(alert) {
      inventoryHtml += '<p style="color: #856404; margin: 4px 0 0 0; font-size: 14px;">' + escapeHtml(alert) + '</p>';
    });
    inventoryHtml += '</div>';
  }
  
  var cartHtml = "";
  if (p.cartReminder && p.cartReminder.length > 0) {
    cartHtml = '<h2 style="color: #1a1a2e; font-size: 20px; margin-top: 30px;">Your Cart Items</h2>';
    cartHtml += '<table style="width: 100%; border-collapse: collapse; margin-top: 12px;">';
    cartHtml += '<tr style="background: #f8f9fa;"><th style="padding: 10px; text-align: left;">Product</th><th style="padding: 10px; text-align: center;">Qty</th><th style="padding: 10px; text-align: right;">Price</th></tr>';
    
    var total = 0;
    p.cartReminder.forEach(function(item) {
      var itemTotal = item.price * item.quantity;
      total += itemTotal;
      cartHtml += '<tr><td style="padding: 10px; border-top: 1px solid #e0e0e0;">' + escapeHtml(item.productName) + '</td>';
      cartHtml += '<td style="padding: 10px; border-top: 1px solid #e0e0e0; text-align: center;">' + item.quantity + '</td>';
      cartHtml += '<td style="padding: 10px; border-top: 1px solid #e0e0e0; text-align: right;">$' + itemTotal.toFixed(2) + '</td></tr>';
    });
    
    cartHtml += '<tr style="font-weight: bold;"><td colspan="2" style="padding: 10px; border-top: 2px solid #1a1a2e;">Total</td>';
    cartHtml += '<td style="padding: 10px; border-top: 2px solid #1a1a2e; text-align: right;">$' + total.toFixed(2) + '</td></tr>';
    cartHtml += '</table>';
  }
  
  var html = '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin: 0; padding: 0; background: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif;">';
  html += '<div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">';
  
  // Header
  html += '<div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 32px; text-align: center;">';
  html += '<h1 style="color: white; font-size: 28px; margin: 0;">⚡ Pulse</h1>';
  html += '<p style="color: #a0aec0; margin: 8px 0 0 0;">Your Personal Shopping Assistant</p>';
  html += '</div>';
  
  // Body
  html += '<div style="padding: 32px;">';
  html += '<p style="color: #333; font-size: 16px; line-height: 1.6;">' + escapeHtml(p.greeting) + '</p>';
  
  html += cartHtml;
  html += discountHtml;
  html += inventoryHtml;
  html += recommendationsHtml;
  
  // CTA Button
  html += '<div style="text-align: center; margin-top: 32px;">';
  html += '<a href="' + escapeHtml(p.ctaUrl) + '" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: bold;">' + escapeHtml(p.ctaText) + '</a>';
  html += '</div>';
  
  html += '</div>';
  
  // Footer
  html += '<div style="background: #f8f9fa; padding: 24px; text-align: center; color: #666; font-size: 12px;">';
  html += '<p>Powered by Pulse Email Campaign Optimizer</p>';
  html += '<p>You received this because of your activity on our platform.</p>';
  html += '</div>';
  
  html += '</div></body></html>';
  
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
