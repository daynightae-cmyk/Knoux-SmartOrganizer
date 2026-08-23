# إعداد التطبيق المحمول - Knoux SmartOrganizer

## إعداد Capacitor للتطبيق المحمول الأصلي

### تثبيت Capacitor

```bash
# تثبيت Capacitor
npm install @capacitor/core @capacitor/cli

# تثبيت المنصات المطلوبة
npm install @capacitor/android @capacitor/ios

# تثبيت الإضافات المطلوبة
npm install @capacitor/app @capacitor/haptics @capacitor/keyboard @capacitor/status-bar
npm install @capacitor/splash-screen @capacitor/camera @capacitor/filesystem
npm install @capacitor/device @capacitor/geolocation @capacitor/local-notifications
npm install @capacitor/push-notifications @capacitor/share @capacitor/storage
```

### تهيئة Capacitor

```bash
# تهيئة المشروع
npx cap init

# إضافة المنصات
npx cap add android
npx cap add ios

# بناء التطبيق
npm run build

# نسخ الملفات للمنصات
npx cap sync

# فتح في Android Studio
npx cap open android

# فتح في Xcode
npx cap open ios
```

## الإضافات المطلوبة

### 1. Camera Plugin

- التقاط الصور
- الوصول لمعرض الصور
- معاينة الصور

### 2. Filesystem Plugin

- حفظ الصور
- إدارة الملفات
- تصدير البيانات

### 3. Geolocation Plugin

- تحديد الموقع
- ربط الصور بالمواقع
- خرائط الصور

### 4. Local Notifications

- إشعارات اكتمال التحليل
- تذكيرات التنظيم
- إشعارات الصور الجديدة

### 5. Push Notifications

- إشعارات المزامنة
- تحديثات التطبيق
- مشاركة الألبومات

### 6. Share Plugin

- مشاركة الصور
- تصدير الألبومات
- مشاركة الروابط

### 7. Storage Plugin

- حفظ البيانات المحلية
- إعدادات المستخدم
- ذاكرة التخزين المؤقت

## إعدادات الأمان

### Android (android/app/src/main/AndroidManifest.xml)

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.VIBRATE" />
```

### iOS (ios/App/App/Info.plist)

```xml
<key>NSCameraUsageDescription</key>
<string>This app needs access to camera to take photos</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>This app needs access to photo library to organize photos</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>This app needs access to location to tag photos</string>
```

## بناء التطبيق للإنتاج

### Android

```bash
# بناء APK للتطوير
npx cap build android

# بناء AAB للمتجر
cd android
./gradlew bundleRelease
```

### iOS

```bash
# بناء للتطوير
npx cap build ios

# فتح في Xcode للنشر
npx cap open ios
```

## ميزات التطبيق المحمول

### 1. تحليل محلي بالكامل

- تشغيل AI models محلياً
- عدم الحاجة للاتصال بالإنترنت
- خصوصية كاملة للبيانات

### 2. تزامن السحابة (اختياري)

- نسخ احتياطي للصور
- مزامنة عبر الأجهزة
- مشاركة الألبومات

### 3. واجهة محمولة محسنة

- تصميم responsive
- إيماءات اللمس
- تحسين الأداء

### 4. معالجة متقدمة

- تحليل في الخلفية
- معالجة دفعية
- أولويات المعالجة

### 5. إشعارات ذكية

- اكتمال التحليل
- اكتشاف الصور المكررة
- اقتراحات التنظيم

## أدوات التطوير

### التطوير والاختبار

```bash
# تشغيل في المتصفح
npm run dev

# تشغيل على أندرويد
npx cap run android

# تشغيل على iOS
npx cap run ios

# تحديث الملفات
npx cap sync
```

### النشر

```bash
# بناء للإنتاج
npm run build

# نسخ للمنصات
npx cap copy

# تحديث native dependencies
npx cap update
```

## إعدادات الأداء

### تحسين الصور

- ضغط الصور تلقائياً
- أحجام مختلفة للمعاينة
- تحميل تدريجي

### إدارة الذاكرة

- تحرير الذاكرة بعد المعالجة
- cache محدود الحجم
- تنظيف الملفات المؤقتة

### تحسين البطارية

- معالجة عند الشحن
- وضع توفير الطاقة
- تعليق المعالجة عند انخفاض البطارية

## الاختبار

### اختبار الوحدة

```bash
npm test
```

### اختبار التطبيق المحمول

```bash
# اختبار Android
npx cap run android --target=emulator

# اختبار iOS
npx cap run ios --target=simulator
```

### اختبار الأداء

- قياس سرعة التحليل
- استخدام الذاكرة
- استهلاك البطارية

هذا الملف يوضح خطة شاملة لتحويل التطبيق إلى تطبيق محمول أصلي باستخدام Capacitor.
