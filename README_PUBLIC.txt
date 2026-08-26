স্মৃতি সংরক্ষণ — Final Public Website

ফাইল:
- index.html — সাধারণ দর্শকদের জন্য Public Website
- admin.html — Admin Dashboard
- config.js — Supabase project URL + publishable key
- supabase_setup.sql — database, RLS ও Storage setup

যা আছে:
- নাম দিয়ে Search
- পিতা/স্বামীর নাম
- ঠিকানা
- বয়স
- মৃত্যুর তারিখ
- মৃত্যুর কারণ
- Passport-style photo
- বিস্তারিত তথ্য modal
- Mobile + Desktop responsive design
- Public শুধু দেখতে পারবে
- Admin login করে Add/Edit/Delete করতে পারবে

Deploy:
1) Supabase SQL Editor-এ supabase_setup.sql একবার Run করুন (যদি প্রয়োজনীয় columns/policies আগে থেকেই করা থাকে, script safe IF NOT EXISTS ব্যবহার করে)।
2) Authentication > Users-এ Admin user Confirmed আছে নিশ্চিত করুন।
3) ZIP-এর সব ফাইল Netlify-তে deploy করুন।
4) Public site: /index.html
5) Admin: /admin.html

গুরুত্বপূর্ণ:
config.js-এ শুধু Publishable/Anon key ব্যবহার করুন। service_role/secret key কখনো browser code-এ দেবেন না।
