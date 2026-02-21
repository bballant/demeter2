-- List descriptions currently tagged as Uncategorized (tag_id = 13).
-- Run after seed-tags.sql: demeter2 db query path/to/uncategorized.sql
SELECT description, COUNT(*) AS cnt
FROM record r
JOIN record_tag rt ON rt.record_id = r.id
WHERE rt.tag_id = 13
GROUP BY description
ORDER BY cnt DESC, description;
