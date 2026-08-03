const fs = require('fs');

const file = 'src/app/dashboard/components/PDGDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Update Props
content = content.replace(
  'depositsByBank: { name: string, value: number }[];',
  'depositsByBank: { name: string, value: number }[];\n    recettesByAgency?: { name: string, value: number }[];'
);

// 2. Calculate recEvo
const recEvoLogic = `
    let recEvo = 0;
    if (prev.recettes > 0) recEvo = ((last.recettes - prev.recettes) / prev.recettes) * 100;
`;
content = content.replace(
  'let revEvo = 0, expEvo = 0, theEvo = 0;',
  'let revEvo = 0, expEvo = 0, theEvo = 0, recEvo = 0;'
);
content = content.replace(
  'if (prev.depenses > 0) expEvo = ((last.depenses - prev.depenses) / prev.depenses) * 100;',
  'if (prev.depenses > 0) expEvo = ((last.depenses - prev.depenses) / prev.depenses) * 100;\n' + recEvoLogic
);

// 3. Add Recettes KPI Card
const recettesCard = `
        {/* Recettes */}
        <Card className="overflow-hidden bg-background border-border/40 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl">
          <CardContent className="p-5 sm:p-6 pb-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" /> Recettes
                </p>
                <div className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-2">
                  {formatToMillions(stats.recetteMonth || 0)}
                </div>
              </div>
              <EvolutionBadge value={recEvo} />
            </div>
            <div className="mt-4 h-[40px] w-full -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData.evolution.slice(-6)}>
                  <defs>
                    <linearGradient id="sparkRec" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="recettes" stroke="#3b82f6" strokeWidth={2} fill="url(#sparkRec)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
`;
content = content.replace(
  '{/* Objectifs */}',
  recettesCard + '\n        {/* Objectifs */}'
);

// Fix grid layout
content = content.replace(
  'grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  'grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'
);

// 4. Update Evolution Chart
const areaRecDefs = `
                  <linearGradient id="areaRec" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
`;
content = content.replace(
  '<linearGradient id="areaRev" x1="0" y1="0" x2="0" y2="1">',
  areaRecDefs + '<linearGradient id="areaRev" x1="0" y1="0" x2="0" y2="1">'
);

content = content.replace(
  '<Area type="monotone" dataKey="revenues" name="Versements bancaires" stroke={REX_GREEN}',
  '<Area type="monotone" dataKey="recettes" name="Recettes journalières" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#areaRec)" activeDot={{ r: 6, fill: "#3b82f6", strokeWidth: 0 }} />\n                <Area type="monotone" dataKey="revenues" name="Versements bancaires" stroke={REX_GREEN}'
);

content = content.replace(
  'Versements et dépenses sur l\'année',
  'Recettes, versements et dépenses sur l\'année'
);

// 5. Add Recettes by Agency Chart
const recettesChart = `
        {/* Graphique Recettes par Agence (Bar Chart) */}
        {chartData.recettesByAgency && chartData.recettesByAgency.length > 0 && (
          <Card className="bg-background border-border/40 rounded-3xl shadow-sm col-span-1 lg:col-span-1 overflow-hidden">
            <CardHeader className="p-6 pb-2">
              <CardTitle className="text-lg font-bold tracking-tight text-foreground">Top Agences</CardTitle>
              <CardDescription className="text-sm">Recettes par agence</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-4 h-[380px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.recettesByAgency} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" horizontal={false} stroke="hsl(var(--border))" strokeOpacity={0.5} />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatYAxis} />
                  <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} width={80} />
                  <RechartsTooltip content={<PremiumTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }} />
                  <Bar dataKey="value" name="Recettes" fill="#3b82f6" radius={[0, 4, 4, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
`;
content = content.replace(
  '{/* Graphique Dépenses par Agence (Bar Chart) */}',
  recettesChart + '\n        {/* Graphique Dépenses par Agence (Bar Chart) */}'
);

fs.writeFileSync(file, content);
