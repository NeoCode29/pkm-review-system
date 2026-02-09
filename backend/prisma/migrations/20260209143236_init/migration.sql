-- CreateEnum
CREATE TYPE "TeamStatus" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('ketua', 'anggota');

-- CreateEnum
CREATE TYPE "ProposalType" AS ENUM ('original', 'revised');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('draft', 'submitted', 'under_review', 'reviewed', 'not_reviewed', 'needs_revision', 'revised');

-- CreateEnum
CREATE TYPE "AnnotationType" AS ENUM ('highlight', 'comment');

-- CreateTable
CREATE TABLE "jurusan" (
    "id" BIGSERIAL NOT NULL,
    "nama" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "jurusan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_studi" (
    "id" BIGSERIAL NOT NULL,
    "jurusan_id" BIGINT NOT NULL,
    "nama" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "program_studi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jenis_pkm" (
    "id" BIGSERIAL NOT NULL,
    "nama" VARCHAR(100) NOT NULL,
    "kode" VARCHAR(20),
    "deskripsi" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "jenis_pkm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kriteria_administrasi" (
    "id" BIGSERIAL NOT NULL,
    "jenis_pkm_id" BIGINT NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "urutan" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "kriteria_administrasi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kriteria_substansi" (
    "id" BIGSERIAL NOT NULL,
    "jenis_pkm_id" BIGINT NOT NULL,
    "nama" VARCHAR(255) NOT NULL,
    "deskripsi" TEXT,
    "skor_min" INTEGER NOT NULL DEFAULT 0,
    "skor_max" INTEGER NOT NULL,
    "bobot" INTEGER NOT NULL,
    "urutan" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "kriteria_substansi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mahasiswa" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "nama" VARCHAR(255) NOT NULL,
    "nim" VARCHAR(12) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "no_hp" VARCHAR(20),
    "jurusan_id" BIGINT NOT NULL,
    "program_studi_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "mahasiswa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviewer_user" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "nama" VARCHAR(255) NOT NULL,
    "nidn" VARCHAR(20),
    "email" VARCHAR(255) NOT NULL,
    "no_hp" VARCHAR(20),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "reviewer_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dosen_pembimbing" (
    "id" BIGSERIAL NOT NULL,
    "nama" VARCHAR(255) NOT NULL,
    "nidn" VARCHAR(20),
    "email" VARCHAR(255),
    "no_hp" VARCHAR(20),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "dosen_pembimbing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team" (
    "id" BIGSERIAL NOT NULL,
    "nama_team" VARCHAR(255) NOT NULL,
    "judul_proposal" TEXT NOT NULL,
    "jenis_pkm_id" BIGINT NOT NULL,
    "dosen_pembimbing_id" BIGINT,
    "status" "TeamStatus" NOT NULL DEFAULT 'active',
    "open_to_join" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_member" (
    "id" BIGSERIAL NOT NULL,
    "team_id" BIGINT NOT NULL,
    "mahasiswa_id" BIGINT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'anggota',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposal" (
    "id" BIGSERIAL NOT NULL,
    "team_id" BIGINT NOT NULL,
    "type" "ProposalType" NOT NULL,
    "status" "ProposalStatus" NOT NULL DEFAULT 'draft',
    "administratif_score" DECIMAL(5,2),
    "substantif_score" DECIMAL(5,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "proposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposal_file" (
    "id" BIGSERIAL NOT NULL,
    "proposal_id" BIGINT NOT NULL,
    "file_path" VARCHAR(500) NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_size" BIGINT NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL DEFAULT 'application/pdf',
    "uploaded_by" UUID NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proposal_file_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviewer_assignment" (
    "id" BIGSERIAL NOT NULL,
    "proposal_id" BIGINT NOT NULL,
    "reviewer_user_id" BIGINT NOT NULL,
    "reviewer_number" SMALLINT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviewer_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "penilaian_administrasi" (
    "id" BIGSERIAL NOT NULL,
    "reviewer_assignment_id" BIGINT NOT NULL,
    "total_kesalahan" INTEGER NOT NULL DEFAULT 0,
    "catatan" TEXT,
    "is_complete" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "penilaian_administrasi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detail_penilaian_administrasi" (
    "id" BIGSERIAL NOT NULL,
    "penilaian_administrasi_id" BIGINT NOT NULL,
    "kriteria_administrasi_id" BIGINT NOT NULL,
    "ada_kesalahan" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "detail_penilaian_administrasi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "penilaian_substansi" (
    "id" BIGSERIAL NOT NULL,
    "reviewer_assignment_id" BIGINT NOT NULL,
    "total_skor" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "catatan" TEXT,
    "is_complete" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "penilaian_substansi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detail_penilaian_substansi" (
    "id" BIGSERIAL NOT NULL,
    "penilaian_substansi_id" BIGINT NOT NULL,
    "kriteria_substansi_id" BIGINT NOT NULL,
    "skor" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "detail_penilaian_substansi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pdf_annotation" (
    "id" BIGSERIAL NOT NULL,
    "proposal_file_id" BIGINT NOT NULL,
    "reviewer_assignment_id" BIGINT NOT NULL,
    "type" "AnnotationType" NOT NULL,
    "page_number" INTEGER NOT NULL,
    "annotation_data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pdf_annotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" BIGSERIAL NOT NULL,
    "field_name" VARCHAR(100) NOT NULL,
    "field_value" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_config" (
    "id" BIGSERIAL NOT NULL,
    "config_key" VARCHAR(100) NOT NULL,
    "config_value" JSONB NOT NULL,
    "deskripsi" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" UUID,

    CONSTRAINT "system_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposal_template" (
    "id" BIGSERIAL NOT NULL,
    "jenis_pkm_id" BIGINT NOT NULL,
    "nama_template" VARCHAR(255) NOT NULL,
    "file_path" VARCHAR(500) NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "deskripsi" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "proposal_template_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "jurusan_nama_key" ON "jurusan"("nama");

-- CreateIndex
CREATE INDEX "program_studi_jurusan_id_idx" ON "program_studi"("jurusan_id");

-- CreateIndex
CREATE UNIQUE INDEX "program_studi_jurusan_id_nama_key" ON "program_studi"("jurusan_id", "nama");

-- CreateIndex
CREATE UNIQUE INDEX "jenis_pkm_nama_key" ON "jenis_pkm"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "jenis_pkm_kode_key" ON "jenis_pkm"("kode");

-- CreateIndex
CREATE INDEX "kriteria_administrasi_jenis_pkm_id_idx" ON "kriteria_administrasi"("jenis_pkm_id");

-- CreateIndex
CREATE INDEX "kriteria_substansi_jenis_pkm_id_idx" ON "kriteria_substansi"("jenis_pkm_id");

-- CreateIndex
CREATE UNIQUE INDEX "mahasiswa_user_id_key" ON "mahasiswa"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "mahasiswa_nim_key" ON "mahasiswa"("nim");

-- CreateIndex
CREATE UNIQUE INDEX "mahasiswa_email_key" ON "mahasiswa"("email");

-- CreateIndex
CREATE INDEX "mahasiswa_user_id_idx" ON "mahasiswa"("user_id");

-- CreateIndex
CREATE INDEX "mahasiswa_nim_idx" ON "mahasiswa"("nim");

-- CreateIndex
CREATE INDEX "mahasiswa_email_idx" ON "mahasiswa"("email");

-- CreateIndex
CREATE INDEX "mahasiswa_jurusan_id_idx" ON "mahasiswa"("jurusan_id");

-- CreateIndex
CREATE INDEX "mahasiswa_program_studi_id_idx" ON "mahasiswa"("program_studi_id");

-- CreateIndex
CREATE UNIQUE INDEX "reviewer_user_user_id_key" ON "reviewer_user"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "reviewer_user_email_key" ON "reviewer_user"("email");

-- CreateIndex
CREATE INDEX "reviewer_user_user_id_idx" ON "reviewer_user"("user_id");

-- CreateIndex
CREATE INDEX "reviewer_user_email_idx" ON "reviewer_user"("email");

-- CreateIndex
CREATE INDEX "dosen_pembimbing_nama_idx" ON "dosen_pembimbing"("nama");

-- CreateIndex
CREATE INDEX "team_jenis_pkm_id_idx" ON "team"("jenis_pkm_id");

-- CreateIndex
CREATE INDEX "team_dosen_pembimbing_id_idx" ON "team"("dosen_pembimbing_id");

-- CreateIndex
CREATE INDEX "team_status_idx" ON "team"("status");

-- CreateIndex
CREATE INDEX "team_member_team_id_idx" ON "team_member"("team_id");

-- CreateIndex
CREATE INDEX "team_member_mahasiswa_id_idx" ON "team_member"("mahasiswa_id");

-- CreateIndex
CREATE UNIQUE INDEX "team_member_team_id_mahasiswa_id_key" ON "team_member"("team_id", "mahasiswa_id");

-- CreateIndex
CREATE UNIQUE INDEX "team_member_mahasiswa_id_key" ON "team_member"("mahasiswa_id");

-- CreateIndex
CREATE INDEX "proposal_team_id_idx" ON "proposal"("team_id");

-- CreateIndex
CREATE INDEX "proposal_status_idx" ON "proposal"("status");

-- CreateIndex
CREATE INDEX "proposal_type_idx" ON "proposal"("type");

-- CreateIndex
CREATE UNIQUE INDEX "proposal_team_id_type_key" ON "proposal"("team_id", "type");

-- CreateIndex
CREATE INDEX "proposal_file_proposal_id_idx" ON "proposal_file"("proposal_id");

-- CreateIndex
CREATE INDEX "proposal_file_uploaded_by_idx" ON "proposal_file"("uploaded_by");

-- CreateIndex
CREATE INDEX "reviewer_assignment_proposal_id_idx" ON "reviewer_assignment"("proposal_id");

-- CreateIndex
CREATE INDEX "reviewer_assignment_reviewer_user_id_idx" ON "reviewer_assignment"("reviewer_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "reviewer_assignment_proposal_id_reviewer_number_key" ON "reviewer_assignment"("proposal_id", "reviewer_number");

-- CreateIndex
CREATE UNIQUE INDEX "penilaian_administrasi_reviewer_assignment_id_key" ON "penilaian_administrasi"("reviewer_assignment_id");

-- CreateIndex
CREATE INDEX "penilaian_administrasi_reviewer_assignment_id_idx" ON "penilaian_administrasi"("reviewer_assignment_id");

-- CreateIndex
CREATE INDEX "detail_penilaian_administrasi_penilaian_administrasi_id_idx" ON "detail_penilaian_administrasi"("penilaian_administrasi_id");

-- CreateIndex
CREATE INDEX "detail_penilaian_administrasi_kriteria_administrasi_id_idx" ON "detail_penilaian_administrasi"("kriteria_administrasi_id");

-- CreateIndex
CREATE UNIQUE INDEX "detail_penilaian_administrasi_penilaian_administrasi_id_kri_key" ON "detail_penilaian_administrasi"("penilaian_administrasi_id", "kriteria_administrasi_id");

-- CreateIndex
CREATE UNIQUE INDEX "penilaian_substansi_reviewer_assignment_id_key" ON "penilaian_substansi"("reviewer_assignment_id");

-- CreateIndex
CREATE INDEX "penilaian_substansi_reviewer_assignment_id_idx" ON "penilaian_substansi"("reviewer_assignment_id");

-- CreateIndex
CREATE INDEX "detail_penilaian_substansi_penilaian_substansi_id_idx" ON "detail_penilaian_substansi"("penilaian_substansi_id");

-- CreateIndex
CREATE INDEX "detail_penilaian_substansi_kriteria_substansi_id_idx" ON "detail_penilaian_substansi"("kriteria_substansi_id");

-- CreateIndex
CREATE UNIQUE INDEX "detail_penilaian_substansi_penilaian_substansi_id_kriteria__key" ON "detail_penilaian_substansi"("penilaian_substansi_id", "kriteria_substansi_id");

-- CreateIndex
CREATE INDEX "pdf_annotation_proposal_file_id_idx" ON "pdf_annotation"("proposal_file_id");

-- CreateIndex
CREATE INDEX "pdf_annotation_reviewer_assignment_id_idx" ON "pdf_annotation"("reviewer_assignment_id");

-- CreateIndex
CREATE INDEX "pdf_annotation_page_number_idx" ON "pdf_annotation"("page_number");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_field_name_key" ON "system_settings"("field_name");

-- CreateIndex
CREATE INDEX "system_settings_field_name_idx" ON "system_settings"("field_name");

-- CreateIndex
CREATE UNIQUE INDEX "system_config_config_key_key" ON "system_config"("config_key");

-- CreateIndex
CREATE INDEX "system_config_config_key_idx" ON "system_config"("config_key");

-- CreateIndex
CREATE INDEX "proposal_template_jenis_pkm_id_idx" ON "proposal_template"("jenis_pkm_id");

-- AddForeignKey
ALTER TABLE "program_studi" ADD CONSTRAINT "program_studi_jurusan_id_fkey" FOREIGN KEY ("jurusan_id") REFERENCES "jurusan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kriteria_administrasi" ADD CONSTRAINT "kriteria_administrasi_jenis_pkm_id_fkey" FOREIGN KEY ("jenis_pkm_id") REFERENCES "jenis_pkm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kriteria_substansi" ADD CONSTRAINT "kriteria_substansi_jenis_pkm_id_fkey" FOREIGN KEY ("jenis_pkm_id") REFERENCES "jenis_pkm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mahasiswa" ADD CONSTRAINT "mahasiswa_jurusan_id_fkey" FOREIGN KEY ("jurusan_id") REFERENCES "jurusan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mahasiswa" ADD CONSTRAINT "mahasiswa_program_studi_id_fkey" FOREIGN KEY ("program_studi_id") REFERENCES "program_studi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team" ADD CONSTRAINT "team_jenis_pkm_id_fkey" FOREIGN KEY ("jenis_pkm_id") REFERENCES "jenis_pkm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team" ADD CONSTRAINT "team_dosen_pembimbing_id_fkey" FOREIGN KEY ("dosen_pembimbing_id") REFERENCES "dosen_pembimbing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_mahasiswa_id_fkey" FOREIGN KEY ("mahasiswa_id") REFERENCES "mahasiswa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal" ADD CONSTRAINT "proposal_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal_file" ADD CONSTRAINT "proposal_file_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviewer_assignment" ADD CONSTRAINT "reviewer_assignment_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviewer_assignment" ADD CONSTRAINT "reviewer_assignment_reviewer_user_id_fkey" FOREIGN KEY ("reviewer_user_id") REFERENCES "reviewer_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penilaian_administrasi" ADD CONSTRAINT "penilaian_administrasi_reviewer_assignment_id_fkey" FOREIGN KEY ("reviewer_assignment_id") REFERENCES "reviewer_assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_penilaian_administrasi" ADD CONSTRAINT "detail_penilaian_administrasi_penilaian_administrasi_id_fkey" FOREIGN KEY ("penilaian_administrasi_id") REFERENCES "penilaian_administrasi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_penilaian_administrasi" ADD CONSTRAINT "detail_penilaian_administrasi_kriteria_administrasi_id_fkey" FOREIGN KEY ("kriteria_administrasi_id") REFERENCES "kriteria_administrasi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penilaian_substansi" ADD CONSTRAINT "penilaian_substansi_reviewer_assignment_id_fkey" FOREIGN KEY ("reviewer_assignment_id") REFERENCES "reviewer_assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_penilaian_substansi" ADD CONSTRAINT "detail_penilaian_substansi_penilaian_substansi_id_fkey" FOREIGN KEY ("penilaian_substansi_id") REFERENCES "penilaian_substansi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_penilaian_substansi" ADD CONSTRAINT "detail_penilaian_substansi_kriteria_substansi_id_fkey" FOREIGN KEY ("kriteria_substansi_id") REFERENCES "kriteria_substansi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pdf_annotation" ADD CONSTRAINT "pdf_annotation_proposal_file_id_fkey" FOREIGN KEY ("proposal_file_id") REFERENCES "proposal_file"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pdf_annotation" ADD CONSTRAINT "pdf_annotation_reviewer_assignment_id_fkey" FOREIGN KEY ("reviewer_assignment_id") REFERENCES "reviewer_assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal_template" ADD CONSTRAINT "proposal_template_jenis_pkm_id_fkey" FOREIGN KEY ("jenis_pkm_id") REFERENCES "jenis_pkm"("id") ON DELETE CASCADE ON UPDATE CASCADE;
