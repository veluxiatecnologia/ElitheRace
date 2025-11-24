import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Register = () => {
    const [formData, setFormData] = useState({
        nome: '',
        data_nascimento: '',
        email: '',
        senha: '',
        moto_atual: ''
    });
    const [error, setError] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await register(formData);
            navigate('/');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="container" style={{ maxWidth: '500px', marginTop: '50px' }}>
            <div className="card">
                <h2 className="text-center mb-4">Cadastro</h2>
                {error && <div className="text-red mb-4 text-center">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <label>Nome Completo</label>
                    <input name="nome" value={formData.nome} onChange={handleChange} required />

                    <label>Data de Nascimento</label>
                    <input type="date" name="data_nascimento" value={formData.data_nascimento} onChange={handleChange} required />

                    <label>Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required />

                    <label>Senha</label>
                    <input type="password" name="senha" value={formData.senha} onChange={handleChange} required />

                    <label>Moto Atual (Modelo/Cor)</label>
                    <input name="moto_atual" value={formData.moto_atual} onChange={handleChange} placeholder="Ex: Honda CB 500X Vermelha" />

                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Cadastrar</button>
                </form>
            </div>
        </div>
    );
};

export default Register;
