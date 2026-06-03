-- Migration: Create RPC to get dynamic inventory summary as of a specific date
CREATE OR REPLACE FUNCTION get_inventory_summary(p_target_date TIMESTAMPTZ)
RETURNS TABLE (
  item_id UUID,
  item_name TEXT,
  category_name TEXT,
  location_id UUID,
  location_name TEXT,
  quantity NUMERIC
)
LANGUAGE sql
SECURITY DEFINER
AS $$
WITH item_locations AS (
  SELECT 
    i.id AS item_id, 
    i.name AS item_name,
    c.name AS category_name,
    l.id AS location_id,
    l.name AS location_name
  FROM items i
  LEFT JOIN categories c ON i.category_id = c.id
  CROSS JOIN locations l
  WHERE i.is_deleted = false AND l.is_deleted = false
),
latest_stocktakings AS (
  SELECT ls_inner.item_id, ls_inner.location_id, ls_inner.actual_qty, ls_inner.date
  FROM (
    SELECT s.item_id, s.location_id, s.actual_qty, s.date,
           ROW_NUMBER() OVER (PARTITION BY s.item_id, s.location_id ORDER BY s.date DESC) as rn
    FROM stocktakings s
    WHERE s.date <= p_target_date
  ) ls_inner
  WHERE ls_inner.rn = 1
),
recent_transactions AS (
  SELECT t.item_id, t.location_id,
         SUM(CASE WHEN t.type = '受入' THEN t.quantity WHEN t.type = '払出' THEN -t.quantity ELSE 0 END) as tx_qty
  FROM transactions t
  LEFT JOIN latest_stocktakings ls ON t.item_id = ls.item_id AND t.location_id = ls.location_id
  WHERE (ls.date IS NULL OR t.date > ls.date)
    AND t.date <= p_target_date
  GROUP BY t.item_id, t.location_id
)
SELECT 
  il.item_id,
  il.item_name,
  il.category_name,
  il.location_id,
  il.location_name,
  COALESCE(ls.actual_qty, 0) + COALESCE(rt.tx_qty, 0) AS quantity
FROM item_locations il
LEFT JOIN latest_stocktakings ls ON il.item_id = ls.item_id AND il.location_id = ls.location_id
LEFT JOIN recent_transactions rt ON il.item_id = rt.item_id AND il.location_id = rt.location_id;
$$;
