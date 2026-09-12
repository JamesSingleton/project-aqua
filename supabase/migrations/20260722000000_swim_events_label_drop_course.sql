-- Drop course/gender from swim_events.label; those live in dedicated columns.
UPDATE "swim_events"
SET "label" = trim(
  regexp_replace(
    "label",
    '\s+(SCY|SCM|LCM)(\s+(Male|Female|Mixed))?$',
    '',
    'i'
  )
);

-- Align IM labels with formatStrokeLabel ("IM", not "Individual Medley").
UPDATE "swim_events"
SET "label" = regexp_replace("label", 'Individual Medley', 'IM')
WHERE "stroke" = 'im';
