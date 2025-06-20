// src/pages/Profile.tsx

import { UpdateAvatar } from '@/components/profile/UpdateAvatar';
import { UpdateProfileInfo } from '@/components/profile/UpdateProfileInfo';
import { UpdatePassword } from '@/components/profile/UpdatePassword';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ProfilePage = () => {
  return (
    <div className="container mx-auto max-w-4xl py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Meu Perfil</h1>
      
      <div className="mb-10">
        <UpdateAvatar />
      </div>

      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
        </TabsList>
        <TabsContent value="info" className="mt-6">
          <UpdateProfileInfo />
        </TabsContent>
        <TabsContent value="security" className="mt-6">
          <UpdatePassword />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfilePage;