-- Migration: Remove teremszam column and set default dentist values
-- Run this if you have an existing database

-- Remove teremszam column from time_slots table
ALTER TABLE time_slots DROP COLUMN IF EXISTS teremszam;

-- Set default values for dentist fields in time_slots table
ALTER TABLE time_slots 
  ALTER COLUMN dentist_name SET DEFAULT 'dr. König János',
  ALTER COLUMN dentist_email SET DEFAULT 'drkonigjanos@gmail.com',
  ALTER COLUMN cim SET DEFAULT '5600 Békéscsaba, Kolozsvári utca 3';

-- Update existing rows in time_slots to have default dentist values if they are NULL
UPDATE time_slots 
SET 
  dentist_name = COALESCE(dentist_name, 'dr. König János'),
  dentist_email = COALESCE(dentist_email, 'drkonigjanos@gmail.com'),
  cim = COALESCE(cim, '5600 Békéscsaba, Kolozsvári utca 3')
WHERE 
  dentist_name IS NULL 
  OR dentist_email IS NULL 
  OR cim IS NULL;

-- Remove teremszam column from appointments table
ALTER TABLE appointments DROP COLUMN IF EXISTS teremszam;

