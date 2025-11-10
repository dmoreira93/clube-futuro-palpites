// src/components/admin/PoolSelector.tsx
import { useAdmin } from '@/contexts/AdminContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Building2 } from 'lucide-react';

export const PoolSelector = () => {
  const { managedPoolId, availablePools, setManagedPoolId, loading } = useAdmin();

  if (loading) {
    return (
      <Card className="mb-6">
        <CardContent className="pt-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Carregando bolões...</span>
        </CardContent>
      </Card>
    );
  }

  if (availablePools.length === 0) {
    return (
      <Card className="mb-6 border-yellow-300 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-yellow-800 flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Nenhum Bolão Disponível
          </CardTitle>
          <CardDescription className="text-yellow-700">
            Crie um bolão para começar a gerenciar.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Selecione o Bolão para Gerenciar
        </CardTitle>
        <CardDescription>
          As configurações abaixo se aplicarão apenas ao bolão selecionado.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Select value={managedPoolId || undefined} onValueChange={setManagedPoolId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione um bolão..." />
          </SelectTrigger>
          <SelectContent>
            {availablePools.map((pool) => (
              <SelectItem key={pool.id} value={pool.id}>
                {pool.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
};
