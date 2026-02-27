-- List records tagged as Uncategorized (no description pattern matched).
-- Run after seed-tags (e.g. demeter2 db execute seed-tags.sql or as part of refresh).
-- Usage: demeter2 db query uncategorized.sql
SELECT r.id, r.date, r.record_type, r.amount, r.description, r.source_file
FROM record r
JOIN record_tag rt ON rt.record_id = r.id
WHERE rt.tag_id = 13
ORDER BY r.description;
