-- Migration: Populate skor column in detail_penilaian_substansi
-- Since skor was newly added, existing records have skor=0
-- This script logs records that need re-review by reviewers

-- Check current state
SELECT 
  dps.id,
  dps.penilaian_substansi_id,
  dps.skor as current_skor,
  dps.kriteria_substansi_id,
  ks.nama as kriteria_nama,
  ks.bobot,
  ps.total_skor,
  ps.reviewer_assignment_id,
  ra.proposal_id
FROM detail_penilaian_substansi dps
JOIN kriteria_substansi ks ON dps.kriteria_substansi_id = ks.id
JOIN penilaian_substansi ps ON dps.penilaian_substansi_id = ps.id
JOIN reviewer_assignments ra ON ps.reviewer_assignment_id = ra.id
WHERE dps.skor = 0;

-- Since we cannot determine original skor values from existing data,
-- reviewers need to re-submit their penilaian substansi.
-- The application will then store the correct skor values.

-- Alternative: Set a default skor based on bobot (not recommended as it affects scoring)
-- UPDATE detail_penilaian_substansi 
-- SET skor = 1  -- arbitrary default
-- WHERE skor = 0;
