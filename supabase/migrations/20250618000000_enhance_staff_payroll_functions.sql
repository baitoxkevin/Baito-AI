-- Add enhanced payroll functionality for staff members
-- This migration adds functions to calculate payroll summaries

-- Create helper function to get date-wise payroll totals 
CREATE OR REPLACE FUNCTION get_project_date_payroll(project_id UUID, work_date DATE)
RETURNS TABLE (
  date DATE,
  staff_count INTEGER,
  total_basic_salary DECIMAL,
  total_claims DECIMAL,
  total_commission DECIMAL,
  total_amount DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH date_staff AS (
    SELECT 
      s.id as staff_id,
      s.project_id,
      item->>'date' as date_str,
      (item->>'basicSalary')::DECIMAL as basic_salary,
      (item->>'claims')::DECIMAL as claims,
      (item->>'commission')::DECIMAL as commission
    FROM 
      project_staff s,
      jsonb_array_elements(s.working_dates_with_salary) as item
    WHERE 
      s.project_id = project_id
      AND (item->>'date')::DATE = work_date
  )
  SELECT 
    work_date as date,
    COUNT(staff_id)::INTEGER as staff_count,
    COALESCE(SUM(basic_salary), 0) as total_basic_salary,
    COALESCE(SUM(claims), 0) as total_claims,
    COALESCE(SUM(commission), 0) as total_commission,
    COALESCE(SUM(basic_salary) + SUM(claims) + SUM(commission), 0) as total_amount
  FROM 
    date_staff;
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate total project payroll
CREATE OR REPLACE FUNCTION get_project_payroll_summary(project_id UUID)
RETURNS TABLE (
  total_staff_count INTEGER,
  total_staff_with_dates INTEGER,
  total_working_days INTEGER,
  total_basic_salary DECIMAL,
  total_claims DECIMAL,
  total_commission DECIMAL,
  total_amount DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH staff_payroll AS (
    SELECT 
      s.id as staff_id,
      s.project_id,
      COUNT(item) as working_days,
      COALESCE(SUM((item->>'basicSalary')::DECIMAL), 0) as basic_salary,
      COALESCE(SUM((item->>'claims')::DECIMAL), 0) as claims,
      COALESCE(SUM((item->>'commission')::DECIMAL), 0) as commission
    FROM 
      project_staff s
      LEFT JOIN LATERAL jsonb_array_elements(s.working_dates_with_salary) as item ON true
    WHERE 
      s.project_id = project_id
    GROUP BY 
      s.id, s.project_id
  )
  SELECT 
    (SELECT COUNT(*) FROM project_staff WHERE project_id = get_project_payroll_summary.project_id)::INTEGER as total_staff_count,
    COUNT(DISTINCT staff_id)::INTEGER as total_staff_with_dates,
    COALESCE(SUM(working_days), 0)::INTEGER as total_working_days,
    COALESCE(SUM(basic_salary), 0) as total_basic_salary,
    COALESCE(SUM(claims), 0) as total_claims,
    COALESCE(SUM(commission), 0) as total_commission,
    COALESCE(SUM(basic_salary) + SUM(claims) + SUM(commission), 0) as total_amount
  FROM 
    staff_payroll;
END;
$$ LANGUAGE plpgsql;

-- Create function to get staff payroll details
CREATE OR REPLACE FUNCTION get_staff_payroll_details(staff_id UUID)
RETURNS TABLE (
  work_date DATE,
  basic_salary DECIMAL,
  claims DECIMAL,
  commission DECIMAL,
  total_amount DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (item->>'date')::DATE as work_date,
    COALESCE((item->>'basicSalary')::DECIMAL, 0) as basic_salary,
    COALESCE((item->>'claims')::DECIMAL, 0) as claims,
    COALESCE((item->>'commission')::DECIMAL, 0) as commission,
    COALESCE((item->>'basicSalary')::DECIMAL, 0) + 
    COALESCE((item->>'claims')::DECIMAL, 0) + 
    COALESCE((item->>'commission')::DECIMAL, 0) as total_amount
  FROM 
    project_staff s,
    jsonb_array_elements(s.working_dates_with_salary) as item
  WHERE 
    s.id = staff_id
  ORDER BY
    work_date ASC;
END;
$$ LANGUAGE plpgsql;

-- Create function to get staff payroll summary
CREATE OR REPLACE FUNCTION get_staff_payroll_summary(staff_id UUID)
RETURNS TABLE (
  total_working_days INTEGER,
  total_basic_salary DECIMAL,
  total_claims DECIMAL,
  total_commission DECIMAL,
  total_amount DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(item)::INTEGER as total_working_days,
    COALESCE(SUM((item->>'basicSalary')::DECIMAL), 0) as total_basic_salary,
    COALESCE(SUM((item->>'claims')::DECIMAL), 0) as total_claims,
    COALESCE(SUM((item->>'commission')::DECIMAL), 0) as total_commission,
    COALESCE(
      SUM((item->>'basicSalary')::DECIMAL) + 
      SUM((item->>'claims')::DECIMAL) + 
      SUM((item->>'commission')::DECIMAL), 
      0
    ) as total_amount
  FROM 
    project_staff s
    LEFT JOIN LATERAL jsonb_array_elements(s.working_dates_with_salary) as item ON true
  WHERE 
    s.id = staff_id;
END;
$$ LANGUAGE plpgsql;

-- Add project_staff index on project_id for faster payroll calculations
CREATE INDEX IF NOT EXISTS project_staff_project_id_idx ON project_staff(project_id);

-- Update any existing working dates to include salary information
UPDATE project_staff
SET working_dates_with_salary = (
  SELECT jsonb_agg(
    jsonb_build_object(
      'date', d,
      'basicSalary', 100.00,
      'claims', 0.00,
      'commission', 0.00
    )
  )
  FROM unnest(working_dates) AS d
)
WHERE 
  working_dates IS NOT NULL 
  AND array_length(working_dates, 1) > 0
  AND (working_dates_with_salary IS NULL OR jsonb_array_length(working_dates_with_salary) = 0);