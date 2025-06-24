// src/components/pwa/StatBanner.tsx

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Trophy, BarChart3 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const fetchPlatformStats = async () => {
  const { data, error } = await supabase.rpc('get_platform_stats');
  if (error) throw new Error(error.message);
  return data[0];
};

export const StatBanner = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['platformStats'],
    queryFn: fetchPlatformStats,
  });

  const Stat = ({ icon: Icon, value, label }: { icon: React.ElementType, value: number, label: string }) => (
    <div className="flex items-center gap-4">
      <div className="bg-fifa-gold/20 p-3 rounded-lg">
        <Icon className="h-6 w-6 text-fifa-gold" />
      </div>
      <div className="flex flex-col">
        <span className="text-2xl font-bold text-fifa-blue">{value}</span>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <Card className="w-full bg-white/80 backdrop-blur-sm">
        <CardContent className="pt-6 flex justify-around">
          <Skeleton className="h-16 w-36" />
          <Skeleton className="h-16 w-36" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-white/80 backdrop-blur-sm shadow-lg">
        <CardHeader>
            <CardTitle className='flex items-center gap-2 text-fifa-blue'><BarChart3/> Estatísticas da Plataforma</CardTitle>
        </CardHeader>
      <CardContent className="flex flex-col sm:flex-row justify-around items-center gap-6">
        <Stat icon={Trophy} value={data?.pool_count || 0} label="Bolões Criados" />
        <Stat icon={Users} value={data?.participant_count || 0} label="Participantes" />
      </CardContent>
    </Card>
  );
};