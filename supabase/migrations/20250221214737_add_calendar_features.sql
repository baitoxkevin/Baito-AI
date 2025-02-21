ALTER TABLE projects
ADD COLUMN is_all_day boolean DEFAULT false,
ADD COLUMN repeat_option text DEFAULT 'does-not-repeat' CHECK (repeat_option IN ('does-not-repeat', 'daily', 'weekly', 'monthly', 'yearly')),
ADD COLUMN guest_permissions jsonb DEFAULT '{"modify": false, "invite": true, "see_guest_list": true}'::jsonb;
