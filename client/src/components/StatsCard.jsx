import React from 'react';

const StatsCard = ({ icon, title, value, subtitle, color = 'gold' }) => {
    const colorMap = {
        gold: 'text-gold border-gold',
        red: 'text-red-500 border-red-500',
        green: 'text-green-500 border-green-500',
        blue: 'text-blue-500 border-blue-500'
    };

    const valueColorMap = {
        gold: 'text-gold',
        red: 'text-red-500',
        green: 'text-green-500',
        blue: 'text-blue-500'
    };

    return (
        <div className="card hover:border-gold transition-all duration-300 transform hover:-translate-y-1 text-center flex flex-col justify-between min-h-[140px]">
            <div className="text-3xl mb-2">{icon}</div>
            <div className="text-xs uppercase tracking-wider text-gray-400 mb-2 font-bold">
                {title}
            </div>
            <div className={`text-2xl font-bold ${valueColorMap[color] || 'text-white'} mb-1`}>
                {value}
            </div>
            {subtitle && (
                <div className="text-xs text-gray-500">
                    {subtitle}
                </div>
            )}
        </div>
    );
};

export default StatsCard;
