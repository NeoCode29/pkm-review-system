-- CreateEnum
CREATE TYPE "JoinRequestStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "join_request" (
    "id" BIGSERIAL NOT NULL,
    "team_id" BIGINT NOT NULL,
    "mahasiswa_id" BIGINT NOT NULL,
    "status" "JoinRequestStatus" NOT NULL DEFAULT 'pending',
    "message" TEXT,
    "responded_by" UUID,
    "responded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "join_request_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "join_request_team_id_idx" ON "join_request"("team_id");

-- CreateIndex
CREATE INDEX "join_request_mahasiswa_id_idx" ON "join_request"("mahasiswa_id");

-- CreateIndex
CREATE INDEX "join_request_status_idx" ON "join_request"("status");

-- CreateIndex
CREATE UNIQUE INDEX "join_request_team_id_mahasiswa_id_key" ON "join_request"("team_id", "mahasiswa_id");

-- AddForeignKey
ALTER TABLE "join_request" ADD CONSTRAINT "join_request_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "join_request" ADD CONSTRAINT "join_request_mahasiswa_id_fkey" FOREIGN KEY ("mahasiswa_id") REFERENCES "mahasiswa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
