INSERT INTO recording_sessions(workflow_name,operator,started_at,ended_at,status,app_name,notes)
SELECT
  (ARRAY['Invoice approval capture','Customer onboarding capture','Incident escalation capture','Vendor review capture','Renewal preparation capture'])[((g-1)%5)+1]||' · '||CEIL(g/5.0)::int,
  (ARRAY['Morgan Lee','Avery Patel','Jordan Rivera'])[((g-1)%3)+1],
  NOW()-(g||' days')::interval,NOW()-(g||' days')::interval+((18+g)||' minutes')::interval,
  (ARRAY['completed','review','completed','exception','completed'])[((g-1)%5)+1],
  (ARRAY['Finance Operations','Customer Success','Incident Management','Vendor Governance','Revenue Operations'])[((g-1)%5)+1],
  'Captured with consent, sensitive fields redacted, and operator review required before replay.'
FROM generate_series(1,15) g
WHERE NOT EXISTS (SELECT 1 FROM recording_sessions WHERE workflow_name=(ARRAY['Invoice approval capture','Customer onboarding capture','Incident escalation capture','Vendor review capture','Renewal preparation capture'])[((g-1)%5)+1]||' · '||CEIL(g/5.0)::int);
