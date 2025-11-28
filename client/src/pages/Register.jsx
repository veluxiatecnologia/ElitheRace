import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import FormCard from '../components/FormCard';
import Input from '../components/Input';
import Button from '../components/Button';
import './Register.css';

const Register = () => {
    const [formData, setFormData] = useState({
        nome: '',
        data_nascimento: '',
        email: '',
        senha: '',
        moto_atual: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingGoogle, setLoadingGoogle] = useState(false);
    const { register, signInWithGoogle } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await register(formData);
            navigate('/');
        } catch (err) {
            setError(err.message || 'Erro ao criar conta');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignup = async () => {
        setError('');
        setLoadingGoogle(true);

        try {
            await signInWithGoogle();
        } catch (err) {
            setError(err.message || 'Erro ao cadastrar com Google');
            setLoadingGoogle(false);
        }
    };

    return (
        <div className="register-page">
            <div className="register-background"></div>

            <FormCard
                title="Criar Conta"
                subtitle="Junte-se à família Elithe Racing"
                maxWidth={500}
            >
                <div className="register-logo">
                    🏍️
                </div>

                {error && (
                    <div className="register-error animate-shake">
                        <span className="register-error-icon">⚠️</span>
                        {error}
                    </div>
                )}

                {/* Google OAuth */}
                <button
                    onClick={handleGoogleSignup}
                    disabled={loadingGoogle}
                    className="google-btn"
                >
                    {loadingGoogle ? (
                        <>
                            <span className="google-btn-spinner"></span>
                            Redirecionando...
                        </>
                    ) : (
                        <>
                            <span>🔍</span>
                            Cadastrar com Google
                        </>
                    )}
                </button>

                <div className="register-separator">
                    <span>ou preencha o formulário</span>
                </div>

                {/* Registration Form */}
                <form onSubmit={handleSubmit} className="register-form">
                    <Input
                        label="Nome Completo"
                        type="text"
                        name="nome"
                        value={formData.nome}
                        onChange={handleChange}
                        icon="👤"
                        required
                        disabled={loading}
                        helperText="Como você gostaria de ser chamado"
                    />

                    <Input
                        label="Data de Nascimento"
                        type="date"
                        name="data_nascimento"
                        value={formData.data_nascimento}
                        onChange={handleChange}
                        icon="📅"
                        required
                        disabled={loading}
                    />

                    <Input
                        label="Email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        icon="📧"
                        required
                        disabled={loading}
                        helperText="Usaremos para suas confirmações"
                    />

                    <Input
                        label="Senha"
                        type="password"
                        name="senha"
                        value={formData.senha}
                        onChange={handleChange}
                        icon="🔒"
                        required
                        disabled={loading}
                        helperText="Mínimo 6 caracteres"
                    />

                    <Input
                        label="Moto Atual"
                        type="text"
                        name="moto_atual"
                        value={formData.moto_atual}
                        onChange={handleChange}
                        icon="🏍️"
                        required
                        disabled={loading}
                        helperText="Ex: Honda CBR 600"
                    />

                    <Button
                        type="submit"
                        variant="primary"
                        size="large"
                        fullWidth
                        loading={loading}
                    >
                        Criar Conta
                    </Button>
                </form>

                {/* Login Link */}
                <div className="register-login">
                    <span>Já tem uma conta? </span>
                    <Link to="/login" className="register-login-link">
                        Faça login
                    </Link>
                </div>
            </FormCard>
        </div>
    );
};

export default Register;
