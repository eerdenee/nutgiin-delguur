
-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reason TEXT NOT NULL CHECK (reason IN ('illegal', 'spam', 'scam', 'other')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can create reports" 
    ON reports FOR INSERT 
    WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins can view reports" 
    ON reports FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Automated Moderation Logic (Optional Database Trigger approach)
-- This function checks if a product has 3+ unique reporters and suspends it
CREATE OR REPLACE FUNCTION check_report_threshold()
RETURNS TRIGGER AS $$
DECLARE
    report_count INT;
BEGIN
    -- Count unique reporters for this product
    SELECT COUNT(DISTINCT reporter_id) INTO report_count
    FROM reports
    WHERE product_id = NEW.product_id;

    -- If 3 or more reports, suspend the product
    IF report_count >= 3 THEN
        UPDATE products
        SET status = 'suspended',
            is_visible = false
        WHERE id = NEW.product_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create Trigger
CREATE TRIGGER on_report_created
AFTER INSERT ON reports
FOR EACH ROW
EXECUTE FUNCTION check_report_threshold();
