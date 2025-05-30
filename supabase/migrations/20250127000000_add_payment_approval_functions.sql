-- Create function to approve payment batches
CREATE OR REPLACE FUNCTION public.approve_payment_batch(p_batch_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_result JSONB;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  -- Check if user is authenticated
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not authenticated'
    );
  END IF;
  
  -- Update payment batch status
  UPDATE payment_batches
  SET 
    status = 'approved',
    approved_by = v_user_id,
    approved_at = NOW(),
    updated_at = NOW()
  WHERE id = p_batch_id
    AND status = 'pending';
    
  -- Check if update was successful
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Payment batch not found or already processed'
    );
  END IF;
  
  -- Log the approval action
  INSERT INTO payment_approval_history (
    batch_id,
    user_id,
    action,
    created_at
  ) VALUES (
    p_batch_id,
    v_user_id,
    'approved',
    NOW()
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'batch_id', p_batch_id,
    'approved_at', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to reject payment batches
CREATE OR REPLACE FUNCTION public.reject_payment_batch(p_batch_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_result JSONB;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  -- Check if user is authenticated
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not authenticated'
    );
  END IF;
  
  -- Update payment batch status
  UPDATE payment_batches
  SET 
    status = 'rejected',
    approved_by = v_user_id,
    approved_at = NOW(),
    rejection_reason = p_reason,
    updated_at = NOW()
  WHERE id = p_batch_id
    AND status = 'pending';
    
  -- Check if update was successful
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Payment batch not found or already processed'
    );
  END IF;
  
  -- Log the rejection action
  INSERT INTO payment_approval_history (
    batch_id,
    user_id,
    action,
    notes,
    created_at
  ) VALUES (
    p_batch_id,
    v_user_id,
    'rejected',
    p_reason,
    NOW()
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'batch_id', p_batch_id,
    'rejected_at', NOW(),
    'reason', p_reason
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.approve_payment_batch(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_payment_batch(UUID, TEXT) TO authenticated;