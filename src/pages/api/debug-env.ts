// pages/api/debug-env.ts

export default function handler(req, res) {
    res.status(200).json({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'MISSING',
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'OK' : 'MISSING',
    });
  }
  