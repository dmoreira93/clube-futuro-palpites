// ... imports existentes ...

const Resultados = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [filter, setFilter] = useState("all");
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);

  // Defina os grupos aqui. Você pode carregar isso dinamicamente do Supabase,
  // mas para resolver o erro 'map', vamos usar um exemplo estático por enquanto.
  // Supondo que seus grupos sejam A, B, C, etc.
  const groups = [
    { id: 'A', text: 'A' },
    { id: 'B', text: 'B' },
    { id: 'C', text: 'C' },
    // ... adicione todos os grupos relevantes do seu jogo
  ];

  // Fetch matches from the database
  const { data: matches = [], isLoading, error } = useQuery({
    queryKey: ['matches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          id,
          match_date,
          is_finished,
          stage,
          home_score,
          away_score,
          home_team_id,
          away_team_id,
          home_team:teams!home_team_id(id, name, group_id, flag_url),
          away_team:teams!away_team_id(id, name, group_id, flag_url)
        `)
        .order('match_date', { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      // Explicitly cast the data to Match[] to satisfy TypeScript
      return data as Match[];
    },
  });

  useEffect(() => {
    if (error) {
      toast({
        title: "Erro ao carregar partidas",
        description: "Não foi possível carregar as partidas do banco de dados.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handleSelectMatch = (matchId: string) => {
    setSelectedMatch(matchId);
  };

  const handleFormComplete = () => {
    setSelectedMatch(null);
  };

  // Apply filter - cast as any first to work around type issues safely
  const filteredMatches = filter === "all"
    ? matches
    : (matches as any[]).filter((match) => {
        // Filter by group_id
        // Certifique-se de que home_team e away_team existem antes de acessar group_id
        if (match.home_team && match.home_team.group_id === filter) return true;
        if (match.away_team && match.away_team.group_id === filter) return true;
        return false;
      });

  // Find the selected match data with proper type handling
  const selectedMatchData = matches.find((m) => m.id === selectedMatch) as Match | undefined;

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto flex justify-center items-center min-h-[400px]">
          <div className="animate-spin h-8 w-8 border-4 border-fifa-blue border-t-transparent rounded-full"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-fifa-blue">Resultados dos Jogos</h1>
          <p className="text-gray-600 mt-2">
            Administrador: insira os resultados das partidas para atualizar a pontuação dos participantes
          </p>
        </div>

        {isAdmin && (
          <Alert className="mb-6 bg-amber-50 border-amber-200">
            <AlertTitle className="text-amber-800">Área restrita</AlertTitle>
            <AlertDescription className="text-amber-700">
              Apenas administradores podem inserir resultados. Os participantes devem aguardar a atualização oficial.
              <strong className="block mt-2">
                Ao registrar um resultado, o sistema calculará automaticamente os pontos dos participantes conforme os critérios estabelecidos.
              </strong>
            </AlertDescription>
          </Alert>
        )}

        {/* **AQUI ESTÁ A MUDANÇA PRINCIPAL:** Passe a prop 'groups' */}
        <MatchFilter value={filter} onValueChange={setFilter} groups={groups} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {filteredMatches.length === 0 ? (
            <div className="col-span-2 text-center py-12 bg-gray-50 rounded-md">
              <p className="text-gray-500">Nenhuma partida encontrada para este filtro.</p>
            </div>
          ) : (
            // Use type assertion to work around the type issue safely
            (filteredMatches as any[]).map((match) => (
              <MatchCard
                key={match.id}
                id={match.id}
                homeTeam={match.home_team?.name || ""}
                awayTeam={match.away_team?.name || ""}
                date={match.match_date ? new Date(match.match_date).toISOString() : ""} // Use ISOString para garantir formato consistente
                time={match.match_date ? new Date(match.match_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                // Certifique-se de que 'group' esteja no formato { name: string }
                group={match.home_team?.group_id ? { name: match.home_team.group_id } : undefined}
                homeTeamFlag={match.home_team?.flag_url || ""}
                awayTeamFlag={match.away_team?.flag_url || ""}
                stage={match.stage || ""}
                selected={selectedMatch === match.id}
                onClick={isAdmin ? handleSelectMatch : undefined}
              />
            ))
          )}
        </div>

        {selectedMatch && isAdmin && (
          <ResultForm
            match={selectedMatchData}
            onComplete={handleFormComplete}
          />
        )}
      </div>
    </Layout>
  );
};

export default Resultados;