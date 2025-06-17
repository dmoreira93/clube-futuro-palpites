// pages/api/pools/[poolId]/ranking.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { poolId } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!poolId || typeof poolId !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid poolId' });
  }

  try {
    const { data, error } = await supabase
      .rpc('get_pool_ranking', { p_pool_id: poolId });

    if (error) {
      console.error('Supabase RPC error:', error);
      return res.status(500).json({ error: 'Failed to fetch ranking.' });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ error: 'Unexpected server error.' });
  }
}
