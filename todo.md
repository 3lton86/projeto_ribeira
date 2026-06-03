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
