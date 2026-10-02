-- Funded XRPL receive account per merchant, sequential destination tags, unique address+tag.

ALTER TABLE "Merchant" ADD COLUMN "xrplAddress" TEXT;
ALTER TABLE "Merchant" ADD COLUMN "xrplSeed" TEXT;
ALTER TABLE "Merchant" ADD COLUMN "nextDestinationTag" INTEGER NOT NULL DEFAULT 1;

CREATE UNIQUE INDEX "Merchant_xrplAddress_key" ON "Merchant"("xrplAddress");
CREATE UNIQUE INDEX "Invoice_destinationAddress_destinationTag_key" ON "Invoice"("destinationAddress", "destinationTag");
CREATE INDEX "Invoice_destinationAddress_destinationTag_status_idx" ON "Invoice"("destinationAddress", "destinationTag", "status");
