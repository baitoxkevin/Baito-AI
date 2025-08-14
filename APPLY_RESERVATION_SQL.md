# 🎯 Apply Reservation System SQL

## Quick Link:
👉 **[Open Supabase SQL Editor](https://supabase.com/dashboard/project/aoiwrdzlichescqgnohi/sql/new)**

## Copy & Run This SQL:

```sql
-- Create warehouse_reservations table for pre-orders/soft bookings
CREATE TABLE IF NOT EXISTS warehouse_reservations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id uuid REFERENCES warehouse_items(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  user_name text NOT NULL,
  event_name text,
  purpose text,
  reservation_date date NOT NULL,
  reservation_start_time time,
  reservation_end_time time,
  expected_pickup_date timestamptz NOT NULL,
  expected_return_date timestamptz NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'fulfilled', 'expired')),
  notes text,
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  cancelled_at timestamptz,
  fulfilled_at timestamptz,
  cancellation_reason text
);

-- Add reservation tracking fields to warehouse_items
ALTER TABLE warehouse_items 
ADD COLUMN IF NOT EXISTS has_reservations boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS next_reservation_date date,
ADD COLUMN IF NOT EXISTS reservation_count integer DEFAULT 0;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_warehouse_reservations_item_id ON warehouse_reservations(item_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_reservations_user_id ON warehouse_reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_reservations_date ON warehouse_reservations(reservation_date);
CREATE INDEX IF NOT EXISTS idx_warehouse_reservations_status ON warehouse_reservations(status);

-- RLS policies
ALTER TABLE warehouse_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all reservations"
  ON warehouse_reservations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create reservations"
  ON warehouse_reservations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own reservations"
  ON warehouse_reservations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager')
  ));

-- Function to update reservation counts
CREATE OR REPLACE FUNCTION update_reservation_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE warehouse_items
    SET 
      reservation_count = (
        SELECT COUNT(*) 
        FROM warehouse_reservations 
        WHERE item_id = NEW.item_id 
          AND status IN ('pending', 'confirmed')
      ),
      has_reservations = EXISTS (
        SELECT 1 
        FROM warehouse_reservations 
        WHERE item_id = NEW.item_id 
          AND status IN ('pending', 'confirmed')
      ),
      next_reservation_date = (
        SELECT MIN(reservation_date)
        FROM warehouse_reservations 
        WHERE item_id = NEW.item_id 
          AND status IN ('pending', 'confirmed')
          AND reservation_date >= CURRENT_DATE
      )
    WHERE id = NEW.item_id;
  END IF;
  
  IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
    UPDATE warehouse_items
    SET 
      reservation_count = (
        SELECT COUNT(*) 
        FROM warehouse_reservations 
        WHERE item_id = OLD.item_id 
          AND status IN ('pending', 'confirmed')
      ),
      has_reservations = EXISTS (
        SELECT 1 
        FROM warehouse_reservations 
        WHERE item_id = OLD.item_id 
          AND status IN ('pending', 'confirmed')
      ),
      next_reservation_date = (
        SELECT MIN(reservation_date)
        FROM warehouse_reservations 
        WHERE item_id = OLD.item_id 
          AND status IN ('pending', 'confirmed')
          AND reservation_date >= CURRENT_DATE
      )
    WHERE id = OLD.item_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_item_reservation_count ON warehouse_reservations;
CREATE TRIGGER update_item_reservation_count
AFTER INSERT OR UPDATE OR DELETE ON warehouse_reservations
FOR EACH ROW
EXECUTE FUNCTION update_reservation_count();
```

## After Running:
1. Click "Run" button
2. Refresh your app
3. The reservation button (calendar icon) will work on each item!

## Features Added:
✅ **Pre-order/Reserve items** for future dates
✅ **Conflict detection** - warns about overlapping reservations
✅ **Priority levels** - urgent reservations can override
✅ **Reservation tracking** - see who reserved what and when
✅ **Auto-updates** - reservation counts update automatically