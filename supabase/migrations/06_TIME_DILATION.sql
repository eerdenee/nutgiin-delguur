-- TIME DILATION MIGRATION

-- Scheduled Notifications (for dopamine loop)
CREATE TABLE IF NOT EXISTS scheduled_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL,
    user_id UUID,
    message_template TEXT NOT NULL,
    notification_type TEXT NOT NULL,
    scheduled_for TIMESTAMPTZ NOT NULL,
    sent_at TIMESTAMPTZ,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own scheduled notifications" ON scheduled_notifications;
CREATE POLICY "Users view own scheduled notifications" ON scheduled_notifications 
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can manage notifications" ON scheduled_notifications;
CREATE POLICY "System can manage notifications" ON scheduled_notifications 
    FOR ALL USING (true);

-- Index for cron job
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_pending 
    ON scheduled_notifications(scheduled_for, status) 
    WHERE status = 'pending';

SELECT 'Time Dilation migration completed!' as result;
