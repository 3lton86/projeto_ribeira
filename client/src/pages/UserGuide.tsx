import { useState } from "react";
import {
  BookOpen,
  ShieldCheck,
  Building2,
  Eye,
  ChevronDown,
  ChevronRight,
  LogIn,
  LayoutDashboard,
  ListChecks,
  FileText,
  MessageSquare,
  Link2,
  UserCog,
  Download,
  Search,
  GripVertical,
  Plus,
  Pencil,
  Trash2,
  History,
  AlertTriangle,
  CheckCircle,
  Clock,
  Info,
  Bell,
  ClipboardList,
} from "lucide-react";
import { useLocalAuth } from "@/contexts/LocalAuthContext";

// ---- Types ----
interface Section {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  content: React.ReactNode;
}

// ---- Accordion Item ----
function AccordionItem({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border/40 rounded-xl overflow-hidden mb-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-secondary/30 transition-colors"
      >
        <Icon className="w-4 h-4 flex-shrink-0 text-primary" />
        <span className="flex-1 text-sm font-semibold text-foreground">{title}</span>
        {open ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      {open && (
        <div className="px-5 pb-5 pt-1 text-sm text-foreground leading-relaxed space-y-3 border-t border-border/30 bg-secondary/10">
          {children}
        </div>
      )}
    </div>
  );
}

// ---- Step Badge ----
function Step({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span
        className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
        style={{ background: "oklch(0.38 0.16 240)" }}
      >
        {n}
      </span>
      <span className="text-sm text-foreground leading-relaxed">{text}</span>
    </div>
  );
}

// ---- Info Box ----
function InfoBox({ type, children }: { type: "tip" | "warning" | "info"; children: React.ReactNode }) {
  const styles = {
    tip: { bg: "oklch(0.45 0.18 145 / 0.08)", border: "oklch(0.45 0.18 145 / 0.30)", icon: CheckCircle, color: "oklch(0.30 0.18 145)" },
    warning: { bg: "oklch(0.65 0.20 50 / 0.08)", border: "oklch(0.65 0.20 50 / 0.30)", icon: AlertTriangle, color: "oklch(0.50 0.20 50)" },
    info: { bg: "oklch(0.38 0.16 240 / 0.08)", border: "oklch(0.38 0.16 240 / 0.30)", icon: Info, color: "oklch(0.38 0.16 240)" },
  }[type];
  const Icon = styles.icon;
  return (
    <div
      className="flex gap-2.5 p-3 rounded-lg text-sm"
      style={{ background: styles.bg, border: `1px solid ${styles.border}` }}
    >
      <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: styles.color }} />
      <span className="text-foreground leading-relaxed">{children}</span>
    </div>
  );
}

// ---- Profile Tab ----
type Profile = "admin" | "setorial" | "viewer";

const PROFILES: { key: Profile; label: string; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
  { key: "admin", label: "Administrador / Super-Admin", icon: ShieldCheck, color: "oklch(0.38 0.16 240)" },
  { key: "setorial", label: "Usuário Setorial", icon: Building2, color: "oklch(0.45 0.18 145)" },
  { key: "viewer", label: "Visualizador", icon: Eye, color: "oklch(0.55 0.12 260)" },
];

// ---- Content per profile ----
const ADMIN_SECTIONS: Section[] = [
  {
    id: "login",
    title: "1. Acesso à plataforma",
    icon: LogIn,
    content: (
      <div className="space-y-3">
        <p>O administrador acessa a plataforma pela tela de login com <strong>usuário</strong> (e-mail) e <strong>senha</strong> cadastrados pelo super-admin.</p>
        <div className="space-y-2">
          <Step n={1} text="Acesse o endereço da plataforma no navegador." />
          <Step n={2} text="Informe seu e-mail e senha nos campos indicados." />
          <Step n={3} text="Clique em 'Entrar'. Você será redirecionado ao Dashboard." />
        </div>
        <InfoBox type="tip">Se esqueceu a senha, solicite ao super-admin que redefina seu acesso na página de Gerenciamento de Usuários.</InfoBox>
      </div>
    ),
  },
  {
    id: "dashboard",
    title: "2. Dashboard — visão geral",
    icon: LayoutDashboard,
    content: (
      <div className="space-y-3">
        <p>O Dashboard apresenta os indicadores consolidados de todos os contratos e ações da plataforma:</p>
        <ul className="space-y-1.5 pl-4">
          <li className="list-disc text-sm"><strong>KPIs no topo:</strong> total de itens, percentual de conclusão, itens atrasados e sem prazo.</li>
          <li className="list-disc text-sm"><strong>Gráfico por status:</strong> distribuição entre Pendente, Em Andamento, Concluído e Cancelado.</li>
          <li className="list-disc text-sm"><strong>Gráfico por área:</strong> comparativo entre as frentes temáticas.</li>
          <li className="list-disc text-sm"><strong>Situação de prazos:</strong> no prazo, atrasados e sem prazo definido.</li>
        </ul>
        <InfoBox type="info">O Dashboard é atualizado em tempo real conforme os itens são editados na listagem de ações.</InfoBox>
      </div>
    ),
  },
  {
    id: "actions",
    title: "3. Gerenciar ações e documentos",
    icon: ListChecks,
    content: (
      <div className="space-y-3">
        <p>A página <strong>Ações</strong> é o centro da plataforma. Nela você visualiza, filtra, edita e organiza todos os itens cadastrados.</p>
        <p className="font-semibold text-foreground">Filtros disponíveis:</p>
        <ul className="space-y-1 pl-4">
          <li className="list-disc text-sm">Área temática, status, prioridade e órgão responsável.</li>
          <li className="list-disc text-sm"><strong>Atrasados</strong> e <strong>Vence esta semana</strong> — filtros rápidos de prazo com contadores.</li>
          <li className="list-disc text-sm">Campo de busca por texto livre.</li>
        </ul>
        <p className="font-semibold text-foreground">Ações disponíveis para o Administrador:</p>
        <div className="space-y-2">
          <div className="flex items-start gap-2 text-sm"><Plus className="w-4 h-4 flex-shrink-0 mt-0.5 text-primary" /><span><strong>Nova Ação:</strong> botão no topo da listagem para cadastrar um novo item com código automático.</span></div>
          <div className="flex items-start gap-2 text-sm"><Plus className="w-4 h-4 flex-shrink-0 mt-0.5 text-primary" /><span><strong>Sub-item:</strong> botão "+ Sub-item" em cada item para criar um item filho hierarquicamente vinculado.</span></div>
          <div className="flex items-start gap-2 text-sm"><Pencil className="w-4 h-4 flex-shrink-0 mt-0.5 text-primary" /><span><strong>Editar inline:</strong> ícone de lápis ao passar o mouse sobre qualquer item para edição rápida de campos principais.</span></div>
          <div className="flex items-start gap-2 text-sm"><Pencil className="w-4 h-4 flex-shrink-0 mt-0.5 text-primary" /><span><strong>Editar grupo:</strong> ícone de pasta ao passar o mouse sobre cabeçalhos de categoria para renomear o grupo.</span></div>
          <div className="flex items-start gap-2 text-sm"><Trash2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-destructive" /><span><strong>Excluir:</strong> ícone de lixeira com confirmação obrigatória antes da exclusão permanente.</span></div>
          <div className="flex items-start gap-2 text-sm"><GripVertical className="w-4 h-4 flex-shrink-0 mt-0.5 text-primary" /><span><strong>Reordenar:</strong> ative o modo "Reordenar" no topo para arrastar e soltar itens dentro de cada área.</span></div>
        </div>
        <InfoBox type="warning">A exclusão de um item é permanente e remove todos os comentários, documentos e histórico vinculados.</InfoBox>
      </div>
    ),
  },
  {
    id: "detail",
    title: "4. Ficha do item — edição completa",
    icon: FileText,
    content: (
      <div className="space-y-3">
        <p>Clique em qualquer item da listagem para abrir sua ficha completa. Nela você pode:</p>
        <div className="space-y-2">
          <Step n={1} text="Clicar em 'Editar' para alterar status, prioridade, prazo, órgão responsável e dados de contato." />
          <Step n={2} text="Salvar as alterações — o histórico de mudanças é registrado automaticamente." />
          <Step n={3} text="Acessar as abas: Comentários, Histórico, Documentos e Auditoria (admin)." />
        </div>
        <p className="font-semibold text-foreground">Aba Auditoria (exclusiva para admins):</p>
        <p>Registra todas as interações de usuários setoriais no item: comentários adicionados e documentos vinculados, com identificação do órgão e horário exato.</p>
        <InfoBox type="info">O Histórico registra automaticamente cada alteração de campo realizada por qualquer administrador, com data, hora e valores anterior/posterior.</InfoBox>
      </div>
    ),
  },
  {
    id: "users",
    title: "5. Gerenciar usuários",
    icon: UserCog,
    content: (
      <div className="space-y-3">
        <p>Acesse <strong>Usuários</strong> no sidebar para cadastrar e gerenciar todos os perfis de acesso.</p>
        <p className="font-semibold text-foreground">Perfis disponíveis:</p>
        <div className="space-y-2">
          <div className="p-3 rounded-lg bg-secondary/20 text-sm"><strong>Super-Admin:</strong> acesso total, incluindo criação de outros admins e super-admins. Apenas o super-admin pode criar este perfil.</div>
          <div className="p-3 rounded-lg bg-secondary/20 text-sm"><strong>Administrador:</strong> pode editar, criar e excluir ações, gerenciar usuários setoriais e visualizadores.</div>
          <div className="p-3 rounded-lg bg-secondary/20 text-sm"><strong>Usuário Setorial:</strong> pode comentar e incluir documentos apenas nos itens dos órgãos autorizados.</div>
          <div className="p-3 rounded-lg bg-secondary/20 text-sm"><strong>Visualizador:</strong> acesso somente leitura a toda a plataforma.</div>
        </div>
        <p className="font-semibold text-foreground">Para criar um Usuário Setorial:</p>
        <div className="space-y-2">
          <Step n={1} text="Clique em 'Novo Usuário' e preencha nome, e-mail/usuário e senha." />
          <Step n={2} text="Selecione o perfil 'Setorial'." />
          <Step n={3} text="No campo 'Órgãos permitidos', selecione os órgãos que o usuário poderá acessar — ou marque 'TODOS' para acesso irrestrito." />
          <Step n={4} text="Clique em 'Salvar'. O usuário poderá fazer login imediatamente." />
        </div>
        <InfoBox type="tip">Você pode editar os órgãos permitidos de um usuário setorial a qualquer momento clicando no ícone de lápis na listagem de usuários.</InfoBox>
      </div>
    ),
  },
  {
    id: "alerts",
    title: "6. Sistema de Alertas (Sininho)",
    icon: Bell,
    content: (
      <div className="space-y-3">
        <p>O <strong>sininho de alertas</strong> fica no canto inferior do sidebar (ao lado do botão Sair) e no cabeçalho mobile. Exibe um contador vermelho com o número de alertas não lidos.</p>
        <p className="font-semibold text-foreground">Tipos de alertas:</p>
        <div className="space-y-2">
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm"><strong>Alterações de item</strong> — disparado quando qualquer item ou sub-item é criado, editado ou excluído. Visível apenas para administradores e super-admins.</div>
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm"><strong>Comentários &amp; Documentos</strong> — disparado quando um usuário setorial adiciona um comentário ou um link de documento. Visível para administradores e para usuários setoriais dos órgãos envolvidos.</div>
        </div>
        <p className="font-semibold text-foreground">Como usar:</p>
        <div className="space-y-2">
          <Step n={1} text="Clique no sininho para abrir o painel de alertas." />
          <Step n={2} text="Use as abas 'Todos', 'Alterações' e 'Comentários & Docs' para filtrar por tipo." />
          <Step n={3} text="Clique em um alerta para marcá-lo como lido e acessar o item diretamente pelo link." />
          <Step n={4} text="Use 'Marcar todos' para limpar todos os alertas pendentes de uma vez." />
        </div>
        <InfoBox type="tip">O painel atualiza automaticamente a cada 30 segundos. Alertas não lidos ficam com destaque azul e ponto vermelho; lidos ficam em cinza.</InfoBox>
      </div>
    ),
  },
  {
    id: "audit-global",
    title: "7. Log de Auditoria Global",
    icon: ClipboardList,
    content: (
      <div className="space-y-3">
        <p>Acesse <strong>Log de Auditoria</strong> no sidebar (seção Administração) para o histórico completo de todas as interações realizadas na plataforma.</p>
        <p className="font-semibold text-foreground">O que é registrado:</p>
        <div className="space-y-2">
          <div className="p-3 rounded-lg bg-secondary/20 text-sm"><strong>Comentários:</strong> usuário, órgão, item e texto do comentário.</div>
          <div className="p-3 rounded-lg bg-secondary/20 text-sm"><strong>Documentos:</strong> usuário, órgão, item e link incluído.</div>
          <div className="p-3 rounded-lg bg-secondary/20 text-sm"><strong>Alterações de item:</strong> criação, edição e exclusão de ações e sub-itens.</div>
        </div>
        <p className="font-semibold text-foreground">Filtros disponíveis:</p>
        <div className="space-y-2">
          <Step n={1} text="Busca por texto: nome do usuário, órgão ou detalhe do evento." />
          <Step n={2} text="Tipo de evento: Comentários, Documentos ou Alterações de item." />
          <Step n={3} text="Perfil: Super Admin, Administrador ou Setorial." />
        </div>
        <InfoBox type="info">Clique em 'Exportar CSV' para baixar o log filtrado em formato planilha para análise externa ou prestação de contas.</InfoBox>
      </div>
    ),
  },
  {
    id: "export",
    title: "8. Exportar dados",
    icon: Download,
    content: (
      <div className="space-y-3">
        <p>A plataforma oferece exportação em <strong>Excel (.xlsx)</strong> e <strong>PDF</strong> diretamente da página de Ações.</p>
        <div className="space-y-2">
          <Step n={1} text="Na página Ações, localize o botão 'Exportar' no canto superior direito." />
          <Step n={2} text="Clique na seta ao lado para abrir o menu de escopo: 'Todos os itens', 'Área atual' ou 'Itens filtrados'." />
          <Step n={3} text="Selecione o formato desejado (Excel ou PDF)." />
          <Step n={4} text="O arquivo será baixado automaticamente com os dados selecionados." />
        </div>
        <InfoBox type="info">A exportação respeita os filtros ativos na listagem. Para exportar tudo, certifique-se de que nenhum filtro está aplicado.</InfoBox>
      </div>
    ),
  },
];

const SETORIAL_SECTIONS: Section[] = [
  {
    id: "login-s",
    title: "1. Como acessar a plataforma",
    icon: LogIn,
    content: (
      <div className="space-y-3">
        <p>Seu acesso é feito com <strong>usuário</strong> (e-mail ou nome de usuário) e <strong>senha</strong> fornecidos pelo administrador da plataforma.</p>
        <div className="space-y-2">
          <Step n={1} text="Acesse o endereço da plataforma no navegador." />
          <Step n={2} text="Informe seu usuário e senha nos campos da tela de login." />
          <Step n={3} text="Clique em 'Entrar'. Você verá a listagem de ações disponíveis." />
        </div>
        <InfoBox type="warning">Caso não consiga acessar, entre em contato com o administrador para verificar seu cadastro e os órgãos autorizados.</InfoBox>
      </div>
    ),
  },
  {
    id: "view-s",
    title: "2. Visualizar ações e documentos",
    icon: Eye,
    content: (
      <div className="space-y-3">
        <p>Você pode visualizar todos os itens cadastrados na plataforma, independentemente do órgão. Use os filtros para encontrar rapidamente o que precisa:</p>
        <ul className="space-y-1 pl-4">
          <li className="list-disc text-sm">Filtre por área, status, prioridade ou órgão responsável.</li>
          <li className="list-disc text-sm">Use a busca por texto para localizar itens pelo nome ou descrição.</li>
          <li className="list-disc text-sm">Clique em qualquer item para abrir sua ficha completa com todos os detalhes.</li>
        </ul>
        <InfoBox type="info">A visualização é irrestrita — você pode consultar todos os itens, mas só pode interagir (comentar/documentar) nos itens dos órgãos autorizados para o seu perfil.</InfoBox>
      </div>
    ),
  },
  {
    id: "comment-s",
    title: "3. Adicionar comentários",
    icon: MessageSquare,
    content: (
      <div className="space-y-3">
        <p>Você pode adicionar comentários nos itens cujo <strong>órgão responsável</strong> esteja na sua lista de órgãos autorizados.</p>
        <div className="space-y-2">
          <Step n={1} text="Abra a ficha do item clicando sobre ele na listagem." />
          <Step n={2} text="Na aba 'Comentários', localize o campo de texto." />
          <Step n={3} text="Digite sua observação ou comentário." />
          <Step n={4} text="Clique em 'Enviar'. O comentário ficará registrado com seu nome e horário." />
        </div>
        <InfoBox type="warning">Se a aba de comentários não exibir o campo de texto, significa que o órgão responsável pelo item não está na sua lista de acesso. Contate o administrador para solicitar ampliação.</InfoBox>
      </div>
    ),
  },
  {
    id: "docs-s",
    title: "4. Incluir links de documentos",
    icon: Link2,
    content: (
      <div className="space-y-3">
        <p>Você pode vincular links de documentos (Google Drive, SharePoint, SEI, etc.) aos itens dos órgãos autorizados.</p>
        <div className="space-y-2">
          <Step n={1} text="Abra a ficha do item." />
          <Step n={2} text="Clique na aba 'Documentos'." />
          <Step n={3} text="Clique em 'Adicionar Link'." />
          <Step n={4} text="Informe um rótulo descritivo (ex.: 'Contrato assinado - jan/2025') e a URL completa do documento." />
          <Step n={5} text="Clique em 'Salvar'. O link ficará disponível para todos os usuários da plataforma." />
        </div>
        <InfoBox type="tip">Certifique-se de que o link do documento está acessível publicamente ou que todos os usuários da plataforma têm permissão para visualizá-lo.</InfoBox>
      </div>
    ),
  },
  {
    id: "history-s",
    title: "5. Consultar histórico de alterações",
    icon: History,
    content: (
      <div className="space-y-3">
        <p>Cada item possui um registro completo de todas as alterações realizadas pelos administradores.</p>
        <div className="space-y-2">
          <Step n={1} text="Abra a ficha do item." />
          <Step n={2} text="Clique na aba 'Histórico'." />
          <Step n={3} text="Visualize a lista de alterações com campo modificado, valor anterior, novo valor, responsável e data/hora." />
        </div>
        <InfoBox type="info">O histórico é somente leitura para usuários setoriais. Apenas administradores podem editar campos e gerar novos registros.</InfoBox>
      </div>
    ),
  },
  {
    id: "alerts-s",
    title: "6. Alertas e notificações",
    icon: Bell,
    content: (
      <div className="space-y-3">
        <p>O <strong>sininho de alertas</strong> fica no canto inferior do sidebar. Quando houver alertas não lidos, aparecerá um contador vermelho.</p>
        <p className="font-semibold text-foreground">Quais alertas você recebe:</p>
        <div className="space-y-2">
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm"><strong>Comentários &amp; Documentos</strong> — você será notificado quando outro usuário setorial do mesmo órgão adicionar um comentário ou documento em um item do seu órgão.</div>
        </div>
        <p className="font-semibold text-foreground">Como usar:</p>
        <div className="space-y-2">
          <Step n={1} text="Clique no sininho para abrir o painel de alertas." />
          <Step n={2} text="Clique em um alerta para marcá-lo como lido." />
          <Step n={3} text="Use 'Marcar todos' para limpar todos os alertas pendentes." />
        </div>
        <InfoBox type="info">Você só recebe alertas referentes aos órgãos autorizados no seu perfil. Alertas de alterações de item são exclusivos para administradores.</InfoBox>
      </div>
    ),
  },
];

const VIEWER_SECTIONS: Section[] = [
  {
    id: "login-v",
    title: "1. Como acessar a plataforma",
    icon: LogIn,
    content: (
      <div className="space-y-3">
        <p>Seu acesso é feito com <strong>usuário</strong> e <strong>senha</strong> fornecidos pelo administrador.</p>
        <div className="space-y-2">
          <Step n={1} text="Acesse o endereço da plataforma no navegador." />
          <Step n={2} text="Informe seu usuário e senha." />
          <Step n={3} text="Clique em 'Entrar' para visualizar o Dashboard e a listagem de ações." />
        </div>
      </div>
    ),
  },
  {
    id: "dashboard-v",
    title: "2. Entendendo o Dashboard",
    icon: LayoutDashboard,
    content: (
      <div className="space-y-3">
        <p>O Dashboard apresenta uma visão consolidada do andamento de todos os contratos e ações gerenciados pela plataforma:</p>
        <ul className="space-y-1 pl-4">
          <li className="list-disc text-sm"><strong>Total de itens</strong> e percentual de conclusão geral.</li>
          <li className="list-disc text-sm"><strong>Itens atrasados</strong> — quantidade de ações com prazo vencido.</li>
          <li className="list-disc text-sm"><strong>Gráficos</strong> de distribuição por status e por área temática.</li>
          <li className="list-disc text-sm"><strong>Situação de prazos</strong> — no prazo, atrasados e sem prazo.</li>
        </ul>
      </div>
    ),
  },
  {
    id: "browse-v",
    title: "3. Navegar pela listagem de ações",
    icon: Search,
    content: (
      <div className="space-y-3">
        <p>Na página <strong>Ações</strong>, você pode consultar todos os itens cadastrados usando os filtros disponíveis:</p>
        <ul className="space-y-1 pl-4">
          <li className="list-disc text-sm">Filtre por <strong>área</strong>, <strong>status</strong>, <strong>prioridade</strong> ou <strong>órgão</strong>.</li>
          <li className="list-disc text-sm">Use os botões <strong>"Atrasados"</strong> e <strong>"Vence esta semana"</strong> para visualizar itens críticos.</li>
          <li className="list-disc text-sm">Use a <strong>busca por texto</strong> para localizar itens pelo nome.</li>
        </ul>
        <InfoBox type="info">Como visualizador, você tem acesso de leitura a todos os itens, mas não pode editar, comentar ou incluir documentos.</InfoBox>
      </div>
    ),
  },
  {
    id: "detail-v",
    title: "4. Consultar a ficha de um item",
    icon: FileText,
    content: (
      <div className="space-y-3">
        <p>Clique em qualquer item da listagem para abrir sua ficha completa. Você pode consultar:</p>
        <ul className="space-y-1 pl-4">
          <li className="list-disc text-sm">Descrição completa, status, prioridade, prazo e órgão responsável.</li>
          <li className="list-disc text-sm">Dados de contato do responsável.</li>
          <li className="list-disc text-sm">Comentários registrados por outros usuários.</li>
          <li className="list-disc text-sm">Histórico de alterações do item.</li>
          <li className="list-disc text-sm">Links de documentos vinculados.</li>
        </ul>
      </div>
    ),
  },
  {
    id: "status-v",
    title: "5. Entendendo os status e prioridades",
    icon: Clock,
    content: (
      <div className="space-y-3">
        <p className="font-semibold text-foreground">Status dos itens:</p>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm"><span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: "oklch(0.65 0.15 260)" }} /><strong>Pendente:</strong> ação ainda não iniciada.</div>
          <div className="flex items-center gap-2 text-sm"><span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: "oklch(0.65 0.20 50)" }} /><strong>Em Andamento:</strong> ação em execução.</div>
          <div className="flex items-center gap-2 text-sm"><span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: "oklch(0.45 0.18 145)" }} /><strong>Concluído:</strong> ação finalizada.</div>
          <div className="flex items-center gap-2 text-sm"><span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: "oklch(0.55 0.20 15)" }} /><strong>Cancelado:</strong> ação descontinuada.</div>
        </div>
        <p className="font-semibold text-foreground">Indicadores de prazo:</p>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm"><AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "oklch(0.55 0.20 15)" }} /><strong>Vermelho:</strong> prazo vencido (item atrasado).</div>
          <div className="flex items-center gap-2 text-sm"><Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "oklch(0.65 0.20 50)" }} /><strong>Amarelo:</strong> vence nos próximos 7 dias.</div>
          <div className="flex items-center gap-2 text-sm"><CheckCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "oklch(0.45 0.18 145)" }} /><strong>Verde:</strong> prazo dentro do previsto.</div>
        </div>
      </div>
    ),
  },
];

const SECTIONS_BY_PROFILE: Record<Profile, Section[]> = {
  admin: ADMIN_SECTIONS,
  setorial: SETORIAL_SECTIONS,
  viewer: VIEWER_SECTIONS,
};

// ---- Main Component ----
export default function UserGuide() {
  const { isAdmin, isSuperAdmin, isSetorial } = useLocalAuth();
  const defaultProfile: Profile = isSuperAdmin || isAdmin ? "admin" : isSetorial ? "setorial" : "viewer";
  const [activeProfile, setActiveProfile] = useState<Profile>(defaultProfile);

  const sections = SECTIONS_BY_PROFILE[activeProfile];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "oklch(0.38 0.16 240 / 0.12)" }}
        >
          <BookOpen className="w-5 h-5" style={{ color: "oklch(0.38 0.16 240)" }} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Guia do Usuário</h1>
          <p className="text-sm text-muted-foreground">Plataforma de Gestão Documental de PPPs — SEMPLA</p>
        </div>
      </div>

      {/* Profile selector */}
      <div
        className="p-4 rounded-xl space-y-3"
        style={{ background: "oklch(0.38 0.16 240 / 0.05)", border: "1px solid oklch(0.38 0.16 240 / 0.15)" }}
      >
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Selecione seu perfil para ver o guia correspondente</p>
        <div className="flex flex-wrap gap-2">
          {PROFILES.map(({ key, label, icon: Icon, color }) => (
            <button
              key={key}
              onClick={() => setActiveProfile(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeProfile === key ? "text-white shadow-sm" : "bg-secondary/40 text-muted-foreground hover:text-foreground"
              }`}
              style={activeProfile === key ? { background: color } : {}}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Profile intro */}
      {activeProfile === "admin" && (
        <div className="p-4 rounded-xl text-sm" style={{ background: "oklch(0.38 0.16 240 / 0.06)", border: "1px solid oklch(0.38 0.16 240 / 0.20)" }}>
          <p className="font-semibold text-foreground mb-1">Perfil: Administrador / Super-Admin</p>
          <p className="text-muted-foreground">Você tem acesso completo à plataforma: pode criar, editar e excluir ações, gerenciar usuários, visualizar auditoria e exportar dados. O Super-Admin também pode criar outros administradores.</p>
        </div>
      )}
      {activeProfile === "setorial" && (
        <div className="p-4 rounded-xl text-sm" style={{ background: "oklch(0.45 0.18 145 / 0.06)", border: "1px solid oklch(0.45 0.18 145 / 0.20)" }}>
          <p className="font-semibold text-foreground mb-1">Perfil: Usuário Setorial</p>
          <p className="text-muted-foreground">Você pode visualizar todos os itens e interagir (comentar e incluir documentos) apenas nos itens cujo órgão responsável foi autorizado pelo administrador para o seu perfil.</p>
        </div>
      )}
      {activeProfile === "viewer" && (
        <div className="p-4 rounded-xl text-sm" style={{ background: "oklch(0.55 0.12 260 / 0.06)", border: "1px solid oklch(0.55 0.12 260 / 0.20)" }}>
          <p className="font-semibold text-foreground mb-1">Perfil: Visualizador</p>
          <p className="text-muted-foreground">Você tem acesso de leitura a toda a plataforma: Dashboard, listagem de ações, fichas de itens, comentários, histórico e documentos. Não é possível editar, comentar ou incluir documentos.</p>
        </div>
      )}

      {/* Sections */}
      <div>
        {sections.map((section, idx) => (
          <AccordionItem
            key={section.id}
            title={section.title}
            icon={section.icon}
            defaultOpen={idx === 0}
          >
            {section.content}
          </AccordionItem>
        ))}
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border/30">
        Plataforma de Gestão Documental de PPPs · SEMPLA — Secretaria Municipal de Planejamento · Prefeitura de Natal/RN
      </div>
    </div>
  );
}
