export const ORGAOS_MUNICIPAIS = [
  "GAPRE",
  "GAVIPRE",
  "SMG",
  "SEPAE",
  "SECOM",
  "PGM",
  "CGM",
  "SEMPLA",
  "SEMAD",
  "SEFIN",
  "SME",
  "SMS",
  "SEMTAS",
  "SECULT",
  "SEMSUR",
  "SEMUL",
  "STTU",
  "SEMDES",
  "SETUR",
  "SEL",
  "SEINFRA",
  "SEMIDH",
  "SEHARPE",
  "SEMURB",
  "OGM",
  "PROCON",
  "NATALPREV",
  "ARSBAN",
  "FUNCARTE",
  "URBANA",
  "SAG",
] as const;

export type OrgaoMunicipal = (typeof ORGAOS_MUNICIPAIS)[number];

export const EMPRESAS_PARCEIRAS = [
  "CONSÓRCIO RIBEIRA",
  "EY",
  "AEPA",
  "BP",
] as const;
export type EmpresaParceira = (typeof EMPRESAS_PARCEIRAS)[number];

/** Todos os órgãos/empresas disponíveis para atribuição */
export const TODOS_ORGAOS = [...ORGAOS_MUNICIPAIS, ...EMPRESAS_PARCEIRAS] as const;
export type TodosOrgaos = OrgaoMunicipal | EmpresaParceira;

/** Retorna true se o código é de empresa parceira */
export function isEmpresaParceira(orgao: string): boolean {
  return (EMPRESAS_PARCEIRAS as readonly string[]).includes(orgao);
}
