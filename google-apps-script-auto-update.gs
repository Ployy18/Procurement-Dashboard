// Google Apps Script for Auto-Update Forecast Data
// Copy this code to your Google Sheets Script Editor

// 1. Open Google Sheets
// 2. Go to Extensions > Apps Script
// 3. Paste this code
// 4. Save and run createTrigger() function

// Auto-update function for Google Sheets
function updateForecastData() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('df_HEADER');
  const data = sheet.getDataRange().getValues();
  
  // Skip header row
  const rows = data.slice(1);
  
  // Process data
  const processedData = rows.map(row => ({
    poDate: row[0], // PO Date column
    totalAmount: row[1], // Total Amount column
    month: new Date(row[0]).toLocaleDateString('en-US', { month: 'short' }),
    year: new Date(row[0]).getFullYear().toString()
  }));
  
  // Group by month and year
  const monthlyData = {};
  processedData.forEach(item => {
    const key = `${item.month} ${item.year}`;
    if (!monthlyData[key]) {
      monthlyData[key] = 0;
    }
    monthlyData[key] += parseFloat(item.totalAmount) || 0;
  });
  
  // Convert to array format
  const result = Object.keys(monthlyData).map(key => {
    const [month, year] = key.split(' ');
    return {
      month: month,
      year: year,
      actual: monthlyData[key],
      forecast: null
    };
  }).sort((a, b) => {
    // Sort by year then month
    const yearDiff = parseInt(a.year) - parseInt(b.year);
    if (yearDiff !== 0) return yearDiff;
    
    const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month);
  });
  
  // Update data in the component (this would be called via API)
  return result;
}

// Set up automatic trigger
function createTrigger() {
  // Run every hour when new data might be added
  ScriptApp.newTrigger('updateForecastData')
    .timeBased()
    .everyHours(1)
    .create();
}

// Webhook for real-time updates
function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const updatedData = updateForecastData();
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    data: updatedData,
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

// Function to send data to React app
function sendToReactApp() {
  const data = updateForecastData();
  const webhookUrl = 'YOUR_REACT_APP_WEBHOOK_URL'; // Replace with your actual webhook URL
  
  UrlFetchApp.fetch(webhookUrl, {
    method: 'POST',
    contentType: 'application/json',
    payload: JSON.stringify({
      type: 'UPDATE_DATA',
      data: data,
      timestamp: new Date().toISOString()
    })
  });
}

// Trigger on sheet edit
function onEdit(e) {
  const sheet = e.source.getActiveSheet();
  if (sheet.getName() === 'df_HEADER') {
    // Send update when df_HEADER is edited
    sendToReactApp();
  }
}

// Trigger on form submit (if using Google Forms)
function onFormSubmit(e) {
  // Send update when new form is submitted
  sendToReactApp();
}
