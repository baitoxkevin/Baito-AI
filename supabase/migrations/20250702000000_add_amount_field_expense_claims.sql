-- Add amount field to expense_claims table if it doesn't exist
ALTER TABLE public.expense_claims 
ADD COLUMN IF NOT EXISTS amount DECIMAL(10, 2) NOT NULL DEFAULT 0;

-- Update existing records to populate amount with total_amount
UPDATE public.expense_claims 
SET amount = total_amount 
WHERE amount = 0 AND total_amount > 0;