import React from 'react';
import './Legal.css';

const Privacy = () => {
    return (
        <div className="legal-container">
            <div className="legal-content">
                <h1>Política de Privacidade</h1>
                <p>Última atualização: 11/01/2026</p>

                <h2>1. Coleta de Dados</h2>
                <p>Coletamos informações essenciais para a organização dos eventos:</p>
                <ul>
                    <li>Nome e Email (para identificação e login)</li>
                    <li>Modelo da Moto (para organização dos bondes)</li>
                    <li>Foto de Perfil (opcional)</li>
                </ul>

                <h2>2. Uso das Informações</h2>
                <p>Seus dados são usados exclusivamente para:</p>
                <ul>
                    <li>Confirmar presença em eventos</li>
                    <li>Gerar listas de participação (WhatsApp)</li>
                    <li>Comunicação sobre alterações em eventos</li>
                </ul>

                <h2>3. Compartilhamento</h2>
                <p>Não vendemos nem compartilhamos seus dados com terceiros. As listas de presença são compartilhadas apenas internamente no grupo do WhatsApp do clube.</p>

                <h2>4. Segurança</h2>
                <p>Utilizamos criptografia e práticas de segurança modernas para proteger seus dados. Suas senhas são armazenadas de forma segura e inacessível pela administração.</p>

                <h2>5. Seus Direitos</h2>
                <p>Você pode solicitar a exclusão de sua conta e dados a qualquer momento entrando em contato com a administração do clube.</p>
            </div>
        </div>
    );
};

export default Privacy;
