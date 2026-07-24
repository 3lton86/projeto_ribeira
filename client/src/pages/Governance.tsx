import { trpc } from "@/lib/trpc";
import { Building2, Users, Target, Layers, ChevronDown, ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";
import { useProject } from "@/contexts/ProjectContext";

type NodeType = "root" | "committee" | "board" | "focal" | "entity";

const NODE_STYLES: Record<NodeType, { bg: string; border: string; text: string; icon: React.ElementType }> = {
  root: {
    bg: "linear-gradient(135deg, oklch(0.72 0.18 185 / 0.2), oklch(0.65 0.20 50 / 0.2))",
    border: "oklch(0.72 0.18 185 / 0.6)",
    text: "oklch(0.90 0.01 220)",
    icon: Layers,
  },
  committee: {
    bg: "oklch(0.65 0.20 50 / 0.12)",
    border: "oklch(0.65 0.20 50 / 0.5)",
    text: "oklch(0.85 0.01 220)",
    icon: Target,
  },
  board: {
    bg: "oklch(0.72 0.18 185 / 0.12)",
    border: "oklch(0.72 0.18 185 / 0.5)",
    text: "oklch(0.85 0.01 220)",
    icon: Building2,
  },
  focal: {
    bg: "oklch(0.65 0.18 290 / 0.12)",
    border: "oklch(0.65 0.18 290 / 0.5)",
    text: "oklch(0.85 0.01 220)",
    icon: Users,
  },
  entity: {
    bg: "oklch(0.65 0.18 145 / 0.08)",
    border: "oklch(0.65 0.18 145 / 0.4)",
    text: "oklch(0.80 0.01 220)",
    icon: Building2,
  },
};

const THEME_COLORS: Record<string, string> = {
  Técnico: "oklch(0.72 0.18 185)",
  Jurídico: "oklch(0.65 0.18 290)",
  "Eco-Fin": "oklch(0.65 0.18 145)",
  Governança: "oklch(0.65 0.20 50)",
};

type GovernanceNode = {
  id: number;
  parentId: number | null;
  title: string;
  subtitle: string | null;
  type: NodeType;
  theme: string | null;
  sortOrder: number;
};

function NodeCard({ node, children }: { node: GovernanceNode; children?: React.ReactNode }) {
  const [expanded, setExpanded] = useState(true);
  const style = NODE_STYLES[node.type];
  const Icon = style.icon;
  const hasChildren = children !== undefined;

  return (
    <div className="flex flex-col items-center">
      {/* Card */}
      <div
        className="relative rounded-xl px-4 py-3 min-w-[180px] max-w-[240px] text-center cursor-pointer transition-all duration-200 hover:scale-105"
        style={{
          background: style.bg,
          border: `1px solid ${style.border}`,
          boxShadow: `0 0 20px ${style.border}`,
        }}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {node.theme && (
          <div
            className="absolute -top-1.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{
              background: `${THEME_COLORS[node.theme] ?? "oklch(0.72 0.18 185)"}22`,
              border: `1px solid ${THEME_COLORS[node.theme] ?? "oklch(0.72 0.18 185)"}66`,
              color: THEME_COLORS[node.theme] ?? "oklch(0.72 0.18 185)",
            }}
          >
            {node.theme}
          </div>
        )}
        <div className="flex items-center justify-center gap-2 mb-1">
          <Icon className="w-4 h-4 flex-shrink-0" style={{ color: style.border }} />
          <span className="text-sm font-semibold leading-tight" style={{ color: style.text }}>
            {node.title}
          </span>
          {hasChildren && (
            <span className="ml-1">
              {expanded ? (
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-3 h-3 text-muted-foreground" />
              )}
            </span>
          )}
        </div>
        {node.subtitle && (
          <p className="text-xs text-muted-foreground leading-tight">{node.subtitle}</p>
        )}
      </div>

      {/* Connector line + children */}
      {hasChildren && expanded && (
        <div className="flex flex-col items-center">
          <div className="w-px h-6" style={{ background: "oklch(0.30 0.04 220)" }} />
          <div className="flex items-start gap-4">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

function buildTree(
  nodes: GovernanceNode[],
  parentId: number | null
): React.ReactNode {
  const children = nodes
    .filter((n) => n.parentId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (children.length === 0) return undefined;

  return (
    <>
      {children.map((node) => {
        const subtree = buildTree(nodes, node.id);
        return (
          <div key={node.id} className="flex flex-col items-center">
            {/* Connector from parent */}
            <div className="w-px h-6" style={{ background: "oklch(0.30 0.04 220)" }} />
            <NodeCard node={node}>
              {subtree}
            </NodeCard>
          </div>
        );
      })}
    </>
  );
}

export default function Governance() {
  const { projectColor } = useProject();
  const { data: nodes, isLoading } = trpc.governance.nodes.useQuery();

  const root = nodes?.find((n) => n.type === "root");

  const legend = [
    { type: "root", label: "Consórcio / Raiz", color: "oklch(0.72 0.18 185)" },
    { type: "committee", label: "Comitê", color: "oklch(0.65 0.20 50)" },
    { type: "board", label: "Órgão Gestor", color: "oklch(0.72 0.18 185)" },
    { type: "focal", label: "Frente Temática", color: "oklch(0.65 0.18 290)" },
    { type: "entity", label: "Entidade / Secretaria", color: "oklch(0.65 0.18 145)" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="animate-fade-in-up">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1 h-6 rounded-full" style={{ background: `linear-gradient(to bottom, ${projectColor}, ${projectColor}88)` }} />
          <h1 className="font-display text-2xl font-bold text-foreground">Estrutura de Governança</h1>
        </div>
        <p className="text-sm text-muted-foreground ml-3">
          Organograma interativo do projeto RIBEIRA SUSTENTÁVEL — clique nos nós para expandir/recolher
        </p>
      </div>

      {/* Legend */}
      <div className="glass-card rounded-xl p-4 flex flex-wrap gap-4 animate-fade-in">
        {legend.map((l) => (
          <div key={l.type} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ background: l.color, boxShadow: `0 0 6px ${l.color}` }}
            />
            <span className="text-xs text-muted-foreground">{l.label}</span>
          </div>
        ))}
      </div>

      {/* Organogram */}
      {isLoading ? (
        <div className="glass-card rounded-xl p-12 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : root && nodes ? (
        <div className="glass-card rounded-xl p-8 overflow-x-auto">
          <div className="flex justify-center min-w-max">
            <div className="flex flex-col items-center">
              <NodeCard node={root as GovernanceNode}>
                {buildTree(nodes as GovernanceNode[], root.id)}
              </NodeCard>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-xl p-12 text-center text-muted-foreground">
          Nenhum dado de governança encontrado.
        </div>
      )}

      {/* Governance description cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-stagger">
        {[
          {
            area: "Governança",
            title: "Frente de Governança",
            desc: "Gestão institucional, participação social e coordenação das instâncias decisórias do projeto.",
            color: "oklch(0.65 0.20 50)",
            badge: "badge-governanca",
          },
          {
            area: "Técnico",
            title: "Frente Técnica",
            desc: "Diagnóstico territorial, urbanístico, ambiental, infraestrutura e estudos técnicos existentes.",
            color: "oklch(0.72 0.18 185)",
            badge: "badge-tecnico",
          },
          {
            area: "Jurídico",
            title: "Frente Jurídica",
            desc: "Regularização fundiária, instrumentos legais, passivos jurídicos e viabilização normativa.",
            color: "oklch(0.65 0.18 290)",
            badge: "badge-juridico",
          },
          {
            area: "Eco-Fin",
            title: "Frente Econômico-Financeira",
            desc: "Viabilidade econômica, estruturação financeira, dados fiscais e potencial de mercado.",
            color: "oklch(0.65 0.18 145)",
            badge: "badge-ecofin",
          },
        ].map((item) => (
          <div
            key={item.area}
            className="glass-card rounded-xl p-4"
            style={{ borderLeft: `3px solid ${item.color}` }}
          >
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mb-2 ${item.badge}`}>
              {item.area}
            </span>
            <h3 className="text-sm font-semibold text-foreground mb-1">{item.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
