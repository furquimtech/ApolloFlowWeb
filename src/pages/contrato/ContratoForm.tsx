import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { contratoApi } from '../../api/contrato';
import { clienteApi } from '../../api/cliente';
import { carteiraApi } from '../../api/carteira';
import type { ContratoRequest, Cliente, Carteira, ParcelaRequest } from '../../types';

type ParcelaEditor = {
  numeroParcela: number;
  dataVencimento: string;
  valorPrincipal: number;
  valorTotal: number;
  saldoAtual: number;
  saldoTotal: number;
  situacao: string;
  acordo: boolean;
  bloqueio: boolean;
  promessa: boolean;
};

const EMPTY_PARCELA_EDITOR: ParcelaEditor = {
  numeroParcela: 1,
  dataVencimento: '',
  valorPrincipal: 0,
  valorTotal: 0,
  saldoAtual: 0,
  saldoTotal: 0,
  situacao: 'Aberta',
  acordo: false,
  bloqueio: false,
  promessa: false,
};

const EMPTY: ContratoRequest = {
  numeroContrato: '',
  numeroParcelas: 1,
  dataEmissao: '',
  dataOperacao: '',
  situacao: 'Ativo',
  tipo: '',
  taxaOperacao: 0,
  valorDevolucao: 0,
  valorIof: 0,
  valorLiquido: 0,
  valorTarifa: 0,
  valorTotal: 0,
  saldoAtual: 0,
  saldoTotal: 0,
  saldoAtraso: 0,
  saldoContabil: 0,
  diasAtraso: 0,
  lp: false,
  carteiraId: 0,
  clienteId: 0,
  parcelas: [],
};

function parcelaToEditor(parcela: ParcelaRequest): ParcelaEditor {
  return {
    numeroParcela: parcela.numeroParcela,
    dataVencimento: parcela.dataVencimento?.slice(0, 10) ?? '',
    valorPrincipal: parcela.valorPrincipal,
    valorTotal: parcela.valorTotal,
    saldoAtual: parcela.saldoAtual,
    saldoTotal: parcela.saldoTotal,
    situacao: parcela.situacao || 'Aberta',
    acordo: Boolean(parcela.acordo),
    bloqueio: Boolean(parcela.bloqueio),
    promessa: Boolean(parcela.promessa),
  };
}

function buildParcelaRequest(editor: ParcelaEditor, numeroContrato: string): ParcelaRequest {
  return {
    numeroContrato: numeroContrato || '',
    numeroParcela: editor.numeroParcela,
    dataVencimento: editor.dataVencimento,
    saldoPrincipal: editor.valorPrincipal,
    saldoTotal: editor.saldoTotal,
    saldoAtual: editor.saldoAtual,
    saldoContabil: editor.saldoAtual,
    valorPrincipal: editor.valorPrincipal,
    valorTotal: editor.valorTotal,
    valorMulta: 0,
    valorPermanencia: 0,
    valorMora: 0,
    valorOutros: 0,
    valorDesconto: 0,
    valorPrincipalAberto: editor.saldoAtual,
    situacao: editor.situacao,
    acordo: editor.acordo,
    bloqueio: editor.bloqueio,
    promessa: editor.promessa,
  };
}

function serializeParcelaForApi(parcela: ParcelaRequest, numeroContrato: string): ParcelaRequest {
  return {
    numeroContrato: numeroContrato || parcela.numeroContrato || '',
    numeroParcela: Math.trunc(parcela.numeroParcela || 0),
    dataVencimento: parcela.dataVencimento,
    valorPrincipal: parcela.valorPrincipal || 0,
    valorTotal: parcela.valorTotal || 0,
    saldoAtual: parcela.saldoAtual || 0,
    saldoTotal: parcela.saldoTotal || 0,
    saldoPrincipal: parcela.saldoPrincipal ?? parcela.valorPrincipal ?? 0,
    saldoContabil: parcela.saldoContabil ?? parcela.saldoAtual ?? 0,
    valorMulta: parcela.valorMulta ?? 0,
    valorPermanencia: parcela.valorPermanencia ?? 0,
    valorMora: parcela.valorMora ?? 0,
    valorOutros: parcela.valorOutros ?? 0,
    valorDesconto: parcela.valorDesconto ?? 0,
    valorPrincipalAberto: parcela.valorPrincipalAberto ?? parcela.saldoAtual ?? 0,
    situacao: parcela.situacao || 'Aberta',
    acordo: Boolean(parcela.acordo),
    bloqueio: Boolean(parcela.bloqueio),
    promessa: Boolean(parcela.promessa),
  };
}

export default function ContratoForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id && id !== 'novo';

  const [form, setForm] = useState<ContratoRequest>(EMPTY);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [carteiras, setCarteiras] = useState<Carteira[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showParcelaForm, setShowParcelaForm] = useState(false);
  const [editingParcelaIndex, setEditingParcelaIndex] = useState<number | null>(null);
  const [parcelaEditor, setParcelaEditor] = useState<ParcelaEditor>(EMPTY_PARCELA_EDITOR);

  useEffect(() => {
    Promise.all([clienteApi.getAll(), carteiraApi.getAll()])
      .then(([c, k]) => {
        setClientes(c);
        setCarteiras(k);
      })
      .catch(() => setError('Erro ao carregar dados auxiliares.'));
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    contratoApi
      .getById(Number(id))
      .then((data) =>
        setForm({
          numeroContrato: data.numeroContrato,
          numeroParcelas: data.numeroParcelas,
          dataEmissao: data.dataEmissao?.slice(0, 10) ?? '',
          dataOperacao: data.dataOperacao?.slice(0, 10) ?? '',
          situacao: data.situacao,
          tipo: data.tipo ?? '',
          taxaOperacao: data.taxaOperacao,
          valorDevolucao: data.valorDevolucao,
          valorIof: data.valorIof,
          valorLiquido: data.valorLiquido ?? 0,
          valorTarifa: data.valorTarifa,
          valorTotal: data.valorTotal,
          saldoAtual: data.saldoAtual,
          saldoTotal: data.saldoTotal,
          saldoAtraso: data.saldoAtraso,
          saldoContabil: data.saldoContabil,
          diasAtraso: data.diasAtraso ?? 0,
          lp: data.lp,
          carteiraId: data.carteiraId,
          clienteId: data.clienteId,
          parcelas:
            data.parcelas?.map((p) => ({
              id: p.id,
              idExterno: p.idExterno,
              numeroContrato: p.numeroContrato || data.numeroContrato || '',
              numeroParcela: p.numeroParcela,
              dataVencimento: p.dataVencimento?.slice(0, 10) ?? '',
              saldoPrincipal: p.saldoPrincipal ?? 0,
              saldoTotal: p.saldoTotal ?? 0,
              saldoAtual: p.saldoAtual ?? 0,
              saldoContabil: p.saldoContabil ?? 0,
              valorPrincipal: p.valorPrincipal ?? 0,
              valorTotal: p.valorTotal ?? 0,
              valorMulta: p.valorMulta ?? 0,
              valorPermanencia: p.valorPermanencia ?? 0,
              valorMora: p.valorMora ?? 0,
              valorOutros: p.valorOutros ?? 0,
              valorDesconto: p.valorDesconto ?? 0,
              valorDespesa: p.valorDespesa ?? 0,
              valorBoleto: p.valorBoleto ?? 0,
              valorBaseTributo: p.valorBaseTributo ?? 0,
              valorPrincipalAberto: p.valorPrincipalAberto ?? 0,
              situacao: p.situacao || 'Aberta',
              acordo: Boolean(p.acordo),
              bloqueio: Boolean(p.bloqueio),
              promessa: Boolean(p.promessa),
            })) ?? [],
        })
      )
      .catch(() => setError('Erro ao carregar contrato.'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value, type } = e.target;
    if (type === 'checkbox') return;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleNumber(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: parseFloat(e.target.value) || 0 }));
  }

  function handleInt(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: parseInt(e.target.value) || 0 }));
  }

  function addOrUpdateParcela() {
    if (!parcelaEditor.numeroParcela || !parcelaEditor.dataVencimento) return;

    const next = buildParcelaRequest(parcelaEditor, form.numeroContrato);
    setForm((prev) => {
      const atuais = prev.parcelas ?? [];
      const parcelas =
        editingParcelaIndex !== null
          ? atuais.map((p, i) => (i === editingParcelaIndex ? { ...p, ...next } : p))
          : [...atuais, next];
      return { ...prev, parcelas, numeroParcelas: parcelas.length || prev.numeroParcelas };
    });

    setParcelaEditor(EMPTY_PARCELA_EDITOR);
    setEditingParcelaIndex(null);
    setShowParcelaForm(false);
  }

  function editParcela(index: number) {
    const parcela = form.parcelas?.[index];
    if (!parcela) return;
    setParcelaEditor(parcelaToEditor(parcela));
    setEditingParcelaIndex(index);
    setShowParcelaForm(true);
  }

  function removeParcela(index: number) {
    setForm((prev) => {
      const parcelas = (prev.parcelas ?? []).filter((_, i) => i !== index);
      return { ...prev, parcelas, numeroParcelas: parcelas.length || 1 };
    });
  }

  function handleParcelaNumberChange(
    e: React.ChangeEvent<HTMLInputElement>,
    key: keyof ParcelaEditor
  ) {
    const parsed =
      key === 'numeroParcela'
        ? parseInt(e.target.value, 10) || 0
        : parseFloat(e.target.value) || 0;
    setParcelaEditor((prev) => ({ ...prev, [key]: parsed }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const parcelas = (form.parcelas ?? [])
        .map((p) => serializeParcelaForApi(p, form.numeroContrato))
        .filter((p) => p.numeroParcela > 0 && !!p.dataVencimento);

      const payload: ContratoRequest = {
        ...form,
        numeroParcelas: parcelas.length > 0 ? parcelas.length : form.numeroParcelas,
        parcelas: parcelas.length > 0 ? parcelas : undefined,
      };
      if (isEdit) {
        await contratoApi.update(Number(id), payload);
      } else {
        await contratoApi.create(payload);
      }
      navigate('/contrato');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { mensagem?: string } } })?.response?.data?.mensagem ??
        'Erro ao salvar contrato.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ftech-500 focus:border-transparent text-gray-800 placeholder-gray-400';
  const selectClass =
    'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ftech-500 focus:border-transparent text-gray-800 bg-white';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400">
        <svg className="animate-spin w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Carregando...
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/contrato')}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isEdit ? 'Editar Contrato' : 'Novo Contrato'}
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {isEdit ? 'Altere os dados e salve' : 'Preencha os dados do novo contrato'}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>
                N Contrato <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="numeroContrato"
                value={form.numeroContrato}
                onChange={handleChange}
                required
                placeholder="Numero do contrato"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                N Parcelas <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="numeroParcelas"
                value={form.numeroParcelas}
                onChange={handleInt}
                required
                min={1}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                Cliente <span className="text-red-500">*</span>
              </label>
              <select
                name="clienteId"
                value={form.clienteId || ''}
                onChange={handleInt}
                required
                className={selectClass}
              >
                <option value="">Selecione...</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome} - {c.cpfCnpj}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>
                Carteira <span className="text-red-500">*</span>
              </label>
              <select
                name="carteiraId"
                value={form.carteiraId || ''}
                onChange={handleInt}
                required
                className={selectClass}
              >
                <option value="">Selecione...</option>
                {carteiras.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>
                Data Emissao <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="dataEmissao"
                value={form.dataEmissao}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                Data Operacao <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="dataOperacao"
                value={form.dataOperacao}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Situacao</label>
              <select
                name="situacao"
                value={form.situacao}
                onChange={handleChange}
                className={selectClass}
              >
                <option value="Ativo">Ativo</option>
                <option value="Liquidado">Liquidado</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Tipo</label>
              <input
                type="text"
                name="tipo"
                value={form.tipo ?? ''}
                onChange={handleChange}
                placeholder="Tipo do contrato"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Taxa Operacao %</label>
              <input type="number" name="taxaOperacao" value={form.taxaOperacao} onChange={handleNumber} step={0.01} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Valor IOF</label>
              <input type="number" name="valorIof" value={form.valorIof} onChange={handleNumber} step={0.01} className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Valor Total</label>
              <input type="number" name="valorTotal" value={form.valorTotal} onChange={handleNumber} step={0.01} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Valor Liquido</label>
              <input type="number" name="valorLiquido" value={form.valorLiquido ?? 0} onChange={handleNumber} step={0.01} className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Saldo Atual</label>
              <input type="number" name="saldoAtual" value={form.saldoAtual} onChange={handleNumber} step={0.01} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Saldo Atraso</label>
              <input type="number" name="saldoAtraso" value={form.saldoAtraso} onChange={handleNumber} step={0.01} className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Dias Atraso</label>
              <input type="number" name="diasAtraso" value={form.diasAtraso ?? 0} onChange={handleNumber} className={inputClass} />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                name="lp"
                id="lp"
                checked={form.lp}
                onChange={(e) => setForm((p) => ({ ...p, lp: e.target.checked }))}
                className="w-4 h-4 text-ftech-600 border-gray-300 rounded focus:ring-ftech-500"
              />
              <label htmlFor="lp" className="text-sm font-medium text-gray-700 cursor-pointer">
                Lancamento Provisorio
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Parcelas</h2>
            {!showParcelaForm && (
              <button
                type="button"
                onClick={() => {
                  setParcelaEditor({
                    ...EMPTY_PARCELA_EDITOR,
                    numeroParcela: (form.parcelas?.length ?? 0) + 1,
                  });
                  setEditingParcelaIndex(null);
                  setShowParcelaForm(true);
                }}
                className="text-ftech-600 hover:text-ftech-800 text-sm font-medium px-3 py-1.5 rounded hover:bg-ftech-50 transition-colors"
              >
                + Adicionar Parcela
              </button>
            )}
          </div>

          {(form.parcelas?.length ?? 0) === 0 ? (
            <p className="text-sm text-gray-500 py-2">Nenhuma parcela cadastrada.</p>
          ) : (
            <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
              {(form.parcelas ?? []).map((parcela, idx) => (
                <div key={`${parcela.numeroParcela}-${idx}`} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Parcela {parcela.numeroParcela} - Venc. {parcela.dataVencimento}
                    </p>
                    <p className="text-xs text-gray-500">
                      Valor: R$ {parcela.valorTotal.toFixed(2)} | Saldo Atual: R$ {parcela.saldoAtual.toFixed(2)} | Situação: {parcela.situacao}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => editParcela(idx)}
                      className="text-ftech-600 hover:text-ftech-800 text-xs font-medium px-2 py-1 rounded hover:bg-ftech-50 transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => removeParcela(idx)}
                      className="text-red-500 hover:text-red-700 text-xs font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showParcelaForm && (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-3">
              <h3 className="text-sm font-medium text-gray-700">
                {editingParcelaIndex !== null ? 'Editar Parcela' : 'Nova Parcela'}
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Numero Parcela</label>
                  <input
                    type="number"
                    value={parcelaEditor.numeroParcela}
                    min={1}
                    onChange={(e) => handleParcelaNumberChange(e, 'numeroParcela')}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Data Vencimento</label>
                  <input
                    type="date"
                    value={parcelaEditor.dataVencimento}
                    onChange={(e) => setParcelaEditor((prev) => ({ ...prev, dataVencimento: e.target.value }))}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Valor Principal</label>
                  <input
                    type="number"
                    step={0.01}
                    value={parcelaEditor.valorPrincipal}
                    onChange={(e) => handleParcelaNumberChange(e, 'valorPrincipal')}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Valor Total</label>
                  <input
                    type="number"
                    step={0.01}
                    value={parcelaEditor.valorTotal}
                    onChange={(e) => handleParcelaNumberChange(e, 'valorTotal')}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Saldo Atual</label>
                  <input
                    type="number"
                    step={0.01}
                    value={parcelaEditor.saldoAtual}
                    onChange={(e) => handleParcelaNumberChange(e, 'saldoAtual')}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Saldo Total</label>
                  <input
                    type="number"
                    step={0.01}
                    value={parcelaEditor.saldoTotal}
                    onChange={(e) => handleParcelaNumberChange(e, 'saldoTotal')}
                    className={inputClass}
                  />
                </div>

                <div className="col-span-2">
                  <label className={labelClass}>Situacao</label>
                  <input
                    type="text"
                    value={parcelaEditor.situacao}
                    onChange={(e) => setParcelaEditor((prev) => ({ ...prev, situacao: e.target.value }))}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={parcelaEditor.acordo}
                    onChange={(e) => setParcelaEditor((prev) => ({ ...prev, acordo: e.target.checked }))}
                    className="w-4 h-4 text-ftech-600 border-gray-300 rounded focus:ring-ftech-500"
                  />
                  Acordo
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={parcelaEditor.bloqueio}
                    onChange={(e) => setParcelaEditor((prev) => ({ ...prev, bloqueio: e.target.checked }))}
                    className="w-4 h-4 text-ftech-600 border-gray-300 rounded focus:ring-ftech-500"
                  />
                  Bloqueio
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={parcelaEditor.promessa}
                    onChange={(e) => setParcelaEditor((prev) => ({ ...prev, promessa: e.target.checked }))}
                    className="w-4 h-4 text-ftech-600 border-gray-300 rounded focus:ring-ftech-500"
                  />
                  Promessa
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={addOrUpdateParcela}
                  className="bg-ftech-600 hover:bg-ftech-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  {editingParcelaIndex !== null ? 'Salvar alterações' : 'Adicionar parcela'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowParcelaForm(false);
                    setParcelaEditor(EMPTY_PARCELA_EDITOR);
                    setEditingParcelaIndex(null);
                  }}
                  className="text-gray-600 hover:text-gray-800 text-sm font-medium px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-ftech-600 hover:bg-ftech-700 disabled:bg-ftech-400 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/contrato')}
              className="px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
