import React from 'react';
import Badge from './Badge';

const Top10List = ({ data, loading }) => {
    const getMedalEmoji = (index) => {
        switch (index) {
            case 0: return '🥇';
            case 1: return '🥈';
            case 2: return '🥉';
            default: return `${index + 1}º`;
        }
    };

    if (loading) {
        return (
            <div className="card flex items-center justify-center min-h-[300px]">
                <div className="text-gray-400 animate-pulse">Carregando ranking...</div>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="card">
                <h3 className="text-gold font-bold text-lg mb-4 flex items-center gap-2">
                    🏆 Top 10 Mais Participativos
                </h3>
                <div className="text-gray-400 text-center py-8 opacity-50">
                    Nenhum dado de participação ainda.
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <h3 className="text-gold font-bold text-lg mb-4 flex items-center gap-2">
                🏆 Top 10 Mais Participativos
            </h3>
            <div className="flex flex-col gap-3">
                {data.map((participant, index) => (
                    <div key={participant.userId}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 hover:translate-x-1 ${index < 3
                                ? 'bg-carbon-light border-gold/30'
                                : 'bg-carbon border-glass-border'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <span className={`text-xl font-bold min-w-[30px] ${index < 3 ? 'text-gold' : 'text-gray-500'}`}>
                                {getMedalEmoji(index)}
                            </span>
                            <span className={`font-medium ${index < 3 ? 'text-white' : 'text-gray-300'}`}>
                                {participant.name}
                            </span>
                        </div>
                        <div className="text-right">
                            <div className="text-gold font-bold">
                                {participant.rate}%
                            </div>
                            <div className="text-xs text-gray-500">
                                {participant.confirmed}/{participant.total} eventos
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Top10List;
