-- =====================================================
-- Seed Company Logos - Dynamic Branding System
-- =====================================================
-- This script updates the companies table with logo URLs
-- Run this in your Supabase SQL Editor

-- Update existing companies with logo URLs
UPDATE companies SET logo_url = '/logos/ascend.svg' WHERE slug = 'ascend';
UPDATE companies SET logo_url = '/logos/vanguard.svg' WHERE slug = 'vanguard';
UPDATE companies SET logo_url = '/logos/lincoln.svg' WHERE slug = 'lincoln';
UPDATE companies SET logo_url = '/logos/congruent.svg' WHERE slug = 'congruent';

-- Insert or update all companies at once
-- Use this if companies don't exist yet or to ensure all data is current
INSERT INTO companies (name, slug, logo_url, primary_color) VALUES
  ('Ascend Federal Credit Union', 'ascend', '/logos/ascend.png', '#8B1538'),
  ('Vanguard', 'vanguard', '/logos/vanguard.svg', '#811926'),
  ('Lincoln Financial', 'lincoln', '/logos/lincoln.svg', '#6B1D4A'),
  ('Congruent Solutions', 'congruent', '/logos/congruent.svg', '#7c3aed')
ON CONFLICT (slug) 
DO UPDATE SET
  logo_url = EXCLUDED.logo_url,
  primary_color = EXCLUDED.primary_color,
  name = EXCLUDED.name;

-- Verify the updates
SELECT 
  name,
  slug,
  logo_url,
  primary_color,
  created_at
FROM companies
ORDER BY name;
