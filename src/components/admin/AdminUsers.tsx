import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { UserX } from "lucide-react";

type User = {
  id: string;
  name: string;
  username: string;
  is_admin: boolean;
  avatar_url: string | null;
  first_login: boolean;
  created_at: string;
};

const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("user_custom")
        .select("id, name, username, is_admin, avatar_url, first_login, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setUsers(data || []);
    } catch (error) {
      toast.error("Erro ao carregar usuários");
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      // Primeiro deletar os palpites associados, se ainda estiverem na tabela "predictions"
      const { error: predictionError } = await supabase
        .from("predictions")
        .delete()
        .eq("user_id", userId);

      if (predictionError) {
        throw predictionError;
      }

      // Depois deletar o usuário da tabela "user_custom"
      const { error } = await supabase
        .from("user_custom")
        .delete()
        .eq("id", userId);

      if (error) {
        throw error;
      }

      toast.success("Usuário excluído com sucesso");
      setUsers((prev) => prev.filter((user) => user.id !== userId));
    } catch (error) {
      toast.error("Erro ao excluir usuário");
      console.error("Error deleting user:", error);
    }
  };

  // Filtro busca por name ou username, pois email não existe mais
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Gerenciamento de Usuários</h2>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Buscar por nome ou username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />
          <Button
            variant="outline"
            onClick={fetchUsers}
            disabled={loading}
          >
            Atualizar
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-fifa-blue border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Avatar</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Primeiro Login</TableHead>
                <TableHead>Data de Cadastro</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.name}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
                          ?
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>
                      {user.is_admin ? (
                        <span className="text-green-600 font-semibold">Sim</span>
                      ) : (
                        <span className="text-gray-500">Não</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.first_login ? (
                        <span className="text-blue-600 font-semibold">Sim</span>
                      ) : (
                        <span className="text-gray-500">Não</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-red-500">
                            <UserX className="h-5 w-5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir usuário</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir o usuário "{user.name}"? Esta ação não pode ser desfeita e também removerá todos os palpites associados a este usuário.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              className="bg-red-500 hover:bg-red-600"
                              onClick={() => handleDelete(user.id)}
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    Nenhum usuário encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
