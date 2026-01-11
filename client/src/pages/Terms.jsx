import React from 'react';
import './Legal.css';

const Terms = () => {
    return (
        <div className="legal-container">
            <div className="legal-content">
                <h1>Termos de Uso</h1>
                <p>Última atualização: 11/01/2026</p>

                <h2>1. Aceitação</h2>
                <p>Ao acessar e usar o aplicativo Elithe Racing, você concorda com estes termos. O aplicativo é destinado exclusivamente para membros e convidados do motoclube.</p>

                <h2>2. Uso do Serviço</h2>
                <p>Você concorda em usar o serviço apenas para fins legítimos, relacionados à organização e participação em eventos do motoclube. É proibido o uso para spam, assédio ou atividades ilegais.</p>

                <h2>3. Contas</h2>
                <p>Você é responsável por manter a confidencialidade de sua senha. Notifique a administração imediatamente sobre qualquer uso não autorizado.</p>

                <h2>4. Conteúdo</h2>
                <p>Ao compartilhar fotos ou comentários, você concede ao Elithe Racing o direito de uso interno para divulgação dos eventos do clube.</p>

                <h2>5. Responsabilidade</h2>
                <p>O Elithe Racing não se responsabiliza por incidentes ocorridos durante os trajetos ou eventos. Cada membro é responsável por sua própria segurança e conformidade com as leis de trânsito.</p>
            </div>
        </div>
    );
};

export default Terms;
