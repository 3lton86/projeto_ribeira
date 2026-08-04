# RIBEIRA SUSTENTÁVEL - TODO

## Banco de Dados e Dados
- [x] Schema: tabelas actions, comments, history, governance_nodes
- [x] Script de seed com todos os dados das 4 abas da planilha
- [x] Migração do banco de dados

## Backend (tRPC)
- [x] Router: actions (list, getById, update, updateStatus)
- [x] Router: comments (list, create)
- [x] Router: history (list por item)
- [x] Router: governance (list nodes)
- [x] Router: dashboard (KPIs e estatísticas)
- [x] Router: export (gerar dados para Excel/PDF)
- [x] Middleware de controle de acesso (admin edita, viewer visualiza)

## Frontend - Layout e Design
- [x] Design cinematográfico: gradiente teal/laranja, tipografia branca
- [x] DashboardLayout customizado com sidebar temática
- [x] Página de login com visual cinematográfico
- [x] Navegação por abas: Governança, Técnico, Jurídico, Eco-Fin

## Frontend - Funcionalidades
- [x] Página Dashboard: KPIs, gráficos de barras e donuts por área
- [x] Página Ações: listagem com hierarquia (itens e subitens)
- [x] Filtros avançados: área, prioridade, status
- [x] Campos editáveis por item: status, responsável, datas, prioridade, base documental
- [x] Sistema de comentários com timestamp e autor
- [x] Histórico de alterações por item
- [x] Painel de Governança: organograma interativo
- [x] Exportação Excel (xlsx)
- [x] Exportação PDF (jsPDF)
- [x] Controle de acesso: bloquear edições para não-admins

## Testes
- [x] Testes unitários para routers principais
- [x] Checkpoint final

## Novas Funcionalidades (Sprint 2)
- [x] Corrigir ações duplicadas no banco de dados
- [x] Schema: tabela local_users (nome, cargo, órgão, senha hash, role: admin/viewer)
- [x] Schema: tabela action_documents (actionId, label, url, createdAt, userId)
- [x] Backend: router users (list, create, update, delete) — apenas super-admin
- [x] Backend: autenticação local com JWT (login por nome+senha)
- [x] Backend: router documents (list, create, delete por ação)
- [x] Frontend: página de Login local com campos nome e senha
- [x] Frontend: página de Gerenciamento de Usuários (super-admin)
- [x] Frontend: campo de links de documentos na página ActionDetail
- [x] Controle de acesso: super-admin vê tudo e gerencia usuários; admin edita ações; viewer só visualiza

## Sprint 3
- [x] Corrigir autenticação ao cadastrar usuários (erro "Faça primeiro login para continuar")
- [x] Botão de exportação PDF no Dashboard

## Sprint 4
- [x] Schema: adicionar campos orgao, responsavelNome, responsavelCargo, responsavelTel, responsavelEmail na tabela actions
- [x] Backend: atualizar query e mutation de actions para incluir os novos campos
- [x] Frontend: lista suspensa de órgão (31 órgãos municipais) e campos de contato no ActionDetail
- [x] Shared: criar constante ORGAOS_MUNICIPAIS com a lista dos 31 órgãos

## Sprint 5
- [x] Schema: substituir campo `responsible` por `dueDate` (prazo previsto) na tabela actions
- [x] Backend: atualizar query/mutation de actions e stats do dashboard para incluir dueDate
- [x] Frontend ActionDetail: substituir campo Responsável pelo campo Prazo (date picker)
- [x] Frontend Actions listagem: exibir prazo e indicador visual de atraso nos itens
- [x] Frontend Dashboard: adicionar gráfico de situação de prazo (no prazo / atrasado / sem prazo)

## Sprint 6
- [x] Backend: mutation createAction (admin) com geração automática de itemCode
- [x] Frontend: botão "Nova Ação" na página Actions (visível apenas para admins)
- [x] Frontend: modal de criação com campos obrigatórios e opcionais
- [x] Testes para createAction

## Sprint 7
- [x] Backend: mutation deleteAction (admin) com proteção
- [x] Frontend: botões Editar e Excluir na listagem de ações (apenas admins)
- [x] Frontend: modal de edição rápida inline na listagem
- [x] Frontend: confirmação de exclusão com dialog
- [x] Testes para deleteAction e editInline (8 novos testes, 30 total)

## Sprint 8
- [x] Backend: mutation actions.updateGroup (admin) para editar descrição de cabeçalhos de grupo (isGroup=1)
- [x] Frontend: botão Editar nos cabeçalhos de grupo (lápis, visível apenas para admins)
- [x] Frontend: modal EditGroupModal reutilizando estilo do EditInlineModal
- [x] Frontend: paginação por área na listagem de ações (20 itens/pág, controles numerados com ellipsis)
- [x] Testes para actions.updateGroup (6 novos testes, 36 total)

## Sprint 9
- [x] Upload da logo SEMPLA e rebranding: nome "SEMPLA", cores azul/cinza da logo, substituir "BUREAU PAD"
- [x] Remover abas Governança e áreas temáticas do sidebar (substituídas pelos filtros)
- [x] Backend: mutation actions.reorder (sortOrder bulk update)
- [x] Backend: suporte a sub-itens (createSubItem com parentCode aninhado)
- [x] Frontend: drag-and-drop na listagem (dnd-kit) com persistência via reorder mutation
- [x] Frontend: filtros rápidos "Atrasados" e "Vence esta semana" com contadores na barra de filtros
- [x] Frontend: exportação filtrada por área/escopo com dropdown (Excel e PDF)
- [x] Frontend: botão "+ Sub-item" em cada action item e modal CreateSubItemModal
- [x] Testes para reorder e createSubItem (7 novos testes, 43 total)

## Sprint 10 — Usuário Setorial
- [x] Schema: adicionar role "setorial" ao enum de local_users
- [x] Schema: nova tabela user_orgaos (userId, orgao) para controle de acesso por órgão
- [x] Migração do banco de dados (pnpm db:push)
- [x] Backend: atualizar createLocalUser/updateLocalUser para salvar órgãos permitidos
- [x] Backend: nova query getUserOrgaos e upsertUserOrgaos no db.ts
- [x] Backend: proteger comments.create e documents.create para verificar orgao do usuário setorial
- [x] Backend: router users expor lista de órgãos do usuário (para frontend)
- [x] Frontend: campo multi-select de órgãos no modal de criação/edição de usuário
- [x] Frontend: exibir badge "Setorial" na listagem de usuários
- [x] Frontend: na ficha do item (ActionDetail), mostrar botão de comentar/doc apenas se usuário setorial tiver acesso ao órgão do item
- [x] Testes para restrições setoriais (43 testes passando, zero erros TypeScript)

## Sprint 11 — Rebranding PPPs + Tema Claro + Auditoria
- [x] Substituir "Plataforma de Acompanhamento do Plano de Equilíbrio Fiscal" por "PLATAFORMA DE GESTÃO DOCUMENTAL DE PPPs" em todos os componentes
- [x] Reformular visual: tema claro (light mode) com paleta SEMPLA (azul institucional #1E4D8C, cinza #6B7280, branco)
- [x] Atualizar index.css com variáveis light mode e cores SEMPLA
- [x] Atualizar RiberaLayout, Login e export.ts com novo nome e visual
- [x] Schema: tabela audit_log (id, actionId, userId, userName, userOrgao, userRole, eventType, detail, createdAt)
- [x] Migração do banco de dados (pnpm db:push)
- [x] Backend: registrar audit_log em comments.create e documents.create para usuários setoriais
- [x] Backend: router audit.list (localAdminProcedure, apenas admin/super_admin)
- [x] Frontend: aba "Auditoria" na ficha do item (ActionDetail), visível apenas para admins
- [x] Testes para audit.list e proteção de acesso (5 novos testes, 56 total)

## Sprint 12 — Guia do Usuário
- [x] Criar página UserGuide.tsx com conteúdo segmentado por perfil (Administrador, Setorial, Visualizador)
- [x] Adicionar aba "Guia do Usuário" no sidebar com ícone BookOpen
- [x] Registrar rota /guia no App.tsx
- [x] Verificar TypeScript (zero erros) e salvar checkpoint

## Sprint 13 — Auditoria Global e Sistema de Alertas
- [x] Schema: tabela notifications (id, userId, type, title, body, actionId, actionCode, orgao, isRead, createdAt)
- [x] Backend: funções createNotification, getNotifications, markAsRead, markAllAsRead, getUnreadCount no db.ts
- [x] Backend: router notifications (list, markRead, markAllRead, unreadCount)
- [x] Backend: disparar alertas tipo "item_change" em createAction, editInline, updateGroup, reorder, createSubItem, deleteAction
- [x] Backend: disparar alertas tipo "comment_doc" em comments.create e documents.create
- [x] Frontend: componente NotificationBell no header (sininho com badge de não lidos)
- [x] Frontend: dropdown de alertas com filtro por tipo (Alterações de Itens / Comentários e Documentos)
- [x] Frontend: alertas "item_change" visíveis apenas para admins
- [x] Frontend: alertas "comment_doc" visíveis para admins e setoriais do órgão do item
- [x] Frontend: página AuditLog.tsx com log global de todas as alterações (apenas admins)
- [x] Frontend: aba "Log de Auditoria" no sidebar (apenas admins)
- [x] Frontend: atualizar UserGuide.tsx com instruções de alertas (admin e setorial) e auditoria global
- [x] Testes unitários para notifications router (67 testes passando, zero erros TypeScript)
- [x] Corrigir acesso setorial ao router de notificações (localAuthProcedure em vez de localAdminProcedure)
- [x] Corrigir disparo de alerta na mutation reorder (getAdminAndSuperAdminIds + segundo argumento)

## Sprint 14 — Correções de UI
- [x] Adicionar logo SEMPLA no cabeçalho do PDF exportado pelo Dashboard (export.ts + sempla-logo-b64.ts)
- [x] Typo "auditório" → "auditoria" (não encontrado no código-fonte atual; texto já estava correto)
- [x] Corrigir erro removeChild no modal de cadastro de usuários ao selecionar categoria (portalled={false} no SelectContent dentro de Dialog)

## Sprint 15 — Correções no Modal de Cadastro de Usuários
- [x] Corrigir dropdown de categorias extrapolando o formulário (textos encurtados + z-[200])
- [x] Corrigir erro React #185 (Maximum update depth exceeded) ao selecionar órgãos para usuário setorial — substituído useEffect com dependência instável por handleSelectAll síncrono

## Sprint 16 — Correção definitiva do erro React #185 no modal de usuários
- [x] Eliminar estado selectAll separado — derivado diretamente de form.allowedOrgaos (sem useState extra)
- [x] Corrigir onOpenChange do Dialog para não fechar em reentrâncias de foco do Radix
- [x] Simplificar handleSubmit para usar form.allowedOrgaos diretamente

## Sprint 17 — Filtro de visibilidade por órgão para usuários setoriais
- [x] Backend: nova função getActionsForSetorial filtra itens por órgão do usuário setorial
- [x] Backend: actions.list detecta token setorial e aplica filtro automaticamente
- [x] Frontend: listagem de ações exibe apenas itens do órgão do setorial (sem mudança de código — filtro é no servidor)
- [x] Backend: getActionsForSetorial remove grupos sem filhos visíveis (sem órgão permitido)
- [x] Guia do Usuário atualizado: setorial só vê itens dos seus órgãos

## Sprint 18 — Troca de senha e auto-cadastro com aprovação
- [x] Backend: endpoint localAuth.changePassword (usuário autenticado altera própria senha)
- [x] Frontend: modal ChangePasswordModal com ícone de chave no sidebar
- [x] Schema: campo pendingApproval adicionado à tabela localUsers + migration
- [x] Backend: endpoint público localAuth.register (auto-cadastro, cria conta com pendingApproval=1)
- [x] Backend: endpoints listPending, approve, reject para fluxo de aprovação
- [x] Backend: notificação ao admin quando novo cadastro pendente chega
- [x] Frontend: página pública /registro com formulário de solicitação de acesso
- [x] Frontend: link 'Solicitar cadastro' na página de login
- [x] Frontend: seção 'Cadastros Pendentes de Aprovação' na página de Usuários
- [x] Guia do Usuário: atualizado com instruções de troca de senha e aprovação de cadastros

## Sprint 19 — Status de Documento (DOC ACEITO / DOC COM PENDÊNCIA)
- [x] Schema: campo docStatus, statusUpdatedAt, statusUpdatedBy adicionados à tabela action_documents
- [x] Backend: migration aplicada (pnpm db:push)
- [x] Backend: função updateDocumentStatus no db.ts
- [x] Backend: mutation documents.updateStatus (localAdminProcedure)
- [x] Frontend: badge verde 'DOC ACEITO' e badge âmbar 'DOC COM PENDÊNCIA' em cada documento
- [x] Frontend: dropdown para admin alterar o status do documento
- [x] Frontend: exibe 'Status por {nome}' abaixo do documento quando status definido

## Sprint 20 — Notificação de pendência, filtros de doc e PDF de auditoria
- [x] Backend: função getDocumentById no db.ts
- [x] Backend: router documents.updateStatus dispara notificação ao setorial do órgão quando doc recebe 'DOC COM PENDÊNCIA'
- [x] Backend: getActionIdsWithDocFilter no db.ts para filtros de documento
- [x] Backend: actions.list aceita docFilter (any/pending/accepted)
- [x] Frontend: filtros rápidos de documento na listagem de ações (Com documentos, Com pendência, Doc aceito)
- [x] Frontend: função exportAuditLogToPdf no export.ts com logo SEMPLA no cabeçalho
- [x] Frontend: botão 'Exportar PDF' na página de Auditoria (ao lado do CSV)

## Sprint 21 — Numeração Hierárquica de Itens

- [x] Investigar schema: campos itemCode, parentCode, isGroup, sortOrder
- [x] Implementar função buildHierarchicalNumbers em shared/hierarchyNumbers.ts
- [x] Exibir numeração hierárquica (1, 1.1, 1.1.1) na listagem de ações (Actions.tsx)
- [x] Exibir numeração hierárquica na ficha do item (ActionDetail.tsx)
- [x] Numeração automática ao criar sub-itens (derivada dinamicamente do array)
- [x] 67 testes passando, zero erros TypeScript

## Sprint 21b — Correção da Numeração Hierárquica

- [x] Corrigir bug: itemCode duplicado entre áreas causava numeração errada (ex: grupo "1" existe em Governança e Técnico)
- [x] Reescrever buildHierarchicalNumbers para usar id (único) como chave do Map em vez de itemCode
- [x] Adicionar campo area ao tipo ActionForHierarchy para processar cada área independentemente
- [x] Corrigir chamadas a hierNums.get() em Actions.tsx e ActionDetail.tsx para usar action.id
- [x] 67 testes passando, zero erros TypeScript

## Sprint 22 — Campo Observações na Ficha do Item

- [x] Schema: adicionar coluna observacoes (text, nullable) na tabela actions
- [x] Migração do banco (pnpm db:push)
- [x] Backend: incluir observacoes em updateAction (db.ts) e router actions.update (routers.ts)
- [x] Frontend ActionDetail: exibir campo Observações abaixo de Documento Base (leitura e edição)
- [x] 67 testes passando, zero erros TypeScript

## Sprint 23 — Múltiplos Órgãos Responsáveis por Item

- [x] Schema: criar tabela action_orgaos (id, actionId, orgao, responsavelNome, responsavelCargo, responsavelTel, responsavelEmail, sortOrder, createdAt)
- [x] Migração do banco (pnpm db:push)
- [x] Backend db.ts: funções getActionOrgaos, addActionOrgao, updateActionOrgao, removeActionOrgao
- [x] Backend routers.ts: procedures orgaos.list, orgaos.add, orgaos.update, orgaos.remove
- [x] Frontend ActionDetail: lista dinâmica com botão "Adicionar Órgão" (dialog) e remoção por item (confirmação)
- [x] Manter compatibilidade: campos legados orgao/responsavelNome/etc. na tabela actions permanecem
- [x] 67 testes passando, zero erros TypeScript

## Sprint 24 — Permissão Setorial por Órgão Co-Responsável

- [x] Backend: nova função setorialUserHasAccessToAction em db.ts (verifica campo legado + action_orgaos)
- [x] Backend: procedure comments.create usa setorialUserHasAccessToAction
- [x] Backend: procedure documents.create usa setorialUserHasAccessToAction
- [x] Frontend LocalAuthContext: novo helper canInteractWithAnyOrgao(orgaos: string[])
- [x] Frontend ActionDetail: canInteract usa canInteractWithAnyOrgao com lista unificada (legado + co-responsáveis)
- [x] 67 testes passando, zero erros TypeScript

## Sprint 25 — Importação da Planilha de Solicitações (11.06.2026)

- [x] Banco zerado: actions, comments, history, audit_log, action_documents, notifications, action_orgaos
- [x] Importação das 4 abas: Governança (12), Técnico (103), Jurídico (74), Eco-Fin (76) = 265 registros
- [x] Coluna "Órgão Provável/Responsável" → campo observacoes
- [x] Campo dueDate (Prazo Previsto) deixado em branco (NULL) em todos os itens
- [x] 67 testes passando, zero erros TypeScript

## Sprint 26 — Exibição Recursiva de Sub-itens na Listagem

- [x] Diagnóstico: 265 registros importados corretamente (grupos + itens + sub-itens)
- [x] Problema identificado: UI filtrava apenas filhos diretos do grupo (parentCode === group.itemCode)
- [x] Correção: função getAllDescendants() recursiva para coletar todos os descendentes
- [x] Indentação visual: prop depth no SortableActionRow (borda esquerda + recuo por nível)
- [x] depth calculado por: itemCode.split('.').length - 1 (ex: "1.1.1" → depth=2)
- [x] 67 testes passando, zero erros TypeScript

## Sprint 27 — Paginação, Exportação Hierárquica e Expansão de Itens

- [x] Paginação por grupo completo: grupos não são quebrados entre páginas
- [x] Exportação Excel: incluir sub-itens com indentação de células por nível hierárquico
- [x] Exportação PDF: incluir sub-itens com recuo visual por nível hierárquico
- [x] Expansão/recolhimento de itens principais (ocultar/exibir sub-itens)
- [x] 67 testes passando, zero erros TypeScript

## Sprint 27 — Paginação, Expansão e Exportação Hierárquica

- [x] Paginação por grupo completo (grupo + todos os descendentes na mesma página, sem quebras)
- [x] Exportação PDF: grupos como cabeçalhos, sub-itens com indentação e barra lateral colorida por nível
- [x] Exportação PDF: campo Observações incluído nos itens
- [x] Exportação Excel: grupos em negrito/cor, sub-itens com recuo por nível hierárquico
- [x] Botão de expandir/recolher (chevron) nos itens que possuem sub-itens
- [x] Sub-itens ocultados quando item pai está recolhido
- [x] getExportData atualizado para incluir grupos (isGroup=1) e parentCode
- [x] 67 testes passando, zero erros TypeScript

## Sprint 28 — Dashboard: Gráficos por Órgão com Status de Documentos

- [x] Backend db.ts: função getOrgaoDocStats retornando por órgão: totalItems, withDocs, docsAccepted, docsPending
- [x] Backend routers.ts: procedure dashboard.orgaoStats (publicProcedure)
- [x] Frontend Dashboard.tsx: novo painel "Itens por Órgão Responsável" com gráfico de barras agrupadas + tabela resumo
- [x] Filtro de frente temática no painel de órgãos (Todas / Governança / Técnico / Jurídico / Eco-Fin)
- [x] 67 testes passando, zero erros TypeScript

## Sprint 29 — Gestão de Responsáveis por Órgão

- [x] Schema: tabela orgao_responsaveis (id, orgao, nome, cargo, telefone, email, localUserId nullable, sortOrder, createdAt)
- [x] Migração do banco (pnpm db:push)
- [x] Backend db.ts: getOrgaoResponsaveis, addOrgaoResponsavel, updateOrgaoResponsavel, removeOrgaoResponsavel
- [x] Backend routers.ts: procedures orgaoResponsaveis.list, .add, .update, .remove (admin)
- [x] Frontend: página /orgaos (admin) com tabela por órgão, adicionar/editar/remover responsáveis, vincular a usuário local existente
- [x] Frontend: dialog de adicionar órgão na ficha do item auto-preenche responsável com o primeiro da tabela orgao_responsaveis
- [x] Frontend: ao selecionar órgão no dialog, lista de responsáveis é filtrada pelos vinculados ao órgão
- [x] Frontend: edição de órgão já atribuído na ficha do item permite alterar responsável via seleção
- [x] 67 testes passando, zero erros TypeScript

## Sprint 30 — Contatos Inteligentes e Histórico

- [x] Schema: tabela contact_history (id, actionId, channel, recipientName, recipientContact, message, sentBy, sentAt)
- [x] Migração do banco (pnpm db:push)
- [x] Backend db.ts: getContactHistory, addContactHistory
- [x] Backend routers.ts: procedures contactHistory.list, contactHistory.add
- [x] Frontend ActionDetail: mensagem pré-preenchida nos botões de e-mail e WhatsApp (título + prazo + status + rodapé bit.ly/ribeirapmi)
- [x] Frontend ActionDetail: alerta visual (laranja) nos botões de contato quando item atrasado ou com documentos pendentes
- [x] Frontend ActionDetail: aba "Contatos" com Histórico de Contatos (canal, destinatário, data, prévia)
- [x] Frontend ActionDetail: botões WhatsApp e e-mail ao lado do campo de comentário
- [x] Registro automático no Histórico de Contatos ao usar os botões de envio
- [x] Dialog de confirmação com prévia editável da mensagem antes de abrir WhatsApp/e-mail
- [x] 67 testes passando, zero erros TypeScript

## Sprint 31 — Telefone no Cadastro, Auto-preenchimento, Filtro de Contatos e Multi-destinatário

- [x] Schema: campo telefone (varchar 20, nullable) adicionado à tabela local_users
- [x] Migração do banco (pnpm db:push)
- [x] Backend: telefone incluído em createLocalUser, updateLocalUser, getLocalUsers
- [x] Frontend: campo telefone no modal de cadastro/edição de usuário (AdminUsers.tsx)
- [x] Frontend: campo telefone no formulário de auto-cadastro (/registro — Register.tsx)
- [x] Frontend: página Órgãos & Responsáveis — ao selecionar usuário vinculado, preenche nome/cargo/telefone/email automaticamente
- [x] Backend: getActionIdsWithContact no db.ts; procedure contactHistory.listActionIds
- [x] Frontend: filtros rápidos na listagem de ações — "Com contato" / "Sem contato" (filtro client-side)
- [x] Frontend: dialog de envio de mensagem — checkboxes para selecionar destinatários quando há múltiplos responsáveis
- [x] 67 testes passando, zero erros TypeScript

## Sprint 32 — Edição de Órgãos Responsáveis e Atualização do Guia

- [x] Frontend: botão de lápis em cada órgão responsável (ActionDetail.tsx) abre dialog de edição pré-preenchido
- [x] Frontend: dialog de edição com seletor de responsável cadastrado e todos os campos (orgão, nome, cargo, tel, email)
- [x] Backend: procedure orgaos.update conectada via updateOrgaoMutation
- [x] Frontend: Guia do Usuário completamente reescrito cobrindo Sprints 19–32 (dashboard por órgão, filtros de contato/doc, multi-responsável, telefone no cadastro, auto-preenchimento, edição de órgãos, exportação hierárquica)
- [x] 67 testes passando, zero erros TypeScript

## Sprint 33 — Indicador de Último Contato na Listagem

- [x] Backend db.ts: getLastContactPerAction retorna { actionId, channel, sentAt, recipientName } via JOIN com subquery de MAX(sentAt)
- [x] Backend routers.ts: procedure contactHistory.lastPerAction (publicProcedure)
- [x] Frontend Actions.tsx: lastContactMap memoizado; badge em cada item com ícone (Phone/Mail), data relativa e tooltip com detalhes completos
- [x] Frontend: badge "sem contato" (opaco) para itens sem histórico
- [x] 69 testes passando (2 novos), zero erros TypeScript

## Sprint 34 — Documentos na Exportação Excel

- [x] export.ts: exportToExcel expande itens com múltiplos documentos em linhas extras; colunas "Nome do Documento", "URL do Arquivo" (com hyperlink) e "Status do Documento" (DOC ACEITO / DOC COM PENDÊNCIA) adicionadas
- [x] Coluna "Qtd. Documentos" adicionada ao lado de "Qtd. Comentários"
- [x] Linhas de continuação (└) para 2º+ documentos do mesmo item
- [x] 69 testes passando, zero erros TypeScript

## Sprint 35 — PDF Corrigido + Filtros por Órgão/Responsável/Status/Prioridade

- [x] export.ts: exportToPdf reescrito com autoTable landscape A4 — tabela principal com 11 colunas fixas, sem sobreposições nem transbordamento
- [x] export.ts: colunas Órgão Responsável, Responsável, Cargo, Telefone e Prazo Previsto no PDF
- [x] export.ts: código de cor automático por Status, Prioridade e Situação Prazo; linhas de grupo destacadas
- [x] Actions.tsx: filtro por Responsável adicionado ao painel avançado (busca dinâmica a partir dos dados carregados)
- [x] Actions.tsx: filtros de Órgão, Responsável, Status e Prioridade todos visíveis e funcionais
- [x] 69 testes passando, zero erros TypeScript

## Sprint 37 — Usuário Vinculado no Dialog de Edição de Órgão

- [x] Frontend: query trpc.localAuth.users.list adicionada em ActionDetail.tsx (enabled apenas para admins)
- [x] Frontend: campo "Vincular a Usuário Cadastrado" no dialog de edição de órgão, filtrado pelos usuários com o órgão em allowedOrgaos (ou admins/super_admins)
- [x] Frontend: ao selecionar usuário, preenche automaticamente nome, cargo, telefone e e-mail
- [x] Frontend: seletor de responsável cadastrado (orgao_responsaveis) também atualiza localUserId ao selecionar
- [x] 69 testes passando, zero erros TypeScript

## Sprint 38 — Empresas Parceiras em Órgãos e Responsáveis

- [x] shared/orgaos.ts: EMPRESAS_PARCEIRAS (CONSÓRCIO RIBEIRA, EY, AEPA, BP), TODOS_ORGAOS e isEmpresaParceira adicionados
- [x] OrgaosResponsaveis.tsx: seção "Empresas Parceiras" com visual âmbar, badge PMI Ribeira Sustentável, borda e cores distintas; componente OrgaoCard reutilizável
- [x] OrgaosResponsaveis.tsx: seletor de órgão no dialog inclui empresas parceiras com grupo separado
- [x] ActionDetail.tsx: seletores de órgão (add/edit) incluem empresas parceiras via optgroup
- [x] server/routers.ts: validações Zod atualizadas para TODOS_ORGAOS (5 ocorrências)
- [x] 69 testes passando, zero erros TypeScript

## Sprint 39 — Empresas Parceiras: Filtro, Cadastro de Usuários e PDF

- [x] Actions.tsx: empresas parceiras incluídas no painel de filtro por órgão com visual âmbar (botões com borda laranja)
- [x] Users.tsx: seletor de allowedOrgaos inclui seção "Empresas Parceiras" com checkboxes em cor âmbar
- [x] export.ts: empresas parceiras destacadas com fundo âmbar-50 e texto amber-700 na coluna Órgão Responsável do PDF
- [x] 69 testes passando, zero erros TypeScript

## Sprint 40 — Empresas Parceiras no Auto-Cadastro

- [x] Register.tsx: campo "Secretaria / Órgão" convertido de texto livre para select com dois grupos: Órgãos Municipais e Empresas Parceiras (PMI Ribeira Sustentável)
- [x] 69 testes passando, zero erros TypeScript

## Sprint 41 — Guia do Usuário atualizado (Sprints 33–40)

- [x] UserGuide.tsx reescrito com todas as funcionalidades dos Sprints 33–40
- [x] Admin: seção 3 atualizada com indicador de último contato, botão Limpar Filtros e restauração de scroll
- [x] Admin: seção 4 atualizada com campo "Vincular a Usuário Cadastrado" no dialog de edição de órgão e empresas parceiras
- [x] Admin: seção 5 (Órgãos & Responsáveis) atualizada com dois tipos de entidades (municipais e parceiras)
- [x] Admin: seção 6 (Usuários) atualizada com campo órgão como select e empresas parceiras nos órgãos permitidos
- [x] Admin: seção 9 (Exportar) atualizada com colunas de documentos no Excel e PDF landscape A4 com filtros no cabeçalho
- [x] Admin: nova seção 10 "Empresas Parceiras do PMI" com lista das 4 empresas e onde aparecem na plataforma
- [x] Setorial: seção 1 atualizada com auto-cadastro via select de órgão
- [x] Setorial: seção 2 atualizada com indicador de último contato
- [x] Viewer: seção 3 atualizada com badge de último contato e botão Limpar Filtros
- [x] Viewer: seção 4 atualizada com restauração de scroll e empresas parceiras
- [x] Viewer: seção 5 atualizada com indicador de último contato
- [x] Subtítulo do Guia atualizado para "PMI Ribeira Sustentável · SEMPLA"
- [x] 69 testes passando, zero erros TypeScript

## Sprint Scroll — Restauração de Posição de Scroll

- [x] Actions.tsx: constante SCROLL_KEY = "actions-scroll-y" definida antes do componente
- [x] Actions.tsx: useEffect de restauração lê sessionStorage, remove a chave e restaura scroll com duplo requestAnimationFrame
- [x] Actions.tsx: handleNavigateToAction (useCallback) salva window.scrollY no sessionStorage e navega programaticamente
- [x] Actions.tsx: prop onNavigate: (id: number) => void adicionada à interface SortableActionRowProps
- [x] Actions.tsx: botão de navegação convertido de Link para button com onClick={onNavigate}
- [x] Actions.tsx: onNavigate={handleNavigateToAction} passado nas duas chamadas de SortableActionRow
- [x] 69 testes passando, zero erros TypeScript

## Sprint 42 — Correção da Restauração de Scroll

- [x] Diagnóstico: wouter não desmonta/remonta Actions ao navegar de /acoes/:id → /acoes, portanto useEffect([], []) não disparava no retorno
- [x] Correção: useEffect agora depende de `location` (useLocation do wouter) e verifica `location === "/acoes"` antes de restaurar o scroll
- [x] handleNavigateToAction continua salvando window.scrollY no sessionStorage antes de navegar
- [x] 69 testes passando, zero erros TypeScript

## Sprint 43 — Correção Robusta de Scroll (segunda iteração)

- [x] Diagnóstico: o useEffect anterior disparava antes dos dados chegarem (isLoading=true), portanto o elemento ainda não estava no DOM
- [x] Nova estratégia em dois passos: Step 1 arma um ref pendente quando a rota muda para /acoes; Step 2 executa o scroll apenas quando isLoading passa para false
- [x] Scroll por elemento: cada linha da listagem recebe data-action-id={action.id}; ao retornar, scrollIntoView({ block: "center" }) posiciona o item no centro da tela
- [x] Fallback por Y: se o elemento não for encontrado (item filtrado/paginado), usa window.scrollTo com a posição Y salva
- [x] handleNavigateToAction salva tanto o Y quanto o id no sessionStorage antes de navegar
- [x] 69 testes passando, zero erros TypeScript

## Sprint 46 — Destaque Visual do Item Recém-Visitado

- [x] Keyframe row-flash adicionado no index.css: fade de fundo azul (oklch 0.55/0.18/240) com borda inset, 2s de duração
- [x] Fallback para prefers-reduced-motion: outline estático em vez de animação
- [x] Prop isRecentlyVisited adicionado na interface SortableActionRowProps
- [x] Estado recentlyVisitedId no componente Actions: ativado após scroll, limpo após 2,4s
- [x] Classe row-flash aplicada condicionalmente no container raiz do SortableActionRow
- [x] Prop passado nos dois pontos de renderização (DnD e modo normal)
- [x] 69 testes passando, zero erros TypeScript

## Sprint 49 — Navegação Anterior/Próximo na Ficha do Item

- [x] Salvar lista ordenada de IDs visíveis no sessionStorage ao navegar para ActionDetail
- [x] Ler lista de IDs no ActionDetail e calcular índice do item atual
- [x] Implementar botões Anterior/Próximo no cabeçalho do ActionDetail
- [x] Atualizar o scroll-id ao navegar entre itens (destaque ao retornar)
- [x] Contador de posição (ex: 12 / 244) exibido entre os botões
- [x] 69 testes passando, zero erros TypeScript

## Sprint 51 — Último Acesso na Tabela de Usuários

- [x] Adicionar campo `lastAccessAt` (bigint, nullable) na tabela `local_users` no schema Drizzle
- [x] Migrar banco com `pnpm db:push`
- [x] Atualizar a rota de login para gravar `lastAccessAt = Date.now()` ao autenticar com sucesso
- [x] Expor `lastAccessAt` no endpoint `users.list` do tRPC
- [x] Exibir coluna "Último Acesso" na tabela de usuários (data e hora formatadas)
- [x] 69 testes passando, zero erros TypeScript

## Sprint 54 — Correção do Erro "is not valid JSON" ao Atualizar Usuário

- [x] Diagnóstico: Express 4.x não popula req.cookies sem cookie-parser — confirmado com teste real
- [x] Instalar cookie-parser e @types/cookie-parser
- [x] Registrar app.use(cookieParser()) antes do tRPC no index.ts
- [x] Adicionar error handler JSON global para /api/* no Express (evita HTML em erros 500)
- [x] Melhorar mensagem de erro no onError do updateMutation (mensagem amigável para parse errors)
- [x] 69 testes passando, zero erros TypeScript

## Sprint 55 — Unicidade de E-mail no Cadastro de Usuários

- [x] Adicionar função getLocalUserByEmail no db.ts
- [x] Validação de e-mail único no procedimento create (admin cria usuário)
- [x] Validação de e-mail único no procedimento update (admin edita usuário, excluindo o próprio)
- [x] Validação de e-mail único no procedimento register (auto-cadastro público)
- [x] Mensagem clara ao usuário: "Este e-mail já está cadastrado na plataforma"
- [x] No auto-cadastro: mensagem orienta a fazer login se já possui acesso
- [x] 69 testes passando, zero erros TypeScript

## Sprint 58 — Relatório PDF de Usuários

- [x] Função `exportUsersToPdf` adicionada ao export.ts (client-side, jsPDF + autoTable)
- [x] PDF inclui: nome, usuário, cargo, órgão/entidade, perfil, status, data de cadastro, último acesso
- [x] Cabeçalho com logotipo SEMPLA, título, subtítulo PMI Ribeira Sustentável, data de geração e total de usuários
- [x] Resumo de totalizadores: ativos, inativos, contagem por perfil
- [x] Cores semânticas: perfil (azul/teal/cinza), status (verde/vermelho), "Nunca acessou" em itálico cinza
- [x] Rodapé com número de página em todas as páginas
- [x] Botão "Exportar PDF" adicionado no cabeçalho da aba de usuários ao lado de "Novo Usuário"
- [x] 69 testes passando, zero erros TypeScript

## Sprint 59 — Status Automático "Em Andamento"

- [x] Ao inserir novo comentário: atualizar status da ação para "Em Andamento" (se não for "Concluído" nem "Cancelado")
- [x] Ao incluir documento (link): atualizar status da ação para "Em Andamento" (se não for "Concluído" nem "Cancelado")
- [x] Ao alterar status do documento para "DOC COM PENDÊNCIA": atualizar status da ação para "Em Andamento"
- [x] Não sobrescreve status "Concluído" nem "Cancelado"
- [x] 69 testes passando, zero erros TypeScript

## Sprint 60 — Correção de acesso setorial + bloqueio de órgão duplicado

- [x] getActionsForSetorial: incluir itens cujo órgão está em action_orgaos (além do campo legado actions.orgao)
- [x] addActionOrgao: bloquear inserção de órgão duplicado no mesmo item (backend)
- [x] ActionDetail: impedir seleção de órgão já existente no item (frontend)
- [x] 69 testes passando, zero erros TypeScript

## Sprint 61 — Unificação de Órgãos (Opção A)

- [x] Migração de dados: mover os 10 registros com orgao legado para action_orgaos (sem duplicar os que já existem)
- [x] Migração de dados: remover duplicatas em action_orgaos
- [x] Backend: remover campo orgao do editInline procedure
- [x] Backend: remover campo orgao do create procedure
- [x] Backend: remover campo orgao do update (actions.update) procedure
- [x] Backend: atualizar getActionsForSetorial para usar apenas action_orgaos
- [x] Backend: atualizar notificações para buscar orgao de action_orgaos
- [x] Frontend: badge da lista exibe orgaoNames de action_orgaos (até 2 + contador)
- [x] Frontend: remover campo Órgão do EditInlineModal
- [x] Frontend: remover campo Órgão do CreateSubItemModal
- [x] Frontend: remover campo Órgão do formulário de nova ação
- [x] Frontend: getExportData usa action_orgaos como fonte única (orgaoNames + compat escalar)
- [x] 69 testes passando, zero erros TypeScript

## Sprint 62 — Exportação com todos os órgãos

- [x] ActionRow: adicionar campo orgaoNames ao tipo de exportação
- [x] Excel: coluna "Órgão Responsável" exibe todos os órgãos separados por vírgula
- [x] PDF: coluna "Órgão Responsável" exibe todos os órgãos separados por vírgula
- [x] 69 testes passando, zero erros TypeScript

## Sprint 63 — Órgão/Entidade do autor nos comentários

- [x] getCommentsByActionId: left join com localUsers para trazer organization
- [x] Resolver nome preferindo localUser (maioria) com fallback para OAuth
- [x] ActionDetail: exibir badge com órgão/entidade do autor ao lado do nome
- [x] 69 testes passando, zero erros TypeScript

## Sprint 64 — Órgão/Entidade do autor no histórico de alterações

- [x] getHistoryByActionId: left join com localUsers para trazer organization
- [x] Resolver nome preferindo localUser com fallback para OAuth
- [x] ActionDetail: exibir badge com órgão/entidade do autor no histórico
- [x] 69 testes passando, zero erros TypeScript

## Sprint 65 — Filtro "Últimas Alterações" na lista de itens

- [x] Backend: procedure getRecentlyChanged — busca data do último evento por item (history, comments, actionDocuments, auditLog)
- [x] Backend: retornar lista de itens com lastEventAt e lastEventType ordenada do mais recente ao mais antigo
- [x] Frontend: botão/seletor "Últimas Alterações" na barra de filtros da lista
- [x] Frontend: ao ativar, reordenar lista por lastEventAt e exibir badge com tipo e data do último evento em cada item
- [x] 69 testes passando, zero erros TypeScript

## Sprint 67 — Multi-Projeto (Ribeira PMI + SANEA+ NATAL)

- [x] Schema: campo `project` enum('ribeira','sanea') em `actions`
- [x] Schema: campo `allowedProjects` JSON em `local_users` (lista de projetos permitidos)
- [x] Migração: colunas aplicadas via SQL direto + 282 itens marcados como project='ribeira'
- [x] Backend: procedure actions.list aceita parâmetro `project`
- [x] Backend: getActions e getActionsForSetorial filtram por projeto ativo
- [x] Backend: exportações filtram por projeto
- [x] Backend: cadastro de usuário com campo allowedProjects
- [x] Frontend: constante PROJECTS com id/label/cor para ribeira e sanea
- [x] Frontend: ProjectContext com projeto ativo, setter (localStorage) e availableProjects filtrado por usuário
- [x] Frontend: seletor de projeto no sidebar — visível só para usuários com acesso a mais de um projeto
- [x] Frontend: ao trocar de projeto, lista de ações recarrega filtrada
- [x] Frontend: modal Nova Ação pré-preenche project com projeto ativo
- [x] Frontend: cadastro de usuários com checkboxes de projetos permitidos
- [x] Frontend: usuário com acesso a apenas 1 projeto não vê o seletor
- [x] 69 testes passando, zero erros TypeScript

## Sprint 68 — Dashboard responsivo ao projeto ativo

- [x] Dashboard KPIs, gráficos e exportação PDF filtrados pelo projeto ativo (ribeira/sanea)
- [x] Título do Dashboard exibe o nome do projeto selecionado
- [x] 69 testes passando, zero erros TypeScript

## Sprint 69 — Título dinâmico na tela de Ações & Entregas

- [x] Título fixo "PMI Ribeira Sustentável" substituído por nome do projeto ativo
- [x] Zero erros TypeScript

## Sprint 70 — Cores de destaque dinâmicas por projeto

- [x] CSS variable `--project-color` aplicada no `<aside>` e `<main>` do RiberaLayout
- [x] Geo-line no sidebar com cor dinâmica via `projectColor`
- [x] Avatar do usuário com gradiente dinâmico baseado em `projectColor`
- [x] `.nav-item:hover` e `.nav-item.active` usam `color-mix` com `--project-color`
- [x] `.geo-line` usa `color-mix` com `--project-color`
- [x] `.progress-teal` usa `--project-color` como base do gradiente
- [x] Barra lateral do título em Dashboard.tsx usa `projectColor`
- [x] Barra lateral do título em Actions.tsx usa `projectColor`
- [x] Barra lateral do título em Governance.tsx usa `projectColor`
- [x] 69 testes passando, zero erros TypeScript

## Sprint 71 — Projeto no Log de Auditoria

- [x] Schema: adicionar campo `project` enum('ribeira','sanea') na tabela `audit_log`
- [x] Migração: pnpm db:push
- [x] Backend db.ts: popular campo `project` ao inserir em `createAuditEntry` (buscar de `actions.project`)
- [x] Backend db.ts: `getAuditLogAll` retorna campo `project` (join com actions ou campo direto)
- [x] Backend routers.ts: `audit.listAll` aceita parâmetro opcional `project` para filtrar
- [x] Frontend AuditLog.tsx: adicionar coluna "Projeto" na tabela com badge colorido
- [x] Frontend AuditLog.tsx: adicionar filtro por projeto no painel de filtros
- [x] Frontend AuditLog.tsx: incluir projeto no CSV e PDF exportados
- [x] 69 testes passando, zero erros TypeScript
