// Migration script: Populate skor column from existing data
// Run with: npx ts-node scripts/migrate-skor.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting migration: Populating skor column...\n');

  // Find all detailPenilaianSubstansi with null skor
  const details = await prisma.detailPenilaianSubstansi.findMany({
    where: {
      skor: 0, // or null if that's the default
    },
    include: {
      kriteriaSubstansi: {
        select: { bobot: true, nama: true },
      },
      penilaianSubstansi: {
        include: {
          reviewerAssignment: {
            include: {
              proposal: true,
            },
          },
        },
      },
    },
  });

  console.log(`Found ${details.length} records with skor=0\n`);

  let updated = 0;
  let skipped = 0;

  for (const detail of details) {
    const bobot = detail.kriteriaSubstansi.bobot;
    
    // Calculate skor from nilai: skor = nilai / bobot
    // But we don't have nilai stored directly, so we need to recalculate
    // Actually, we need to look at the data differently
    
    // Check if we can calculate from the penilaianSubstansi total
    const penilaian = detail.penilaianSubstansi;
    
    // Since we don't have stored nilai per detail, we need to estimate
    // For now, if bobot is available and skor is 0, we might need to set a default
    // or ask reviewer to re-submit
    
    console.log(`ID ${detail.id}: ${detail.kriteriaSubstansi.nama}, bobot=${bobot}, current skor=${detail.skor}`);
    
    // If there's no way to determine original skor, we set to 0 (already is)
    // Or we could try to infer from totalSkor if all other details are known
    
    skipped++;
  }

  console.log(`\nMigration complete:`);
  console.log(`- Updated: ${updated}`);
  console.log(`- Skipped: ${skipped}`);
  console.log(`\nNote: Records with skor=0 need to be re-submitted by reviewer`);
  console.log(`since original skor values were not stored in the database.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
