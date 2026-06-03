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
