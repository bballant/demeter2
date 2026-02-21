-- Verify: total tagged, and count per tag
SELECT t.name, COUNT(rt.record_id) AS cnt
FROM tag t
LEFT JOIN record_tag rt ON rt.tag_id = t.id
GROUP BY t.id, t.name
ORDER BY t.id;
