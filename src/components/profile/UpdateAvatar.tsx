// src/components/profile/UpdateAvatar.tsx (VERSÃO CORRIGIDA E MELHORADA)

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, Upload } from 'lucide-react';

export const UpdateAvatar = () => {
  const { user, fetchAndSyncProfile } = useAuth();
  const [uploading, setUploading] = useState(false);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !user) {
      return;
    }

    setUploading(true);
    try {
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      // Nome de arquivo previsível para facilitar a substituição
      const fileName = `avatar.${fileExt}`; 
      // Caminho do arquivo agora é uma pasta com o ID do usuário
      const filePath = `${user.id}/${fileName}`; 

      // Faz o upload do novo avatar. O 'upsert: true' substitui o arquivo antigo se o nome for o mesmo.
      const { error: uploadError } = await supabase.storage
        .from('avatars') // Confere se o nome do bucket está correto
        .upload(filePath, file, {
          upsert: true,
          cacheControl: '3600',
        });

      if (uploadError) throw uploadError;

      // Monta a URL pública manualmente para evitar problemas de cache do CDN
      // Adicionamos um timestamp para forçar a atualização da imagem no navegador
      const timestamp = new Date().getTime();
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const publicUrlWithTimestamp = `${urlData.publicUrl}?t=${timestamp}`;


      // Atualiza a tabela 'users_custom' com a nova URL
      const { error: updateUserError } = await supabase
        .from('users_custom')
        .update({ avatar_url: publicUrlWithTimestamp, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (updateUserError) throw updateUserError;
      
      await fetchAndSyncProfile(user); // Re-sincroniza o perfil no contexto
      toast.success("Avatar atualizado com sucesso!");

    } catch (error: any) {
      toast.error("Erro ao atualizar o avatar.", { description: error.message });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <Avatar className="h-24 w-24">
        <AvatarImage src={user?.avatar_url || undefined} alt={user?.name || 'Avatar'} />
        <AvatarFallback>{user?.name?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
      </Avatar>
      <Button asChild variant="outline">
        <label htmlFor="avatar-upload" className="cursor-pointer">
          {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          {uploading ? 'Enviando...' : 'Trocar Avatar'}
          <Input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
        </label>
      </Button>
    </div>
  );
};