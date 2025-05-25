-- Clear all payment-related data
-- This migration removes all existing payment data as the logic needs to be redesigned

-- Delete all payment approval history
DELETE FROM public.payment_approval_history;

-- Delete all payment items
DELETE FROM public.payment_items;

-- Delete all payment batches
DELETE FROM public.payment_batches;

-- Delete payment-related activity logs
DELETE FROM public.activity_logs 
WHERE action IN ('export_payment_data', 'submit_payment_batch', 'approve_payment', 'reject_payment');

-- Add a comment to indicate the tables are cleared
COMMENT ON TABLE public.payment_batches IS 'Payment system is being redesigned - table cleared on 2025-05-26';
COMMENT ON TABLE public.payment_items IS 'Payment system is being redesigned - table cleared on 2025-05-26';
COMMENT ON TABLE public.payment_approval_history IS 'Payment system is being redesigned - table cleared on 2025-05-26';