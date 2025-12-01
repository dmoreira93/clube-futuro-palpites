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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { UserX, Search, Shield, User, Calendar, CheckCircle2, Loader2, Users, Bot } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type UserType = {
  id: string;
  name: string;
  username: string;
  created_at: string;
  is_admin: boolean;
  is_ai: boolean; // Campo novo
  avatar_url: string | null;
  first_login: boolean;
};

const AdminUsers = () => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("users_custom")
        .select(
          "id, name, username, created_at, is_admin, is_ai, avatar_url, first_login"
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

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
      const { error } = await supabase
        .from("users_custom")
        .delete()
        .eq("id", userId);

      if (error) throw error;

      toast.success("Usuário excluído com sucesso");
      setUsers((prev) => prev.filter((user) => user.id !== userId));
    } catch (error) {
      toast.error("Erro ao excluir usuário");
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      (user.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (user.username?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-fifa-blue flex items-center gap-2">
                <Users className="h-6 w-6 text-fifa-gold" /> Gerenciamento de Usuários
            </h2>
            <p className="text-muted-foreground text-sm">Administre os participantes cadastrados.</p>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 border-gray-300 focus:border-fifa-blue"
            />
          </div>
          <Button variant="outline" onClick={fetchUsers} disabled={loading} className="border-fifa-blue text-fifa-blue hover:bg-blue-50">
            Atualizar
          </Button>
        </div>
      </div>

      <Card className="border-t-4 border-t-fifa-blue shadow-md">
        <CardHeader className="pb-4 border-b border-gray-100">
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle className="text-lg text-gray-800">Lista de Participantes</CardTitle>
                    <CardDescription>Total: {filteredUsers.length} encontrados.</CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent className="p-0">
            {loading ? (
                <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-fifa-blue" /></div>
            ) : (
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-gray-50/80">
                            <TableRow>
                                <TableHead className="font-bold text-fifa-blue pl-6">Usuário</TableHead>
                                <TableHead className="font-bold text-fifa-blue">Perfil</TableHead>
                                <TableHead className="font-bold text-fifa-blue">Status</TableHead>
                                <TableHead className="font-bold text-fifa-blue">Cadastro</TableHead>
                                <TableHead className="font-bold text-fifa-blue text-right pr-6">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                <TableRow key={user.id} className="hover:bg-blue-50/30 transition-colors h-16 group">
                                    <TableCell className="pl-6">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9 border border-gray-200">
                                                <AvatarImage src={user.avatar_url || undefined} />
                                                <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">
                                                    {user.name ? user.name.substring(0, 2).toUpperCase() : "??"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-gray-900">{user.name}</span>
                                                <span className="text-xs text-gray-500">@{user.username}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            {user.is_admin && (
                                                <Badge className="bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200 gap-1">
                                                    <Shield className="w-3 h-3" /> Admin
                                                </Badge>
                                            )}
                                            {user.is_ai && (
                                                <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200 gap-1">
                                                    <Bot className="w-3 h-3" /> IA
                                                </Badge>
                                            )}
                                            {!user.is_admin && !user.is_ai && (
                                                <Badge variant="outline" className="text-gray-600 border-gray-300 gap-1">
                                                    <User className="w-3 h-3" /> Humano
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {user.first_login ? (
                                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200">
                                                Pendente
                                            </Badge>
                                        ) : (
                                            <div className="flex items-center text-green-600 text-sm gap-1">
                                                <CheckCircle2 className="w-4 h-4" /> <span className="text-gray-600">Ok</span>
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-gray-500 text-sm font-mono">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-3 h-3 text-gray-400" />
                                            {new Date(user.created_at).toLocaleDateString("pt-BR")}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors">
                                                    <UserX className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle className="text-red-600 flex items-center gap-2">
                                                        <UserX className="w-5 h-5"/> Excluir Usuário
                                                    </AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Tem certeza? Isso removerá <strong className="text-gray-800">{user.name}</strong> e todo o seu histórico.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={() => handleDelete(user.id)}>
                                                        Sim, Excluir
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center text-gray-500">
                                    Nenhum usuário encontrado.
                                </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsers;