স্মৃতি সংরক্ষণ — Final Admin Dashboard

Admin:
1) /admin.html খুলুন।
2) Supabase Authentication-এর confirmed Admin email/password দিয়ে login করুন।
3) নাম, পিতা/স্বামী, ঠিকানা, বয়স, মৃত্যুর তারিখ, মৃত্যুর কারণ ও ছবি দিন।
4) Save করুন।
5) তালিকা থেকে Edit/Delete করা যাবে।

নোট:
- বর্তমান Persons table-এর id যদি int8/identity হয়, Admin code নতুন id নিজে বানায় না; database-এর identity id ব্যবহার করে।
- Public website-এ সবাই তথ্য দেখতে পারবে।
- Add/Edit/Delete শুধু authenticated Admin session-এর জন্য RLS policy দিয়ে অনুমোদিত।
