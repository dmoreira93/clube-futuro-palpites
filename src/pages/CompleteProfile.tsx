import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { User } from "lucide-react";

export default function CompleteProfile() {
  const { user, fetchAndSyncProfile } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!username.trim() || !user) return;
    setLoading(true);

    try {
      // 1. Verifica se apelido já existe (opcional, mas recomendado)
      // (Pulei essa verificação pra simplificar, o banco deve ter constraint unique se quiser)

      // 2. Atualiza o perfil
      const { error } = await supabase
        .from("users_custom")
        .update({ 
            username: username,
            first_login: false // Marca que já completou o setup
        })
        .eq("id", user.id);

      if (error) throw error;

      // 3. Sincroniza e vai pro Dashboard
      await fetchAndSyncProfile(user);
      toast.success("Perfil atualizado!");
      navigate("/dashboard");

    } catch (error: any) {
      toast.error("Erro ao salvar", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto bg-blue-100 p-3 rounded-full w-fit mb-2">
            <User className="h-8 w-8 text-fifa-blue" />
          </div>
          <CardTitle>Quase lá!</CardTitle>
          <CardDescription>Escolha como você quer ser chamado nos bolões.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Seu Apelido (Nome no Ranking)</label>
            <Input 
                placeholder="Ex: Imperador, Fenômeno..." 
                value={username} 
                onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <Button className="w-full bg-fifa-blue" onClick={handleSave} disabled={loading || !username}>
            {loading ? "Salvando..." : "Concluir e Entrar"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}