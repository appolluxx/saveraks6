-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ActionType" ADD VALUE 'zero_waste';
ALTER TYPE "ActionType" ADD VALUE 'eco_product';
ALTER TYPE "ActionType" ADD VALUE 'walk';
ALTER TYPE "ActionType" ADD VALUE 'bicycle';
ALTER TYPE "ActionType" ADD VALUE 'commute';
ALTER TYPE "ActionType" ADD VALUE 'report';

-- AlterTable
ALTER TABLE "eco_actions" ADD COLUMN     "a_hash" TEXT,
ADD COLUMN     "d_hash" TEXT,
ADD COLUMN     "device_fingerprint" TEXT,
ADD COLUMN     "distance_km" DECIMAL(5,2),
ADD COLUMN     "flag_reason" TEXT,
ADD COLUMN     "histogram" JSONB,
ADD COLUMN     "image_hash" TEXT,
ADD COLUMN     "image_quality" DECIMAL(3,2),
ADD COLUMN     "ip_address" TEXT,
ADD COLUMN     "is_flagged" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "p_hash" TEXT,
ADD COLUMN     "ticket_image_url" TEXT,
ADD COLUMN     "ticket_type" TEXT,
ADD COLUMN     "user_agent" TEXT,
ADD COLUMN     "verified_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "eco_actions_image_hash_idx" ON "eco_actions"("image_hash");

-- CreateIndex
CREATE INDEX "eco_actions_p_hash_idx" ON "eco_actions"("p_hash");

-- CreateIndex
CREATE INDEX "eco_actions_d_hash_idx" ON "eco_actions"("d_hash");

-- CreateIndex
CREATE INDEX "eco_actions_a_hash_idx" ON "eco_actions"("a_hash");

-- CreateIndex
CREATE INDEX "eco_actions_device_fingerprint_idx" ON "eco_actions"("device_fingerprint");

-- CreateIndex
CREATE INDEX "eco_actions_created_at_idx" ON "eco_actions"("created_at");
