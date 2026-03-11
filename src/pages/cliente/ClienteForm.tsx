import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { clienteApi } from '../../api/cliente';
import type { Cliente } from '../../types';

const UF_LIST = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

const EMPTY_FORM: Partial<Cliente> = {
  tipoPessoa: 'F',
  situacao: 'Ativo',
  nome: '',
  cpfCnpj: '',
  codigo: '',
  sexo: '',
  dataNascimento: '',
  dataConta: '',
  naturalidade: '',
  estadoCivil: '',
  rg: '',
  profissao: '',
  tipoResidencia: '',
  saldoAtraso: 0,
  saldoAtual: 0,
  saldoTotal: 0,
  saldoVencido: 0,
  saldoContabil: 0,
  diasAtraso: 0,
  emails: [],
  enderecos: [],
  telefones: [],
};

type TabKey = 'dados' | 'telefones' | 'enderecos' | 'emails';

const EMPTY_TEL = { ddd: '', numero: '', tipo: 'Celular', principal: false };
const EMPTY_END = { cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: 'SP', tipo: 'Residencial', tipoLogradouro: '', principal: false };
const EMPTY_EMAIL = { emailAddress: '', principal: false };

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ftech-500 ${props.className ?? ''}`}
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ftech-500 bg-white ${props.className ?? ''}`}
    />
  );
}

export default function ClienteForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id && id !== 'novo');

  const [form, setForm] = useState<Partial<Cliente>>(EMPTY_FORM);
  const [activeTab, setActiveTab] = useState<TabKey>('dados');
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Estado do mini-formulário de novo telefone
  const [newTel, setNewTel] = useState({ ddd: '', numero: '', tipo: 'Celular', principal: false });
  const [showTelForm, setShowTelForm] = useState(false);
  const [editingTelIndex, setEditingTelIndex] = useState<number | null>(null);

  // Estado do mini-formulário de novo endereço
  const [newEnd, setNewEnd] = useState({ cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: 'SP', tipo: 'Residencial', tipoLogradouro: '', principal: false });
  const [showEndForm, setShowEndForm] = useState(false);
  const [editingEndIndex, setEditingEndIndex] = useState<number | null>(null);

  // Estado do mini-formulário de novo e-mail
  const [newEmail, setNewEmail] = useState({ emailAddress: '', principal: false });
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [editingEmailIndex, setEditingEmailIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      setLoading(true);
      try {
        const data = await clienteApi.getById(Number(id));
        setForm({ ...EMPTY_FORM, ...data });
      } catch {
        setError('Erro ao carregar os dados do cliente.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isEdit]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  // ─── Telefones ───────────────────────────────────────────
  function saveTelefone() {
    if (!newTel.numero) return;
    if (editingTelIndex !== null) {
      setForm(prev => ({
        ...prev,
        telefones: (prev.telefones ?? []).map((tel, i) =>
          i === editingTelIndex ? { ...tel, ...newTel } : tel
        ),
      }));
    } else {
      setForm(prev => ({
        ...prev,
        telefones: [...(prev.telefones ?? []), { ...newTel, ramal: '' }],
      }));
    }
    setNewTel(EMPTY_TEL);
    setEditingTelIndex(null);
    setShowTelForm(false);
  }

  function editTelefone(index: number) {
    const tel = form.telefones?.[index];
    if (!tel) return;
    setNewTel({
      ddd: tel.ddd ?? '',
      numero: tel.numero ?? '',
      tipo: tel.tipo ?? 'Celular',
      principal: Boolean(tel.principal),
    });
    setEditingTelIndex(index);
    setShowTelForm(true);
  }

  function removeTelefone(index: number) {
    setForm(prev => ({
      ...prev,
      telefones: (prev.telefones ?? []).filter((_, i) => i !== index),
    }));
  }

  // ─── Endereços ────────────────────────────────────────────
  function saveEndereco() {
    if (!newEnd.cep || !newEnd.logradouro || !newEnd.numero || !newEnd.bairro || !newEnd.cidade || !newEnd.uf) return;
    if (editingEndIndex !== null) {
      setForm(prev => ({
        ...prev,
        enderecos: (prev.enderecos ?? []).map((end, i) =>
          i === editingEndIndex ? { ...end, ...newEnd } : end
        ),
      }));
    } else {
      setForm(prev => ({
        ...prev,
        enderecos: [...(prev.enderecos ?? []), { ...newEnd }],
      }));
    }
    setNewEnd(EMPTY_END);
    setEditingEndIndex(null);
    setShowEndForm(false);
  }

  function editEndereco(index: number) {
    const end = form.enderecos?.[index];
    if (!end) return;
    setNewEnd({
      cep: end.cep ?? '',
      logradouro: end.logradouro ?? '',
      numero: end.numero ?? '',
      complemento: end.complemento ?? '',
      bairro: end.bairro ?? '',
      cidade: end.cidade ?? '',
      uf: end.uf ?? 'SP',
      tipo: end.tipo ?? 'Residencial',
      tipoLogradouro: end.tipoLogradouro ?? '',
      principal: Boolean(end.principal),
    });
    setEditingEndIndex(index);
    setShowEndForm(true);
  }

  function removeEndereco(index: number) {
    setForm(prev => ({
      ...prev,
      enderecos: (prev.enderecos ?? []).filter((_, i) => i !== index),
    }));
  }

  // ─── E-mails ──────────────────────────────────────────────
  function saveEmail() {
    if (!newEmail.emailAddress) return;
    if (editingEmailIndex !== null) {
      setForm(prev => ({
        ...prev,
        emails: (prev.emails ?? []).map((email, i) =>
          i === editingEmailIndex ? { ...email, ...newEmail } : email
        ),
      }));
    } else {
      setForm(prev => ({
        ...prev,
        emails: [...(prev.emails ?? []), { ...newEmail }],
      }));
    }
    setNewEmail(EMPTY_EMAIL);
    setEditingEmailIndex(null);
    setShowEmailForm(false);
  }

  function editEmail(index: number) {
    const email = form.emails?.[index];
    if (!email) return;
    setNewEmail({
      emailAddress: email.emailAddress ?? '',
      principal: Boolean(email.principal),
    });
    setEditingEmailIndex(index);
    setShowEmailForm(true);
  }

  function removeEmail(index: number) {
    setForm(prev => ({
      ...prev,
      emails: (prev.emails ?? []).filter((_, i) => i !== index),
    }));
  }

  // ─── Submit ───────────────────────────────────────────────
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await clienteApi.save(form);
      navigate('/cliente');
    } catch (err: unknown) {
      setError((err as any)?.response?.data?.mensagem ?? 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'dados', label: 'Dados Principais' },
    { key: 'telefones', label: `Telefones (${form.telefones?.length ?? 0})` },
    { key: 'enderecos', label: `Endereços (${form.enderecos?.length ?? 0})` },
    { key: 'emails', label: `E-mails (${form.emails?.length ?? 0})` },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500 text-sm">
        Carregando...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 max-w-5xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/cliente')}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Voltar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Editar Cliente' : 'Novo Cliente'}
          </h1>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 bg-ftech-600 hover:bg-ftech-700 disabled:opacity-50 text-white font-medium px-5 py-2 rounded-lg transition-colors"
        >
          {saving ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Salvando...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Salvar
            </>
          )}
        </button>
      </div>

      {/* Mensagem de erro */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Abas */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-1">
          {tabs.map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab.key
                  ? 'border-ftech-600 text-ftech-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ═══════════════════════════════════════════════
          ABA 1 - DADOS PRINCIPAIS
      ═══════════════════════════════════════════════ */}
      {activeTab === 'dados' && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="grid grid-cols-2 gap-4">

            {/* Tipo Pessoa */}
            <div>
              <FieldLabel>Tipo Pessoa</FieldLabel>
              <Select name="tipoPessoa" value={form.tipoPessoa ?? 'F'} onChange={handleChange}>
                <option value="F">Física</option>
                <option value="J">Jurídica</option>
              </Select>
            </div>

            {/* Situação */}
            <div>
              <FieldLabel>Situação</FieldLabel>
              <Select name="situacao" value={form.situacao ?? 'Ativo'} onChange={handleChange}>
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
                <option value="Bloqueado">Bloqueado</option>
              </Select>
            </div>

            {/* Nome */}
            <div className="col-span-2">
              <FieldLabel required>Nome</FieldLabel>
              <Input name="nome" value={form.nome ?? ''} onChange={handleChange} required placeholder="Nome completo" />
            </div>

            {/* CPF/CNPJ */}
            <div>
              <FieldLabel required>CPF/CNPJ</FieldLabel>
              <Input name="cpfCnpj" value={form.cpfCnpj ?? ''} onChange={handleChange} required placeholder="000.000.000-00" />
            </div>

            {/* Código */}
            <div>
              <FieldLabel>Código</FieldLabel>
              <Input name="codigo" value={form.codigo ?? ''} onChange={handleChange} placeholder="Código interno" />
            </div>

            {/* Sexo */}
            <div>
              <FieldLabel>Sexo</FieldLabel>
              <Select name="sexo" value={form.sexo ?? ''} onChange={handleChange}>
                <option value="">Selecione</option>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
                <option value="N">Não informado</option>
              </Select>
            </div>

            {/* Data Nascimento */}
            <div>
              <FieldLabel>Data de Nascimento</FieldLabel>
              <Input type="date" name="dataNascimento" value={form.dataNascimento ?? ''} onChange={handleChange} />
            </div>

            {/* Data Conta */}
            <div>
              <FieldLabel>Data da Conta</FieldLabel>
              <Input type="date" name="dataConta" value={form.dataConta ?? ''} onChange={handleChange} />
            </div>

            {/* Estado Civil */}
            <div>
              <FieldLabel>Estado Civil</FieldLabel>
              <Select name="estadoCivil" value={form.estadoCivil ?? ''} onChange={handleChange}>
                <option value="">Selecione</option>
                <option value="Solteiro">Solteiro</option>
                <option value="Casado">Casado</option>
                <option value="Divorciado">Divorciado</option>
                <option value="Viúvo">Viúvo</option>
                <option value="Outros">Outros</option>
              </Select>
            </div>

            {/* RG */}
            <div>
              <FieldLabel>RG</FieldLabel>
              <Input name="rg" value={form.rg ?? ''} onChange={handleChange} placeholder="RG" />
            </div>

            {/* Naturalidade */}
            <div>
              <FieldLabel>Naturalidade</FieldLabel>
              <Input name="naturalidade" value={form.naturalidade ?? ''} onChange={handleChange} placeholder="Cidade de nascimento" />
            </div>

            {/* Profissão */}
            <div>
              <FieldLabel>Profissão</FieldLabel>
              <Input name="profissao" value={form.profissao ?? ''} onChange={handleChange} placeholder="Profissão" />
            </div>

            {/* Tipo Residência */}
            <div>
              <FieldLabel>Tipo de Residência</FieldLabel>
              <Select name="tipoResidencia" value={form.tipoResidencia ?? ''} onChange={handleChange}>
                <option value="">Selecione</option>
                <option value="Própria">Própria</option>
                <option value="Alugada">Alugada</option>
                <option value="Financiada">Financiada</option>
                <option value="Outros">Outros</option>
              </Select>
            </div>

          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════
          ABA 2 - TELEFONES
      ═══════════════════════════════════════════════ */}
      {activeTab === 'telefones' && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 space-y-4">
          <h2 className="text-base font-semibold text-gray-800">Telefones</h2>

          {/* Lista de telefones */}
          {(form.telefones ?? []).length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">Nenhum telefone cadastrado.</p>
          ) : (
            <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
              {(form.telefones ?? []).map((tel, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <span className="font-medium text-gray-900 text-sm">
                      {tel.ddd ? `(${tel.ddd}) ` : ''}{tel.numero}
                    </span>
                    <span className="text-xs text-gray-500">{tel.tipo}</span>
                    {tel.principal && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-ftech-100 text-ftech-800">
                        Principal
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => editTelefone(i)}
                      className="text-ftech-600 hover:text-ftech-800 text-xs font-medium px-2 py-1 rounded hover:bg-ftech-50 transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => removeTelefone(i)}
                      className="text-red-500 hover:text-red-700 text-xs font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Mini-formulário de novo telefone */}
          {showTelForm ? (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-3">
              <h3 className="text-sm font-medium text-gray-700">
                {editingTelIndex !== null ? 'Editar Telefone' : 'Novo Telefone'}
              </h3>
              <div className="flex flex-wrap gap-3 items-end">
                <div>
                  <FieldLabel>DDD</FieldLabel>
                  <Input
                    className="w-16"
                    maxLength={2}
                    placeholder="11"
                    value={newTel.ddd}
                    onChange={e => setNewTel(prev => ({ ...prev, ddd: e.target.value }))}
                  />
                </div>
                <div className="flex-1 min-w-36">
                  <FieldLabel required>Número</FieldLabel>
                  <Input
                    placeholder="99999-9999"
                    value={newTel.numero}
                    onChange={e => setNewTel(prev => ({ ...prev, numero: e.target.value }))}
                  />
                </div>
                <div>
                  <FieldLabel>Tipo</FieldLabel>
                  <Select
                    value={newTel.tipo}
                    onChange={e => setNewTel(prev => ({ ...prev, tipo: e.target.value }))}
                  >
                    <option value="Celular">Celular</option>
                    <option value="Fixo">Fixo</option>
                    <option value="Comercial">Comercial</option>
                    <option value="Recado">Recado</option>
                  </Select>
                </div>
                <div className="flex items-center gap-2 pb-2">
                  <input
                    type="checkbox"
                    id="tel-principal"
                    checked={newTel.principal}
                    onChange={e => setNewTel(prev => ({ ...prev, principal: e.target.checked }))}
                    className="w-4 h-4 text-ftech-600 rounded border-gray-300 focus:ring-ftech-500"
                  />
                  <label htmlFor="tel-principal" className="text-sm text-gray-700">Principal</label>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={saveTelefone}
                  className="bg-ftech-600 hover:bg-ftech-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  {editingTelIndex !== null ? 'Salvar alterações' : 'Adicionar'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowTelForm(false);
                    setNewTel(EMPTY_TEL);
                    setEditingTelIndex(null);
                  }}
                  className="text-gray-600 hover:text-gray-800 text-sm font-medium px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowTelForm(true)}
              className="inline-flex items-center gap-2 text-ftech-600 hover:text-ftech-800 text-sm font-medium px-3 py-2 rounded-lg hover:bg-ftech-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Adicionar Telefone
            </button>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════
          ABA 3 - ENDEREÇOS
      ═══════════════════════════════════════════════ */}
      {activeTab === 'enderecos' && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 space-y-4">
          <h2 className="text-base font-semibold text-gray-800">Endereços</h2>

          {/* Lista de endereços */}
          {(form.enderecos ?? []).length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">Nenhum endereço cadastrado.</p>
          ) : (
            <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
              {(form.enderecos ?? []).map((end, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-gray-900 text-sm">
                      {end.logradouro}, {end.numero}{end.complemento ? ` - ${end.complemento}` : ''}
                    </span>
                    <span className="text-xs text-gray-500">
                      {end.bairro} - {end.cidade}/{end.uf} &bull; CEP: {end.cep}
                      {end.tipo ? ` &bull; ${end.tipo}` : ''}
                    </span>
                    {end.principal && (
                      <span className="inline-flex items-center self-start px-2 py-0.5 rounded-full text-xs font-medium bg-ftech-100 text-ftech-800">
                        Principal
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => editEndereco(i)}
                      className="text-ftech-600 hover:text-ftech-800 text-xs font-medium px-2 py-1 rounded hover:bg-ftech-50 transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => removeEndereco(i)}
                      className="text-red-500 hover:text-red-700 text-xs font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Mini-formulário de novo endereço */}
          {showEndForm ? (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-3">
              <h3 className="text-sm font-medium text-gray-700">
                {editingEndIndex !== null ? 'Editar Endereço' : 'Novo Endereço'}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel required>CEP</FieldLabel>
                  <Input
                    placeholder="00000-000"
                    value={newEnd.cep}
                    onChange={e => setNewEnd(prev => ({ ...prev, cep: e.target.value }))}
                  />
                </div>
                <div>
                  <FieldLabel>Tipo</FieldLabel>
                  <Select
                    value={newEnd.tipo}
                    onChange={e => setNewEnd(prev => ({ ...prev, tipo: e.target.value }))}
                  >
                    <option value="Residencial">Residencial</option>
                    <option value="Comercial">Comercial</option>
                    <option value="Correspondência">Correspondência</option>
                    <option value="Outros">Outros</option>
                  </Select>
                </div>
                <div className="col-span-2">
                  <FieldLabel required>Logradouro</FieldLabel>
                  <Input
                    placeholder="Rua, Avenida, etc."
                    value={newEnd.logradouro}
                    onChange={e => setNewEnd(prev => ({ ...prev, logradouro: e.target.value }))}
                  />
                </div>
                <div>
                  <FieldLabel required>Número</FieldLabel>
                  <Input
                    placeholder="Nº"
                    value={newEnd.numero}
                    onChange={e => setNewEnd(prev => ({ ...prev, numero: e.target.value }))}
                  />
                </div>
                <div>
                  <FieldLabel>Complemento</FieldLabel>
                  <Input
                    placeholder="Apto, Bloco, etc."
                    value={newEnd.complemento}
                    onChange={e => setNewEnd(prev => ({ ...prev, complemento: e.target.value }))}
                  />
                </div>
                <div>
                  <FieldLabel required>Bairro</FieldLabel>
                  <Input
                    placeholder="Bairro"
                    value={newEnd.bairro}
                    onChange={e => setNewEnd(prev => ({ ...prev, bairro: e.target.value }))}
                  />
                </div>
                <div>
                  <FieldLabel required>Cidade</FieldLabel>
                  <Input
                    placeholder="Cidade"
                    value={newEnd.cidade}
                    onChange={e => setNewEnd(prev => ({ ...prev, cidade: e.target.value }))}
                  />
                </div>
                <div>
                  <FieldLabel required>UF</FieldLabel>
                  <Select
                    value={newEnd.uf}
                    onChange={e => setNewEnd(prev => ({ ...prev, uf: e.target.value }))}
                  >
                    {UF_LIST.map(uf => (
                      <option key={uf} value={uf}>{uf}</option>
                    ))}
                  </Select>
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="end-principal"
                    checked={newEnd.principal}
                    onChange={e => setNewEnd(prev => ({ ...prev, principal: e.target.checked }))}
                    className="w-4 h-4 text-ftech-600 rounded border-gray-300 focus:ring-ftech-500"
                  />
                  <label htmlFor="end-principal" className="text-sm text-gray-700">Principal</label>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={saveEndereco}
                  className="bg-ftech-600 hover:bg-ftech-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  {editingEndIndex !== null ? 'Salvar alterações' : 'Adicionar'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEndForm(false);
                    setNewEnd(EMPTY_END);
                    setEditingEndIndex(null);
                  }}
                  className="text-gray-600 hover:text-gray-800 text-sm font-medium px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowEndForm(true)}
              className="inline-flex items-center gap-2 text-ftech-600 hover:text-ftech-800 text-sm font-medium px-3 py-2 rounded-lg hover:bg-ftech-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Adicionar Endereço
            </button>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════
          ABA 4 - E-MAILS
      ═══════════════════════════════════════════════ */}
      {activeTab === 'emails' && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 space-y-4">
          <h2 className="text-base font-semibold text-gray-800">E-mails</h2>

          {/* Lista de e-mails */}
          {(form.emails ?? []).length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">Nenhum e-mail cadastrado.</p>
          ) : (
            <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
              {(form.emails ?? []).map((em, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <span className="font-medium text-gray-900 text-sm">{em.emailAddress}</span>
                    {em.principal && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-ftech-100 text-ftech-800">
                        Principal
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => editEmail(i)}
                      className="text-ftech-600 hover:text-ftech-800 text-xs font-medium px-2 py-1 rounded hover:bg-ftech-50 transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => removeEmail(i)}
                      className="text-red-500 hover:text-red-700 text-xs font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Mini-formulário de novo e-mail */}
          {showEmailForm ? (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-3">
              <h3 className="text-sm font-medium text-gray-700">
                {editingEmailIndex !== null ? 'Editar E-mail' : 'Novo E-mail'}
              </h3>
              <div className="flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-64">
                  <FieldLabel required>E-mail</FieldLabel>
                  <Input
                    type="email"
                    placeholder="exemplo@email.com"
                    value={newEmail.emailAddress}
                    onChange={e => setNewEmail(prev => ({ ...prev, emailAddress: e.target.value }))}
                  />
                </div>
                <div className="flex items-center gap-2 pb-2">
                  <input
                    type="checkbox"
                    id="email-principal"
                    checked={newEmail.principal}
                    onChange={e => setNewEmail(prev => ({ ...prev, principal: e.target.checked }))}
                    className="w-4 h-4 text-ftech-600 rounded border-gray-300 focus:ring-ftech-500"
                  />
                  <label htmlFor="email-principal" className="text-sm text-gray-700">Principal</label>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={saveEmail}
                  className="bg-ftech-600 hover:bg-ftech-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  {editingEmailIndex !== null ? 'Salvar alterações' : 'Adicionar'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEmailForm(false);
                    setNewEmail(EMPTY_EMAIL);
                    setEditingEmailIndex(null);
                  }}
                  className="text-gray-600 hover:text-gray-800 text-sm font-medium px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowEmailForm(true)}
              className="inline-flex items-center gap-2 text-ftech-600 hover:text-ftech-800 text-sm font-medium px-3 py-2 rounded-lg hover:bg-ftech-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Adicionar E-mail
            </button>
          )}
        </div>
      )}
    </form>
  );
}
