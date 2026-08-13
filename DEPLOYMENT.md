# 🚀 دليل النشر — د. كريم الليثي على Hostinger Business Plan

## نظرة عامة على المعمارية

```
Hostinger hPanel
└── Node.js Web App (server/)
    ├── يخدم API على:        /api/v1/*
    └── يخدم Frontend على:   /* (من dist/)
```

الـ Express server يخدم **كل شيء**: الـ API والـ React frontend معاً من نفس الـ Node.js process.

---

## الخطوة 1 — تجهيز الكود محلياً

```bash
# في مجلد المشروع الجذري
npm run build
```

يجب أن ينتهي بـ `✓ built in ...ms` وينشئ مجلد `dist/`.

---

## الخطوة 2 — إعداد قاعدة البيانات في hPanel

1. افتح **hPanel** → **Databases** → **MySQL Databases**
2. اضغط **Create a new MySQL database**
3. سجّل البيانات:
   ```
   DB_NAME=     (مثال: u123456_drkareem)
   DB_USER=     (مثال: u123456_druser)
   DB_PASSWORD= (اختار باسورد قوي)
   DB_HOST=     localhost
   DB_PORT=     3306
   ```

---

## الخطوة 3 — رفع الملفات (Git أو FTP)

### Git (الأفضل)
1. في **hPanel** → **Git** → **Create repository**
2. الملفات التالية مش هترفعها (موجودة في `.gitignore`):
   - `node_modules/`
   - `dist/`
   - `.env`

### FTP (بديل)
ارفع كل المشروع ما عدا `node_modules/` و`dist/` و`.env`

---

## الخطوة 4 — إعداد Node.js App في hPanel

1. افتح **hPanel** → **Advanced** → **Node.js**
2. اضغط **Create Application**:
   ```
   Node.js version:          18.x أو أحدث
   Application mode:         Production
   Application root:         /server
   Application URL:          /
   Application startup file: src/server.js
   ```

---

## الخطوة 5 — إعداد Environment Variables

في صفحة الـ Node.js App → **Environment Variables**:

```
DB_HOST            = localhost
DB_PORT            = 3306
DB_NAME            = u123456_drkareem
DB_USER            = u123456_druser
DB_PASSWORD        = your_strong_password
DB_LOGGING         = false
NODE_ENV           = production
PORT               = 3000
HOST               = 0.0.0.0
TRUST_PROXY        = true
CORS_ORIGINS       = https://your-site.hostingersite.com
AUTH_REQUIRED      = true
AUTH_TOKEN_SECRET  = (64 حرف عشوائي — من random.org)
AUTH_SETUP_TOKEN   = (توكين عشوائي لمرة واحدة لإنشاء حساب الطبيب — احذفه بعد الاستخدام)
DEFAULT_TENANT_SLUG = dr-kareem
DAILY_PROVIDER_MODE = mock
```

> AUTH_TOKEN_SECRET لازم يكون 32 حرف على الأقل!
> لا تحط localhost في CORS_ORIGINS في production!

---

## الخطوة 6 — Install + Build على السيرفر (SSH)

```bash
# Dependencies الـ frontend
cd ~/domains/your-site.com
npm install
npm run build

# Dependencies الـ backend
cd server
npm install --production
```

---

## الخطوة 7 — تشغيل Database Migrations (SSH)

```bash
cd ~/domains/your-site.com/server
npm run db:migrate
```

يجب أن تنتهي بـ: `All migrations applied.`

---

## الخطوة 8 — Seed Data (SSH)

```bash
cd ~/domains/your-site.com/server
node scripts/seed.js
```

---

## الخطوة 9 — إنشاء حساب الطبيب (مرة واحدة)

الـ seed لا ينشئ حساب تسجيل دخول. بعد تشغيل التطبيق:

```bash
curl -H "Authorization: Bearer $AUTH_SETUP_TOKEN" \
  https://your-site.hostingersite.com/api/v1/health/init-doctor
```

- يرجع `credentials.email` + `credentials.password` (عشوائي) — غيّرها من أول دخول.
- ثم **احذف** `AUTH_SETUP_TOKEN` من الـ env vars وشغّل Restart (بعدها الإيندبوينت بيتعطل تلقائياً).

---

## الخطوة 10 — Start التطبيق

**hPanel** → **Node.js** → اضغط **Start** أو **Restart**

---

## التحقق من نجاح الـ Deploy

```
1. GET https://your-site.hostingersite.com/api/v1/health
   → يرجع: { "data": { "status": "ok", "db": "up" } }

2. https://your-site.hostingersite.com
   → الـ homepage يفتح

3. https://your-site.hostingersite.com/assessment
   → صفحة التقييم (SPA routing)

4. https://your-site.hostingersite.com/login
   → صفحة الدخول
```

---

## أخطاء شائعة

| الخطأ | الحل |
|-------|------|
| `AUTH_TOKEN_SECRET must be configured` | تأكد أنه 32+ حرف في env vars |
| `CORS_ORIGINS must contain production origin` | شيل localhost، حط الـ domain الفعلي |
| `Database unavailable` | تحقق من DB_HOST/NAME/USER/PASSWORD |
| `Cannot find dist/index.html` | شغّل `npm run build` في الجذر أولاً |

---

## عند شراء الدومين الفعلي

عدّل في env vars:
```
CORS_ORIGINS = https://www.drkareem.com,https://drkareem.com
```

ثم **Restart** الـ Node.js app.
