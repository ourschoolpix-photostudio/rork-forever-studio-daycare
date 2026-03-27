# Supabase Setup Instructions

The backup/restore feature requires a Supabase table. Follow these steps to set it up:

## 1. Create the Backups Table

Go to your Supabase project SQL Editor and run this SQL:

```sql
-- Create the backups table
CREATE TABLE IF NOT EXISTS public.backups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  backup_data JSONB NOT NULL
);

-- Create an index for faster queries
CREATE INDEX IF NOT EXISTS backups_created_at_idx ON public.backups(created_at DESC);
```

## 2. Disable Row Level Security (RLS)

For testing/development, you can disable RLS to allow full access:

```sql
-- Disable RLS on the backups table (for development/testing)
ALTER TABLE public.backups DISABLE ROW LEVEL SECURITY;
```

**Important:** This allows anyone with your anon key to access all backups. For production, you should enable RLS with proper policies (see below).

## 3. (Optional) Enable RLS with Policies for Production

If you want secure access with RLS enabled:

```sql
-- Enable RLS
ALTER TABLE public.backups ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read all backups (adjust as needed)
CREATE POLICY "Allow public read access to backups"
  ON public.backups
  FOR SELECT
  USING (true);

-- Allow anyone to create backups (adjust as needed)
CREATE POLICY "Allow public create access to backups"
  ON public.backups
  FOR INSERT
  WITH CHECK (true);

-- Allow anyone to delete backups (adjust as needed)
CREATE POLICY "Allow public delete access to backups"
  ON public.backups
  FOR DELETE
  USING (true);
```

**Note:** The policies above allow public access. In a production environment, you should restrict access based on authenticated users.

## 4. Verify the Setup

After running the SQL, you can verify the table exists:

```sql
SELECT * FROM public.backups LIMIT 1;
```

You should see "Success. No rows returned" (or rows if backups exist).

## Troubleshooting

### Error: "Network request failed"
- **Cause:** Table doesn't exist or RLS is blocking access
- **Solution:** Run the SQL commands above, especially step 2 to disable RLS

### Error: "relation 'public.backups' does not exist"
- **Cause:** Table hasn't been created yet
- **Solution:** Run the CREATE TABLE command from step 1

### Error: "permission denied"
- **Cause:** RLS is enabled and no policies allow access
- **Solution:** Either disable RLS (step 2) or add policies (step 3)

## Current Supabase Configuration

Your app is currently configured to use:
- **URL:** `https://bnirywkoktzfdwadnsdd.supabase.co`
- **Table:** `public.backups`

If you need to change these, edit `integrations/supabase/client.ts`.
