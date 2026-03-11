// ── Auth ──────────────────────────────────────────────────────────────────────
export interface AutenticacaoRequest { codigo: string; chave: string; }
export interface AutenticacaoResponse {
  token: string; expiracao: string;
  aplicacaoId: number; codigo: string; nome: string;
}
export interface LoginRequest { username: string; password: string; }
export interface LoginResponse {
  token: string; expiracao: string;
  userId: number; username: string; nome: string;
}

// ── Aplicacao ─────────────────────────────────────────────────────────────────
export interface Aplicacao { id: number; codigo: string; nome: string; chave: string; }
export interface AplicacaoRequest { codigo: string; nome: string; chave: string; }

// ── User ──────────────────────────────────────────────────────────────────────
export interface User {
  id: number; username: string; nome: string;
  tipoUsuario: string; situacao: string;
  dataHoraInclusao: string; dataHoraModificacao: string;
  pessoaId?: number; assessoriaId?: number;
  carteiras?: Carteira[];
  carteiraIds?: number[];
}
export interface UserRequest {
  username: string; nome: string; password?: string;
  tipoUsuario: string; situacao: string;
  assessoriaId?: number; pessoaId?: number;
  carteiraIds?: number[];
}

// ── Assessoria ────────────────────────────────────────────────────────────────
export interface Assessoria {
  id: number; nome: string; cnpj: string; situacao: string;
  dataHoraInclusao: string; dataHoraModificacao: string;
  carteiras?: Carteira[];
}
export interface AssessoriaRequest { id?: number; nome: string; cnpj: string; situacao: string; }

// ── Carteira ──────────────────────────────────────────────────────────────────
export interface Carteira {
  id: number; nome: string; descricao?: string; situacao: string;
  assessoriaId: number; assessoria?: Assessoria;
  dataHoraInclusao: string; dataHoraModificacao: string;
  regraCalculo?: RegraCalculo;
}
export interface CarteiraRequest {
  id?: number; nome: string; descricao?: string; situacao: string; assessoriaId: number;
  regraCalculo?: RegraCalculoRequest;
}

// ── RegraCalculo ──────────────────────────────────────────────────────────────
export interface RegraCalculo {
  id: number; carteiraId: number; nome: string;
  taxaCp: number; tipoJuros: number;
  taxaJurosMes: number; taxaMulta: number;
  taxaHonorarios: number; taxaComissionamento: number;
  ativo: boolean;
  dataHoraInclusao: string; dataHoraModificacao: string;
  regrasParcelamento?: RegraParcelamento[];
}

export interface RegraParcelamento {
  id: number; maxParcelas: number; valorMinimoParcela: number;
  taxaJurosParcelamento: number; percentualEntrada: number;
  dataHoraInclusao: string; dataHoraModificacao: string;
  regraCalculoId: number;
}

export interface RegraCalculoRequest {
  carteiraId?: number;
  nome: string;
  taxaCp: number;
  tipoJuros: number;
  taxaJurosMes: number;
  taxaMulta: number;
  taxaHonorarios: number;
  taxaComissionamento: number;
  ativo: boolean;
  regrasParcelamento?: RegraParcelamentoRequest[];
}

export interface RegraParcelamentoRequest {
  id?: number;
  maxParcelas: number;
  valorMinimoParcela: number;
  taxaJurosParcelamento: number;
  percentualEntrada: number;
}

// ── Produto ───────────────────────────────────────────────────────────────────
export interface Produto { id: number; nome: string; descricao: string; }
export interface ProdutoRequest { nome: string; descricao: string; }

// ── MotivoContato ─────────────────────────────────────────────────────────────
export interface MotivoContato {
  id: number;
  codigo: string;
  descricao: string;
  produtivo: boolean;
  cpc: boolean;
  diasStandBy: number;
  ativo: boolean;
  historicoPadrao: string;
  codigoExterno: string;
  descricaoExterno: string;
  /** "NOVO" = cria nova tarefa e encerra atendimento; "MANTER" = mantém cliente aberto */
  acao: string;
}
export interface MotivoContatoRequest {
  codigo: string;
  descricao: string;
  produtivo: boolean;
  cpc: boolean;
  diasStandBy: number;
  ativo: boolean;
  historicoPadrao: string;
  codigoExterno: string;
  descricaoExterno: string;
}

// ── MotivoAtraso ──────────────────────────────────────────────────────────────
export interface MotivoAtraso {
  id: number; descricao: string;
  carteiraId?: number; carteira?: Carteira;
  /** ID equivalente no Cobransaas (de-para para lançamento de Tarefas). */
  idCobransaas?: string;
}
export interface MotivoAtrasoRequest {
  descricao: string;
  carteiraId?: number;
  idCobransaas?: string;
}

// ── CarteiraCobransaas ────────────────────────────────────────────────────────
export interface CarteiraCobransaas {
  id: number; carteiraId: number; carteira?: Carteira;
  host: string; apiKey: string; assessoriaExternaId?: string;
  ativo: boolean; tamanhoPagina: number;
  modoSincronizacao: string; seletoresCliente: string;
  observacao?: string;
  dataUltimaSincronizacao?: string;
  ultimoCursor?: string; ultimaPagina?: number;
  ultimoLoteId?: string; ultimoLoteDataProcessamento?: string;
  dataHoraInclusao: string; dataHoraModificacao: string;
}
export interface CarteiraCobransaasRequest {
  carteiraId: number; host: string; apiKey: string;
  assessoriaExternaId?: string; ativo: boolean;
  tamanhoPagina: number; modoSincronizacao: string;
  seletoresCliente: string; observacao?: string;
}

// ── Cliente / Pessoa (com contatos embutidos) ─────────────────────────────────
export interface ClienteEmail {
  id?: number; emailAddress: string; principal: boolean; ranking?: number;
  dataHoraInclusao?: string; dataHoraModificacao?: string;
}
export interface ClienteTelefone {
  id?: number; ddd: string; numero: string; ramal?: string;
  tipo: string; observacao?: string; principal: boolean; ranking?: number;
  dataHoraInclusao?: string; dataHoraModificacao?: string;
}
export interface ClienteEndereco {
  id?: number; cep: string; logradouro: string; numero: string;
  complemento?: string; bairro: string; cidade: string; uf: string;
  tipo: string; tipoLogradouro: string; principal: boolean; ranking?: number;
  codigoDne?: string; dataHoraInclusao?: string; dataHoraModificacao?: string;
}
export interface Cliente {
  id: number; tipoPessoa: string; situacao: string; nome: string;
  cpfCnpj: string; codigo: string; sexo?: string;
  dataNascimento?: string; dataConta?: string;
  naturalidade?: string; estadoCivil?: string; rg?: string;
  rating?: string; lp?: string;
  propensaoPagamento?: string; historicoPagamento?: string;
  numeroDiasMaiorAtraso?: number; dataMaiorAtraso?: string;
  rendaTitular?: number; rendaConjuge?: number; outrasRendas?: number;
  profissao?: string; categoriaProfissao?: string; tipoResidencia?: string;
  saldoAtraso: number; saldoAtual: number; saldoTotal: number;
  saldoVencido: number; saldoContabil: number; saldoProvisao?: string;
  diasAtraso: number;
  dataHoraInclusao: string; dataHoraModificacao: string;
  emails: ClienteEmail[];
  enderecos: ClienteEndereco[];
  telefones: ClienteTelefone[];
}

// ── Contrato ──────────────────────────────────────────────────────────────────
export interface Contrato {
  id: number; idExterno?: string; numeroContrato: string;
  numeroParcelas: number; dataEmissao: string; dataOperacao: string;
  situacao: string; tipo?: string;
  taxaOperacao: number; valorDevolucao: number; valorIof: number;
  valorLiquido?: number; valorTarifa: number; valorMinimo?: number;
  valorTotal: number; saldoAtual: number; saldoTotal: number;
  saldoAtraso: number; saldoContabil: number;
  diasAtraso?: number; dataVencimento?: string;
  lp: boolean; dataLp?: string; siglaAtraso?: string; rating?: string;
  carteiraId: number; carteira?: Carteira;
  clienteId: number; cliente?: Cliente;
  parcelas?: Parcela[];
  produto?: Produto;
  dataHoraCriacao: string; dataHoraModificacao: string;
}
export interface ContratoRequest {
  id?: number; idExterno?: string; numeroContrato: string;
  numeroParcelas: number; dataEmissao: string; dataOperacao: string;
  situacao: string; tipo?: string;
  taxaOperacao: number; valorDevolucao: number; valorIof: number;
  valorLiquido?: number; valorTarifa: number; valorMinimo?: number;
  valorTotal: number; saldoAtual: number; saldoTotal: number;
  saldoAtraso: number; saldoContabil: number;
  diasAtraso?: number; dataVencimento?: string;
  lp: boolean; siglaAtraso?: string; rating?: string;
  carteiraId: number; clienteId: number;
  parcelas?: ParcelaRequest[];
}

// ── Parcela ───────────────────────────────────────────────────────────────────
export interface Parcela {
  id: number; idExterno?: string; numeroContrato: string;
  numeroParcela: number; dataVencimento: string;
  saldoPrincipal: number; saldoTotal: number; saldoAtual: number;
  saldoContabil: number; valorPrincipal: number; valorTotal: number;
  valorMulta: number; valorPermanencia: number; valorMora: number;
  valorOutros: number; valorDesconto: number;
  valorDespesa?: number; valorBoleto?: number; valorBaseTributo?: number;
  valorPrincipalAberto: number;
  situacao: string; acordo: boolean; bloqueio: boolean; promessa: boolean;
  contratoId: number;
}
export interface ParcelaRequest {
  id?: number;
  idExterno?: string;
  numeroContrato: string;
  numeroParcela: number;
  dataVencimento: string;
  saldoPrincipal: number;
  saldoTotal: number;
  saldoAtual: number;
  saldoContabil: number;
  valorPrincipal: number;
  valorTotal: number;
  valorMulta: number;
  valorPermanencia: number;
  valorMora: number;
  valorOutros: number;
  valorDesconto: number;
  valorDespesa?: number;
  valorBoleto?: number;
  valorBaseTributo?: number;
  valorPrincipalAberto: number;
  situacao: string;
  acordo: boolean;
  bloqueio: boolean;
  promessa: boolean;
  contratoId?: number;
}

// ── Fila ──────────────────────────────────────────────────────────────────────
export interface Fila {
  id: number; codigoFila: string; descricao: string; ativo: boolean;
  dataInicio: string; dataFim?: string;
  /** "INTERNO" ou "DISCADOR" */
  tipo: string;
  dataHoraInclusao: string; dataHoraModificacao: string;
}
export interface FilaRequest {
  codigoFila: string; descricao: string; ativo: boolean;
  dataInicio: string; dataFim?: string; tipo: string;
}
export interface FilaRegistro {
  id: number; filaId: number;
  clienteId: number; cliente?: Pick<Cliente, 'id' | 'nome' | 'cpfCnpj'>;
  contratoId?: number; contrato?: Pick<Contrato, 'id' | 'numeroContrato'>;
  dataHoraAgendamento?: string; dataHoraAtendimento?: string;
  atendido: boolean; ocorrenciaId?: number;
}
export interface FilaFiltroRequest {
  carteiraIds?: number[];
  situacaoCliente?: string; situacaoContrato?: string;
  diasAtrasoMin?: number; diasAtrasoMax?: number;
  saldoAtualMin?: number; saldoAtualMax?: number;
  dataHoraAgendamento?: string;
  ignorarJaIncluidos: boolean; incluirContrato: boolean;
}

// ── Ocorrencia ────────────────────────────────────────────────────────────────
export interface Ocorrencia {
  id: number; clienteId: number; cliente?: Pick<Cliente, 'id' | 'nome' | 'cpfCnpj'>;
  motivoContatoId: number; motivoContato?: MotivoContato;
  motivoAtrasoId: number; motivoAtraso?: MotivoAtraso;
  dataHoraContato: string; dataPromessa?: string;
  dataAgendada: string; horaAgendada?: string;
  usuarioResponsavelId: number; usuarioResponsavel?: Pick<User, 'id' | 'nome' | 'username'>;
  situacao: string; observacao: string;
  diasAtraso: number; saldoAtual: number; saldoAtraso: number;
  cpc?: string; telefone?: string;
  dataHoraInclusao: string; dataHoraModificacao: string;
}
export interface OcorrenciaRequest {
  id?: number; clienteId: number;
  motivoContatoId: number; motivoAtrasoId: number;
  dataHoraContato: string; dataPromessa?: string;
  dataAgendada: string; horaAgendada?: string;
  usuarioResponsavelId: number;
  situacao: string; observacao: string;
  diasAtraso: number; saldoAtual: number; saldoAtraso: number;
  cpc?: string; telefone?: string;
}
