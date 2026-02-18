# 🔧 คู่มือแก้ไข Google Apps Script URL

## ❌ URL ปัจจุบัน (ผิด)
```
https://script.google.com/macros/library/d/****
```

## ✅ URL ที่ถูกต้องต้องเป็น
```
https://script.google.com/macros/s/YOUR_ACTUAL_SCRIPT_ID/exec
```

## 🔍 วิธีหา Script ID ที่ถูกต้อง

### 1. จาก Google Apps Script Editor
1. เปิด Google Apps Script project ของคุณ
2. ไปที่เมนู **Deploy** > **Deployments**
3. หา Deployment ที่เป็น **Web app**
4. คัดลอก **Web app URL** ทั้งหมด
5. Script ID อยู่ใน URL ระหว่าง `/s/` และ `/exec`

### 2. จาก Project Settings
1. ใน Apps Script Editor ไปที่ **Project Settings** (⚙️)
2. ดูในส่วน **Script ID**
3. คัดลอก Script ID ที่แสดง

### 3. จาก URL ปัจจุบัน (ถ้ามี Deployment แล้ว)
ถ้าคุณมี URL แบบ `/library/d/` ให้:
1. ไปที่ **Deploy** > **Deployments**
2. หา Web app deployment ที่ active
3. คัดลอก URL ที่ขึ้นต้นด้วย `/macros/s/`

## 🚀 วิธี Deploy Web App ใหม่

### ขั้นตอนการ Deploy:
1. **เปิด Google Apps Script**
2. **คลิก Deploy** > **New deployment**
3. **เลือก Web app**
4. **ตั้งค่า:**
   - Description: Procurement Dashboard API
   - Execute as: Me (your email)
   - Who has access: **Anyone**
5. **คลิก Deploy**
6. **Authorize access** และ **Allow**
7. **คัดลอก Web app URL** ที่ได้

## 📝 ตัวอย่าง URL ที่ถูกต้อง

✅ **ถูกต้อง:**
```
https://script.google.com/macros/s/AKfycbygQDleEqGVxoi-pOkXMo-R94OewQn_FPNALCnUnRLHp4K5SAUWBWXV3WOnlWOdR7lz/exec
```

❌ **ผิด:**
```
https://script.google.com/macros/library/d/****
https://script.google.com/macros/s/YOUR_SCRIPT_ID_HERE
```

## 🔧 การแก้ไข .env

แทนที่บรรทัดนี้ใน .env:
```env
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/library/d/****
```

ด้วย:
```env
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_ACTUAL_SCRIPT_ID_HERE/exec
```

## 🧪 การทดสอบ

หลังจากแก้ไข URL:
1. **รีสตาร์ท development server**
2. **ลอง import ข้อมูล**
3. **ตรวจสอบว่าไม่มี error "API URL ยังไม่ถูกตั้งค่า"**

## 🚨 ข้อควรระวัง

1. **Script ID ต้องเป็นของ Web app deployment** ไม่ใช่ library ID
2. **ต้อง Deploy เป็น Web app** ไม่ใช่แค่ save script
3. **Who has access ต้องเป็น Anyone** ถึงจะเรียกใช้จาก web ได้
4. **ต้องใช้ URL แบบ `/s/.../exec`** ไม่ใช่ `/library/d/`
