# Postmortem notes — 2026-07-21 notification delay (synthetic)

Root cause: DB connection pool for the notification dispatcher hit its max
(200) under a routine traffic bump. Autoscaling is CPU-triggered, not
queue-delay-triggered, so it didn't react until CPU load caught up — about
5 minutes after the queue was already backed up.

Two independent fixes discussed: raise the pool ceiling (quick), and also
change the autoscale trigger to watch queue delay directly (more durable,
~1 week of work). Leaning toward doing both.
