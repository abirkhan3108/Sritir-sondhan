-- =========================================
-- স্মৃতি সংরক্ষণ
-- profiles table RLS FIX
-- =========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- পুরনো একই নামের policy থাকলে মুছে দাও
DROP POLICY IF EXISTS "public can read profiles" ON public.profiles;
DROP POLICY IF EXISTS "authenticated can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "authenticated can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "authenticated can delete profiles" ON public.profiles;

-- সবাই Profile দেখতে পারবে
CREATE POLICY "public can read profiles"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (true);

-- Login করা Admin Profile যোগ করতে পারবে
CREATE POLICY "authenticated can insert profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Login করা Admin Profile Edit করতে পারবে
CREATE POLICY "authenticated can update profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Login করা Admin Profile Delete করতে পারবে
CREATE POLICY "authenticated can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (true);


-- =========================================
-- PHOTO STORAGE FIX
-- =========================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "public can view profile photos" ON storage.objects;
DROP POLICY IF EXISTS "authenticated can upload profile photos" ON storage.objects;
DROP POLICY IF EXISTS "authenticated can update profile photos" ON storage.objects;
DROP POLICY IF EXISTS "authenticated can delete profile photos" ON storage.objects;

CREATE POLICY "public can view profile photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profile-photos');

CREATE POLICY "authenticated can upload profile photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-photos');

CREATE POLICY "authenticated can update profile photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-photos')
WITH CHECK (bucket_id = 'profile-photos');

CREATE POLICY "authenticated can delete profile photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'profile-photos');
