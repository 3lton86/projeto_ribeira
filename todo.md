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
