-- Payment Queue System Migration
-- This migration creates tables for managing payment batches, payments, and approval workflow

-- Create payment batches table to track groups of payments
CREATE TABLE IF NOT EXISTS public.payment_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_reference TEXT NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    payment_date DATE NOT NULL,
    total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processing', 'completed', 'cancelled')),
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    exported_at TIMESTAMPTZ,
    exported_by UUID REFERENCES auth.users(id),
    company_bank_account TEXT,
    company_name TEXT,
    company_registration_number TEXT,
    batch_details JSONB DEFAULT '{}'::jsonb,
    payment_method TEXT DEFAULT 'bank_transfer' CHECK (payment_method IN ('bank_transfer', 'duitnow', 'cash', 'cheque')),
    notes TEXT,
    CONSTRAINT unique_batch_reference UNIQUE (batch_reference)
);

-- Create payments table to track individual payments within a batch
CREATE TABLE IF NOT EXISTS public.payment_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES public.payment_batches(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL,
    staff_name TEXT NOT NULL,
    bank_code TEXT,
    bank_account_number TEXT,
    amount DECIMAL(15, 2) NOT NULL,
    reference TEXT,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processing', 'completed', 'cancelled')),
    payment_details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create an approval history table to track the approval workflow
CREATE TABLE IF NOT EXISTS public.payment_approval_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES public.payment_batches(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    action TEXT NOT NULL CHECK (action IN ('created', 'approved', 'rejected', 'cancelled', 'exported', 'edited', 'completed')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.payment_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_approval_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Payment Batches policies
CREATE POLICY "Payment batches are viewable by authenticated users" 
ON public.payment_batches FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Payment batches can be created by authenticated users" 
ON public.payment_batches FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Payment batches can be updated by their creator or approvers" 
ON public.payment_batches FOR UPDATE 
TO authenticated 
USING (
    auth.uid() = created_by 
    OR auth.uid() IN (
        SELECT user_id FROM public.approvers 
        WHERE resource_type = 'payment_batch'
    )
);

-- Payment Items policies
CREATE POLICY "Payment items are viewable by authenticated users" 
ON public.payment_items FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Payment items can be created by authenticated users" 
ON public.payment_items FOR INSERT 
TO authenticated 
WITH CHECK (
    batch_id IN (
        SELECT id FROM public.payment_batches 
        WHERE created_by = auth.uid()
    )
);

CREATE POLICY "Payment items can be updated by batch creator or approvers" 
ON public.payment_items FOR UPDATE 
TO authenticated 
USING (
    batch_id IN (
        SELECT id FROM public.payment_batches 
        WHERE created_by = auth.uid()
        OR auth.uid() IN (
            SELECT user_id FROM public.approvers 
            WHERE resource_type = 'payment_batch'
        )
    )
);

-- Payment Approval History policies
CREATE POLICY "Payment approval history is viewable by authenticated users" 
ON public.payment_approval_history FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Payment approval history can be created by authenticated users" 
ON public.payment_approval_history FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

-- Create a function to submit a payment batch
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
    v_payment JSONB;
    v_item_id UUID;
    v_result JSONB;
BEGIN
    -- Calculate total amount
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

-- Function to approve a payment batch
CREATE OR REPLACE FUNCTION public.approve_payment_batch(
    p_batch_id UUID,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_batch_exists BOOLEAN;
    v_result JSONB;
BEGIN
    -- Check if batch exists and is in pending status
    SELECT EXISTS (
        SELECT 1 
        FROM payment_batches 
        WHERE id = p_batch_id 
        AND status = 'pending'
    ) INTO v_batch_exists;
    
    IF NOT v_batch_exists THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Batch not found or not in pending status'
        );
    END IF;
    
    -- Update the batch status
    UPDATE payment_batches
    SET 
        status = 'approved',
        approved_by = auth.uid(),
        approved_at = now()
    WHERE id = p_batch_id;
    
    -- Update all payment items to approved
    UPDATE payment_items
    SET status = 'approved'
    WHERE batch_id = p_batch_id;
    
    -- Record the action in the approval history
    INSERT INTO payment_approval_history (
        batch_id,
        user_id,
        action,
        notes
    ) VALUES (
        p_batch_id,
        auth.uid(),
        'approved',
        p_notes
    );
    
    -- Return the result
    SELECT jsonb_build_object(
        'success', true,
        'batch_id', p_batch_id,
        'status', 'approved'
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

-- Function to reject a payment batch
CREATE OR REPLACE FUNCTION public.reject_payment_batch(
    p_batch_id UUID,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_batch_exists BOOLEAN;
    v_result JSONB;
BEGIN
    -- Check if batch exists and is in pending status
    SELECT EXISTS (
        SELECT 1 
        FROM payment_batches 
        WHERE id = p_batch_id 
        AND status = 'pending'
    ) INTO v_batch_exists;
    
    IF NOT v_batch_exists THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Batch not found or not in pending status'
        );
    END IF;
    
    -- Update the batch status
    UPDATE payment_batches
    SET status = 'rejected'
    WHERE id = p_batch_id;
    
    -- Update all payment items to rejected
    UPDATE payment_items
    SET status = 'rejected'
    WHERE batch_id = p_batch_id;
    
    -- Record the action in the approval history
    INSERT INTO payment_approval_history (
        batch_id,
        user_id,
        action,
        notes
    ) VALUES (
        p_batch_id,
        auth.uid(),
        'rejected',
        p_notes
    );
    
    -- Return the result
    SELECT jsonb_build_object(
        'success', true,
        'batch_id', p_batch_id,
        'status', 'rejected'
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

-- Function to mark a payment batch as exported
CREATE OR REPLACE FUNCTION public.mark_payment_batch_exported(
    p_batch_id UUID,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_batch_exists BOOLEAN;
    v_result JSONB;
BEGIN
    -- Check if batch exists and is in approved status
    SELECT EXISTS (
        SELECT 1 
        FROM payment_batches 
        WHERE id = p_batch_id 
        AND status = 'approved'
    ) INTO v_batch_exists;
    
    IF NOT v_batch_exists THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Batch not found or not in approved status'
        );
    END IF;
    
    -- Update the batch status
    UPDATE payment_batches
    SET 
        status = 'processing',
        exported_at = now(),
        exported_by = auth.uid()
    WHERE id = p_batch_id;
    
    -- Update all payment items to processing
    UPDATE payment_items
    SET status = 'processing'
    WHERE batch_id = p_batch_id;
    
    -- Record the action in the approval history
    INSERT INTO payment_approval_history (
        batch_id,
        user_id,
        action,
        notes
    ) VALUES (
        p_batch_id,
        auth.uid(),
        'exported',
        p_notes
    );
    
    -- Return the result
    SELECT jsonb_build_object(
        'success', true,
        'batch_id', p_batch_id,
        'status', 'processing'
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

-- Function to mark a payment batch as completed
CREATE OR REPLACE FUNCTION public.mark_payment_batch_completed(
    p_batch_id UUID,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_batch_exists BOOLEAN;
    v_result JSONB;
BEGIN
    -- Check if batch exists and is in processing status
    SELECT EXISTS (
        SELECT 1 
        FROM payment_batches 
        WHERE id = p_batch_id 
        AND status = 'processing'
    ) INTO v_batch_exists;
    
    IF NOT v_batch_exists THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Batch not found or not in processing status'
        );
    END IF;
    
    -- Update the batch status
    UPDATE payment_batches
    SET status = 'completed'
    WHERE id = p_batch_id;
    
    -- Update all payment items to completed
    UPDATE payment_items
    SET status = 'completed'
    WHERE batch_id = p_batch_id;
    
    -- Record the action in the approval history
    INSERT INTO payment_approval_history (
        batch_id,
        user_id,
        action,
        notes
    ) VALUES (
        p_batch_id,
        auth.uid(),
        'completed',
        p_notes
    );
    
    -- Return the result
    SELECT jsonb_build_object(
        'success', true,
        'batch_id', p_batch_id,
        'status', 'completed'
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

-- Function to get payment batches
CREATE OR REPLACE FUNCTION public.get_payment_batches(
    p_status TEXT DEFAULT NULL,
    p_project_id UUID DEFAULT NULL,
    p_created_by UUID DEFAULT NULL,
    p_from_date DATE DEFAULT NULL,
    p_to_date DATE DEFAULT NULL,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    batch_reference TEXT,
    project_id UUID,
    project_name TEXT,
    created_by UUID,
    created_by_name TEXT,
    created_at TIMESTAMPTZ,
    payment_date DATE,
    total_amount DECIMAL(15, 2),
    status TEXT,
    approved_by UUID,
    approved_by_name TEXT,
    approved_at TIMESTAMPTZ,
    exported_at TIMESTAMPTZ,
    exported_by UUID,
    exported_by_name TEXT,
    company_bank_account TEXT,
    company_name TEXT,
    company_registration_number TEXT,
    payment_method TEXT,
    notes TEXT,
    items_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pb.id,
        pb.batch_reference,
        pb.project_id,
        p.title AS project_name,
        pb.created_by,
        creator.email AS created_by_name,
        pb.created_at,
        pb.payment_date,
        pb.total_amount,
        pb.status,
        pb.approved_by,
        approver.email AS approved_by_name,
        pb.approved_at,
        pb.exported_at,
        pb.exported_by,
        exporter.email AS exported_by_name,
        pb.company_bank_account,
        pb.company_name,
        pb.company_registration_number,
        pb.payment_method,
        pb.notes,
        COUNT(pi.id) AS items_count
    FROM 
        payment_batches pb
    LEFT JOIN 
        projects p ON pb.project_id = p.id
    LEFT JOIN 
        auth.users creator ON pb.created_by = creator.id
    LEFT JOIN 
        auth.users approver ON pb.approved_by = approver.id
    LEFT JOIN 
        auth.users exporter ON pb.exported_by = exporter.id
    LEFT JOIN 
        payment_items pi ON pb.id = pi.batch_id
    WHERE 
        (p_status IS NULL OR pb.status = p_status) AND
        (p_project_id IS NULL OR pb.project_id = p_project_id) AND
        (p_created_by IS NULL OR pb.created_by = p_created_by) AND
        (p_from_date IS NULL OR pb.payment_date >= p_from_date) AND
        (p_to_date IS NULL OR pb.payment_date <= p_to_date)
    GROUP BY 
        pb.id, 
        pb.batch_reference, 
        pb.project_id, 
        p.title, 
        pb.created_by, 
        creator.email, 
        pb.created_at, 
        pb.payment_date, 
        pb.total_amount, 
        pb.status, 
        pb.approved_by, 
        approver.email, 
        pb.approved_at, 
        pb.exported_at, 
        pb.exported_by, 
        exporter.email, 
        pb.company_bank_account, 
        pb.company_name, 
        pb.company_registration_number, 
        pb.payment_method, 
        pb.notes
    ORDER BY 
        pb.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Function to get payment batch details
CREATE OR REPLACE FUNCTION public.get_payment_batch_details(
    p_batch_id UUID
)
RETURNS TABLE (
    batch_id UUID,
    batch_reference TEXT,
    project_id UUID,
    project_name TEXT,
    created_by UUID,
    created_by_name TEXT,
    created_at TIMESTAMPTZ,
    payment_date DATE,
    total_amount DECIMAL(15, 2),
    status TEXT,
    approved_by UUID,
    approved_by_name TEXT,
    approved_at TIMESTAMPTZ,
    exported_at TIMESTAMPTZ,
    exported_by UUID,
    exported_by_name TEXT,
    company_bank_account TEXT,
    company_name TEXT,
    company_registration_number TEXT,
    payment_method TEXT,
    notes TEXT,
    payment_items JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pb.id AS batch_id,
        pb.batch_reference,
        pb.project_id,
        p.title AS project_name,
        pb.created_by,
        creator.email AS created_by_name,
        pb.created_at,
        pb.payment_date,
        pb.total_amount,
        pb.status,
        pb.approved_by,
        approver.email AS approved_by_name,
        pb.approved_at,
        pb.exported_at,
        pb.exported_by,
        exporter.email AS exported_by_name,
        pb.company_bank_account,
        pb.company_name,
        pb.company_registration_number,
        pb.payment_method,
        pb.notes,
        COALESCE(
            (
                SELECT 
                    jsonb_agg(
                        jsonb_build_object(
                            'id', pi.id,
                            'staff_id', pi.staff_id,
                            'staff_name', pi.staff_name,
                            'bank_code', pi.bank_code,
                            'bank_account_number', pi.bank_account_number,
                            'amount', pi.amount,
                            'reference', pi.reference,
                            'description', pi.description,
                            'status', pi.status,
                            'payment_details', pi.payment_details,
                            'created_at', pi.created_at,
                            'updated_at', pi.updated_at
                        )
                    )
                FROM 
                    payment_items pi
                WHERE 
                    pi.batch_id = pb.id
            ),
            '[]'::jsonb
        ) AS payment_items
    FROM 
        payment_batches pb
    LEFT JOIN 
        projects p ON pb.project_id = p.id
    LEFT JOIN 
        auth.users creator ON pb.created_by = creator.id
    LEFT JOIN 
        auth.users approver ON pb.approved_by = approver.id
    LEFT JOIN 
        auth.users exporter ON pb.exported_by = exporter.id
    WHERE 
        pb.id = p_batch_id;
END;
$$;

-- Function to get payment batch approval history
CREATE OR REPLACE FUNCTION public.get_payment_batch_history(
    p_batch_id UUID
)
RETURNS TABLE (
    id UUID,
    batch_id UUID,
    user_id UUID,
    user_email TEXT,
    action TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pah.id,
        pah.batch_id,
        pah.user_id,
        u.email AS user_email,
        pah.action,
        pah.notes,
        pah.created_at
    FROM 
        payment_approval_history pah
    LEFT JOIN 
        auth.users u ON pah.user_id = u.id
    WHERE 
        pah.batch_id = p_batch_id
    ORDER BY 
        pah.created_at DESC;
END;
$$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_batches_project_id ON public.payment_batches(project_id);
CREATE INDEX IF NOT EXISTS idx_payment_batches_created_by ON public.payment_batches(created_by);
CREATE INDEX IF NOT EXISTS idx_payment_batches_status ON public.payment_batches(status);
CREATE INDEX IF NOT EXISTS idx_payment_batches_payment_date ON public.payment_batches(payment_date);
CREATE INDEX IF NOT EXISTS idx_payment_items_batch_id ON public.payment_items(batch_id);
CREATE INDEX IF NOT EXISTS idx_payment_items_staff_id ON public.payment_items(staff_id);
CREATE INDEX IF NOT EXISTS idx_payment_approval_history_batch_id ON public.payment_approval_history(batch_id);

-- Create view for payment batch summaries
CREATE OR REPLACE VIEW public.payment_batch_summaries AS
SELECT 
    pb.id AS batch_id,
    pb.batch_reference,
    pb.project_id,
    p.title AS project_name,
    pb.created_by,
    u.email AS created_by_email,
    pb.created_at,
    pb.payment_date,
    pb.status,
    pb.total_amount,
    COUNT(pi.id) AS items_count,
    MIN(pi.created_at) AS first_item_created_at,
    MAX(pi.updated_at) AS last_item_updated_at
FROM 
    payment_batches pb
LEFT JOIN 
    projects p ON pb.project_id = p.id
LEFT JOIN 
    auth.users u ON pb.created_by = u.id
LEFT JOIN 
    payment_items pi ON pb.id = pi.batch_id
GROUP BY 
    pb.id, pb.batch_reference, pb.project_id, p.title, pb.created_by, u.email, 
    pb.created_at, pb.payment_date, pb.status, pb.total_amount
ORDER BY 
    pb.created_at DESC;

-- Add types to database.types.ts next