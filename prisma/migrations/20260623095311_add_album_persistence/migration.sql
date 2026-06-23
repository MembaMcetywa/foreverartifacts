/*
  Warnings:

  - A unique constraint covering the columns `[spreadId,slotIndex]` on the table `AlbumSlot` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[albumId,order]` on the table `AlbumSpread` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "AlbumSlot_spreadId_slotIndex_key" ON "AlbumSlot"("spreadId", "slotIndex");

-- CreateIndex
CREATE UNIQUE INDEX "AlbumSpread_albumId_order_key" ON "AlbumSpread"("albumId", "order");
