import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import UpdateProfileInfo from "@/components/profile/UpdateProfileInfo";
import UpdateAvatar from "@/components/profile/UpdateAvatar";
import UpdatePassword from "@/components/profile/UpdatePassword";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Settings, Lock } from "lucide-react";

const ProfilePage = () => {
  const { user, userParticipations } = useAuth();

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-fifa-blue mb-8">Meu Perfil</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Coluna da Esquerda: Cartão de Identidade */}
        <div className="space-y-6">
          <Card className="text-center overflow-hidden border-t-4 border-t-fifa-gold shadow-md">
            <div className="bg-gray-50 h-24"></div>
            <div className="relative -mt-12 px-4">
                <div className="inline-block p-1 bg-white rounded-full shadow-sm">
                    <Avatar className="h-24 w-24">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback className="text-2xl bg-fifa-blue text-white">
                        {user.name?.substring(0, 2).toUpperCase() || "US"}
                        </AvatarFallback>
                    </Avatar>
                </div>
            </div>
            <CardHeader className="pt-2 pb-2">
              <CardTitle className="text-xl">{user.name}</CardTitle>
              <p className="text-sm text-gray-500">@{user.username}</p>
            </CardHeader>
            <CardContent className="pb-6">
                <div className="flex justify-center gap-4 mt-2 text-sm">
                    <div className="text-center">
                        <span className="block font-bold text-lg text-fifa-blue">{userParticipations.length}</span>
                        <span className="text-gray-400 text-xs uppercase">Bolões</span>
                    </div>
                    {/* Você pode adicionar mais stats agregados aqui no futuro */}
                </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna da Direita: Edição */}
        <div className="md:col-span-2">
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="info"><User className="w-4 h-4 mr-2"/> Dados</TabsTrigger>
              <TabsTrigger value="avatar"><Settings className="w-4 h-4 mr-2"/> Avatar</TabsTrigger>
              <TabsTrigger value="security"><Lock className="w-4 h-4 mr-2"/> Senha</TabsTrigger>
            </TabsList>
            
            <TabsContent value="info">
              <UpdateProfileInfo />
            </TabsContent>
            
            <TabsContent value="avatar">
              <UpdateAvatar />
            </TabsContent>
            
            <TabsContent value="security">
              <UpdatePassword />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;