import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { carteiraApi } from '../../api/carteira';
import { assessoriaApi } from '../../api/assessoria';
import { carteiraCobransaasApi } from '../../api/carteiraCobransaas';
import type { CarteiraRequest, Assessoria, RegraCalculo, RegraParcelamentoRequest, CarteiraCobransaas, CarteiraCobransaasRequest } from '../../types';

const EMPTY_COBRANSAAS: Omit<CarteiraCobransaasRequest, 'carteiraId'> = {
  host: '',
  apiKey: '',
  assessoriaExternaId: '',
  ativo: true,
  tamanhoPagina: 20,
  modoSincronizacao: 'CONTINUABLE',
  seletoresCliente: 'telefones,emails,enderecos',
  observacao: '',
};

const EMPTY_REGRA_PARCELA: RegraParcelamentoRequest = {
  maxParcelas: 1,
  valorMinimoParcela: 0,
  taxaJurosParcelamento: 0,
  percentualEntrada: 0,
};

const EMPTY: CarteiraRequest = {
  nome: '', descricao: '', situacao: 'Ativo', assessoriaId: 0,
};

export default function CarteiraForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id && id !== 'novo';

  const [form, setForm] = useState<CarteiraRequest>(EMPTY);
  const [assessorias, setAssessorias] = useState<Assessoria[]>([]);
  const [regraCalculo, setRegraCalculo] = useState<RegraCalculo | null>(null);

  // RegraCalculo para criação de nova carteira
  const [incluirRegra, setIncluirRegra] = useState(false);
  const [regraForm, setRegraForm] = useState({
    nome: '',
    taxaCp: 0,
    tipoJuros: 0,
    taxaJurosMes: 0,
    taxaMulta: 0,
    taxaHonorarios: 0,
    taxaComissionamento: 0,
    ativo: true,
  });
  const [regrasParcela, setRegrasParcela] = useState<RegraParcelamentoRequest[]>([]);

  // CarteiraCobransaas
  const [cobransaasConfig, setCobransaasConfig] = useState<CarteiraCobransaas | null>(null);
  const [cobransaasForm, setCobransaasForm] = useState(EMPTY_COBRANSAAS);
  const [cobransaasOpen, setCobransaasOpen] = useState(false);
  const [savingCobransaas, setSavingCobransaas] = useState(false);
  const [cobransaasError, setCobransaasError] = useState('');
  const [cobransaasSuccess, setCobransaasSuccess] = useState('');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    assessoriaApi.getAll().then(setAssessorias).catch(() => setError('Erro ao carregar assessorias.'));
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    carteiraApi
      .getById(Number(id))
      .then((data) => {
        setForm({
          nome: data.nome,
          descricao: data.descricao ?? '',
          situacao: data.situacao,
          assessoriaId: data.assessoriaId,
        });
        if (data.regraCalculo) setRegraCalculo(data.regraCalculo);
        // Carrega configuração Cobransaas (ignora 404)
        carteiraCobransaasApi.getByCarteira(Number(id))
          .then(cfg => {
            setCobransaasConfig(cfg);
            setCobransaasForm({
              host: cfg.host, apiKey: cfg.apiKey,
              assessoriaExternaId: cfg.assessoriaExternaId ?? '',
              ativo: cfg.ativo, tamanhoPagina: cfg.tamanhoPagina,
              modoSincronizacao: cfg.modoSincronizacao,
              seletoresCliente: cfg.seletoresCliente,
              observacao: cfg.observacao ?? '',
            });
          })
          .catch(() => { /* sem configuração ainda */ });
      })
      .catch(() => setError('Erro ao carregar carteira.'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'assessoriaId' ? parseInt(value) || 0 : value,
    }));
  }

  function handleRegraChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setRegraForm(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setRegraForm(prev => ({ ...prev, [name]: name === 'tipoJuros' ? parseInt(value) : parseFloat(value) || 0 }));
    }
  }

  function addParcelamento() {
    setRegrasParcela(prev => [...prev, { ...EMPTY_REGRA_PARCELA }]);
  }

  function removeParcelamento(idx: number) {
    setRegrasParcela(prev => prev.filter((_, i) => i !== idx));
  }

  function handleParcelaChange(idx: number, field: keyof RegraParcelamentoRequest, value: string) {
    setRegrasParcela(prev => prev.map((p, i) =>
      i === idx ? { ...p, [field]: parseFloat(value) || 0 } : p
    ));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload: CarteiraRequest = { ...form };
      if (!isEdit && incluirRegra) {
        payload.regraCalculo = {
          ...regraForm,
          regrasParcelamento: regrasParcela,
        };
      }
      if (isEdit) {
        await carteiraApi.update(Number(id), form);
      } else {
        await carteiraApi.create(payload);
      }
      navigate('/carteira');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { mensagem?: string } } })?.response?.data?.mensagem ??
        'Erro ao salvar carteira.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveCobransaas() {
    if (!cobransaasForm.host.trim() || !cobransaasForm.apiKey.trim()) {
      setCobransaasError('Host e ApiKey são obrigatórios.');
      return;
    }
    setSavingCobransaas(true);
    setCobransaasError('');
    setCobransaasSuccess('');
    try {
      const payload: CarteiraCobransaasRequest = {
        ...cobransaasForm,
        carteiraId: Number(id),
        assessoriaExternaId: cobransaasForm.assessoriaExternaId || undefined,
        observacao: cobransaasForm.observacao || undefined,
      };
      if (cobransaasConfig) {
        const updated = await carteiraCobransaasApi.update(cobransaasConfig.id, payload);
        setCobransaasConfig(updated);
      } else {
        const created = await carteiraCobransaasApi.create(payload);
        setCobransaasConfig(created);
      }
      setCobransaasSuccess('Configuração Cobransaas salva com sucesso.');
    } catch (e: any) {
      setCobransaasError(e?.response?.data?.message ?? 'Erro ao salvar configuração Cobransaas.');
    } finally {
      setSavingCobransaas(false);
    }
  }

  const inputCls = 'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ftech-500 focus:border-transparent text-gray-800 placeholder-gray-400';
  const numCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ftech-500 focus:border-transparent text-sm text-gray-800';

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
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/carteira')} className="text-gray-400 hover:text-gray-600 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{isEdit ? 'Editar Carteira' : 'Nova Carteira'}</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {isEdit ? 'Altere os dados e salve' : 'Preencha os dados da nova carteira'}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados da Carteira */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide border-b pb-2">Dados da Carteira</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome <span className="text-red-500">*</span></label>
            <input type="text" name="nome" value={form.nome} onChange={handleChange}
              required placeholder="Nome da carteira" className={inputCls} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea name="descricao" value={form.descricao ?? ''} onChange={handleChange}
              rows={3} placeholder="Descrição da carteira"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ftech-500 focus:border-transparent text-gray-800 placeholder-gray-400 resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assessoria <span className="text-red-500">*</span></label>
            <select name="assessoriaId" value={form.assessoriaId || ''} onChange={handleChange}
              required className={inputCls + ' bg-white'}>
              <option value="">Selecione...</option>
              {assessorias.map((a) => (
                <option key={a.id} value={a.id}>{a.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Situação</label>
            <select name="situacao" value={form.situacao} onChange={handleChange}
              className={inputCls + ' bg-white'}>
              <option value="Ativo">Ativo</option>
              <option value="Inativo">Inativo</option>
            </select>
          </div>
        </div>

        {/* Regra de Cálculo — somente leitura em edição */}
        {isEdit && regraCalculo && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide border-b pb-2 mb-4">
              Regra de Cálculo
              <span className="ml-2 text-xs font-normal text-gray-400 normal-case">(somente leitura)</span>
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Nome:</span> <span className="font-medium text-gray-800">{regraCalculo.nome}</span></div>
              <div><span className="text-gray-500">Tipo de Juros:</span> <span className="font-medium text-gray-800">{regraCalculo.tipoJuros === 0 ? 'Simples' : 'Composto'}</span></div>
              <div><span className="text-gray-500">Taxa CP:</span> <span className="font-medium text-gray-800">{regraCalculo.taxaCp}% a.m.</span></div>
              <div><span className="text-gray-500">Taxa Juros:</span> <span className="font-medium text-gray-800">{regraCalculo.taxaJurosMes}% a.m.</span></div>
              <div><span className="text-gray-500">Multa:</span> <span className="font-medium text-gray-800">{regraCalculo.taxaMulta}%</span></div>
              <div><span className="text-gray-500">Honorários:</span> <span className="font-medium text-gray-800">{regraCalculo.taxaHonorarios}%</span></div>
              <div><span className="text-gray-500">Comissionamento:</span> <span className="font-medium text-gray-800">{regraCalculo.taxaComissionamento}%</span></div>
              <div>
                <span className="text-gray-500">Status:</span>{' '}
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${regraCalculo.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}>
                  {regraCalculo.ativo ? 'Ativa' : 'Inativa'}
                </span>
              </div>
            </div>
            {regraCalculo.regrasParcelamento && regraCalculo.regrasParcelamento.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Regras de Parcelamento</p>
                <table className="w-full text-xs text-left border-t">
                  <thead>
                    <tr className="text-gray-500">
                      <th className="py-1 pr-4">Máx. Parcelas</th>
                      <th className="py-1 pr-4">Vlr. Mínimo</th>
                      <th className="py-1 pr-4">Taxa Juros</th>
                      <th className="py-1">% Entrada</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700">
                    {regraCalculo.regrasParcelamento.map((rp) => (
                      <tr key={rp.id} className="border-t border-gray-100">
                        <td className="py-1.5 pr-4">{rp.maxParcelas}x</td>
                        <td className="py-1.5 pr-4">R$ {rp.valorMinimoParcela.toFixed(2)}</td>
                        <td className="py-1.5 pr-4">{rp.taxaJurosParcelamento}% a.m.</td>
                        <td className="py-1.5">{rp.percentualEntrada}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Regra de Cálculo — criação (apenas para nova carteira) */}
        {!isEdit && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <label className="flex items-center gap-3 cursor-pointer mb-4">
              <input type="checkbox" checked={incluirRegra} onChange={e => setIncluirRegra(e.target.checked)}
                className="w-4 h-4 text-ftech-600 rounded border-gray-300 focus:ring-ftech-500" />
              <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Definir Regra de Cálculo</span>
            </label>

            {incluirRegra && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Regra <span className="text-red-500">*</span></label>
                  <input type="text" name="nome" value={regraForm.nome} onChange={handleRegraChange}
                    required={incluirRegra} className={numCls} placeholder="Ex: Regra Padrão" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Juros</label>
                    <select name="tipoJuros" value={regraForm.tipoJuros} onChange={handleRegraChange}
                      className={numCls + ' bg-white'}>
                      <option value={0}>Simples</option>
                      <option value={1}>Composto</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Taxa CP (% a.m.)</label>
                    <input type="number" name="taxaCp" value={regraForm.taxaCp} onChange={handleRegraChange}
                      min={0} step={0.01} className={numCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Taxa Juros Mora (% a.m.)</label>
                    <input type="number" name="taxaJurosMes" value={regraForm.taxaJurosMes} onChange={handleRegraChange}
                      min={0} step={0.01} className={numCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Multa (%)</label>
                    <input type="number" name="taxaMulta" value={regraForm.taxaMulta} onChange={handleRegraChange}
                      min={0} step={0.01} className={numCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Honorários (%)</label>
                    <input type="number" name="taxaHonorarios" value={regraForm.taxaHonorarios} onChange={handleRegraChange}
                      min={0} step={0.01} className={numCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Comissionamento (%)</label>
                    <input type="number" name="taxaComissionamento" value={regraForm.taxaComissionamento} onChange={handleRegraChange}
                      min={0} step={0.01} className={numCls} />
                  </div>
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" name="ativo" checked={regraForm.ativo} onChange={handleRegraChange}
                    className="w-4 h-4 text-ftech-600 rounded border-gray-300 focus:ring-ftech-500" />
                  <span className="text-sm text-gray-700">Regra Ativa</span>
                </label>

                {/* Regras de Parcelamento */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700">Regras de Parcelamento</p>
                    <button type="button" onClick={addParcelamento}
                      className="text-ftech-600 hover:text-ftech-800 text-xs font-medium px-3 py-1 rounded hover:bg-ftech-50 transition-colors">
                      + Adicionar
                    </button>
                  </div>
                  {regrasParcela.length === 0 ? (
                    <p className="text-xs text-gray-400 py-2">Nenhuma regra de parcelamento definida.</p>
                  ) : (
                    <div className="space-y-3">
                      {regrasParcela.map((rp, idx) => (
                        <div key={idx} className="grid grid-cols-4 gap-3 items-end border border-gray-100 rounded-lg p-3">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Máx. Parcelas</label>
                            <input type="number" value={rp.maxParcelas} min={1}
                              onChange={e => handleParcelaChange(idx, 'maxParcelas', e.target.value)}
                              className={numCls} />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Vlr. Mínimo (R$)</label>
                            <input type="number" value={rp.valorMinimoParcela} min={0} step={0.01}
                              onChange={e => handleParcelaChange(idx, 'valorMinimoParcela', e.target.value)}
                              className={numCls} />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Juros (% a.m.)</label>
                            <input type="number" value={rp.taxaJurosParcelamento} min={0} step={0.01}
                              onChange={e => handleParcelaChange(idx, 'taxaJurosParcelamento', e.target.value)}
                              className={numCls} />
                          </div>
                          <div className="flex gap-2 items-end">
                            <div className="flex-1">
                              <label className="block text-xs text-gray-500 mb-1">% Entrada</label>
                              <input type="number" value={rp.percentualEntrada} min={0} max={100} step={0.01}
                                onChange={e => handleParcelaChange(idx, 'percentualEntrada', e.target.value)}
                                className={numCls} />
                            </div>
                            <button type="button" onClick={() => removeParcelamento(idx)}
                              className="text-red-500 hover:text-red-700 p-2 rounded hover:bg-red-50 transition-colors mb-0.5">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Integração Cobransaas — apenas em edição */}
        {isEdit && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setCobransaasOpen(o => !o)}
              className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Integração Cobransaas
                </span>
                {cobransaasConfig ? (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cobransaasConfig.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {cobransaasConfig.ativo ? 'Ativa' : 'Inativa'}
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700">
                    Não configurada
                  </span>
                )}
              </div>
              <svg className={`w-4 h-4 text-gray-400 transition-transform ${cobransaasOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {cobransaasOpen && (
              <div className="px-6 pb-6 space-y-4 border-t border-gray-100 pt-4">
                {cobransaasError && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{cobransaasError}</div>
                )}
                {cobransaasSuccess && (
                  <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">{cobransaasSuccess}</div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Host <span className="text-red-500">*</span></label>
                    <input
                      type="url"
                      value={cobransaasForm.host}
                      onChange={e => setCobransaasForm(p => ({ ...p, host: e.target.value }))}
                      className={numCls}
                      placeholder="https://app.cobransaas.com.br"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">ApiKey / Token <span className="text-red-500">*</span></label>
                    <input
                      type="password"
                      value={cobransaasForm.apiKey}
                      onChange={e => setCobransaasForm(p => ({ ...p, apiKey: e.target.value }))}
                      className={numCls}
                      placeholder="Token Bearer ou ApiKey"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ID Assessoria Externa</label>
                    <input
                      type="text"
                      value={cobransaasForm.assessoriaExternaId ?? ''}
                      onChange={e => setCobransaasForm(p => ({ ...p, assessoriaExternaId: e.target.value }))}
                      className={numCls}
                      placeholder="ID no Cobransaas (opcional)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Modo de Sincronização</label>
                    <select
                      value={cobransaasForm.modoSincronizacao}
                      onChange={e => setCobransaasForm(p => ({ ...p, modoSincronizacao: e.target.value }))}
                      className={numCls + ' bg-white'}
                    >
                      <option value="CONTINUABLE">Continuable (cursor)</option>
                      <option value="OFFSET">Offset (página)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tamanho de Página</label>
                    <input
                      type="number"
                      min={1}
                      max={200}
                      value={cobransaasForm.tamanhoPagina}
                      onChange={e => setCobransaasForm(p => ({ ...p, tamanhoPagina: parseInt(e.target.value) || 20 }))}
                      className={numCls}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Seletores de Cliente</label>
                    <input
                      type="text"
                      value={cobransaasForm.seletoresCliente}
                      onChange={e => setCobransaasForm(p => ({ ...p, seletoresCliente: e.target.value }))}
                      className={numCls}
                      placeholder="telefones,emails,enderecos"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Observação</label>
                    <input
                      type="text"
                      value={cobransaasForm.observacao ?? ''}
                      onChange={e => setCobransaasForm(p => ({ ...p, observacao: e.target.value }))}
                      className={numCls}
                      placeholder="Notas livres sobre esta configuração"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cobransaasForm.ativo}
                        onChange={e => setCobransaasForm(p => ({ ...p, ativo: e.target.checked }))}
                        className="w-4 h-4 text-ftech-600 rounded border-gray-300 focus:ring-ftech-500"
                      />
                      <span className="text-sm text-gray-700">Integração ativa</span>
                    </label>
                  </div>
                </div>

                {cobransaasConfig && (
                  <div className="text-xs text-gray-400 space-y-0.5">
                    {cobransaasConfig.dataUltimaSincronizacao && (
                      <p>Última sincronização: {new Date(cobransaasConfig.dataUltimaSincronizacao).toLocaleString('pt-BR')}</p>
                    )}
                    {cobransaasConfig.ultimoLoteId && (
                      <p>Último lote: {cobransaasConfig.ultimoLoteId}</p>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSaveCobransaas}
                  disabled={savingCobransaas}
                  className="px-4 py-2 bg-ftech-600 text-white rounded-lg text-sm font-medium hover:bg-ftech-500 disabled:opacity-50 transition-colors"
                >
                  {savingCobransaas ? 'Salvando…' : cobransaasConfig ? 'Atualizar Cobransaas' : 'Criar Configuração'}
                </button>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="flex-1 bg-ftech-600 hover:bg-ftech-700 disabled:bg-ftech-400 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
            {saving ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Salvando...
              </>
            ) : 'Salvar'}
          </button>
          <button type="button" onClick={() => navigate('/carteira')}
            className="px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-lg transition-colors">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
