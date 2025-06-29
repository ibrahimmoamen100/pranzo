نظام إدارة منتجات متكامل مع حفظ تلقائي للبيانات في ملف JSON.

## المميزات الجديدة

✅ **حفظ تلقائي للمنتجات**: عند إضافة منتج جديد في صفحة المسؤول، يتم حفظه تلقائياً في ملف `src/data/store.json`
✅ **تحديث تلقائي**: عند تعديل أو حذف منتج، يتم تحديث الملف تلقائياً
✅ **نسخ احتياطي**: البيانات محفوظة في localStorage كنسخة احتياطية
✅ **API متكامل**: خادم Express.js لإدارة العمليات

## كيفية التشغيل

### 1. تثبيت التبعيات

```bash
npm install
```

### 2. تشغيل النظام الكامل (الخادم + التطبيق)

```bash
npm run dev:full
```

أو يمكنك تشغيلهما منفصلين:

### تشغيل الخادم فقط

```bash
npm run server
```

### تشغيل التطبيق فقط

```bash
npm run dev
```

## كيفية الاستخدام

1. **الدخول لصفحة المسؤول**: اذهب إلى `/admin`
2. **كلمة المرور**: `45086932`
3. **إضافة منتج جديد**: املأ النموذج واضغط "Add Product"
4. **التحقق من الحفظ**: ستجد المنتج محفوظ في `src/data/store.json`

## البنية التقنية

### الخادم (Server)

- **المنفذ**: 3001
- **المسارات**:
  - `POST /api/products` - إضافة منتج جديد
  - `PUT /api/products/:id` - تحديث منتج
  - `DELETE /api/products/:id` - حذف منتج
  - `POST /api/save-store` - حفظ جميع البيانات
  - `GET /api/store` - جلب جميع البيانات

### التطبيق (Frontend)

- **المنفذ**: 5173 (افتراضي لـ Vite)
- **إدارة الحالة**: Zustand
- **التخزين**: localStorage + ملف JSON

## الملفات المهمة

- `src/data/store.json` - ملف البيانات الرئيسي
- `src/server/index.ts` - خادم API
- `src/store/useStore.ts` - إدارة الحالة
- `src/pages/Admin.tsx` - صفحة المسؤول
- `src/components/ProductForm.tsx` - نموذج إضافة المنتجات

## ملاحظات مهمة

- يجب تشغيل الخادم على المنفذ 3001 لضمان عمل الحفظ التلقائي
- في حالة عدم توفر الخادم، ستُحفظ البيانات في localStorage فقط
- يتم إنشاء ملف `store.json` تلقائياً إذا لم يكن موجوداً
- جميع العمليات (إضافة، تعديل، حذف) تحدث في الوقت الفعلي

## استكشاف الأخطاء

### إذا لم يتم حفظ البيانات في الملف:

1. تأكد من تشغيل الخادم على المنفذ 3001
2. تحقق من console المتصفح للرسائل
3. تأكد من وجود صلاحيات الكتابة في مجلد المشروع

### إذا ظهرت أخطاء CORS:

- تأكد من تشغيل الخادم والتطبيق على المنافذ الصحيحة
- الخادم يدعم CORS تلقائياً

## التطوير

لإضافة مميزات جديدة:

1. أضف endpoint جديد في `src/server/index.ts`
2. حدث `useStore.ts` لاستخدام API الجديد
3. اختبر العملية في صفحة المسؤول
