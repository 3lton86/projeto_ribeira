import { trpc } from "@/lib/trpc";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";
import { Activity, CheckCircle2, Clock, FileText, TrendingUp, XCircle, Download, AlertTriangle, Timer, Building2 } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { exportToPdf } from "@/lib/export";
import { toast } from "sonner";
import { useProject } from "@/contexts/ProjectContext";

const AREA_COLORS: Record<string, string> = {
  Governança: "oklch(0.65 0.20 50)",
  Técnico: "oklch(0.72 0.18 185)",
  Jurídico: "oklch(0.65 0.18 290)",
  "Eco-Fin": "oklch(0.65 0.18 145)",
};

const STATUS_COLORS: Record<string, string> = {
  Pendente: "oklch(0.65 0.14 60)",
  "Em Andamento": "oklch(0.65 0.18 200)",
  Concluído: "oklch(0.65 0.18 145)",
  Cancelado: "oklch(0.55 0.14 25)",
};

function KpiCard({
  label,
  value,
  icon: Icon,
  color,
  sub,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  sub?: string;
}) {
  return (
    <div className="glass-card rounded-xl p-5 flex items-start gap-4 animate-fade-in-up">
      <div
        className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}22`, border: `1px solid ${color}55` }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-2xl font-bold font-display text-foreground">{value}</div>
        <div className="text-sm text-muted-foreground mt-0.5">{label}</div>
        {sub && <div className="text-xs mt-1" style={{ color }}>{sub}</div>}
      </div>
    </div>
  );
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${value}%`, background: color }}
      />
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card rounded-lg p-3 text-xs border border-border/50">
        <div className="font-semibold text-foreground mb-1">{label}</div>
        {payload.map((p: any) => (
          <div key={p.name} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: p.fill || p.color }} />
            <span className="text-muted-foreground">{p.name}:</span>
            <span className="text-foreground font-medium">{p.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

function ExportPdfButton({ project }: { project: string }) {
  const [loading, setLoading] = useState(false);
  const { data: exportData } = trpc.export.data.useQuery({ area: undefined, status: undefined, priority: undefined, project });

  const handleExport = async () => {
    if (!exportData || exportData.length === 0) {
      toast.error("Nenhum dado disponível para exportar.");
      return;
    }
    setLoading(true);
    try {
      exportToPdf(exportData, undefined);
      toast.success("Relatório PDF gerado com sucesso!");
    } catch (err) {
      toast.error("Erro ao gerar o PDF. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
      style={{
        background: "linear-gradient(135deg, oklch(0.72 0.18 185 / 0.15), oklch(0.65 0.20 50 / 0.15))",
        border: "1px solid oklch(0.72 0.18 185 / 0.4)",
        color: "oklch(0.72 0.18 185)",
      }}
    >
      <Download className="w-4 h-4" />
      {loading ? "Gerando..." : "Exportar PDF"}
    </button>
  );
}

export default function Dashboard() {
  const { activeProject, availableProjects, projectColor } = useProject();
  const projectLabel = availableProjects.find((p) => p.id === activeProject)?.label ?? activeProject;
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery({ project: activeProject });
  const [orgaoAreaFilter, setOrgaoAreaFilter] = useState<string | undefined>(undefined);
  const { data: orgaoStats } = trpc.dashboard.orgaoStats.useQuery({ area: orgaoAreaFilter, project: activeProject });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 bg-secondary/50 rounded-lg w-64 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card rounded-xl p-5 h-24 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const statusDonutData = [
    { name: "Pendente", value: stats.byStatus.Pendente, color: STATUS_COLORS["Pendente"] },
    { name: "Em Andamento", value: stats.byStatus["Em Andamento"], color: STATUS_COLORS["Em Andamento"] },
    { name: "Concluído", value: stats.byStatus["Concluído"], color: STATUS_COLORS["Concluído"] },
    { name: "Cancelado", value: stats.byStatus["Cancelado"], color: STATUS_COLORS["Cancelado"] },
  ].filter((d) => d.value > 0);

  const barData = stats.byArea.map((a) => ({
    name: a.area,
    Pendente: a.Pendente,
    "Em Andamento": a["Em Andamento"],
    Concluído: a["Concluído"],
    Cancelado: a.Cancelado,
  }));

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="animate-fade-in-up flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-6 rounded-full" style={{ background: `linear-gradient(to bottom, ${projectColor}, ${projectColor}88)` }} />
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">Dashboard</h1>
              <span className="ml-0.5 text-sm font-semibold tracking-wide" style={{ color: projectColor }}>{projectLabel}</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground ml-3">
            Controle de entrega de documentos e informações pelos órgãos municipais para estruturação do projeto PPP
          </p>
        </div>
        <ExportPdfButton project={activeProject} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-stagger">
        <KpiCard
          label="Total de Ações"
          value={stats.total}
          icon={FileText}
          color="oklch(0.72 0.18 185)"
          sub="itens cadastrados"
        />
        <KpiCard
          label="Concluídas"
          value={stats.byStatus["Concluído"]}
          icon={CheckCircle2}
          color="oklch(0.65 0.18 145)"
          sub={`${stats.completionRate}% do total`}
        />
        <KpiCard
          label="Em Andamento"
          value={stats.byStatus["Em Andamento"]}
          icon={Activity}
          color="oklch(0.65 0.18 200)"
          sub="em execução"
        />
        <KpiCard
          label="Pendentes"
          value={stats.byStatus.Pendente}
          icon={Clock}
          color="oklch(0.65 0.14 60)"
          sub="aguardando início"
        />
      </div>

      {/* Progress global */}
      <div className="glass-card rounded-xl p-5 animate-fade-in-up">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" style={{ color: "oklch(0.72 0.18 185)" }} />
            <span className="text-sm font-semibold text-foreground">Progresso Geral</span>
          </div>
          <span className="text-2xl font-bold font-display" style={{ color: "oklch(0.72 0.18 185)" }}>
            {stats.completionRate}%
          </span>
        </div>
        <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${stats.completionRate}%`,
              background: "linear-gradient(90deg, oklch(0.72 0.18 185), oklch(0.65 0.20 50))",
              boxShadow: "0 0 12px oklch(0.72 0.18 185 / 0.5)",
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Bar chart by area */}
        <div className="glass-card rounded-xl p-5 animate-fade-in-up">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 rounded-full" style={{ background: "oklch(0.72 0.18 185)" }} />
            <span className="text-sm font-semibold text-foreground">Ações por Área e Status</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} barSize={14}>
              <XAxis
                dataKey="name"
                tick={{ fill: "oklch(0.60 0.02 220)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "oklch(0.60 0.02 220)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "oklch(0.18 0.03 220 / 0.5)" }} />
              <Bar dataKey="Pendente" fill={STATUS_COLORS["Pendente"]} radius={[3, 3, 0, 0]} />
              <Bar dataKey="Em Andamento" fill={STATUS_COLORS["Em Andamento"]} radius={[3, 3, 0, 0]} />
              <Bar dataKey="Concluído" fill={STATUS_COLORS["Concluído"]} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Donut chart */}
        <div className="glass-card rounded-xl p-5 animate-fade-in-up">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 rounded-full" style={{ background: "oklch(0.65 0.20 50)" }} />
            <span className="text-sm font-semibold text-foreground">Distribuição por Status</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={statusDonutData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {statusDonutData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value) => (
                  <span style={{ color: "oklch(0.75 0.02 220)", fontSize: 12 }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Deadline chart */}
      {stats.byDeadline && (() => {
        const DEADLINE_COLORS = {
          Atrasado: "oklch(0.60 0.20 25)",
          "No Prazo": "oklch(0.65 0.18 145)",
          Concluído: "oklch(0.72 0.18 185)",
          "Sem Prazo": "oklch(0.45 0.02 220)",
        };
        const deadlineData = [
          { name: "Atrasado", value: stats.byDeadline.atrasado, color: DEADLINE_COLORS["Atrasado"] },
          { name: "No Prazo", value: stats.byDeadline.noPrazo, color: DEADLINE_COLORS["No Prazo"] },
          { name: "Concluído", value: stats.byDeadline.concluido, color: DEADLINE_COLORS["Concluído"] },
          { name: "Sem Prazo", value: stats.byDeadline.semPrazo, color: DEADLINE_COLORS["Sem Prazo"] },
        ].filter(d => d.value > 0);
        return (
          <div className="glass-card rounded-xl p-5 animate-fade-in-up">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 rounded-full" style={{ background: "oklch(0.65 0.20 25)" }} />
              <span className="text-sm font-semibold text-foreground">Situação dos Prazos</span>
              <span className="ml-auto text-xs text-muted-foreground">itens não cancelados</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
              {/* Donut chart */}
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={deadlineData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                    {deadlineData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend formatter={(value) => <span style={{ color: "oklch(0.75 0.02 220)", fontSize: 12 }}>{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
              {/* KPI cards */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Atrasados", value: stats.byDeadline.atrasado, icon: AlertTriangle, color: "oklch(0.60 0.20 25)" },
                  { label: "No Prazo", value: stats.byDeadline.noPrazo, icon: Timer, color: "oklch(0.65 0.18 145)" },
                  { label: "Concluídos", value: stats.byDeadline.concluido, icon: CheckCircle2, color: "oklch(0.72 0.18 185)" },
                  { label: "Sem Prazo", value: stats.byDeadline.semPrazo, icon: XCircle, color: "oklch(0.45 0.02 220)" },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="flex flex-col items-center justify-center p-3 rounded-xl" style={{ background: `${color.replace(')', ' / 0.12)')}`, border: `1px solid ${color.replace(')', ' / 0.3)')}` }}>
                    <Icon className="w-5 h-5 mb-1" style={{ color }} />
                    <div className="text-xl font-bold font-display" style={{ color }}>{value}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 text-center">{label}</div>
                  </div>
                ))}
              </div>
            </div>
            {stats.byDeadline.atrasado > 0 && (
              <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg text-xs" style={{ background: "oklch(0.55 0.18 25 / 0.10)", border: "1px solid oklch(0.55 0.18 25 / 0.25)", color: "oklch(0.65 0.20 25)" }}>
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                <span><strong>{stats.byDeadline.atrasado} {stats.byDeadline.atrasado === 1 ? "ação está" : "ações estão"} com prazo vencido</strong> e ainda não {stats.byDeadline.atrasado === 1 ? "foi concluída" : "foram concluídas"}. Acesse a lista de ações para priorizar as entregas em atraso.</span>
              </div>
            )}
          </div>
        );
      })()}

      {/* Area progress cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-stagger">
        {stats.byArea.map((area) => (
          <Link key={area.area} href={`/acoes?area=${encodeURIComponent(area.area)}`} className="glass-card rounded-xl p-4 block hover:border-primary/40 transition-all duration-200 cursor-pointer group">
              <div className="flex items-center justify-between mb-3">
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded badge-${
                    area.area === "Eco-Fin"
                      ? "ecofin"
                      : area.area === "Governança"
                      ? "governanca"
                      : area.area === "Técnico"
                      ? "tecnico"
                      : "juridico"
                  }`}
                >
                  {area.area}
                </span>
                <span className="text-xs text-muted-foreground">{area.total} itens</span>
              </div>
              <div className="text-xl font-bold font-display text-foreground mb-1">
                {area.completion}%
              </div>
              <div className="text-xs text-muted-foreground mb-2">concluído</div>
              <ProgressBar
                value={area.completion}
                color={AREA_COLORS[area.area] ?? "oklch(0.72 0.18 185)"}
              />
              <div className="mt-3 grid grid-cols-2 gap-1 text-xs">
                <div className="text-muted-foreground">
                  <span className="text-foreground font-medium">{area.Pendente}</span> pendentes
                </div>
                <div className="text-muted-foreground">
                  <span className="text-foreground font-medium">{area["Em Andamento"]}</span> em and.
                </div>
              </div>
            </Link>
        ))}
      </div>

      {/* ---- PAINEL: ITENS POR ÓRGÃO ---- */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            <h2 className="text-base font-semibold text-foreground">Itens por Órgão Responsável</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Filtrar por frente:</span>
            <select
              value={orgaoAreaFilter ?? ""}
              onChange={(e) => setOrgaoAreaFilter(e.target.value || undefined)}
              className="text-xs px-2 py-1 rounded-md border border-border bg-background text-foreground"
            >
              <option value="">Todas</option>
              <option value="Governança">Governança</option>
              <option value="Técnico">Técnico</option>
              <option value="Jurídico">Jurídico</option>
              <option value="Eco-Fin">Eco-Fin</option>
            </select>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-4 text-xs">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block" style={{background:"oklch(0.55 0.18 230)"}} />Total de itens</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block" style={{background:"oklch(0.72 0.18 185)"}} />Com documentos</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block" style={{background:"oklch(0.65 0.20 145)"}} />Doc aceito</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block" style={{background:"oklch(0.72 0.18 50)"}} />Doc com pendência</span>
        </div>

        {!orgaoStats || orgaoStats.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">Nenhum órgão vinculado.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <div style={{ minWidth: Math.max(600, orgaoStats.length * 52) }}>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart
                  data={orgaoStats}
                  margin={{ top: 8, right: 16, left: 0, bottom: 60 }}
                  barCategoryGap="25%"
                  barGap={2}
                >
                  <XAxis
                    dataKey="orgao"
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    angle={-40}
                    textAnchor="end"
                    interval={0}
                    height={64}
                  />
                  <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(value: number, name: string) => {
                      const labels: Record<string, string> = {
                        totalItems: "Total de itens",
                        withDocs: "Com documentos",
                        docsAccepted: "Doc aceito",
                        docsPending: "Doc com pendência",
                      };
                      return [value, labels[name] ?? name];
                    }}
                  />
                  <Bar dataKey="totalItems" name="totalItems" fill="oklch(0.55 0.18 230)" radius={[3,3,0,0]} maxBarSize={20} />
                  <Bar dataKey="withDocs" name="withDocs" fill="oklch(0.72 0.18 185)" radius={[3,3,0,0]} maxBarSize={20} />
                  <Bar dataKey="docsAccepted" name="docsAccepted" fill="oklch(0.65 0.20 145)" radius={[3,3,0,0]} maxBarSize={20} />
                  <Bar dataKey="docsPending" name="docsPending" fill="oklch(0.72 0.18 50)" radius={[3,3,0,0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Table summary */}
        {orgaoStats && orgaoStats.length > 0 && (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-3 font-semibold text-muted-foreground">Órgão</th>
                  <th className="text-right py-2 px-2 font-semibold text-muted-foreground">Total</th>
                  <th className="text-right py-2 px-2 font-semibold text-muted-foreground">Com Doc</th>
                  <th className="text-right py-2 px-2 font-semibold text-muted-foreground">Aceito</th>
                  <th className="text-right py-2 pl-2 font-semibold text-muted-foreground">Pendência</th>
                </tr>
              </thead>
              <tbody>
                {orgaoStats.map((row) => (
                  <tr key={row.orgao} className="border-b border-border/40 hover:bg-secondary/30 transition-colors">
                    <td className="py-1.5 pr-3 font-medium text-foreground">{row.orgao}</td>
                    <td className="text-right py-1.5 px-2 text-foreground">{row.totalItems}</td>
                    <td className="text-right py-1.5 px-2" style={{color:"oklch(0.72 0.18 185)"}}>{row.withDocs}</td>
                    <td className="text-right py-1.5 px-2" style={{color:"oklch(0.55 0.22 145)"}}>{row.docsAccepted}</td>
                    <td className="text-right py-1.5 pl-2" style={{color:"oklch(0.65 0.20 50)"}}>{row.docsPending}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
