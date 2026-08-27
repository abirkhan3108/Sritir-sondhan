স্মৃতি সংরক্ষণ — Admin Dashboard (Login Fix)

ফাইল:
- admin.html — Admin Dashboard
- config.js — Supabase project URL + publishable key
- supabase_setup.sql — database, RLS ও storage setup

ব্যবহার:
1) Supabase-এ supabase_setup.sql একবার Run করুন।
2) Authentication > Users-এ Admin user Confirmed আছে নিশ্চিত করুন।
3) admin.html খুলে Admin email/password দিয়ে Login করুন।
4) Login error হলে এবার error message সরাসরি Login box-এর নিচে দেখা যাবে।

নোট: Password বা secret key কাউকে শেয়ার করবেন না।
