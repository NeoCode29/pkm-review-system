import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const ADMIN_EMAIL = 'admin@pkm-review.local';
const ADMIN_PASSWORD = 'admin123456';

async function seedAdmin() {
  console.log('🔐 Seeding Admin account...');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    console.log('  ⚠️  SUPABASE_URL or SUPABASE_SECRET_KEY not set, skipping admin seed');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseSecretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Check if admin already exists by listing users
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const adminExists = existingUsers?.users?.find((u) => u.email === ADMIN_EMAIL);

  if (adminExists) {
    console.log(`  ✅ Admin already exists: ${ADMIN_EMAIL}`);
    return;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: { role: 'admin', nama: 'Administrator' },
  });

  if (error) {
    console.error(`  ❌ Failed to create admin: ${error.message}`);
    return;
  }

  console.log(`  ✅ Admin created: ${ADMIN_EMAIL} (id: ${data.user.id})`);
  console.log(`     Email: ${ADMIN_EMAIL}`);
  console.log(`     Password: ${ADMIN_PASSWORD}`);
}

async function main() {
  // Seed admin account
  await seedAdmin();

  console.log('\n🌱 Seeding Jurusan & Program Studi...');

  const jurusanData = [
    {
      nama: 'Teknik Sipil',
      programStudi: [
        'D3 Teknik Sipil',
        'D4 Manajemen Konstruksi',
        'D4 Teknologi Rekayasa Konstruksi Jalan & Jembatan',
        'D4 Teknologi Rekayasa Konstruksi Bangunan Gedung',
      ],
    },
    {
      nama: 'Teknik Mesin',
      programStudi: [
        'D4 Teknik Manufaktur Kapal',
        'D4 Teknologi Rekayasa Otomotif',
        'D4 Teknologi Rekayasa Manufaktur',
      ],
    },
    {
      nama: 'Bisnis & Informatika',
      programStudi: [
        'D4 Bisnis Digital',
        'D4 Teknologi Rekayasa Komputer',
        'D4 Teknologi Rekayasa Perangkat Lunak',
      ],
    },
    {
      nama: 'Pariwisata',
      programStudi: [
        'D4 Destinasi Pariwisata',
        'D4 Pengelolaan Perhotelan',
        'D4 Manajemen Bisnis Pariwisata',
      ],
    },
    {
      nama: 'Pertanian',
      programStudi: [
        'D4 Agribisnis',
        'D4 Teknologi Produksi Ternak',
        'D4 Teknologi Pengolahan Hasil Ternak',
        'D4 Teknologi Produksi Tanaman Pangan',
        'D4 Pengembangan Produk Agroindustri',
        'D4 Teknologi Budi Daya Perikanan / Teknologi Akuakultur',
      ],
    },
  ];

  for (const j of jurusanData) {
    const jurusan = await prisma.jurusan.upsert({
      where: { nama: j.nama },
      update: {},
      create: { nama: j.nama },
    });

    console.log(`  ✅ Jurusan: ${jurusan.nama} (id: ${jurusan.id})`);

    for (const prodiNama of j.programStudi) {
      await prisma.programStudi.upsert({
        where: {
          jurusanId_nama: { jurusanId: jurusan.id, nama: prodiNama },
        },
        update: {},
        create: {
          jurusanId: jurusan.id,
          nama: prodiNama,
        },
      });
      console.log(`     - ${prodiNama}`);
    }
  }

  console.log('\n🎉 Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
