import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface NavItem { label: string; path: string; icon: React.ReactNode; }
interface NavGroup {
  id: 'operacional' | 'cadastros' | 'administracao';
  group: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    id: 'operacional',
    group: 'Operacional',
    items: [
      {
        label: 'Atendimento', path: '/atendimento',
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4v-4z" /></svg>,
      },
      {
        label: 'Fila de Cobrança', path: '/fila',
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>,
      },
      {
        label: 'Clientes', path: '/cliente',
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
      },
      {
        label: 'Contratos', path: '/contrato',
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
      },
      {
        label: 'Ocorrências', path: '/ocorrencia',
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
      },
    ],
  },
  {
    id: 'cadastros',
    group: 'Cadastros',
    items: [
      {
        label: 'Assessorias', path: '/assessoria',
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
      },
      {
        label: 'Carteiras', path: '/carteira',
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
      },
      {
        label: 'Produtos', path: '/produto',
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
      },
      {
        label: 'Motivo de Contato', path: '/motivo-contato',
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
      },
      {
        label: 'Motivo de Atraso', path: '/motivo-atraso',
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      },
    ],
  },
  {
    id: 'administracao',
    group: 'Administração',
    items: [
      {
        label: 'Aplicações', path: '/aplicacao',
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2v-4M9 21H5a2 2 0 01-2-2v-4m0 0h18" /></svg>,
      },
      {
        label: 'Usuários', path: '/usuario',
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
      },
    ],
  },
];

export default function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openGroups, setOpenGroups] = useState<Record<NavGroup['id'], boolean>>({
    operacional: true,
    cadastros: true,
    administracao: true,
  });

  function handleLogout() { logout(); navigate('/login'); }
  function toggleGroup(groupId: NavGroup['id']) {
    setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-ftech-900 text-white flex flex-col transition-all duration-300 ease-in-out shrink-0`}>
        <div className="flex items-center justify-center border-b border-ftech-800 p-3">
          {sidebarOpen ? (
            <img src="/apollo_logotipo.png" alt="Apollo Flow" className="h-20 w-auto rounded-lg" />
          ) : (
            <img src="/apollo_logotipo.png" alt="Apollo Flow" className="h-9 w-9 rounded-lg object-cover object-top" />
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {navGroups.map((group) => (
            <div key={group.id}>
              {sidebarOpen && (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="w-full px-3 py-1.5 mb-1 rounded-md bg-ftech-800/70 hover:bg-ftech-800 text-left text-xs font-semibold text-ftech-200 uppercase tracking-wider flex items-center justify-between transition-colors"
                >
                  <span>{group.group}</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${openGroups[group.id] ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
              <div className={`${!sidebarOpen || openGroups[group.id] ? 'space-y-0.5' : 'hidden'}`}>
                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    title={!sidebarOpen ? item.label : undefined}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-150 ${
                        isActive
                          ? 'bg-ftech-700 text-white'
                          : 'text-ftech-200 hover:bg-ftech-800 hover:text-white'
                      }`
                    }
                  >
                    <span className="shrink-0">{item.icon}</span>
                    {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {sidebarOpen && (
          <div className="px-4 py-3 border-t border-ftech-800 flex items-center justify-center">
            <img src="/ftech_logotipo.png" alt="FTech" className="h-10 w-auto rounded-lg opacity-90" />
          </div>
        )}

        <button
          onClick={() => setSidebarOpen((o) => !o)}
          className="p-4 border-t border-ftech-800 text-ftech-300 hover:text-white hover:bg-ftech-800 transition-colors flex items-center gap-3"
        >
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d={sidebarOpen ? 'M11 19l-7-7 7-7m8 14l-7-7 7-7' : 'M13 5l7 7-7 7M5 5l7 7-7 7'} />
          </svg>
          {sidebarOpen && <span className="text-sm">Recolher menu</span>}
        </button>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <h2 className="text-gray-600 text-sm font-medium">
            Bem-vindo, <span className="text-gray-900 font-semibold">{user?.nome || user?.username}</span>
          </h2>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sair
          </button>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
