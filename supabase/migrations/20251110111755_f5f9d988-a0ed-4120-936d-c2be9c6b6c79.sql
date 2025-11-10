-- Adiciona coluna api_football_id à tabela teams se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'teams' AND column_name = 'api_football_id') THEN
        ALTER TABLE public.teams ADD COLUMN api_football_id INTEGER;
    END IF;
END $$;