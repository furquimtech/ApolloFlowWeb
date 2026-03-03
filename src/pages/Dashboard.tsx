import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const cards = [
  {
    title: 'Aplicações',
    description: 'Gerencie as aplicações integradas ao ApolloFlow.',
    path: '/aplicacao',
    color: 'blue',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2v-4M9 21H5a2 2 0 01-2-2v-4m0 0h18" />
      </svg>
    ),
  },
  {
    title: 'Usuários',
    description: 'Gerencie os operadores e suas permissões de acesso.',
    path: '/operador',
    color: 'indigo',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

const colorMap: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600 group-hover:bg-blue-100',
  indigo: 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100',
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">
          Olá, {user?.username}!
        </h1>
        <p className="text-gray-500 mt-1">Bem-vindo ao painel de controle do ApolloFlow.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
        {cards.map((card) => (
          <button
            key={card.path}
            onClick={() => navigate(card.path)}
            className="group bg-white rounded-xl border border-gray-200 p-6 text-left hover:shadow-md transition-all duration-200 hover:border-blue-200"
          >
            <div className={`inline-flex p-3 rounded-xl mb-4 transition-colors ${colorMap[card.color]}`}>
              {card.icon}
            </div>
            <h3 className="font-semibold text-gray-800 mb-1">{card.title}</h3>
            <p className="text-sm text-gray-500">{card.description}</p>
            <div className="flex items-center gap-1 mt-4 text-blue-600 text-sm font-medium">
              Acessar
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
