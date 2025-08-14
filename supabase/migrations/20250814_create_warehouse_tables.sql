-- Create warehouse_items table
CREATE TABLE IF NOT EXISTS public.warehouse_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  details TEXT,
  photo_url TEXT,
  rack_no VARCHAR(50),
  rack_row VARCHAR(50),
  status VARCHAR(50) DEFAULT 'available',
  current_user_name VARCHAR(255),
  current_event VARCHAR(255),
  current_purpose TEXT,
  last_checkout_date TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create warehouse_reservations table
CREATE TABLE IF NOT EXISTS public.warehouse_reservations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES public.warehouse_items(id) ON DELETE CASCADE,
  reserved_by UUID REFERENCES auth.users(id),
  reserved_by_name VARCHAR(255),
  event_name VARCHAR(255) NOT NULL,
  purpose TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create warehouse_checkouts table for tracking item check-in/out history
CREATE TABLE IF NOT EXISTS public.warehouse_checkouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES public.warehouse_items(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  user_name VARCHAR(255),
  event_name VARCHAR(255),
  purpose TEXT,
  checkout_date TIMESTAMP WITH TIME ZONE NOT NULL,
  checkin_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_warehouse_items_item_id ON public.warehouse_items(item_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_items_status ON public.warehouse_items(status);
CREATE INDEX IF NOT EXISTS idx_warehouse_reservations_item_id ON public.warehouse_reservations(item_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_reservations_dates ON public.warehouse_reservations(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_warehouse_checkouts_item_id ON public.warehouse_checkouts(item_id);

-- Enable RLS (Row Level Security)
ALTER TABLE public.warehouse_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_checkouts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for warehouse_items
CREATE POLICY "Anyone can view warehouse items" ON public.warehouse_items
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert warehouse items" ON public.warehouse_items
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update warehouse items" ON public.warehouse_items
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete warehouse items" ON public.warehouse_items
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Create RLS policies for warehouse_reservations
CREATE POLICY "Anyone can view reservations" ON public.warehouse_reservations
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create reservations" ON public.warehouse_reservations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own reservations" ON public.warehouse_reservations
  FOR UPDATE USING (auth.uid() = reserved_by);

CREATE POLICY "Users can delete their own reservations" ON public.warehouse_reservations
  FOR DELETE USING (auth.uid() = reserved_by);

-- Create RLS policies for warehouse_checkouts
CREATE POLICY "Anyone can view checkouts" ON public.warehouse_checkouts
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create checkouts" ON public.warehouse_checkouts
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update checkouts" ON public.warehouse_checkouts
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_warehouse_items_updated_at BEFORE UPDATE ON public.warehouse_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_warehouse_reservations_updated_at BEFORE UPDATE ON public.warehouse_reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();