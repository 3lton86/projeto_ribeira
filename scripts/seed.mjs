import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// ---- SEED DATA ----

const actionsData = [
  // ===================== GOVERNANÇA =====================
  { area: "Governança", itemCode: "1", parentCode: null, isGroup: 1, description: "Gestão do Projeto", priority: null, sortOrder: 10 },
  { area: "Governança", itemCode: "1.1", parentCode: "1", isGroup: 0, description: "Estrutura de governança atualmente prevista para o projeto (comitês, fóruns decisórios, instâncias de validação)", priority: "Alta", documentBase: "Organogramas, regimentos internos, fluxos de governança", sortOrder: 11 },
  { area: "Governança", itemCode: "1.2", parentCode: "1", isGroup: 0, description: "Indicação formal dos pontos focais por frente temática (Ambiental, Social, Econômico-Financeiro, Arquitetura e Urbanismo e etc)", priority: "Alta", documentBase: "Lista de responsáveis, contactos institucionais", sortOrder: 12 },
  { area: "Governança", itemCode: "1.3", parentCode: "1", isGroup: 0, description: "Relação de órgãos e entidades envolvidos no projeto", priority: "Alta", documentBase: "Mapeamento institucional, atas, comunicações oficiais", sortOrder: 13 },
  { area: "Governança", itemCode: "1.4", parentCode: "1", isGroup: 0, description: "Fluxo atual de tomada de decisão e aprovação de projetos", priority: "Alta", documentBase: "Normativos internos, fluxogramas, manuais administrativos", sortOrder: 14 },
  { area: "Governança", itemCode: "1.5", parentCode: "1", isGroup: 0, description: "Identificação de restrições institucionais ou riscos", priority: "Alta", documentBase: "Notas técnicas, pareceres, registros de riscos", sortOrder: 15 },

  // ===================== TÉCNICO =====================
  { area: "Técnico", itemCode: "1", parentCode: null, isGroup: 1, description: "Diagnóstico Territorial e de Uso do Solo", priority: null, sortOrder: 10 },
  { area: "Técnico", itemCode: "1.1", parentCode: "1", isGroup: 0, description: "Levantamento físico-funcional dos ativos/equipamentos, incluindo identificação, limites físicos, usos atuais, e quando aplicável, informações preliminares de titularidade/gestão e regime de uso", priority: "Alta", sortOrder: 11 },
  { area: "Técnico", itemCode: "1.2", parentCode: "1", isGroup: 0, description: "Cadastro fotográfico, plantas, mapas, georreferenciamento incluindo, quando disponível, a indicação das áreas e perímetros associados a cada ativo e sua correlação com registros e instrumentos de gestão aplicáveis", priority: "Alta", sortOrder: 12 },

  { area: "Técnico", itemCode: "2", parentCode: null, isGroup: 1, description: "Diagnóstico Urbanístico - Bairro da Ribeira", priority: null, sortOrder: 20 },
  { area: "Técnico", itemCode: "2.1", parentCode: "2", isGroup: 0, description: "Legislação urbanística vigente.", priority: "Alta", sortOrder: 21 },
  { area: "Técnico", itemCode: "2.2", parentCode: "2", isGroup: 0, description: "Projetos urbanos e operações urbanas planejadas/projetadas.", priority: "Alta", sortOrder: 22 },
  { area: "Técnico", itemCode: "2.3", parentCode: "2", isGroup: 0, description: "Listagem de imóveis vazios, subutilizados e de ocupações informais.", priority: "Alta", sortOrder: 23 },
  { area: "Técnico", itemCode: "2.4", parentCode: "2", isGroup: 0, description: "Estudos elaborados previamente destacando potencialidades e entraves à investimentos imobiliários na região.", priority: "Alta", sortOrder: 24 },
  { area: "Técnico", itemCode: "2.5", parentCode: "2", isGroup: 0, description: "Inventário de patrimônio histórico e cultural.", priority: "Alta", sortOrder: 25 },
  { area: "Técnico", itemCode: "2.6", parentCode: "2", isGroup: 0, description: "Dados sobre mobilidade urbana e infraestrutura de transporte.", priority: "Média", sortOrder: 26 },

  { area: "Técnico", itemCode: "3", parentCode: null, isGroup: 1, description: "Diagnóstico Ambiental", priority: null, sortOrder: 30 },
  { area: "Técnico", itemCode: "3.1", parentCode: "3", isGroup: 0, description: "Levantamento de áreas de preservação permanente (APPs) e restrições ambientais incidentes sobre a área do projeto.", priority: "Alta", sortOrder: 31 },
  { area: "Técnico", itemCode: "3.2", parentCode: "3", isGroup: 0, description: "Licenças e autorizações ambientais vigentes relacionadas aos ativos e equipamentos da área.", priority: "Alta", sortOrder: 32 },
  { area: "Técnico", itemCode: "3.3", parentCode: "3", isGroup: 0, description: "Estudos e laudos ambientais existentes (EIA, RIMA, laudos de contaminação, etc.).", priority: "Alta", sortOrder: 33 },
  { area: "Técnico", itemCode: "3.4", parentCode: "3", isGroup: 0, description: "Passivos ambientais identificados ou suspeitos.", priority: "Alta", sortOrder: 34 },
  { area: "Técnico", itemCode: "3.5", parentCode: "3", isGroup: 0, description: "Dados sobre qualidade da água, solo e ar na área de influência do projeto.", priority: "Média", sortOrder: 35 },

  { area: "Técnico", itemCode: "4", parentCode: null, isGroup: 1, description: "Diagnóstico de Infraestrutura e Serviços Urbanos", priority: null, sortOrder: 40 },
  { area: "Técnico", itemCode: "4.1", parentCode: "4", isGroup: 0, description: "Situação atual das redes de infraestrutura urbana (água, esgoto, drenagem, energia, telecomunicações) na área do projeto.", priority: "Alta", sortOrder: 41 },
  { area: "Técnico", itemCode: "4.2", parentCode: "4", isGroup: 0, description: "Projetos de expansão ou melhoria de infraestrutura previstos para a área.", priority: "Alta", sortOrder: 42 },
  { area: "Técnico", itemCode: "4.3", parentCode: "4", isGroup: 0, description: "Capacidade instalada e demanda atual dos serviços urbanos na área.", priority: "Média", sortOrder: 43 },

  { area: "Técnico", itemCode: "5", parentCode: null, isGroup: 1, description: "Diagnóstico Social e Comunitário", priority: null, sortOrder: 50 },
  { area: "Técnico", itemCode: "5.1", parentCode: "5", isGroup: 0, description: "Levantamento socioeconômico da população residente e usuária da área do projeto.", priority: "Alta", sortOrder: 51 },
  { area: "Técnico", itemCode: "5.2", parentCode: "5", isGroup: 0, description: "Identificação de comunidades, associações e grupos organizados com atuação na área.", priority: "Alta", sortOrder: 52 },
  { area: "Técnico", itemCode: "5.3", parentCode: "5", isGroup: 0, description: "Histórico de processos participativos e consultas públicas realizadas.", priority: "Média", sortOrder: 53 },
  { area: "Técnico", itemCode: "5.4", parentCode: "5", isGroup: 0, description: "Mapeamento de conflitos sociais e tensões territoriais existentes.", priority: "Alta", sortOrder: 54 },

  { area: "Técnico", itemCode: "6", parentCode: null, isGroup: 1, description: "Projetos e Estudos Técnicos Existentes", priority: null, sortOrder: 60 },
  { area: "Técnico", itemCode: "6.1", parentCode: "6", isGroup: 0, description: "Projetos arquitetônicos, urbanísticos e de engenharia elaborados para a área ou equipamentos.", priority: "Alta", sortOrder: 61 },
  { area: "Técnico", itemCode: "6.2", parentCode: "6", isGroup: 0, description: "Estudos de viabilidade técnica existentes.", priority: "Alta", sortOrder: 62 },
  { area: "Técnico", itemCode: "6.3", parentCode: "6", isGroup: 0, description: "Planos setoriais e programas governamentais incidentes sobre a área.", priority: "Média", sortOrder: 63 },
  { area: "Técnico", itemCode: "6.4", parentCode: "6", isGroup: 0, description: "Contratos de obras em andamento ou recentemente concluídos na área.", priority: "Alta", sortOrder: 64 },

  // ===================== JURÍDICO =====================
  { area: "Jurídico", itemCode: "1", parentCode: null, isGroup: 1, description: "Dominial e patrimonial", priority: null, sortOrder: 10 },
  { area: "Jurídico", itemCode: "1.1", parentCode: "1", isGroup: 0, description: "Matrículas atualizadas e certidões do Registro de Imóveis dos equipamentos-alvo de domínio municipal inseridos na ÁREA DO PROJETO", priority: "Alta", sortOrder: 11 },
  { area: "Jurídico", itemCode: "1.2", parentCode: "1", isGroup: 0, description: "Identificação e matrículas dos lotes e áreas de domínio público municipal no eixo da Rua Chile", priority: "Alta", sortOrder: 12 },
  { area: "Jurídico", itemCode: "1.3", parentCode: "1", isGroup: 0, description: "Confirmação documental da titularidade e da gestão do Ancoradouro Pesqueiro", priority: "Média", sortOrder: 13 },
  { area: "Jurídico", itemCode: "1.4", parentCode: "1", isGroup: 0, description: "Atos de afetação/desafetação e classificação dos bens (uso comum, especial ou dominical) dos equipamentos-alvo de domínio municipal", priority: "Alta", sortOrder: 14 },
  { area: "Jurídico", itemCode: "1.5", parentCode: "1", isGroup: 0, description: "Ficha do cadastro imobiliário municipal / inscrição de IPTU e registro no inventário patrimonial dos equipamentos-alvo de domínio municipal", priority: "Média", sortOrder: 15 },

  { area: "Jurídico", itemCode: "2", parentCode: null, isGroup: 1, description: "Instrumentos de uso vigentes", priority: null, sortOrder: 20 },
  { area: "Jurídico", itemCode: "2.1", parentCode: "2", isGroup: 0, description: "Contratos, cessões, permissões, concessões de uso, comodatos, convênios e termos de cooperação vigentes sobre os equipamentos-alvo municipais, com prazos e condições", priority: "Alta", sortOrder: 21 },
  { area: "Jurídico", itemCode: "2.2", parentCode: "2", isGroup: 0, description: "Identificação de eventuais ocupações informais ou irregulares nos equipamentos-alvo e nas áreas adjacentes de domínio público", priority: "Alta", sortOrder: 22 },
  { area: "Jurídico", itemCode: "2.3", parentCode: "2", isGroup: 0, description: "Atos normativos municipais que regulam o uso e a gestão dos equipamentos-alvo (decretos, portarias, resoluções)", priority: "Média", sortOrder: 23 },

  { area: "Jurídico", itemCode: "3", parentCode: null, isGroup: 1, description: "Restrições e passivos jurídicos", priority: null, sortOrder: 30 },
  { area: "Jurídico", itemCode: "3.1", parentCode: "3", isGroup: 0, description: "Ações judiciais, processos administrativos ou inquéritos civis envolvendo os equipamentos-alvo ou a área do projeto", priority: "Alta", sortOrder: 31 },
  { area: "Jurídico", itemCode: "3.2", parentCode: "3", isGroup: 0, description: "Restrições legais incidentes sobre os imóveis (tombamento, ZEIS, APPs, áreas de marinha, terrenos de marinha, etc.)", priority: "Alta", sortOrder: 32 },
  { area: "Jurídico", itemCode: "3.3", parentCode: "3", isGroup: 0, description: "Pendências de regularização fundiária ou urbanística dos equipamentos-alvo", priority: "Alta", sortOrder: 33 },
  { area: "Jurídico", itemCode: "3.4", parentCode: "3", isGroup: 0, description: "Dívidas, ônus reais ou gravames incidentes sobre os imóveis", priority: "Alta", sortOrder: 34 },

  { area: "Jurídico", itemCode: "4", parentCode: null, isGroup: 1, description: "Instrumentos de viabilização jurídica", priority: null, sortOrder: 40 },
  { area: "Jurídico", itemCode: "4.1", parentCode: "4", isGroup: 0, description: "Legislação municipal aplicável a parcerias público-privadas, concessões e outros modelos de gestão compartilhada", priority: "Alta", sortOrder: 41 },
  { area: "Jurídico", itemCode: "4.2", parentCode: "4", isGroup: 0, description: "Plano Diretor e legislação de uso e ocupação do solo aplicável à área do projeto", priority: "Alta", sortOrder: 42 },
  { area: "Jurídico", itemCode: "4.3", parentCode: "4", isGroup: 0, description: "Legislação estadual e federal incidente sobre a área e os equipamentos-alvo", priority: "Média", sortOrder: 43 },
  { area: "Jurídico", itemCode: "4.4", parentCode: "4", isGroup: 0, description: "Competências e atribuições dos órgãos municipais envolvidos na gestão dos equipamentos-alvo", priority: "Média", sortOrder: 44 },

  // ===================== ECO-FIN =====================
  { area: "Eco-Fin", itemCode: "1", parentCode: null, isGroup: 1, description: "Informações dos imóveis/ativos públicos municipais", priority: null, sortOrder: 10 },
  { area: "Eco-Fin", itemCode: "1.1", parentCode: "1", isGroup: 0, description: "Valor contábil dos ativos públicos envolvidos e depreciação do período e acumulada dos últimos 5 anos, se existente", priority: "Alta", documentBase: "Contabilidade patrimonial, balanços, inventário patrimonial, sistema de bens", sortOrder: 11 },
  { area: "Eco-Fin", itemCode: "1.2", parentCode: "1", isGroup: 0, description: "Valor venal, IPTU e demais referências fiscais/cadastrais dos imóveis", priority: "Alta", documentBase: "Cadastro imobiliário, espelho IPTU, base de valor venal", sortOrder: 12 },
  { area: "Eco-Fin", itemCode: "1.3", parentCode: "1", isGroup: 0, description: "Passivos existentes associados aos imóveis/ativos, inclusive passivos administrativos, financeiros, operacionais ou de regularização", priority: "Alta", documentBase: "Relatórios de passivos, processos, pendências operacionais e de regularização", sortOrder: 13 },
  { area: "Eco-Fin", itemCode: "1.4", parentCode: "1", isGroup: 0, description: "Histórico de custos de desmobilização, reassentamento, regularização, adequação ou reocupação, se existente", priority: "Alta", documentBase: "Contratos, medições, relatórios de reassentamento e regularização", sortOrder: 14 },
  { area: "Eco-Fin", itemCode: "1.5", parentCode: "1", isGroup: 0, description: "Situação atual de uso, ocupação e destinação econômica de cada imóvel/ativo municipal abrangido pelo estudo", priority: "Alta", documentBase: "Quadro de ocupação, mapas de uso, cadastro de ocupantes, destinação atual", sortOrder: 15 },
  { area: "Eco-Fin", itemCode: "1.6", parentCode: "1", isGroup: 0, description: "Instrumentos vigentes relacionados aos imóveis/ativos: contratos, cessões, permissões, termos de uso e equivalentes, com prazo, objeto e condições econômicas", priority: "Alta", documentBase: "Contratos, termos de cessão, permissões, convênios, instrumentos de uso", sortOrder: 16 },

  { area: "Eco-Fin", itemCode: "2", parentCode: null, isGroup: 1, description: "Informações comerciais e operacionais da área/ativos", priority: null, sortOrder: 20 },
  { area: "Eco-Fin", itemCode: "2.1", parentCode: "2", isGroup: 0, description: "Receitas geradas pelos ativos/equipamentos municipais (aluguéis, taxas, tarifas, outorgas, etc.) nos últimos 3 anos", priority: "Alta", documentBase: "Demonstrativos de receita, contratos de locação, relatórios de arrecadação", sortOrder: 21 },
  { area: "Eco-Fin", itemCode: "2.2", parentCode: "2", isGroup: 0, description: "Custos operacionais e de manutenção dos ativos/equipamentos municipais nos últimos 3 anos", priority: "Alta", documentBase: "Contratos de manutenção, notas de empenho, relatórios de despesa", sortOrder: 22 },
  { area: "Eco-Fin", itemCode: "2.3", parentCode: "2", isGroup: 0, description: "Fluxo de visitantes, usuários ou frequentadores dos equipamentos públicos, se disponível", priority: "Média", documentBase: "Relatórios de visitação, dados de bilheteria, registros de acesso", sortOrder: 23 },
  { area: "Eco-Fin", itemCode: "2.4", parentCode: "2", isGroup: 0, description: "Dados sobre atividades econômicas formais e informais no entorno imediato dos equipamentos-alvo", priority: "Média", documentBase: "Cadastro de contribuintes, alvarás, pesquisas de campo, dados do IBGE", sortOrder: 24 },

  { area: "Eco-Fin", itemCode: "3", parentCode: null, isGroup: 1, description: "Informações fiscais e orçamentárias municipais", priority: null, sortOrder: 30 },
  { area: "Eco-Fin", itemCode: "3.1", parentCode: "3", isGroup: 0, description: "Capacidade de endividamento e indicadores fiscais do município (CAPAG, LRF, etc.)", priority: "Alta", documentBase: "Relatórios do Tesouro Nacional, SICONFI, STN, CAPAG", sortOrder: 31 },
  { area: "Eco-Fin", itemCode: "3.2", parentCode: "3", isGroup: 0, description: "Dotações orçamentárias previstas e executadas para a área do projeto nos últimos 3 anos", priority: "Alta", documentBase: "LOA, LDO, relatórios de execução orçamentária, SIAFEM", sortOrder: 32 },
  { area: "Eco-Fin", itemCode: "3.3", parentCode: "3", isGroup: 0, description: "Investimentos públicos realizados na área do projeto nos últimos 5 anos (fontes: municipal, estadual, federal, internacional)", priority: "Alta", documentBase: "Contratos, convênios, termos de repasse, relatórios de execução", sortOrder: 33 },
  { area: "Eco-Fin", itemCode: "3.4", parentCode: "3", isGroup: 0, description: "Financiamentos, empréstimos ou operações de crédito vinculados à área do projeto ou equipamentos-alvo", priority: "Alta", documentBase: "Contratos de financiamento, relatórios de operações de crédito", sortOrder: 34 },

  { area: "Eco-Fin", itemCode: "4", parentCode: null, isGroup: 1, description: "Informações de mercado e potencial econômico", priority: null, sortOrder: 40 },
  { area: "Eco-Fin", itemCode: "4.1", parentCode: "4", isGroup: 0, description: "Dados sobre o mercado imobiliário local (preços de venda e locação, tendências, comparativos regionais)", priority: "Alta", documentBase: "Pesquisas de mercado, dados de cartórios, ITBI, avaliações imobiliárias", sortOrder: 41 },
  { area: "Eco-Fin", itemCode: "4.2", parentCode: "4", isGroup: 0, description: "Estudos de demanda por usos potenciais (hotelaria, comércio, cultura, lazer, habitação, etc.)", priority: "Alta", documentBase: "Estudos de viabilidade, pesquisas de demanda, dados do setor", sortOrder: 42 },
  { area: "Eco-Fin", itemCode: "4.3", parentCode: "4", isGroup: 0, description: "Dados sobre turismo e economia criativa na área da Ribeira e entorno", priority: "Média", documentBase: "Dados da SETUR, IBGE, pesquisas de turismo, relatórios setoriais", sortOrder: 43 },
  { area: "Eco-Fin", itemCode: "4.4", parentCode: "4", isGroup: 0, description: "Benchmarks de projetos de revitalização urbana similares (nacionais e internacionais)", priority: "Média", documentBase: "Estudos de caso, relatórios de organismos internacionais, publicações técnicas", sortOrder: 44 },
];

const governanceNodesData = [
  { id: 1, parentId: null, title: "Consórcio Ribeira Sustentável", subtitle: "Estrutura de Governança do Projeto", type: "root", theme: null, sortOrder: 0 },
  { id: 2, parentId: 1, title: "Comitê Executivo", subtitle: "Instância máxima de decisão estratégica", type: "committee", theme: null, sortOrder: 1 },
  { id: 3, parentId: 1, title: "Comitê Técnico", subtitle: "Coordenação técnica e metodológica", type: "committee", theme: null, sortOrder: 2 },
  { id: 4, parentId: 2, title: "Prefeitura Municipal de Natal", subtitle: "Órgão gestor principal", type: "board", theme: null, sortOrder: 1 },
  { id: 5, parentId: 2, title: "Consórcio Consultor", subtitle: "Equipe técnica contratada", type: "board", theme: null, sortOrder: 2 },
  { id: 6, parentId: 3, title: "Frente Técnica", subtitle: "Diagnóstico territorial e urbanístico", type: "focal", theme: "Técnico", sortOrder: 1 },
  { id: 7, parentId: 3, title: "Frente Jurídica", subtitle: "Regularização fundiária e legal", type: "focal", theme: "Jurídico", sortOrder: 2 },
  { id: 8, parentId: 3, title: "Frente Econômico-Financeira", subtitle: "Viabilidade e estruturação financeira", type: "focal", theme: "Eco-Fin", sortOrder: 3 },
  { id: 9, parentId: 3, title: "Frente de Governança", subtitle: "Gestão institucional e participação", type: "focal", theme: "Governança", sortOrder: 4 },
  { id: 10, parentId: 4, title: "SEPAE", subtitle: "Sec. de Planejamento e Assuntos Estratégicos", type: "entity", theme: null, sortOrder: 1 },
  { id: 11, parentId: 4, title: "SEFIN", subtitle: "Secretaria de Finanças", type: "entity", theme: null, sortOrder: 2 },
  { id: 12, parentId: 4, title: "Procuradoria Municipal", subtitle: "Assessoria Jurídica", type: "entity", theme: null, sortOrder: 3 },
  { id: 13, parentId: 4, title: "SEINFRA", subtitle: "Sec. de Infraestrutura", type: "entity", theme: null, sortOrder: 4 },
];

// Insert actions (skip if already exists to avoid duplicates)
console.log("Inserindo ações...");
let inserted = 0, skipped = 0;
for (const action of actionsData) {
  const [existing] = await connection.execute(
    `SELECT id FROM actions WHERE area = ? AND itemCode = ? LIMIT 1`,
    [action.area, action.itemCode]
  );
  if (existing.length > 0) { skipped++; continue; }
  await connection.execute(
    `INSERT INTO actions (area, itemCode, parentCode, isGroup, description, priority, status, responsible, requestDate, receiptDate, documentBase, sortOrder)
     VALUES (?, ?, ?, ?, ?, ?, 'Pendente', NULL, NULL, NULL, ?, ?)`,
    [action.area, action.itemCode, action.parentCode ?? null, action.isGroup, action.description, action.priority ?? null, action.documentBase ?? null, action.sortOrder]
  );
  inserted++;
}
console.log(`✓ ${inserted} ações inseridas, ${skipped} já existiam (ignoradas)`);

// Insert governance nodes
console.log("Inserindo nós de governança...");
for (const node of governanceNodesData) {
  await connection.execute(
    `INSERT INTO governance_nodes (id, parentId, title, subtitle, type, theme, sortOrder)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [node.id, node.parentId ?? null, node.title, node.subtitle ?? null, node.type, node.theme ?? null, node.sortOrder]
  );
}
console.log(`✓ ${governanceNodesData.length} nós de governança inseridos`);

await connection.end();
console.log("✓ Seed concluído com sucesso!");
