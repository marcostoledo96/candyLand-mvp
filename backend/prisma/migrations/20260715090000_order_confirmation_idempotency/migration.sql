-- Existing orders intentionally retain NULL confirmation values. PostgreSQL unique
-- indexes allow multiple NULLs, so this is forward-only and data-safe.
ALTER TABLE "Order"
  ADD COLUMN "confirmationKey" TEXT,
  ADD COLUMN "confirmationCartId" TEXT;

CREATE UNIQUE INDEX "Order_confirmationKey_key" ON "Order"("confirmationKey");
