import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ocorrenciaApi } from '../../api/ocorrencia';
import { clienteApi } from '../../api/cliente';
import { motivoContatoApi } from '../../api/motivoContato';
import { motivoAtrasoApi } from '../../api/motivoAtraso';
import { userApi } from '../../api/user';
import type { OcorrenciaRequest, Cliente, MotivoContato, MotivoAtraso, User } from '../../types';

const EMPTY: OcorrenciaRequest = {
  clienteId: 0, motivoContatoId: 0, motivoAtrasoId: 0,
  dataHoraContato: new Date().toISOString().slice(0, 16),
  dataAgendada: new Date().toISOString().slice(0, 10),
  usuarioResponsavelId: 0,
  situacao: 'Pendente', observacao: '',
  diasAtraso: 0, saldoAtual: 0, saldoAtraso: 0,
  cpc: '', telefone: '',
};

export default function OcorrenciaForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id && id !== 'novo';

  const [form, setForm] = useState<OcorrenciaRequest>(EMPTY);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [motivosContato, setMotivosContato] = useState<MotivoContato[]>([]);
  const [motivosAtraso, setMotivosAtraso] = useState<MotivoAtraso[]>([]);
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      clienteApi.getAll(),
      motivoContatoApi.getAll(),
      motivoAtrasoApi.getAll(),
      userApi.getAll(),
    ]).then(([c, mc, ma, u]) => {
      setClientes(c); setMotivosContato(mc); setMotivosAtraso(ma); setUsuarios(u);
    }).catch(() => setError('Erro ao carregar dados auxiliares.'));
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    ocorrenciaApi
      .getById(Number(id))
      .then((data) =>
        setForm({
          clienteId: data.clienteId,
          motivoContatoId: data.motivoContatoId,
          motivoAtrasoId: data.motivoAtrasoId,
          dataHoraContato: data.dataHoraContato?.slice(0, 16) ?? '',
          dataAgendada: data.dataAgendada?.slice(0, 10) ?? '',
          dataPromessa: data.dataPromessa?.slice(0, 10),
          usuarioResponsavelId: data.usuarioResponsavelId,
          situacao: data.situacao,
          observacao: data.observacao,
          diasAtraso: data.diasAtraso,
          saldoAtual: data.saldoAtual,
          saldoAtraso: data.saldoAtraso,
          cpc: data.cpc ?? '',
          telefone: data.telefone ?? '',
        })
      )
      .catch(() => setError('Erro ao carregar ocorrencia.'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSelectId(e: React.ChangeEvent<HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: parseInt(e.target.value) || 0 }));
  }

  function handleNumber(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: parseFloat(e.target.value) || 0 }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (isEdit) {
        await ocorrenciaApi.update(Number(id), form);
      } else {
        await ocorrenciaApi.create(form);
      }
      navigate('/ocorrencia');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { mensagem?: string } } })?.response?.data?.mensagem ??
        'Erro ao salvar ocorrencia.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-400';
  const selectClass =
    'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 bg-white';
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
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/ocorrencia')}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isEdit ? 'Editar Ocorrencia' : 'Nova Ocorrencia'}
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {isEdit ? 'Altere os dados e salve' : 'Preencha os dados da nova ocorrencia'}
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-5">

            {/* Row 1: Cliente / Responsavel */}
            <div>
              <label className={labelClass}>
                Cliente <span className="text-red-500">*</span>
              </label>
              <select
                name="clienteId"
                value={form.clienteId || ''}
                onChange={handleSelectId}
                required
                className={selectClass}
              >
                <option value="">Selecione...</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>
                Responsavel <span className="text-red-500">*</span>
              </label>
              <select
                name="usuarioResponsavelId"
                value={form.usuarioResponsavelId || ''}
                onChange={handleSelectId}
                required
                className={selectClass}
              >
                <option value="">Selecione...</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Row 2: Motivo Contato / Motivo Atraso */}
            <div>
              <label className={labelClass}>
                Motivo Contato <span className="text-red-500">*</span>
              </label>
              <select
                name="motivoContatoId"
                value={form.motivoContatoId || ''}
                onChange={handleSelectId}
                required
                className={selectClass}
              >
                <option value="">Selecione...</option>
                {motivosContato.map((mc) => (
                  <option key={mc.id} value={mc.id}>
                    {mc.descricao}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>
                Motivo Atraso <span className="text-red-500">*</span>
              </label>
              <select
                name="motivoAtrasoId"
                value={form.motivoAtrasoId || ''}
                onChange={handleSelectId}
                required
                className={selectClass}
              >
                <option value="">Selecione...</option>
                {motivosAtraso.map((ma) => (
                  <option key={ma.id} value={ma.id}>
                    {ma.descricao}
                  </option>
                ))}
              </select>
            </div>

            {/* Row 3: Data/Hora Contato / Data Agendada */}
            <div>
              <label className={labelClass}>
                Data/Hora Contato <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="dataHoraContato"
                value={form.dataHoraContato}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                Data Agendada <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="dataAgendada"
                value={form.dataAgendada}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>

            {/* Row 4: Situacao / CPC */}
            <div>
              <label className={labelClass}>Situacao</label>
              <select
                name="situacao"
                value={form.situacao}
                onChange={handleChange}
                className={selectClass}
              >
                <option value="Pendente">Pendente</option>
                <option value="Em Andamento">Em Andamento</option>
                <option value="Concluída">Concluida</option>
                <option value="Cancelada">Cancelada</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>CPC</label>
              <input
                type="text"
                name="cpc"
                value={form.cpc ?? ''}
                onChange={handleChange}
                placeholder="CPC"
                className={inputClass}
              />
            </div>

            {/* Row 5: Telefone / Dias Atraso */}
            <div>
              <label className={labelClass}>Telefone</label>
              <input
                type="text"
                name="telefone"
                value={form.telefone ?? ''}
                onChange={handleChange}
                placeholder="Telefone"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Dias Atraso</label>
              <input
                type="number"
                name="diasAtraso"
                value={form.diasAtraso}
                onChange={handleNumber}
                className={inputClass}
              />
            </div>

            {/* Row 6: Saldo Atual / Saldo Atraso */}
            <div>
              <label className={labelClass}>Saldo Atual</label>
              <input
                type="number"
                name="saldoAtual"
                value={form.saldoAtual}
                onChange={handleNumber}
                step={0.01}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Saldo Atraso</label>
              <input
                type="number"
                name="saldoAtraso"
                value={form.saldoAtraso}
                onChange={handleNumber}
                step={0.01}
                className={inputClass}
              />
            </div>

            {/* Row 7: Observacao (col-span-2) */}
            <div className="col-span-2">
              <label className={labelClass}>Observacao</label>
              <textarea
                name="observacao"
                value={form.observacao}
                onChange={handleChange}
                rows={4}
                placeholder="Observacoes sobre a ocorrencia"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-400 resize-none"
              />
            </div>

            {/* Data Promessa (optional) */}
            <div>
              <label className={labelClass}>Data Promessa</label>
              <input
                type="date"
                name="dataPromessa"
                value={form.dataPromessa ?? ''}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
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
              onClick={() => navigate('/ocorrencia')}
              className="px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
