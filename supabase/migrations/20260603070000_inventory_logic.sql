-- Migration: Add calculate_book_inventory RPC and prevent_backdated_transactions trigger

-- 1. RPC function to calculate book inventory
CREATE OR REPLACE FUNCTION calculate_book_inventory(
  p_item_id UUID,
  p_location_id UUID,
  p_target_date TIMESTAMPTZ
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_prev_qty NUMERIC := 0;
  v_prev_date TIMESTAMPTZ := '1970-01-01 00:00:00+00'::TIMESTAMPTZ;
  v_tx_qty NUMERIC := 0;
BEGIN
  -- Find the most recent stocktaking record for the item/location before the target date
  SELECT actual_qty, date 
  INTO v_prev_qty, v_prev_date 
  FROM stocktakings 
  WHERE item_id = p_item_id 
    AND location_id = p_location_id 
    AND date < p_target_date 
  ORDER BY date DESC 
  LIMIT 1;

  -- Default to 0 and '1970' if no previous record is found
  IF v_prev_date IS NULL THEN
    v_prev_qty := 0;
    v_prev_date := '1970-01-01 00:00:00+00'::TIMESTAMPTZ;
  END IF;

  -- Sum transactions after the previous stocktaking date up to the target date
  SELECT COALESCE(SUM(
    CASE 
      WHEN type = '受入' THEN quantity 
      WHEN type = '払出' THEN -quantity 
      ELSE 0 
    END
  ), 0) 
  INTO v_tx_qty 
  FROM transactions 
  WHERE item_id = p_item_id 
    AND location_id = p_location_id 
    AND date > v_prev_date 
    AND date <= p_target_date;

  RETURN v_prev_qty + v_tx_qty;
END;
$$;

-- 2. Trigger function to prevent backdated transactions
CREATE OR REPLACE FUNCTION prevent_backdated_transactions() 
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
DECLARE
  v_latest_stocktaking_date TIMESTAMPTZ;
  v_target_item_id UUID;
  v_target_location_id UUID;
BEGIN
  -- Determine target item and location based on operation
  IF TG_OP = 'DELETE' THEN
    v_target_item_id := OLD.item_id;
    v_target_location_id := OLD.location_id;
  ELSE
    v_target_item_id := NEW.item_id;
    v_target_location_id := NEW.location_id;
  END IF;

  -- Get the latest stocktaking date for this item and location
  SELECT date INTO v_latest_stocktaking_date
  FROM stocktakings
  WHERE item_id = v_target_item_id AND location_id = v_target_location_id
  ORDER BY date DESC LIMIT 1;

  -- Check DELETE
  IF TG_OP = 'DELETE' THEN
    IF v_latest_stocktaking_date IS NOT NULL AND OLD.date <= v_latest_stocktaking_date THEN
      RAISE EXCEPTION 'Cannot delete transaction on or before the latest stocktaking date (%)', v_latest_stocktaking_date;
    END IF;
    RETURN OLD;
  END IF;

  -- Check INSERT / UPDATE
  IF v_latest_stocktaking_date IS NOT NULL AND NEW.date <= v_latest_stocktaking_date THEN
    RAISE EXCEPTION 'Cannot insert or update transaction on or before the latest stocktaking date (%)', v_latest_stocktaking_date;
  END IF;

  -- Additional check for UPDATE: cannot modify an already locked old record
  IF TG_OP = 'UPDATE' AND v_latest_stocktaking_date IS NOT NULL AND OLD.date <= v_latest_stocktaking_date THEN
    RAISE EXCEPTION 'Cannot modify transaction on or before the latest stocktaking date (%)', v_latest_stocktaking_date;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop trigger if exists (for safety)
DROP TRIGGER IF EXISTS check_transaction_date ON transactions;

-- Create the trigger
CREATE TRIGGER check_transaction_date
BEFORE INSERT OR UPDATE OR DELETE ON transactions
FOR EACH ROW EXECUTE FUNCTION prevent_backdated_transactions();
