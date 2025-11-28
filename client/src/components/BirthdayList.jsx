import React from 'react';
import Badge from './Badge';

const BirthdayList = ({ data, loading }) => {
    if (loading) {
        return (
            <div className="card flex items-center justify-center min-h-[300px]">
                <div className="text-gray-400 animate-pulse">Carregando aniversariantes...</div>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="card">
                <h3 className="text-gold font-bold text-lg mb-4 flex items-center gap-2">
                    🎂 Aniversariantes da Semana
                </h3>
                <div className="text-gray-400 text-center py-8 opacity-50">
                    Nenhum aniversariante nos próximos dias.
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <h3 className="text-gold font-bold text-lg mb-4 flex items-center gap-2">
                🎂 Aniversariantes da Semana
            </h3>
            <div className="flex flex-col gap-3">
                {data.map((birthday) => (
                    <div key={birthday.userId}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${birthday.isToday
                            ? 'bg-gold/10 border-gold'
                            : 'bg-carbon border-glass-border'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">🎉</span>
                            <div>
                                <div className="font-bold flex items-center gap-2 text-white">
                                    {birthday.name}
                                    {birthday.isToday && (
                                        <Badge variant="warning" size="small">HOJE</Badge>
                                    )}
                                </div>
                                <div className="text-xs text-gray-400">
                                    {birthday.birthDate} ({birthday.dayOfWeek})
                                </div>
                            </div>
                        </div>
                        <div className={`text-sm font-medium ${birthday.isToday ? 'text-gold' : 'text-gray-500'}`}>
                            {birthday.daysUntil === 0 ? '🎂 É hoje!' : `Faltam ${birthday.daysUntil} dias`}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BirthdayList;
