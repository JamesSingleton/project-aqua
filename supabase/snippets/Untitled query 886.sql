SELECT m.id AS member_id, m.role, u.email
FROM member m
JOIN "user" u ON u.id = m.user_id
WHERE m.organization_id = 'Anvb08SUi8TgNRvFuxPWF0gspSwW4qsx';