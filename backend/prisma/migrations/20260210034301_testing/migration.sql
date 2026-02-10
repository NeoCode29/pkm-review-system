-- AlterTable
ALTER TABLE "reviewer_user" ADD COLUMN     "program_studi_id" BIGINT;

-- CreateTable
CREATE TABLE "audit_log" (
    "id" BIGSERIAL NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(100) NOT NULL,
    "entity_id" VARCHAR(255) NOT NULL,
    "old_value" TEXT,
    "new_value" TEXT,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_log_entity_type_entity_id_idx" ON "audit_log"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_log_user_id_idx" ON "audit_log"("user_id");

-- CreateIndex
CREATE INDEX "audit_log_created_at_idx" ON "audit_log"("created_at");

-- AddForeignKey
ALTER TABLE "reviewer_user" ADD CONSTRAINT "reviewer_user_program_studi_id_fkey" FOREIGN KEY ("program_studi_id") REFERENCES "program_studi"("id") ON DELETE SET NULL ON UPDATE CASCADE;
