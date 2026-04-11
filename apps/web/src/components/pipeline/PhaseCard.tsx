interface PhaseCardProps {
  phase: number;
  name: string;
  description: string;
  status: 'locked' | 'active' | 'completed';
  onClick: () => void;
}

const STATUS_STYLES = {
  locked: 'opacity-50 cursor-not-allowed border-gray-200 bg-gray-50',
  active: 'cursor-pointer border-purple-300 bg-white hover:shadow-md hover:border-purple-400',
  completed: 'cursor-pointer border-green-300 bg-green-50 hover:shadow-md',
};

const STATUS_BADGES = {
  locked: { text: 'Bloqueada', color: 'bg-gray-200 text-gray-600' },
  active: { text: 'Ativa', color: 'bg-purple-100 text-purple-700' },
  completed: { text: 'Concluída', color: 'bg-green-100 text-green-700' },
};

export default function PhaseCard({ phase, name, description, status, onClick }: PhaseCardProps) {
  const badge = STATUS_BADGES[status];

  return (
    <button
      onClick={status !== 'locked' ? onClick : undefined}
      disabled={status === 'locked'}
      className={`w-full text-left rounded-xl border p-5 transition-all ${STATUS_STYLES[status]}`}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-sm font-mono text-gray-400">FASE {phase}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.color}`}>
          {badge.text}
        </span>
      </div>
      <h3 className="font-semibold text-gray-900 mb-1">{name}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </button>
  );
}
