-- Add Update Policy for Cards
-- Allow authenticated users to update cards linked to their profiles
CREATE POLICY "Users can update their own linked cards" 
ON public.cards 
FOR UPDATE 
TO authenticated 
USING (
    profile_uid IN (
        SELECT id FROM public.profiles WHERE clerk_user_id = (select auth.jwt() ->> 'sub')
    )
)
WITH CHECK (
    -- Allow setting profile_uid to NULL (delinking)
    profile_uid IS NULL
    OR 
    -- Or re-assigning to another profile they own
    profile_uid IN (
        SELECT id FROM public.profiles WHERE clerk_user_id = (select auth.jwt() ->> 'sub')
    )
);

-- Also allow activated cards to be read by anyone (already exists as public read)
