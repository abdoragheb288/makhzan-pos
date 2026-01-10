# Makhzan POS System

نظام متكامل لإدارة نقاط البيع والمخزون للملابس.

## 🚀 التشغيل المحلي

### Backend
```bash
cd backend
npm install
cp .env.example .env
# عدل .env بقاعدة بياناتك
npm run db:push
npm run db:seed
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 🌐 الرفع أونلاين (Deployment)

### 1. قاعدة البيانات (Neon)
1. اذهب لـ [neon.tech](https://neon.tech)
2. سجل حساب مجاني
3. أنشئ Project جديد
4. انسخ Connection String

### 2. الباكيند (Render)
1. اذهب لـ [render.com](https://render.com)
2. New → Web Service
3. اربط GitHub repo (مجلد backend)
4. أضف Environment Variables:
   - `DATABASE_URL` = من Neon
   - `JWT_SECRET` = كلمة سر قوية
   - `NODE_ENV` = production

### 3. الفرونت (Vercel)
1. اذهب لـ [vercel.com](https://vercel.com)
2. Import Project من GitHub
3. حدد مجلد frontend
4. أضف Environment Variable:
   - `VITE_API_URL` = https://your-app.onrender.com/api

---

## 📦 المميزات
- نقطة بيع (POS)
- إدارة المخزون
- إدارة الفروع
- إدارة الموظفين والصلاحيات
- نظام الورديات
- التقارير والتحليلات
- نظام التقسيط
