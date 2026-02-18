# 📋 คู่มือการตั้งค่า Google Apps Script API

## 🔍 วิธีหา Script ID และคีย์ทั้งหมด

### 1. การหา Script ID

**วิธีที่ 1: จาก Google Apps Script Editor**
1. เปิด Google Apps Script project
2. ไปที่เมนู **Deployments** (หรือ **Deploy** > **New deployment**)
3. คลิก **Select type** > **Web app**
4. ในหน้า Deployment settings จะเห็น **Web app URL**
5. Script ID อยู่ใน URL: `https://script.google.com/macros/s/[SCRIPT_ID]/exec`

**วิธีที่ 2: จาก Project Settings**
1. ใน Apps Script Editor ไปที่ **Project Settings** (⚙️)
2. ดูในส่วน **Script ID**
3. คัดลอก Script ID ที่แสดง

### 2. การ Deploy เป็น Web App

**ขั้นตอนการ Deploy:**
1. ใน Apps Script Editor คลิก **Deploy** > **New deployment**
2. เลือก **Web app**
3. ตั้งค่าต่อไปนี้:
   - **Description**: Procurement Dashboard API
   - **Execute as**: Me (your email)
   - **Who has access**: Anyone
4. คลิก **Deploy**
5. **Authorize access** และ **Allow**
6. คัดลอก **Web app URL** ที่ได้

### 3. การตั้งค่า CORS

**เพิ่มโค้ดนี้ใน Apps Script:**
```javascript
function doPost(e) {
  try {
    // Enable CORS
    const output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);
    
    // Set CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    };
    
    // Handle preflight OPTIONS request
    if (e.request.method === 'OPTIONS') {
      output.setContent(JSON.stringify({ status: 'success', message: 'CORS enabled' }));
      Object.keys(headers).forEach(key => {
        output.addHeader(key, headers[key]);
      });
      return output;
    }
    
    // Your existing code here...
    
  } catch (error) {
    // Error handling with CORS
  }
}
```

### 4. การตั้งค่า Environment Variables

**สร้างไฟล์ `.env` ในโปรเจค:**
```env
# Google Apps Script URL (แทนที่ YOUR_SCRIPT_ID)
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_ACTUAL_SCRIPT_ID_HERE/exec

# Google Sheets ID (optional)
VITE_SHEET_ID=1ZmrD930kvZOcO9LSw0URFdl9KV35pcaUIXR5kuOCaD4

# Database Configuration (ถ้ามี)
VITE_DATABASE_API_URL=http://localhost:3000/api
VITE_DATABASE_API_KEY=your_api_key_here
VITE_DATABASE_ENDPOINT=/sheet-configs

# Development
VITE_NODE_ENV=development
```

### 5. การทดสอบการเชื่อมต่อ

**ทดสอบด้วย curl:**
```bash
curl -X POST "YOUR_WEB_APP_URL" \
  -H "Content-Type: application/json" \
  -d '{"action":"test"}'
```

**หรือทดสอบใน Browser:**
```javascript
fetch('YOUR_WEB_APP_URL', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'test' })
})
.then(res => res.json())
.then(console.log)
```

## 🚨 ข้อควรระวัง

1. **Permission**: ต้องตั้งค่า "Who has access" เป็น **Anyone**
2. **CORS**: ต้องเพิ่ม CORS headers ใน Apps Script
3. **Redeploy**: แก้ไขโค้ดต้อง Deploy ใหม่ทุกครั้ง
4. **URL**: ใช้ Web app URL ไม่ใช่ Script ID

## 📝 ตัวอย่าง URL ที่ถูกต้อง

✅ **ถูกต้อง:**
```
https://script.google.com/macros/s/AKfycbygQDleEqGVxoi-pOkXMo-R94OewQn_FPNALCnUnRLHp4K5SAUWBWXV3WOnlWOdR7lz/exec
```

❌ **ผิด:**
```
https://script.google.com/macros/s/YOUR_SCRIPT_ID_HERE/exec
```

## 🔧 การแก้ไขปัญหาที่พบบ่อย

1. **403 Forbidden**: ตรวจสอบการตั้งค่า "Who has access"
2. **CORS Error**: เพิ่ม CORS headers ใน Apps Script
3. **404 Not Found**: ตรวจสอบว่า Deploy สำเร็จหรือไม่
4. **Network Error**: ตรวจสอบ URL ว่าถูกต้องหรือไม่
