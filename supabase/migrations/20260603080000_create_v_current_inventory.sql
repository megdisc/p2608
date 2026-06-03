-- Migration: Create view for dynamic inventory calculation
CREATE OR REPLACE VIEW v_current_inventory AS
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
  SELECT item_id, location_id, actual_qty, date
  FROM (
    SELECT item_id, location_id, actual_qty, date,
           ROW_NUMBER() OVER (PARTITION BY item_id, location_id ORDER BY date DESC) as rn
    FROM stocktakings
  ) s
  WHERE rn = 1
),
recent_transactions AS (
  SELECT t.item_id, t.location_id,
         SUM(CASE WHEN t.type = '受入' THEN t.quantity WHEN t.type = '払出' THEN -t.quantity ELSE 0 END) as tx_qty
  FROM transactions t
  LEFT JOIN latest_stocktakings ls ON t.item_id = ls.item_id AND t.location_id = ls.location_id
  WHERE ls.date IS NULL OR t.date > ls.date
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
