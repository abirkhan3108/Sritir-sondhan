স্মৃতি সংরক্ষণ — Admin APK project

এই ZIP-এ Android/Capacitor build-এর জন্য সম্পূর্ণ project setup দেওয়া হয়েছে।

1. GitHub repository-তে ZIP-এর ফাইলগুলো upload করুন।
2. GitHub Actions workflow build-apk.yml ব্যবহার করবে।
3. Supabase-এ supabase_setup.sql আগে Run করা হয়ে থাকলে supabase_dashboard_migration.sql একবার Run করুন।
4. Admin login দিয়ে APK-তে ঢুকুন।
5. ছবি bucket: person-photos
6. Profile table: public.profiles

নোট: config.js-এ Supabase URL ও publishable key আছে। Password/secret key এখানে রাখা হয়নি।
