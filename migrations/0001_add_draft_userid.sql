-- Add user_id column to drafts for authenticated user ownership
ALTER TABLE "drafts" ADD COLUMN "user_id" varchar;

-- Make session_id nullable (for authenticated users who don't need it)
ALTER TABLE "drafts" ALTER COLUMN "session_id" DROP NOT NULL;

-- Add index for efficient userId lookups
CREATE INDEX "idx_drafts_user_id" ON "drafts" ("user_id");

-- Add index for efficient sessionId lookups (anonymous users)
CREATE INDEX "idx_drafts_session_id" ON "drafts" ("session_id");
