-- Single-query spending report. Returns unified rows: one per (period, section, rank).
-- Columns: period, section, rank, tag_name, category_spend, merchant, merchant_spend,
--          record_id, record_date, record_description, record_amount.
-- Only DEBITs count as spend; spend amounts are positive. Merchant = first 24 chars of description, digits stripped.
-- Run with: demeter2 db query path/to/report.sql

WITH
  params AS (
    SELECT
      (SELECT MAX(date) FROM record) AS last_d,
      CAST(DATE_TRUNC('month', (SELECT MAX(date) FROM record)) AS DATE) AS month_start
  ),
  -- Normalized merchant: first 24 chars of description, numbers removed, trimmed
  with_merchant AS (
    SELECT
      r.*,
      TRIM(REGEXP_REPLACE(SUBSTRING(r.description, 1, 24), '[0-9]', '')) AS merchant_key
    FROM record r
    WHERE r.record_type = 'DEBIT' AND r.amount < 0
  ),
  -- Recent month: records in the month ending on last_d
  month_records AS (
    SELECT * FROM with_merchant, params
    WHERE date >= params.month_start AND date <= params.last_d
  ),
  -- Recent year: records in the 12 months ending on last_d
  year_records AS (
    SELECT * FROM with_merchant, params
    WHERE date > (params.last_d - INTERVAL 1 YEAR) AND date <= params.last_d
  ),

  -- Top categories: recent month
  cat_month AS (
    SELECT
      'recent_month' AS period,
      'top_categories' AS section,
      ROW_NUMBER() OVER (ORDER BY SUM(-r.amount) DESC) AS rank,
      t.name AS tag_name,
      SUM(-r.amount) AS category_spend,
      NULL::VARCHAR AS merchant,
      NULL::DOUBLE AS merchant_spend,
      NULL::VARCHAR AS record_id,
      NULL::DATE AS record_date,
      NULL::VARCHAR AS record_description,
      NULL::DOUBLE AS record_amount
    FROM month_records r
    JOIN record_tag rt ON r.id = rt.record_id
    JOIN tag t ON rt.tag_id = t.id
    GROUP BY t.name
  ),
  top_categories_month AS (SELECT * FROM cat_month WHERE rank <= 12),

  -- Top categories: recent year
  cat_year AS (
    SELECT
      'recent_year' AS period,
      'top_categories' AS section,
      ROW_NUMBER() OVER (ORDER BY SUM(-r.amount) DESC) AS rank,
      t.name AS tag_name,
      SUM(-r.amount) AS category_spend,
      NULL::VARCHAR AS merchant,
      NULL::DOUBLE AS merchant_spend,
      NULL::VARCHAR AS record_id,
      NULL::DATE AS record_date,
      NULL::VARCHAR AS record_description,
      NULL::DOUBLE AS record_amount
    FROM year_records r
    JOIN record_tag rt ON r.id = rt.record_id
    JOIN tag t ON rt.tag_id = t.id
    GROUP BY t.name
  ),
  top_categories_year AS (SELECT * FROM cat_year WHERE rank <= 12),

  -- Top categories: avg monthly (year total / 12, same top 12 as year)
  cat_avg AS (
    SELECT
      'avg_monthly' AS period,
      'top_categories' AS section,
      ROW_NUMBER() OVER (ORDER BY SUM(-r.amount) DESC) AS rank,
      t.name AS tag_name,
      SUM(-r.amount) / 12.0 AS category_spend,
      NULL::VARCHAR AS merchant,
      NULL::DOUBLE AS merchant_spend,
      NULL::VARCHAR AS record_id,
      NULL::DATE AS record_date,
      NULL::VARCHAR AS record_description,
      NULL::DOUBLE AS record_amount
    FROM year_records r
    JOIN record_tag rt ON r.id = rt.record_id
    JOIN tag t ON rt.tag_id = t.id
    GROUP BY t.name
  ),
  top_categories_avg AS (SELECT * FROM cat_avg WHERE rank <= 12),

  -- Top merchants: recent month (by merchant_key); tag_name = category for this merchant
  merch_month AS (
    SELECT
      'recent_month' AS period,
      'top_merchants' AS section,
      ROW_NUMBER() OVER (ORDER BY SUM(-m.amount) DESC) AS rank,
      arg_max(t.name, -m.amount) AS tag_name,
      NULL::DOUBLE AS category_spend,
      m.merchant_key AS merchant,
      SUM(-m.amount) AS merchant_spend,
      NULL::VARCHAR AS record_id,
      NULL::DATE AS record_date,
      NULL::VARCHAR AS record_description,
      NULL::DOUBLE AS record_amount
    FROM month_records m
    JOIN record_tag rt ON m.id = rt.record_id
    JOIN tag t ON rt.tag_id = t.id
    WHERE m.merchant_key != ''
    GROUP BY m.merchant_key
  ),
  top_merchants_month AS (SELECT * FROM merch_month WHERE rank <= 12),

  -- Top merchants: recent year
  merch_year AS (
    SELECT
      'recent_year' AS period,
      'top_merchants' AS section,
      ROW_NUMBER() OVER (ORDER BY SUM(-m.amount) DESC) AS rank,
      arg_max(t.name, -m.amount) AS tag_name,
      NULL::DOUBLE AS category_spend,
      m.merchant_key AS merchant,
      SUM(-m.amount) AS merchant_spend,
      NULL::VARCHAR AS record_id,
      NULL::DATE AS record_date,
      NULL::VARCHAR AS record_description,
      NULL::DOUBLE AS record_amount
    FROM year_records m
    JOIN record_tag rt ON m.id = rt.record_id
    JOIN tag t ON rt.tag_id = t.id
    WHERE m.merchant_key != ''
    GROUP BY m.merchant_key
  ),
  top_merchants_year AS (SELECT * FROM merch_year WHERE rank <= 12),

  -- Top merchants: avg monthly
  merch_avg AS (
    SELECT
      'avg_monthly' AS period,
      'top_merchants' AS section,
      ROW_NUMBER() OVER (ORDER BY SUM(-m.amount) DESC) AS rank,
      arg_max(t.name, -m.amount) AS tag_name,
      NULL::DOUBLE AS category_spend,
      m.merchant_key AS merchant,
      SUM(-m.amount) / 12.0 AS merchant_spend,
      NULL::VARCHAR AS record_id,
      NULL::DATE AS record_date,
      NULL::VARCHAR AS record_description,
      NULL::DOUBLE AS record_amount
    FROM year_records m
    JOIN record_tag rt ON m.id = rt.record_id
    JOIN tag t ON rt.tag_id = t.id
    WHERE m.merchant_key != ''
    GROUP BY m.merchant_key
  ),
  top_merchants_avg AS (SELECT * FROM merch_avg WHERE rank <= 12),

  -- Top 10 transactions: recent month
  tx_month AS (
    SELECT
      'recent_month' AS period,
      'top_transactions' AS section,
      ROW_NUMBER() OVER (ORDER BY amount) AS rank,
      NULL::VARCHAR AS tag_name,
      NULL::DOUBLE AS category_spend,
      NULL::VARCHAR AS merchant,
      NULL::DOUBLE AS merchant_spend,
      id AS record_id,
      date AS record_date,
      description AS record_description,
      amount AS record_amount
    FROM month_records
  ),
  top_transactions_month AS (SELECT * FROM tx_month WHERE rank <= 12),

  -- Top 10 transactions: recent year
  tx_year AS (
    SELECT
      'recent_year' AS period,
      'top_transactions' AS section,
      ROW_NUMBER() OVER (ORDER BY amount) AS rank,
      NULL::VARCHAR AS tag_name,
      NULL::DOUBLE AS category_spend,
      NULL::VARCHAR AS merchant,
      NULL::DOUBLE AS merchant_spend,
      id AS record_id,
      date AS record_date,
      description AS record_description,
      amount AS record_amount
    FROM year_records
  ),
  top_transactions_year AS (SELECT * FROM tx_year WHERE rank <= 12)

SELECT * FROM top_categories_month
UNION ALL SELECT * FROM top_categories_year
UNION ALL SELECT * FROM top_categories_avg
UNION ALL SELECT * FROM top_merchants_month
UNION ALL SELECT * FROM top_merchants_year
UNION ALL SELECT * FROM top_merchants_avg
UNION ALL SELECT * FROM top_transactions_month
UNION ALL SELECT * FROM top_transactions_year
ORDER BY period, section, rank;
