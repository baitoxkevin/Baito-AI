# 🚨 IMMEDIATE FIX - Run This SQL in Supabase

## Quick Link:
👉 **[Click here to open SQL Editor](https://supabase.com/dashboard/project/aoiwrdzlichescqgnohi/sql/new)**

## Copy & Paste This SQL:

```sql
-- Create warehouse_items table
CREATE TABLE IF NOT EXISTS warehouse_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  details text,
  photo_url text,
  rack_no text,
  rack_row text,
  status text DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'maintenance', 'lost')),
  current_user_id uuid REFERENCES auth.users(id),
  current_user_name text,
  current_event text,
  current_purpose text,
  last_checkout_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Add RLS policies
ALTER TABLE warehouse_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view warehouse items"
  ON warehouse_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert warehouse items"
  ON warehouse_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update warehouse items"
  ON warehouse_items FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete warehouse items"
  ON warehouse_items FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes
CREATE INDEX idx_warehouse_items_item_id ON warehouse_items(item_id);
CREATE INDEX idx_warehouse_items_name ON warehouse_items(name);
CREATE INDEX idx_warehouse_items_rack ON warehouse_items(rack_no, rack_row);
CREATE INDEX idx_warehouse_items_status ON warehouse_items(status);

-- Create warehouse_item_transactions table
CREATE TABLE IF NOT EXISTS warehouse_item_transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id uuid REFERENCES warehouse_items(id) ON DELETE CASCADE,
  transaction_type text NOT NULL CHECK (transaction_type IN ('check_out', 'check_in')),
  user_id uuid REFERENCES auth.users(id),
  user_name text NOT NULL,
  event_name text,
  purpose text,
  expected_return_date date,
  actual_return_date date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add RLS policies for transactions
ALTER TABLE warehouse_item_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view warehouse transactions"
  ON warehouse_item_transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert warehouse transactions"
  ON warehouse_item_transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update warehouse transactions"
  ON warehouse_item_transactions FOR UPDATE
  TO authenticated
  USING (true);

-- Create indexes for transactions
CREATE INDEX idx_warehouse_transactions_item_id ON warehouse_item_transactions(item_id);
CREATE INDEX idx_warehouse_transactions_user_id ON warehouse_item_transactions(user_id);
CREATE INDEX idx_warehouse_transactions_type ON warehouse_item_transactions(transaction_type);
```

## After Running:
1. Click "Run" button
2. You should see "Success" message
3. Refresh your app
4. The "Add Item" button will now work!

## To Verify:
Run: `node check-warehouse-tables.js`

You should see:
✅ warehouse_items table exists
✅ warehouse_item_transactions table exists