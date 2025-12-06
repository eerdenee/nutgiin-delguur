-- Add missing columns to reports table
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id);
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS review_notes TEXT;

-- Create index for faster lookup
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);

SELECT 'REPORTS TABLE UPDATED!' as result;
