-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reason TEXT NOT NULL CHECK (reason IN ('illegal', 'spam', 'scam', 'other')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed'))
);

-- Enable RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert reports
CREATE POLICY "Authenticated users can create reports" 
ON reports FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Allow admins to view all reports (Assuming profiles table has role column)
CREATE POLICY "Admins can view all reports" 
ON reports FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_reports_product_id ON reports(product_id);
