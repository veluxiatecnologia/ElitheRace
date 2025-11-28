-- Migration: add_pe_destination
-- Created: 2025-11-27
-- Description: Add destination PE field to allow PEs to reference each other

-- Add new column for PE destination
ALTER TABLE pes 
ADD COLUMN IF NOT EXISTS destino_pe_id BIGINT;

-- Add foreign key constraint to reference other PEs in the same table
-- Note: This is a self-referencing foreign key
ALTER TABLE pes
ADD CONSTRAINT fk_pes_destino_pe
FOREIGN KEY (destino_pe_id) 
REFERENCES pes(id) 
ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_pes_destino_pe_id 
ON pes(destino_pe_id);

-- Add comment for documentation
COMMENT ON COLUMN pes.destino_pe_id IS 'ID do PE de destino para onde este PE segue. NULL se não segue para nenhum PE específico';
