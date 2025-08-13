-- Create goals table for tracking financial and project goals
CREATE TABLE IF NOT EXISTS goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  target_amount DECIMAL(10, 2),
  current_amount DECIMAL(10, 2) DEFAULT 0,
  goal_type TEXT CHECK (goal_type IN ('revenue', 'collection', 'project', 'custom')),
  period_type TEXT CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create invoices table for tracking company invoices
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  invoice_date DATE NOT NULL,
  quotation_number TEXT,
  client_name TEXT NOT NULL,
  project_name TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial', 'overdue', 'cancelled')),
  payment_date DATE,
  due_date DATE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create invoice_payments table for tracking partial payments
CREATE TABLE IF NOT EXISTS invoice_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT,
  reference_number TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create goal_milestones table for tracking progress milestones
CREATE TABLE IF NOT EXISTS goal_milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  milestone_date DATE NOT NULL,
  target_amount DECIMAL(10, 2),
  actual_amount DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better query performance
CREATE INDEX idx_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX idx_invoices_payment_status ON invoices(payment_status);
CREATE INDEX idx_invoices_client_name ON invoices(client_name);
CREATE INDEX idx_goals_status ON goals(status);
CREATE INDEX idx_goals_period ON goals(start_date, end_date);

-- Create RLS policies
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_milestones ENABLE ROW LEVEL SECURITY;

-- Goals policies
CREATE POLICY "Users can view all goals" ON goals
  FOR SELECT USING (true);

CREATE POLICY "Users can create goals" ON goals
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own goals" ON goals
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own goals" ON goals
  FOR DELETE USING (auth.uid() = created_by);

-- Invoices policies
CREATE POLICY "Users can view all invoices" ON invoices
  FOR SELECT USING (true);

CREATE POLICY "Users can create invoices" ON invoices
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update invoices" ON invoices
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete invoices" ON invoices
  FOR DELETE USING (true);

-- Invoice payments policies
CREATE POLICY "Users can view all invoice payments" ON invoice_payments
  FOR SELECT USING (true);

CREATE POLICY "Users can create invoice payments" ON invoice_payments
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update invoice payments" ON invoice_payments
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete invoice payments" ON invoice_payments
  FOR DELETE USING (true);

-- Goal milestones policies
CREATE POLICY "Users can view all goal milestones" ON goal_milestones
  FOR SELECT USING (true);

CREATE POLICY "Users can manage goal milestones" ON goal_milestones
  FOR ALL USING (true);

-- Create function to update goal progress based on invoices
CREATE OR REPLACE FUNCTION update_goal_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Update revenue goals based on invoice amounts
  UPDATE goals
  SET current_amount = (
    SELECT COALESCE(SUM(amount), 0)
    FROM invoices
    WHERE invoice_date >= goals.start_date 
    AND invoice_date <= goals.end_date
    AND payment_status = 'paid'
  )
  WHERE goal_type = 'revenue'
  AND status = 'active';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update goals when invoices change
CREATE TRIGGER update_goals_on_invoice_change
AFTER INSERT OR UPDATE OR DELETE ON invoices
FOR EACH STATEMENT
EXECUTE FUNCTION update_goal_progress();

-- Create trigger to update goals when payments change
CREATE TRIGGER update_goals_on_payment_change
AFTER INSERT OR UPDATE OR DELETE ON invoice_payments
FOR EACH STATEMENT
EXECUTE FUNCTION update_goal_progress();