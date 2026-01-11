-- First migration: Just add the enum value
-- The functions will be created in a separate migration after this commits
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'dono';