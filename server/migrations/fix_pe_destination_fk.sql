-- Migration: fix_pe_destination_fk
-- Created: 2025-11-27
-- Description: Fix foreign key constraint for destino_pe_id to reference pe_templates instead of pes

-- Drop the incorrect foreign key constraint
ALTER TABLE pes
DROP CONSTRAINT IF EXISTS fk_pes_destino_pe;

-- Add the correct foreign key constraint referencing pe_templates
ALTER TABLE pes
ADD CONSTRAINT fk_pes_destino_pe
FOREIGN KEY (destino_pe_id) 
REFERENCES pe_templates(id) 
ON DELETE SET NULL;
