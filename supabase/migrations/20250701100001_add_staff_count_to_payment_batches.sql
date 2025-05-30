-- Add staff_count column if it doesn't exist
ALTER TABLE public.payment_batches 
ADD COLUMN IF NOT EXISTS staff_count INTEGER DEFAULT 0;

-- Update the submit_payment_batch function to include staff_count
CREATE OR REPLACE FUNCTION public.submit_payment_batch(
    p_project_id UUID,
    p_payment_date DATE,
    p_batch_reference TEXT,
    p_company_name TEXT,
    p_company_registration_number TEXT,
    p_company_bank_account TEXT,
    p_payment_method TEXT,
    p_payments JSONB,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_batch_id UUID;
    v_total_amount DECIMAL(15, 2) := 0;
    v_staff_count INTEGER := 0;
    v_payment JSONB;
    v_item_id UUID;
    v_result JSONB;
BEGIN
    -- Calculate total amount and staff count
    v_staff_count := jsonb_array_length(p_payments);
    FOR v_payment IN SELECT jsonb_array_elements(p_payments)
    LOOP
        v_total_amount := v_total_amount + (v_payment->>'amount')::DECIMAL;
    END LOOP;
    
    -- Create the payment batch
    INSERT INTO payment_batches (
        project_id,
        batch_reference,
        created_by,
        payment_date,
        total_amount,
        staff_count,
        company_name,
        company_registration_number,
        company_bank_account,
        payment_method,
        notes
    ) VALUES (
        p_project_id,
        p_batch_reference,
        auth.uid(),
        p_payment_date,
        v_total_amount,
        v_staff_count,
        p_company_name,
        p_company_registration_number,
        p_company_bank_account,
        p_payment_method,
        p_notes
    )
    RETURNING id INTO v_batch_id;
    
    -- Insert payment items
    FOR v_payment IN SELECT jsonb_array_elements(p_payments)
    LOOP
        INSERT INTO payment_items (
            batch_id,
            staff_id,
            staff_name,
            bank_code,
            bank_account_number,
            amount,
            reference,
            description,
            payment_details
        ) VALUES (
            v_batch_id,
            (v_payment->>'staff_id')::UUID,
            v_payment->>'staff_name',
            v_payment->>'bank_code',
            v_payment->>'bank_account_number',
            (v_payment->>'amount')::DECIMAL,
            v_payment->>'reference',
            v_payment->>'description',
            v_payment
        )
        RETURNING id INTO v_item_id;
    END LOOP;
    
    -- Record the action in the approval history
    INSERT INTO payment_approval_history (
        batch_id,
        user_id,
        action,
        notes
    ) VALUES (
        v_batch_id,
        auth.uid(),
        'created',
        p_notes
    );
    
    -- Return the result
    SELECT jsonb_build_object(
        'success', true,
        'batch_id', v_batch_id,
        'total_amount', v_total_amount,
        'staff_count', v_staff_count,
        'items_count', jsonb_array_length(p_payments)
    ) INTO v_result;
    
    RETURN v_result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- Create a trigger to update staff_count when payment_items are added/removed
CREATE OR REPLACE FUNCTION update_payment_batch_staff_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'DELETE' THEN
        UPDATE payment_batches
        SET staff_count = (
            SELECT COUNT(DISTINCT staff_id)
            FROM payment_items
            WHERE batch_id = COALESCE(NEW.batch_id, OLD.batch_id)
        )
        WHERE id = COALESCE(NEW.batch_id, OLD.batch_id);
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS update_batch_staff_count ON payment_items;
CREATE TRIGGER update_batch_staff_count
AFTER INSERT OR DELETE ON payment_items
FOR EACH ROW
EXECUTE FUNCTION update_payment_batch_staff_count();

-- Update existing batches to have correct staff_count
UPDATE payment_batches pb
SET staff_count = (
    SELECT COUNT(DISTINCT staff_id)
    FROM payment_items pi
    WHERE pi.batch_id = pb.id
)
WHERE staff_count IS NULL OR staff_count = 0;