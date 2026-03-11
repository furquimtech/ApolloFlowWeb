import { useState, useEffect, useRef } from 'react';
import { filaApi } from '../../api/fila';
import { carteiraApi } from '../../api/carteira';
import { contratoApi } from '../../api/contrato';
import { clienteApi } from '../../api/cliente';
import type { Fila, FilaRequest, FilaFiltroRequest, Carteira, Contrato } from '../../types';

// ── helpers ──────────────────────────────────────────────────────────────────

const fmtDateTimeInput = (iso?: string) => {
  if (!iso) return '';
  const date = new Date(iso);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 16);
};

const fmtDateTimeDisplay = (iso?: string) => {
  if (!iso) return '';
  return new Date(iso).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
};

const fmtDate = fmtDateTimeDisplay;

const now = () => fmtDateTimeInput(new Date().toISOString());

const emptyForm = (): FilaRequest => ({
  codigoFila: '',
  descricao: '',
  ativo: true,
  dataInicio: now(),
  dataFim: '',
  tipo: 'INTERNO',
});

const emptyFiltro = (): FilaFiltroRequest => ({
  carteiraIds: [],
  situacaoCliente: '',
  situacaoContrato: '',
  diasAtrasoMin: undefined,
  diasAtrasoMax: undefined,
  saldoAtualMin: undefined,
  saldoAtualMax: undefined,
  dataHoraAgendamento: '',
  ignorarJaIncluidos: true,
  incluirContrato: false,
});

type PreviewRegistro = {
  clienteId: number;
  contratoId?: number;
  dataHoraAgendamento?: string;
  atendido: boolean;
};

// ── component ────────────────────────────────────────────────────────────────

export default function FilaPage() {
  // Fila list & form
  const [filas, setFilas] = useState<Fila[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FilaRequest>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Selected fila for operations
  const [selectedFila, setSelectedFila] = useState<Fila | null>(null);
  const [activeTab, setActiveTab] = useState<'csv' | 'filtro'>('csv');

  // CSV tab
  const fileRef = useRef<HTMLInputElement>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvResult, setCsvResult] = useState<{
    inseridos: number;
    naoEncontrados: string[];
    erros: string[];
  } | null>(null);
  const [csvError, setCsvError] = useState('');

  // Filter tab
  const [carteiras, setCarteiras] = useState<Carteira[]>([]);
  const [filtro, setFiltro] = useState<FilaFiltroRequest>(emptyFiltro());
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [previewRegistros, setPreviewRegistros] = useState<PreviewRegistro[]>([]);
  const [buscarLoading, setBuscarLoading] = useState(false);
  const [subirLoading, setSubirLoading] = useState(false);
  const [filtroError, setFiltroError] = useState('');
  const [filtroSuccess, setFiltroSuccess] = useState('');

  // ── load ────────────────────────────────────────────────────────────────
  useEffect(() => {
    loadFilas();
    carteiraApi.getAll().then(setCarteiras).catch(() => {});
  }, []);

  async function loadFilas() {
    setLoading(true);
    try {
      setFilas(await filaApi.getAll());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  // ── form ────────────────────────────────────────────────────────────────
  function openNew() {
    setEditingId(null);
    setForm(emptyForm());
    setFormError('');
    setShowForm(true);
  }

  function openEdit(f: Fila) {
    setEditingId(f.id);
    setForm({
      codigoFila: f.codigoFila,
      descricao: f.descricao,
      ativo: f.ativo,
      dataInicio: fmtDateTimeInput(f.dataInicio),
      dataFim: f.dataFim ? fmtDateTimeInput(f.dataFim) : '',
      tipo: f.tipo,
    });
    setFormError('');
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.codigoFila.trim() || !form.descricao.trim()) {
      setFormError('Código e Descrição são obrigatórios.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const payload: FilaRequest = { ...form, dataFim: form.dataFim || undefined };
      let savedFila: Fila | null = null;
      if (editingId) {
        await filaApi.update(editingId, payload);
        savedFila = await filaApi.getById(editingId);
      } else {
        savedFila = await filaApi.create(payload);
      }
      setShowForm(false);
      await loadFilas();
      if (savedFila) {
        selectFila(savedFila);
      }
    } catch (e: any) {
      setFormError(e?.response?.data?.message ?? 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Confirma exclusão desta fila?')) return;
    try {
      await filaApi.remove(id);
      if (selectedFila?.id === id) setSelectedFila(null);
      await loadFilas();
    } catch {
      alert('Erro ao excluir fila.');
    }
  }

  // ── select fila ─────────────────────────────────────────────────────────
  function selectFila(f: Fila) {
    if (selectedFila?.id === f.id) {
      setSelectedFila(null);
      return;
    }
    setSelectedFila(f);
    setActiveTab('csv');
    setCsvFile(null);
    setCsvResult(null);
    setCsvError('');
    setFiltro(emptyFiltro());
    setPreviewCount(null);
    setPreviewRegistros([]);
    setFiltroError('');
    setFiltroSuccess('');
    if (fileRef.current) fileRef.current.value = '';
  }

  // ── CSV ─────────────────────────────────────────────────────────────────
  async function handleCsvUpload() {
    if (!selectedFila || !csvFile) return;
    setCsvLoading(true);
    setCsvError('');
    setCsvResult(null);
    try {
      const result = await filaApi.popularPorCsv(selectedFila.id, csvFile);
      setCsvResult(result);
    } catch (e: any) {
      setCsvError(e?.response?.data?.message ?? 'Erro ao enviar CSV.');
    } finally {
      setCsvLoading(false);
    }
  }

  async function buildPreviewRegistros() {
    if (!selectedFila) return [];

    const payload: FilaFiltroRequest = {
      ...filtro,
      carteiraIds: filtro.carteiraIds?.length ? filtro.carteiraIds : undefined,
      situacaoCliente: filtro.situacaoCliente || undefined,
      situacaoContrato: filtro.situacaoContrato || undefined,
      dataHoraAgendamento: filtro.dataHoraAgendamento || undefined,
    };

    const [clientes, contratos, registrosExistentes] = await Promise.all([
      clienteApi.search({ pageSize: 50000 }),
      contratoApi.getAll(),
      payload.ignorarJaIncluidos
        ? filaApi.getRegistros(selectedFila.id, 0, 50000).then((result) => result.items)
        : Promise.resolve([]),
    ]);

    const clientesJaIncluidos = new Set(registrosExistentes.map((registro) => registro.clienteId));
    const contratosPorCliente = new Map<number, Contrato[]>();

    for (const contrato of contratos) {
      const lista = contratosPorCliente.get(contrato.clienteId) ?? [];
      lista.push(contrato);
      contratosPorCliente.set(contrato.clienteId, lista);
    }

    return clientes
      .filter((cliente) => {
        if (payload.situacaoCliente && cliente.situacao !== payload.situacaoCliente) return false;
        if (payload.diasAtrasoMin !== undefined && cliente.diasAtraso < payload.diasAtrasoMin) return false;
        if (payload.diasAtrasoMax !== undefined && cliente.diasAtraso > payload.diasAtrasoMax) return false;
        if (payload.saldoAtualMin !== undefined && cliente.saldoAtual < payload.saldoAtualMin) return false;
        if (payload.saldoAtualMax !== undefined && cliente.saldoAtual > payload.saldoAtualMax) return false;
        if (payload.ignorarJaIncluidos && clientesJaIncluidos.has(cliente.id)) return false;

        const contratosDoCliente = contratosPorCliente.get(cliente.id) ?? [];

        if (payload.carteiraIds?.length) {
          const possuiCarteira = contratosDoCliente.some((contrato) => payload.carteiraIds?.includes(contrato.carteiraId));
          if (!possuiCarteira) return false;
        }

        if (payload.situacaoContrato) {
          const possuiSituacao = contratosDoCliente.some((contrato) => contrato.situacao === payload.situacaoContrato);
          if (!possuiSituacao) return false;
        }

        return true;
      })
      .map((cliente) => {
        let contratoId: number | undefined;

        if (payload.incluirContrato) {
          contratoId = (contratosPorCliente.get(cliente.id) ?? [])
            .filter((contrato) => {
              if (payload.carteiraIds?.length && !payload.carteiraIds.includes(contrato.carteiraId)) return false;
              if (payload.situacaoContrato && contrato.situacao !== payload.situacaoContrato) return false;
              return true;
            })
            .sort((a, b) => new Date(b.dataHoraCriacao).getTime() - new Date(a.dataHoraCriacao).getTime())[0]?.id;
        }

        return {
          clienteId: cliente.id,
          contratoId,
          dataHoraAgendamento: payload.dataHoraAgendamento,
          atendido: false,
        };
      });
  }

  // ── Filter step 1: Buscar (count preview) ────────────────────────────────
  async function handleBuscar() {
    setBuscarLoading(true);
    setFiltroError('');
    setFiltroSuccess('');
    setPreviewCount(null);
    setPreviewRegistros([]);
    try {
      const registros = await buildPreviewRegistros();
      setPreviewRegistros(registros);
      setPreviewCount(registros.length);
    } catch (e: any) {
      setFiltroError('Erro ao buscar clientes para preview.');
    } finally {
      setBuscarLoading(false);
    }
  }

  // ── Filter step 2: Subir Fila (actual insert) ────────────────────────────
  async function handleSubirFila() {
    if (!selectedFila) return;
    if (previewRegistros.length === 0) {
      setFiltroError('Faça a busca antes de subir a fila.');
      return;
    }
    setSubirLoading(true);
    setFiltroError('');
    setFiltroSuccess('');
    try {
      const result = await filaApi.addRegistros(selectedFila.id, previewRegistros);
      setFiltroSuccess(
        result.inseridos === 0
          ? 'Nenhum registro foi adicionado à fila.'
          : `${result.inseridos} registro${result.inseridos !== 1 ? 's' : ''} adicionado${result.inseridos !== 1 ? 's' : ''} à fila com sucesso!`
      );
      setPreviewCount(null);
      setPreviewRegistros([]);
    } catch (e: any) {
      setFiltroError(e?.response?.data?.message ?? 'Erro ao popular fila.');
    } finally {
      setSubirLoading(false);
    }
  }

  function toggleCarteira(id: number) {
    setFiltro(prev => {
      const ids = prev.carteiraIds ?? [];
      return {
        ...prev,
        carteiraIds: ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id],
      };
    });
  }

  function resetFiltro() {
    setFiltro(emptyFiltro());
    setPreviewCount(null);
    setPreviewRegistros([]);
    setFiltroError('');
    setFiltroSuccess('');
  }

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ftech-900">Fila de Cobrança</h1>
          <p className="text-sm text-gray-500 mt-0.5">Cadastre e gerencie as filas de atendimento</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-ftech-600 text-white rounded-lg text-sm font-medium hover:bg-ftech-500 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nova Fila
        </button>
      </div>

      {/* Inline form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="text-base font-semibold text-ftech-900">
            {editingId ? 'Editar Fila' : 'Nova Fila'}
          </h2>
          {formError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              {formError}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Código *</label>
              <input
                value={form.codigoFila}
                onChange={e => setForm(p => ({ ...p, codigoFila: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ftech-500"
                placeholder="Ex: FILA_001"
              />
            </div>
            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Descrição *</label>
              <input
                value={form.descricao}
                onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ftech-500"
                placeholder="Descrição da fila"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
              <select
                value={form.tipo}
                onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ftech-500"
              >
                <option value="INTERNO">Interno</option>
                <option value="DISCADOR">Discador</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Data Início *</label>
              <input
                type="datetime-local"
                value={form.dataInicio}
                onChange={e => setForm(p => ({ ...p, dataInicio: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ftech-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Data Fim</label>
              <input
                type="datetime-local"
                value={form.dataFim ?? ''}
                onChange={e => setForm(p => ({ ...p, dataFim: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ftech-500"
              />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input
                type="checkbox"
                id="fila-ativo"
                checked={form.ativo}
                onChange={e => setForm(p => ({ ...p, ativo: e.target.checked }))}
                className="rounded border-gray-300 text-ftech-600 focus:ring-ftech-500"
              />
              <label htmlFor="fila-ativo" className="text-sm text-gray-700">
                Ativa
              </label>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-ftech-600 text-white rounded-lg text-sm font-medium hover:bg-ftech-500 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Fila list */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
            Carregando…
          </div>
        ) : filas.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
            Nenhuma fila cadastrada.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-ftech-900 text-white">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Código</th>
                <th className="text-left px-4 py-3 font-medium">Descrição</th>
                <th className="text-left px-4 py-3 font-medium">Tipo</th>
                <th className="text-left px-4 py-3 font-medium">Início</th>
                <th className="text-left px-4 py-3 font-medium">Fim</th>
                <th className="text-center px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filas.map(f => (
                <tr
                  key={f.id}
                  onClick={() => selectFila(f)}
                  className={`cursor-pointer transition-colors ${
                    selectedFila?.id === f.id
                      ? 'bg-ftech-50 border-l-4 border-l-ftech-600'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <td className="px-4 py-3 font-mono text-ftech-900 font-medium">
                    {f.codigoFila}
                  </td>
                  <td className="px-4 py-3 text-gray-800">{f.descricao}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        f.tipo === 'DISCADOR'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {f.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{fmtDateTimeDisplay(f.dataInicio)}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {f.dataFim ? fmtDate(f.dataFim) : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        f.ativo
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {f.ativo ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div
                      className="flex items-center justify-end gap-1"
                      onClick={e => e.stopPropagation()}
                    >
                      <button
                        onClick={() => selectFila(f)}
                        className="p-1.5 text-gray-500 hover:text-ftech-600 hover:bg-ftech-50 rounded transition-colors"
                        title="Selecionar para envio"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => openEdit(f)}
                        className="p-1.5 text-gray-500 hover:text-ftech-600 hover:bg-ftech-50 rounded transition-colors"
                        title="Editar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(f.id)}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Excluir"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Operations panel (only when a fila is selected) ── */}
      <div className="bg-white border border-ftech-200 rounded-xl shadow-sm overflow-hidden">
        {!selectedFila ? (
          <div className="p-8">
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center">
              <h2 className="text-lg font-semibold text-ftech-900">Envio de registros da fila</h2>
              <p className="mt-2 text-sm text-gray-600">
                Selecione uma fila na grade acima para habilitar as opções <strong>Enviar por CSV</strong> e <strong>Filtros e Busca</strong>.
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Você também pode criar uma nova fila e, após salvar, ela será selecionada automaticamente.
              </p>
            </div>
          </div>
        ) : (
        <div className="bg-white border border-ftech-200 rounded-xl shadow-sm overflow-hidden">
          {/* Panel header */}
          <div className="flex items-center justify-between px-5 py-3 bg-ftech-50 border-b border-ftech-200">
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-ftech-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
              <span className="text-sm font-semibold text-ftech-900">
                Carregar registros —{' '}
                <span className="text-ftech-600">{selectedFila.codigoFila}</span>
                <span className="text-gray-500 font-normal ml-1">
                  ({selectedFila.descricao})
                </span>
              </span>
            </div>
            <button
              onClick={() => setSelectedFila(null)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            {(['csv', 'filtro'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === tab
                    ? 'border-ftech-600 text-ftech-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'csv' ? 'Enviar por CSV' : 'Filtros e Busca'}
              </button>
            ))}
          </div>

          <div className="p-5">
            {/* ── CSV tab ── */}
            {activeTab === 'csv' && (
              <div className="space-y-4">
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                  Esta opção usa o endpoint `POST /fila/{'{id}'}/registros/csv` do `FilaController` para inserir os registros do arquivo na fila selecionada.
                </div>
                <div className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="font-medium text-gray-700 mb-1">Formato esperado do CSV:</p>
                  <code className="text-xs text-gray-600">
                    codigofila, cpf, numerocontrato, datahoraagendamento
                  </code>
                  <p className="text-xs text-gray-500 mt-1">
                    Os campos <em>codigofila</em>, <em>numerocontrato</em> e{' '}
                    <em>datahoraagendamento</em> são opcionais. A primeira linha é ignorada se
                    iniciar com "codigofila" ou "cpf".
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-ftech-400 transition-colors">
                      <svg
                        className="w-5 h-5 text-gray-400 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                        />
                      </svg>
                      <span className="text-sm text-gray-600 truncate">
                        {csvFile ? csvFile.name : 'Selecionar arquivo CSV…'}
                      </span>
                    </div>
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".csv,text/csv"
                      className="hidden"
                      onChange={e => {
                        const f = e.target.files?.[0] ?? null;
                        setCsvFile(f);
                        setCsvResult(null);
                        setCsvError('');
                      }}
                    />
                  </label>
                  <button
                    onClick={handleCsvUpload}
                    disabled={!csvFile || csvLoading}
                    className="px-4 py-2 bg-ftech-600 text-white rounded-lg text-sm font-medium hover:bg-ftech-500 disabled:opacity-40 transition-colors whitespace-nowrap"
                  >
                    {csvLoading ? 'Enviando…' : 'Enviar CSV'}
                  </button>
                </div>

                {csvError && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                    {csvError}
                  </div>
                )}

                {csvResult && (
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="flex-1 bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-green-700">
                          {csvResult.inseridos}
                        </div>
                        <div className="text-xs text-green-600 mt-0.5">Inseridos</div>
                      </div>
                      <div className="flex-1 bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-amber-700">
                          {csvResult.naoEncontrados.length}
                        </div>
                        <div className="text-xs text-amber-600 mt-0.5">Não encontrados</div>
                      </div>
                      <div className="flex-1 bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-red-700">
                          {csvResult.erros.length}
                        </div>
                        <div className="text-xs text-red-600 mt-0.5">Erros</div>
                      </div>
                    </div>

                    {csvResult.naoEncontrados.length > 0 && (
                      <details className="text-sm">
                        <summary className="cursor-pointer text-amber-700 font-medium py-1">
                          Ver CPFs não encontrados ({csvResult.naoEncontrados.length})
                        </summary>
                        <ul className="mt-2 max-h-32 overflow-auto bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-0.5">
                          {csvResult.naoEncontrados.map((s, i) => (
                            <li key={i} className="text-xs text-amber-800 font-mono">
                              {s}
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}

                    {csvResult.erros.length > 0 && (
                      <details className="text-sm">
                        <summary className="cursor-pointer text-red-700 font-medium py-1">
                          Ver erros ({csvResult.erros.length})
                        </summary>
                        <ul className="mt-2 max-h-32 overflow-auto bg-red-50 border border-red-200 rounded-lg p-3 space-y-0.5">
                          {csvResult.erros.map((s, i) => (
                            <li key={i} className="text-xs text-red-800 font-mono">
                              {s}
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Filter tab ── */}
            {activeTab === 'filtro' && (
              <div className="space-y-5">
                <div className="rounded-lg border border-ftech-200 bg-ftech-50 p-3 text-sm text-ftech-900">
                  Use os filtros para montar o lote. O botão <strong>Buscar</strong> prepara os registros e mostra a quantidade. O botão <strong>Subir Fila</strong> grava esse lote em `filaregistros`.
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Carteiras */}
                  <div className="lg:col-span-3">
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      Carteiras
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {carteiras.length === 0 && (
                        <span className="text-xs text-gray-400">Nenhuma carteira disponível</span>
                      )}
                      {carteiras.map(c => {
                        const sel = filtro.carteiraIds?.includes(c.id) ?? false;
                        return (
                          <button
                            key={c.id}
                            onClick={() => toggleCarteira(c.id)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                              sel
                                ? 'bg-ftech-600 text-white border-ftech-600'
                                : 'bg-white text-gray-600 border-gray-300 hover:border-ftech-400'
                            }`}
                          >
                            {c.nome}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Situação cliente */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Situação do Cliente
                    </label>
                    <select
                      value={filtro.situacaoCliente ?? ''}
                      onChange={e =>
                        setFiltro(p => ({ ...p, situacaoCliente: e.target.value }))
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ftech-500"
                    >
                      <option value="">Todas</option>
                      <option value="ABERTO">Aberto</option>
                      <option value="BAIXADO">Baixado</option>
                      <option value="CANCELADO">Cancelado</option>
                    </select>
                  </div>

                  {/* Situação contrato */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Situação do Contrato
                    </label>
                    <input
                      value={filtro.situacaoContrato ?? ''}
                      onChange={e =>
                        setFiltro(p => ({ ...p, situacaoContrato: e.target.value }))
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ftech-500"
                      placeholder="Ex: Aberto"
                    />
                  </div>

                  {/* Data agendamento */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Data de Agendamento
                    </label>
                    <input
                      type="datetime-local"
                      value={filtro.dataHoraAgendamento ?? ''}
                      onChange={e =>
                        setFiltro(p => ({ ...p, dataHoraAgendamento: e.target.value }))
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ftech-500"
                    />
                  </div>

                  {/* Dias atraso */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Dias de Atraso (mín.)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={filtro.diasAtrasoMin ?? ''}
                      onChange={e =>
                        setFiltro(p => ({
                          ...p,
                          diasAtrasoMin: e.target.value ? +e.target.value : undefined,
                        }))
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ftech-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Dias de Atraso (máx.)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={filtro.diasAtrasoMax ?? ''}
                      onChange={e =>
                        setFiltro(p => ({
                          ...p,
                          diasAtrasoMax: e.target.value ? +e.target.value : undefined,
                        }))
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ftech-500"
                      placeholder="9999"
                    />
                  </div>

                  {/* Saldo atual */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Saldo Atual mín. (R$)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={filtro.saldoAtualMin ?? ''}
                      onChange={e =>
                        setFiltro(p => ({
                          ...p,
                          saldoAtualMin: e.target.value ? +e.target.value : undefined,
                        }))
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ftech-500"
                      placeholder="0,00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Saldo Atual máx. (R$)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={filtro.saldoAtualMax ?? ''}
                      onChange={e =>
                        setFiltro(p => ({
                          ...p,
                          saldoAtualMax: e.target.value ? +e.target.value : undefined,
                        }))
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ftech-500"
                      placeholder="999999,00"
                    />
                  </div>

                  {/* Checkboxes */}
                  <div className="flex flex-col gap-2 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filtro.ignorarJaIncluidos}
                        onChange={e =>
                          setFiltro(p => ({ ...p, ignorarJaIncluidos: e.target.checked }))
                        }
                        className="rounded border-gray-300 text-ftech-600 focus:ring-ftech-500"
                      />
                      <span className="text-sm text-gray-700">Ignorar já incluídos</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filtro.incluirContrato}
                        onChange={e =>
                          setFiltro(p => ({ ...p, incluirContrato: e.target.checked }))
                        }
                        className="rounded border-gray-300 text-ftech-600 focus:ring-ftech-500"
                      />
                      <span className="text-sm text-gray-700">Incluir contrato</span>
                    </label>
                  </div>
                </div>

                {/* Preview result */}
                {previewCount !== null && !filtroSuccess && (
                  <div className="flex items-center gap-3 bg-ftech-50 border border-ftech-200 rounded-lg p-4">
                    <div className="text-3xl font-bold text-ftech-600">{previewCount}</div>
                    <div>
                      <p className="text-sm font-medium text-ftech-900">
                        {previewCount === 1
                          ? '1 cliente encontrado'
                          : `${previewCount} clientes encontrados`}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Clique em "Subir Fila" para adicionar estes registros.
                      </p>
                    </div>
                  </div>
                )}

                {previewCount === 0 && !filtroSuccess && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    Nenhum registro atende aos filtros informados.
                  </div>
                )}

                {filtroError && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                    {filtroError}
                  </div>
                )}

                {filtroSuccess && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                    <svg
                      className="w-5 h-5 text-green-600 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-sm text-green-700">{filtroSuccess}</span>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={handleBuscar}
                    disabled={buscarLoading || subirLoading}
                    className="px-5 py-2 bg-ftech-900 text-white rounded-lg text-sm font-medium hover:bg-ftech-800 disabled:opacity-40 transition-colors"
                  >
                    {buscarLoading ? 'Buscando…' : 'Buscar'}
                  </button>
                  {previewCount !== null && previewCount > 0 && !filtroSuccess && (
                    <button
                      onClick={handleSubirFila}
                      disabled={subirLoading}
                      className="px-5 py-2 bg-ftech-600 text-white rounded-lg text-sm font-medium hover:bg-ftech-500 disabled:opacity-40 transition-colors"
                    >
                      {subirLoading
                        ? 'Enviando…'
                        : `Subir Fila (${previewCount})`}
                    </button>
                  )}
                  <button
                    onClick={resetFiltro}
                    className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                  >
                    Limpar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
