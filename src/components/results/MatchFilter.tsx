
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type MatchFilterProps = {
  value: string;
  onValueChange: (value: string) => void;
};

export const MatchFilter = ({ value, onValueChange }: MatchFilterProps) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-bold text-fifa-blue">Jogos</h2>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filtrar por grupo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os jogos</SelectItem>
          <SelectItem value="A">Grupo A</SelectItem>
          <SelectItem value="B">Grupo B</SelectItem>
          <SelectItem value="C">Grupo C</SelectItem>
          <SelectItem value="D">Grupo D</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
