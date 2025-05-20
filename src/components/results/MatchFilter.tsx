import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type MatchFilterProps = {
  value: string;
  onValueChange: (value: string) => void;
  groups: { id: string; text: string }[];
};

export const MatchFilter = ({ value, onValueChange, groups }: MatchFilterProps) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-bold text-fifa-blue">Jogos</h2>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filtrar por grupo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os jogos</SelectItem>
          {groups.map((group) => (
            <SelectItem key={group.id} value={group.text}>
              Grupo {group.text}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
