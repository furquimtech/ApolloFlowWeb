import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { clienteApi } from '../../api/cliente';
import { contratoApi } from '../../api/contrato';
import { motivoContatoApi } from '../../api/motivoContato';
import { motivoAtrasoApi } from '../../api/motivoAtraso';
import { ocorrenciaApi } from '../../api/ocorrencia';
import { useAuth } from '../../contexts/AuthContext';
import type {
  Cliente,
  ClienteEmail,
  ClienteEndereco,
  ClienteTelefone,
  Contrato,
  MotivoAtraso,
  MotivoContato,
  Ocorrencia,
  OcorrenciaRequest,
  Parcela,
} from '../../types';

// ── Helpers ──────────────────────────────────────────────────────────────────

const UF_LIST = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

const EMPTY_PHONE: ClienteTelefone = { ddd: '', numero: '', tipo: 'Celular', principal: false, ramal: '' };
const EMPTY_EMAIL: ClienteEmail    = { emailAddress: '', principal: false };
const EMPTY_ADDRESS: ClienteEndereco = {
  cep: '', logradouro: '', numero: '', complemento: '', bairro: '',
  cidade: '', uf: 'SP', tipo: 'Residencial', tipoLogradouro: '', principal: false,
};

function fmtCurrency(v?: number) {
  return (v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function fmtDateTime(v?: string) {
  if (!v) return '-';
  return new Date(v).toLocaleString('pt-BR');
}

const inputCls = (extra = '') =>
  `w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-ftech-500 focus:ring-2 focus:ring-ftech-200 ${extra}`.trim();

function SLabel({ children, req }: { children: ReactNode; req?: boolean }) {
  return (
    <label className="mb-1 block text-sm font-medium text-gray-700">
      {children}{req && <span className="ml-1 text-red-500">*</span>}
    </label>
  );
}

type ContactTab = 'telefone' | 'email' | 'endereco';

// ── Star Rating ───────────────────────────────────────────────────────────────
function StarRating({ value, onChange, max = 5 }: { value: number | undefined; onChange: (v: number) => void; max?: number }) {
  const [hover, setHover] = useState(0);
  const filled = hover || value || 0;
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }, (_, i) => i + 1).map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(value === star ? 0 : star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="text-xl leading-none transition-transform hover:scale-110 focus:outline-none"
          aria-label={`${star} estrela${star > 1 ? 's' : ''}`}
        >
          <span className={filled >= star ? 'text-amber-400' : 'text-gray-300'}>★</span>
        </button>
      ))}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AtendimentoCliente() {
  const { user } = useAuth();

  // ── Search state ─────────────────────────────────────────────────────────
  const [buscaNome, setBuscaNome]       = useState('');
  const [buscaCpf, setBuscaCpf]         = useState('');
  const [buscaCodigo, setBuscaCodigo]   = useState('');
  const [searchResults, setSearchResults] = useState<Cliente[]>([]);
  const [searching, setSearching]       = useState(false);
  const [searchCollapsed, setSearchCollapsed] = useState(false);

  // ── Cliente state ─────────────────────────────────────────────────────────
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [clientForm, setClientForm] = useState<Partial<Cliente>>({ telefones: [], emails: [], enderecos: [] });
  const [pageLoading, setPageLoading] = useState(false);

  // ── Tabs (contatos) ───────────────────────────────────────────────────────
  const [contactTab, setContactTab] = useState<ContactTab>('telefone');

  // ── Contratos ─────────────────────────────────────────────────────────────
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [contractsCollapsed, setContractsCollapsed] = useState(false);
  const [parcelasMap, setParcelasMap] = useState<Map<number, Parcela[]>>(new Map());
  const [parcelasOpen, setParcelasOpen] = useState<Set<number>>(new Set());
  const [parcelasLoading, setParcelasLoading] = useState<Set<number>>(new Set());

  // ── Ocorrências ───────────────────────────────────────────────────────────
  const [occurrences, setOccurrences] = useState<Ocorrencia[]>([]);
  const [occurrencesCollapsed, setOccurrencesCollapsed] = useState(false);
  const [motivosContato, setMotivosContato] = useState<MotivoContato[]>([]);
  const [motivosAtraso, setMotivosAtraso]   = useState<MotivoAtraso[]>([]);

  // ── Novo lançamento ───────────────────────────────────────────────────────
  const [occForm, setOccForm] = useState<Omit<OcorrenciaRequest, 'usuarioResponsavelId' | 'dataHoraContato' | 'dataAgendada'>>({
    clienteId: 0, motivoContatoId: 0, motivoAtrasoId: 0,
    situacao: 'Pendente', observacao: '',
    diasAtraso: 0, saldoAtual: 0, saldoAtraso: 0,
    cpc: '', telefone: '',
  });
  // telefone: 'select' (existing) or 'custom' (new number)
  const [telMode, setTelMode]     = useState<'select' | 'custom'>('select');
  const [customTel, setCustomTel] = useState('');
  const [savingOcc, setSavingOcc] = useState(false);

  // ── New contact forms ─────────────────────────────────────────────────────
  const [newPhone, setNewPhone]     = useState<ClienteTelefone>(EMPTY_PHONE);
  const [newEmail, setNewEmail]     = useState<ClienteEmail>(EMPTY_EMAIL);
  const [newAddress, setNewAddress] = useState<ClienteEndereco>(EMPTY_ADDRESS);
  const [savingContacts, setSavingContacts] = useState(false);

  // ── Feedback ──────────────────────────────────────────────────────────────
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');

  // ── Aux data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([motivoContatoApi.getAll(), motivoAtrasoApi.getAll()])
      .then(([mc, ma]) => { setMotivosContato(mc); setMotivosAtraso(ma); })
      .catch(() => setError('Erro ao carregar dados auxiliares.'));
  }, []);

  const sortedOccurrences = useMemo(
    () => [...occurrences].sort((a, b) => new Date(b.dataHoraContato).getTime() - new Date(a.dataHoraContato).getTime()),
    [occurrences]
  );

  function parcelasEmAtraso(contrato: Contrato): number {
    if (!contrato.parcelas?.length) return 0;
    const hoje = new Date();
    return contrato.parcelas.filter(p =>
      new Date(p.dataVencimento) < hoje && p.situacao !== 'Pago' && p.saldoAtual > 0
    ).length;
  }

  function valorParcelaMedio(contrato: Contrato): number {
    if (contrato.numeroParcelas > 0) return contrato.valorTotal / contrato.numeroParcelas;
    return 0;
  }

  async function toggleParcelas(contratoId: number) {
    const isOpen = parcelasOpen.has(contratoId);
    if (isOpen) {
      setParcelasOpen(prev => { const s = new Set(prev); s.delete(contratoId); return s; });
      return;
    }
    // Expand: load if not cached
    if (!parcelasMap.has(contratoId)) {
      setParcelasLoading(prev => new Set(prev).add(contratoId));
      try {
        const c = await contratoApi.getById(contratoId);
        setParcelasMap(prev => new Map(prev).set(contratoId, c.parcelas ?? []));
      } finally {
        setParcelasLoading(prev => { const s = new Set(prev); s.delete(contratoId); return s; });
      }
    }
    setParcelasOpen(prev => new Set(prev).add(contratoId));
  }

  const existingPhones = clientForm.telefones ?? [];

  // ── Search ────────────────────────────────────────────────────────────────
  async function handleSearch() {
    const nome    = buscaNome.trim();
    const cpfCnpj = buscaCpf.trim();
    const codigo  = buscaCodigo.trim();
    if (!nome && !cpfCnpj && !codigo) { setError('Informe pelo menos um filtro.'); return; }
    setSearching(true); setError(''); setSuccess('');
    try {
      setSearchResults(await clienteApi.search({ nome: nome || undefined, cpfCnpj: cpfCnpj || undefined, codigo: codigo || undefined }));
    } catch { setError('Erro ao pesquisar clientes.'); setSearchResults([]); }
    finally { setSearching(false); }
  }

  // ── Load cliente ──────────────────────────────────────────────────────────
  async function loadCliente(clientId: number) {
    setPageLoading(true); setError(''); setSuccess('');
    try {
      const [cliente, allOcc, allContratos] = await Promise.all([
        clienteApi.getById(clientId),
        ocorrenciaApi.getAll(),
        contratoApi.getAll(),
      ]);
      const telefones = cliente.telefones ?? [];
      setSelectedClientId(clientId);
      setClientForm(cliente);
      setOccurrences(allOcc.filter(o => o.clienteId === clientId));
      setContratos(allContratos.filter(c => c.clienteId === clientId));
      setContractsCollapsed(false);
      setOccurrencesCollapsed(false);
      const defaultTel = telefones.find(t => t.principal)?.numero ?? telefones[0]?.numero ?? '';
      setOccForm(prev => ({
        ...prev,
        clienteId: clientId,
        diasAtraso: cliente.diasAtraso ?? 0,
        saldoAtual: cliente.saldoAtual ?? 0,
        saldoAtraso: cliente.saldoAtraso ?? 0,
        telefone: defaultTel,
      }));
      setTelMode('select');
      setCustomTel('');
      setSearchCollapsed(true); // minimiza busca após selecionar cliente
    } catch { setError('Erro ao carregar dados do cliente.'); }
    finally { setPageLoading(false); }
  }

  // ── Contact editing (ranking / principal only for existing) ───────────────
  function updatePhoneField(index: number, field: 'ranking' | 'principal', value: string | boolean | number) {
    setClientForm(prev => ({
      ...prev,
      telefones: (prev.telefones ?? []).map((t, i) => i === index ? { ...t, [field]: value } : t),
    }));
  }
  function updateEmailField(index: number, field: 'ranking' | 'principal', value: string | boolean | number) {
    setClientForm(prev => ({
      ...prev,
      emails: (prev.emails ?? []).map((e, i) => i === index ? { ...e, [field]: value } : e),
    }));
  }
  function updateAddressField(index: number, field: 'ranking' | 'principal', value: string | boolean | number) {
    setClientForm(prev => ({
      ...prev,
      enderecos: (prev.enderecos ?? []).map((e, i) => i === index ? { ...e, [field]: value } : e),
    }));
  }

  // Add new contact to local state
  function addPhone() {
    if (!newPhone.numero) return;
    setClientForm(prev => ({ ...prev, telefones: [...(prev.telefones ?? []), { ...newPhone }] }));
    setNewPhone(EMPTY_PHONE);
  }
  function addEmail() {
    if (!newEmail.emailAddress) return;
    setClientForm(prev => ({ ...prev, emails: [...(prev.emails ?? []), { ...newEmail }] }));
    setNewEmail(EMPTY_EMAIL);
  }
  function addAddress() {
    if (!newAddress.logradouro || !newAddress.numero || !newAddress.cidade) return;
    setClientForm(prev => ({ ...prev, enderecos: [...(prev.enderecos ?? []), { ...newAddress }] }));
    setNewAddress(EMPTY_ADDRESS);
  }

  // Save contacts via clienteApi.save (upsert)
  async function handleSaveContacts(e: FormEvent) {
    e.preventDefault();
    if (!selectedClientId) return;
    setSavingContacts(true); setError(''); setSuccess('');
    try {
      const saved = await clienteApi.save(clientForm);
      setClientForm(saved);
      setSuccess('Contatos salvos com sucesso.');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { mensagem?: string } } })?.response?.data?.mensagem ?? 'Erro ao salvar contatos.');
    } finally { setSavingContacts(false); }
  }

  // ── Lançamento de ocorrência ──────────────────────────────────────────────
  async function handleCreateOccurrence(e: FormEvent) {
    e.preventDefault();
    if (!selectedClientId) { setError('Selecione um cliente antes de lançar.'); return; }

    setSavingOcc(true); setError(''); setSuccess('');

    try {
      // Se telefone é custom e foi digitado, adiciona ao cadastro
      let telefoneUsado = occForm.telefone ?? '';
      if (telMode === 'custom' && customTel.trim()) {
        telefoneUsado = customTel.trim();
        const updatedClient = await clienteApi.save({
          ...clientForm,
          telefones: [...existingPhones, { ddd: '', numero: telefoneUsado, tipo: 'Celular', principal: false }],
        });
        setClientForm(updatedClient);
      }

      const now = new Date();
      await ocorrenciaApi.create({
        ...occForm,
        clienteId: selectedClientId,
        usuarioResponsavelId: user?.userId ?? 0,
        dataHoraContato: now.toISOString().slice(0, 16),
        dataAgendada: now.toISOString().slice(0, 10),
        telefone: telefoneUsado,
      });

      // Verifica se motivo tem acao = NOVO → encerra atendimento
      const motivoSelecionado = motivosContato.find(mc => mc.id === occForm.motivoContatoId);
      const acaoNovo = motivoSelecionado?.acao?.toUpperCase() === 'NOVO';

      if (acaoNovo) {
        // Encerra cliente e volta para pesquisa em branco
        setSelectedClientId(null);
        setClientForm({ telefones: [], emails: [], enderecos: [] });
        setContratos([]);
        setOccurrences([]);
        setSearchCollapsed(false);
        setSearchResults([]);
        setBuscaNome('');
        setBuscaCpf('');
        setBuscaCodigo('');
        setOccForm({ clienteId: 0, motivoContatoId: 0, motivoAtrasoId: 0, situacao: 'Pendente', observacao: '', diasAtraso: 0, saldoAtual: 0, saldoAtraso: 0, cpc: '', telefone: '' });
        setTelMode('select');
        setCustomTel('');
        setSuccess('Ocorrência lançada. Cliente encerrado (ação NOVO).');
      } else {
        // Reload ocorrências e prepara novo lançamento
        const allOcc = await ocorrenciaApi.getAll();
        setOccurrences(allOcc.filter(o => o.clienteId === selectedClientId));
        setOccForm(prev => ({ ...prev, motivoContatoId: 0, motivoAtrasoId: 0, observacao: '', cpc: '', telefone: '' }));
        setTelMode('select');
        setCustomTel('');
        setSuccess('Ocorrência lançada com sucesso.');
      }
    } catch (err: unknown) {
      setError((err as { response?: { data?: { mensagem?: string } } })?.response?.data?.mensagem ?? 'Erro ao lançar ocorrência.');
    } finally { setSavingOcc(false); }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Atendimento</h1>
        <p className="mt-1 text-sm text-gray-500">Busque o cliente, registre ocorrências e gerencie contatos.</p>
      </div>

      {/* Feedback */}
      {error   && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div>}

      {/* ── Busca Cliente ──────────────────────────────────────────────────── */}
      {searchCollapsed ? (
        <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-5 py-3 shadow-sm">
          <span className="text-sm text-gray-500">
            Cliente: <strong className="text-gray-900">{clientForm.nome}</strong>
          </span>
          <button type="button" onClick={() => { setSearchCollapsed(false); setSelectedClientId(null); }}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-100">
            Trocar cliente
          </button>
        </div>
      ) : (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-base font-semibold text-gray-900">Buscar cliente</h2>
          <p className="mb-4 text-sm text-gray-500">Pesquise pelo nome, CPF/CNPJ ou código para iniciar o atendimento.</p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <input value={buscaNome} onChange={e => setBuscaNome(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Nome" className={inputCls()} />
            <input value={buscaCpf} onChange={e => setBuscaCpf(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="CPF/CNPJ" className={inputCls()} />
            <input value={buscaCodigo} onChange={e => setBuscaCodigo(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Código interno" className={inputCls()} />
            <button type="button" onClick={handleSearch} disabled={searching}
              className="rounded-xl bg-ftech-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-ftech-700 disabled:opacity-60">
              {searching ? 'Pesquisando...' : 'Pesquisar'}
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="px-3 py-3 font-medium">Cliente</th>
                    <th className="px-3 py-3 font-medium">CPF/CNPJ</th>
                    <th className="px-3 py-3 font-medium">Código</th>
                    <th className="px-3 py-3 font-medium">Situação</th>
                    <th className="px-3 py-3 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {searchResults.map(item => (
                    <tr key={item.id} className={selectedClientId === item.id ? 'bg-ftech-50' : 'hover:bg-gray-50'}>
                      <td className="px-3 py-3 font-medium text-gray-900">{item.nome}</td>
                      <td className="px-3 py-3 text-gray-600">{item.cpfCnpj}</td>
                      <td className="px-3 py-3 text-gray-600">{item.codigo || '-'}</td>
                      <td className="px-3 py-3 text-gray-600">{item.situacao}</td>
                      <td className="px-3 py-3 text-right">
                        <button type="button" onClick={() => loadCliente(item.id)}
                          className="rounded-lg bg-ftech-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-ftech-700">
                          Atender
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {searchResults.length === 0 && !searching && (
            <div className="mt-4 rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-400">
              Faça uma pesquisa para exibir clientes disponíveis.
            </div>
          )}
        </section>
      )}

      {/* ── Área de atendimento ─────────────────────────────────────────────── */}
      {selectedClientId && (
        pageLoading ? (
          <div className="flex items-center justify-center rounded-2xl border border-gray-200 bg-white py-20 text-sm text-gray-400 shadow-sm">
            Carregando dados do atendimento...
          </div>
        ) : (
          <div className="space-y-6">
            {/* Cliente header */}
            <section className="grid grid-cols-1 gap-4 xl:grid-cols-4">
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm xl:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-ftech-700">Cliente em atendimento</p>
                <h2 className="mt-2 text-2xl font-bold text-gray-900">{clientForm.nome}</h2>
                <p className="mt-1 text-sm text-gray-500">{clientForm.cpfCnpj || '-'} • Código {clientForm.codigo || '-'}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">Saldo atual</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">{fmtCurrency(clientForm.saldoAtual)}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">Dias em atraso</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">{clientForm.diasAtraso ?? 0}</p>
              </div>
            </section>

            {/* ── Contratos em Cobrança ────────────────────────────────────────── */}
            <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                <h2 className="text-base font-semibold text-gray-900">
                  Contratos em cobrança
                  <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">{contratos.length}</span>
                </h2>
                <button type="button" onClick={() => setContractsCollapsed(v => !v)}
                  className="rounded-lg px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors flex items-center gap-1">
                  {contractsCollapsed ? (
                    <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>Expandir</>
                  ) : (
                    <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>Minimizar</>
                  )}
                </button>
              </div>
              {!contractsCollapsed && (
                <div className="p-5">
                  {contratos.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-400">
                      Nenhum contrato encontrado para este cliente.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {contratos.map(c => {
                        const emAtraso = parcelasEmAtraso(c);
                        const vlrParcela = valorParcelaMedio(c);
                        return (
                          <div key={c.id} className="rounded-xl border border-gray-200">
                            {/* Contract summary row */}
                            <div className="grid grid-cols-2 gap-x-6 gap-y-1 px-4 py-3 text-sm md:grid-cols-3 lg:grid-cols-6">
                              <div>
                                <p className="text-xs text-gray-500">Contrato</p>
                                <p className="font-semibold text-gray-900">{c.numeroContrato}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Carteira</p>
                                <p className="font-medium text-gray-700">{c.carteira?.nome ?? '-'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Produto</p>
                                <p className="font-medium text-gray-700">{c.produto?.nome ?? '-'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Dias em atraso</p>
                                <p className={`font-semibold ${(c.diasAtraso ?? 0) > 0 ? 'text-red-600' : 'text-gray-700'}`}>
                                  {c.diasAtraso ?? 0}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Parcelas em atraso</p>
                                <p className={`font-semibold ${emAtraso > 0 ? 'text-red-600' : 'text-gray-700'}`}>
                                  {emAtraso}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Vlr. parcela</p>
                                <p className="font-semibold text-gray-900">{fmtCurrency(vlrParcela)}</p>
                              </div>
                            </div>

                            {/* Parcelas toggle */}
                            <div className="border-t border-gray-100 px-4 py-2">
                              <button
                                type="button"
                                onClick={() => toggleParcelas(c.id)}
                                className="flex items-center gap-1.5 text-xs font-medium text-ftech-600 hover:text-ftech-500 transition-colors"
                              >
                                {parcelasLoading.has(c.id) ? (
                                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                  </svg>
                                ) : (
                                  <svg className={`w-3.5 h-3.5 transition-transform ${parcelasOpen.has(c.id) ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                )}
                                {parcelasOpen.has(c.id) ? 'Ocultar parcelas' : 'Ver parcelas'}
                              </button>
                            </div>

                            {/* Parcelas table (lazy) */}
                            {parcelasOpen.has(c.id) && (
                              <div className="border-t border-gray-100 overflow-x-auto">
                                {(parcelasMap.get(c.id) ?? []).length === 0 ? (
                                  <p className="px-4 py-4 text-sm text-gray-400 text-center">
                                    Nenhuma parcela encontrada para este contrato.
                                  </p>
                                ) : (
                                  <table className="w-full text-xs">
                                    <thead className="bg-gray-50 text-gray-500">
                                      <tr>
                                        <th className="px-4 py-2 text-left font-medium">Nº</th>
                                        <th className="px-4 py-2 text-left font-medium">Vencimento</th>
                                        <th className="px-4 py-2 text-right font-medium">Saldo Atual</th>
                                        <th className="px-4 py-2 text-right font-medium">Valor Total</th>
                                        <th className="px-4 py-2 text-center font-medium">Situação</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                      {(parcelasMap.get(c.id) ?? []).map(p => {
                                        const vencida = new Date(p.dataVencimento) < new Date() && p.situacao !== 'Pago';
                                        return (
                                          <tr key={p.id} className={vencida ? 'bg-red-50' : ''}>
                                            <td className="px-4 py-2 text-gray-700 font-medium">{p.numeroParcela}</td>
                                            <td className={`px-4 py-2 ${vencida ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                                              {new Date(p.dataVencimento).toLocaleDateString('pt-BR')}
                                            </td>
                                            <td className={`px-4 py-2 text-right font-semibold ${p.saldoAtual > 0 ? 'text-red-600' : 'text-gray-700'}`}>
                                              {fmtCurrency(p.saldoAtual)}
                                            </td>
                                            <td className="px-4 py-2 text-right text-gray-700">
                                              {fmtCurrency(p.valorTotal)}
                                            </td>
                                            <td className="px-4 py-2 text-center">
                                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                                p.situacao === 'Pago'
                                                  ? 'bg-green-100 text-green-700'
                                                  : p.situacao === 'Aberto'
                                                  ? 'bg-amber-100 text-amber-700'
                                                  : 'bg-gray-100 text-gray-600'
                                              }`}>
                                                {p.situacao}
                                              </span>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* ── Ocorrências existentes ──────────────────────────────────────── */}
            <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                <h2 className="text-base font-semibold text-gray-900">
                  Ocorrências registradas
                  <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">{sortedOccurrences.length}</span>
                </h2>
                <button type="button" onClick={() => setOccurrencesCollapsed(v => !v)}
                  className="rounded-lg px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors flex items-center gap-1">
                  {occurrencesCollapsed ? (
                    <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>Expandir</>
                  ) : (
                    <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>Minimizar</>
                  )}
                </button>
              </div>
              {!occurrencesCollapsed && <div className="p-5">
                {sortedOccurrences.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-400">
                    Nenhuma ocorrência registrada para este cliente.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 text-left text-gray-500">
                          <th className="px-3 py-2 font-medium">Data/Hora</th>
                          <th className="px-3 py-2 font-medium">Motivo Contato</th>
                          <th className="px-3 py-2 font-medium">Motivo Atraso</th>
                          <th className="px-3 py-2 font-medium">Telefone</th>
                          <th className="px-3 py-2 font-medium">Situação</th>
                          <th className="px-3 py-2 font-medium">Responsável</th>
                          <th className="px-3 py-2 font-medium max-w-xs">Observação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {sortedOccurrences.map(occ => (
                          <tr key={occ.id} className="hover:bg-gray-50">
                            <td className="px-3 py-3 text-gray-700 whitespace-nowrap">{fmtDateTime(occ.dataHoraContato)}</td>
                            <td className="px-3 py-3 text-gray-700">{occ.motivoContato?.descricao ?? '-'}</td>
                            <td className="px-3 py-3 text-gray-700">{occ.motivoAtraso?.descricao ?? '-'}</td>
                            <td className="px-3 py-3 text-gray-600">{occ.telefone || '-'}</td>
                            <td className="px-3 py-3">
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                occ.situacao === 'Concluída' ? 'bg-green-100 text-green-800' :
                                occ.situacao === 'Pendente'  ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'
                              }`}>{occ.situacao}</span>
                            </td>
                            <td className="px-3 py-3 text-gray-700">{occ.usuarioResponsavel?.nome ?? '-'}</td>
                            <td className="max-w-xs px-3 py-3 text-gray-500 truncate">{occ.observacao || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>}
            </section>

            {/* ── Novo lançamento ─────────────────────────────────────────────── */}
            <section className="rounded-2xl border border-ftech-200 bg-white shadow-sm">
              <div className="border-b border-ftech-100 bg-ftech-50 px-5 py-4 rounded-t-2xl">
                <h2 className="text-base font-semibold text-ftech-900">Novo lançamento de ocorrência</h2>
              </div>
              <form onSubmit={handleCreateOccurrence} className="p-5 space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Motivo Contato */}
                  <div>
                    <SLabel req>Motivo de Contato</SLabel>
                    <select value={occForm.motivoContatoId || ''} onChange={e => setOccForm(prev => ({ ...prev, motivoContatoId: parseInt(e.target.value) || 0 }))}
                      required className={inputCls('bg-white')}>
                      <option value="">Selecione...</option>
                      {motivosContato.map(mc => (
                        <option key={mc.id} value={mc.id}>{mc.descricao}</option>
                      ))}
                    </select>
                  </div>

                  {/* Motivo Atraso */}
                  <div>
                    <SLabel req>Motivo de Atraso</SLabel>
                    <select value={occForm.motivoAtrasoId || ''} onChange={e => setOccForm(prev => ({ ...prev, motivoAtrasoId: parseInt(e.target.value) || 0 }))}
                      required className={inputCls('bg-white')}>
                      <option value="">Selecione...</option>
                      {motivosAtraso.map(ma => (
                        <option key={ma.id} value={ma.id}>{ma.descricao}</option>
                      ))}
                    </select>
                  </div>

                  {/* Telefone */}
                  <div>
                    <SLabel>Telefone</SLabel>
                    <div className="space-y-2">
                      <select value={telMode === 'select' ? (occForm.telefone ?? '') : '__custom__'}
                        onChange={e => {
                          if (e.target.value === '__custom__') {
                            setTelMode('custom');
                            setOccForm(prev => ({ ...prev, telefone: '' }));
                          } else {
                            setTelMode('select');
                            setOccForm(prev => ({ ...prev, telefone: e.target.value }));
                          }
                        }}
                        className={inputCls('bg-white')}>
                        <option value="">Nenhum</option>
                        {existingPhones.map((t, i) => (
                          <option key={i} value={t.numero}>
                            {t.ddd ? `(${t.ddd}) ` : ''}{t.numero}{t.tipo ? ` — ${t.tipo}` : ''}{t.principal ? ' ★' : ''}
                            {t.ranking != null ? ` [rank ${t.ranking}]` : ''}
                          </option>
                        ))}
                        <option value="__custom__">Digitar outro número...</option>
                      </select>
                      {telMode === 'custom' && (
                        <input value={customTel} onChange={e => setCustomTel(e.target.value)}
                          placeholder="Digite o número (será incluído no cadastro)"
                          className={inputCls()} />
                      )}
                    </div>
                  </div>
                </div>

                {/* Observação */}
                <div>
                  <SLabel>Observação</SLabel>
                  <textarea value={occForm.observacao} onChange={e => setOccForm(prev => ({ ...prev, observacao: e.target.value }))}
                    rows={4} placeholder="Descreva o atendimento..."
                    className={inputCls('resize-none')} />
                </div>

                <div className="flex justify-end">
                  <button type="submit" disabled={savingOcc}
                    className="rounded-xl bg-ftech-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-ftech-700 disabled:opacity-60 flex items-center gap-2">
                    {savingOcc && (
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    )}
                    {savingOcc ? 'Gravando...' : 'Lançar ocorrência'}
                  </button>
                </div>
              </form>
            </section>

            {/* ── Contatos com abas ───────────────────────────────────────────── */}
            <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-5 pt-4">
                <h2 className="mb-3 text-base font-semibold text-gray-900">Contatos</h2>
                <nav className="flex gap-1">
                  {(['telefone', 'email', 'endereco'] as ContactTab[]).map(tab => (
                    <button key={tab} type="button" onClick={() => setContactTab(tab)}
                      className={`rounded-t-lg px-4 py-2 text-sm font-medium transition ${contactTab === tab ? 'bg-ftech-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                      {tab === 'telefone' ? 'Telefones' : tab === 'email' ? 'E-mails' : 'Endereços'}
                    </button>
                  ))}
                </nav>
              </div>

              <form onSubmit={handleSaveContacts} className="p-5">

                {/* ── Tab: Telefones ──────────────────────────────────── */}
                {contactTab === 'telefone' && (
                  <div className="space-y-4">
                    {/* Existing */}
                    {(clientForm.telefones ?? []).length === 0 ? (
                      <p className="text-sm text-gray-400">Nenhum telefone cadastrado.</p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100 text-left text-gray-500">
                            <th className="px-3 py-2 font-medium">Telefone</th>
                            <th className="px-3 py-2 font-medium">Tipo</th>
                            <th className="px-3 py-2 font-medium text-center">Ranking</th>
                            <th className="px-3 py-2 font-medium w-24 text-center">Principal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {(clientForm.telefones ?? []).map((t, i) => (
                            <tr key={i} className="hover:bg-gray-50">
                              <td className="px-3 py-2.5 font-medium text-gray-900">
                                {t.ddd ? `(${t.ddd}) ` : ''}{t.numero}
                                {t.ramal ? ` r. ${t.ramal}` : ''}
                              </td>
                              <td className="px-3 py-2.5 text-gray-600">{t.tipo}</td>
                              <td className="px-3 py-2.5">
                                <div className="flex justify-center">
                                  <StarRating value={t.ranking} onChange={v => updatePhoneField(i, 'ranking', v)} />
                                </div>
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                <input type="checkbox" checked={t.principal}
                                  onChange={e => updatePhoneField(i, 'principal', e.target.checked)}
                                  className="h-4 w-4 rounded border-gray-300 text-ftech-600 focus:ring-ftech-500" />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {/* Add new */}
                    <div className="rounded-xl border border-dashed border-gray-200 p-4">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Adicionar telefone</p>
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        <div>
                          <SLabel>DDD</SLabel>
                          <input value={newPhone.ddd} onChange={e => setNewPhone(p => ({ ...p, ddd: e.target.value }))}
                            placeholder="11" className={inputCls()} />
                        </div>
                        <div>
                          <SLabel req>Número</SLabel>
                          <input value={newPhone.numero} onChange={e => setNewPhone(p => ({ ...p, numero: e.target.value }))}
                            placeholder="999999999" className={inputCls()} />
                        </div>
                        <div>
                          <SLabel>Tipo</SLabel>
                          <select value={newPhone.tipo} onChange={e => setNewPhone(p => ({ ...p, tipo: e.target.value }))}
                            className={inputCls('bg-white')}>
                            <option>Celular</option><option>Fixo</option><option>Comercial</option><option>Recado</option>
                          </select>
                        </div>
                        <div className="flex flex-col justify-end gap-2">
                          <label className="flex items-center gap-2 text-sm text-gray-600">
                            <input type="checkbox" checked={newPhone.principal} onChange={e => setNewPhone(p => ({ ...p, principal: e.target.checked }))}
                              className="h-4 w-4 rounded border-gray-300 text-ftech-600" />
                            Principal
                          </label>
                          <button type="button" onClick={addPhone}
                            className="rounded-lg border border-ftech-200 bg-ftech-50 px-3 py-1.5 text-xs font-semibold text-ftech-700 transition hover:bg-ftech-100">
                            + Adicionar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Tab: E-mails ────────────────────────────────────── */}
                {contactTab === 'email' && (
                  <div className="space-y-4">
                    {(clientForm.emails ?? []).length === 0 ? (
                      <p className="text-sm text-gray-400">Nenhum e-mail cadastrado.</p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100 text-left text-gray-500">
                            <th className="px-3 py-2 font-medium">E-mail</th>
                            <th className="px-3 py-2 font-medium text-center">Ranking</th>
                            <th className="px-3 py-2 font-medium w-24 text-center">Principal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {(clientForm.emails ?? []).map((em, i) => (
                            <tr key={i} className="hover:bg-gray-50">
                              <td className="px-3 py-2.5 font-medium text-gray-900">{em.emailAddress}</td>
                              <td className="px-3 py-2.5">
                                <div className="flex justify-center">
                                  <StarRating value={em.ranking} onChange={v => updateEmailField(i, 'ranking', v)} />
                                </div>
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                <input type="checkbox" checked={em.principal}
                                  onChange={e => updateEmailField(i, 'principal', e.target.checked)}
                                  className="h-4 w-4 rounded border-gray-300 text-ftech-600 focus:ring-ftech-500" />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    <div className="rounded-xl border border-dashed border-gray-200 p-4">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Adicionar e-mail</p>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div className="md:col-span-2">
                          <SLabel req>Endereço de e-mail</SLabel>
                          <input type="email" value={newEmail.emailAddress}
                            onChange={e => setNewEmail(p => ({ ...p, emailAddress: e.target.value }))}
                            placeholder="nome@exemplo.com" className={inputCls()} />
                        </div>
                        <div className="flex flex-col justify-end gap-2">
                          <label className="flex items-center gap-2 text-sm text-gray-600">
                            <input type="checkbox" checked={newEmail.principal}
                              onChange={e => setNewEmail(p => ({ ...p, principal: e.target.checked }))}
                              className="h-4 w-4 rounded border-gray-300 text-ftech-600" />
                            Principal
                          </label>
                          <button type="button" onClick={addEmail}
                            className="rounded-lg border border-ftech-200 bg-ftech-50 px-3 py-1.5 text-xs font-semibold text-ftech-700 transition hover:bg-ftech-100">
                            + Adicionar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Tab: Endereços ──────────────────────────────────── */}
                {contactTab === 'endereco' && (
                  <div className="space-y-4">
                    {(clientForm.enderecos ?? []).length === 0 ? (
                      <p className="text-sm text-gray-400">Nenhum endereço cadastrado.</p>
                    ) : (
                      <div className="space-y-2">
                        {(clientForm.enderecos ?? []).map((end, i) => (
                          <div key={i} className="rounded-xl border border-gray-200 px-4 py-3">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 text-sm">
                                  {end.tipoLogradouro ? `${end.tipoLogradouro} ` : ''}{end.logradouro}, {end.numero}
                                  {end.complemento ? ` — ${end.complemento}` : ''}
                                </p>
                                <p className="text-xs text-gray-500">{end.bairro} • {end.cidade}/{end.uf} • CEP {end.cep}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{end.tipo}</p>
                              </div>
                              <div className="flex items-center gap-4 shrink-0">
                                <div className="text-center">
                                  <p className="text-xs text-gray-500 mb-1">Ranking</p>
                                  <StarRating value={end.ranking} onChange={v => updateAddressField(i, 'ranking', v)} />
                                </div>
                                <label className="flex flex-col items-center gap-1 text-xs text-gray-500 cursor-pointer">
                                  Principal
                                  <input type="checkbox" checked={end.principal}
                                    onChange={e => updateAddressField(i, 'principal', e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-ftech-600 focus:ring-ftech-500" />
                                </label>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="rounded-xl border border-dashed border-gray-200 p-4">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Adicionar endereço</p>
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                        <div><SLabel>CEP</SLabel><input value={newAddress.cep} onChange={e => setNewAddress(p => ({ ...p, cep: e.target.value }))} placeholder="00000-000" className={inputCls()} /></div>
                        <div><SLabel req>Logradouro</SLabel><input value={newAddress.logradouro} onChange={e => setNewAddress(p => ({ ...p, logradouro: e.target.value }))} className={inputCls()} /></div>
                        <div><SLabel req>Número</SLabel><input value={newAddress.numero} onChange={e => setNewAddress(p => ({ ...p, numero: e.target.value }))} className={inputCls()} /></div>
                        <div><SLabel>Complemento</SLabel><input value={newAddress.complemento ?? ''} onChange={e => setNewAddress(p => ({ ...p, complemento: e.target.value }))} className={inputCls()} /></div>
                        <div><SLabel>Bairro</SLabel><input value={newAddress.bairro} onChange={e => setNewAddress(p => ({ ...p, bairro: e.target.value }))} className={inputCls()} /></div>
                        <div><SLabel req>Cidade</SLabel><input value={newAddress.cidade} onChange={e => setNewAddress(p => ({ ...p, cidade: e.target.value }))} className={inputCls()} /></div>
                        <div>
                          <SLabel>UF</SLabel>
                          <select value={newAddress.uf} onChange={e => setNewAddress(p => ({ ...p, uf: e.target.value }))} className={inputCls('bg-white')}>
                            {UF_LIST.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                          </select>
                        </div>
                        <div>
                          <SLabel>Tipo</SLabel>
                          <select value={newAddress.tipo} onChange={e => setNewAddress(p => ({ ...p, tipo: e.target.value }))} className={inputCls('bg-white')}>
                            <option>Residencial</option><option>Comercial</option><option>Cobrança</option><option>Outros</option>
                          </select>
                        </div>
                        <div className="flex flex-col justify-end gap-2">
                          <label className="flex items-center gap-2 text-sm text-gray-600">
                            <input type="checkbox" checked={newAddress.principal} onChange={e => setNewAddress(p => ({ ...p, principal: e.target.checked }))}
                              className="h-4 w-4 rounded border-gray-300 text-ftech-600" />
                            Principal
                          </label>
                          <button type="button" onClick={addAddress}
                            className="rounded-lg border border-ftech-200 bg-ftech-50 px-3 py-1.5 text-xs font-semibold text-ftech-700 transition hover:bg-ftech-100">
                            + Adicionar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Save contacts button */}
                <div className="mt-5 flex justify-end border-t border-gray-100 pt-4">
                  <button type="submit" disabled={savingContacts}
                    className="rounded-xl bg-ftech-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ftech-700 disabled:opacity-60">
                    {savingContacts ? 'Salvando...' : 'Salvar contatos'}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )
      )}
    </div>
  );
}
