import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import FormCard from '../components/FormCard';
import Input from '../components/Input';
import Button from '../components/Button';
import './Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingGoogle, setLoadingGoogle] = useState(false);
    const { login, signInWithGoogle } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, senha);
            navigate('/');
        } catch (err) {
            setError(err.message || 'Erro ao fazer login');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        setLoadingGoogle(true);

        try {
            await signInWithGoogle();
            // OAuth will redirect automatically
        } catch (err) {
            setError(err.message || 'Erro ao fazer login com Google');
            setLoadingGoogle(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-background"></div>

            <FormCard
                title="Bem-vindo"
                subtitle="Entre para gerenciar seus eventos e confirmações"
                maxWidth={450}
            >
                {/* Logo/Icon */}
                <div className="login-logo">
                    🏍️
                </div>

                {error && (
                    <div className="login-error animate-shake">
                        <span className="login-error-icon">⚠️</span>
                        {error}
                    </div>
                )}

                {/* Google OAuth Button */}
                <button
                    onClick={handleGoogleLogin}
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
                            <img
                                src="/assets/google-icon.svg"
                                alt="Google"
                                className="google-icon"
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                            <span>🔍</span> {/* Fallback icon */}
                            Continuar com Google
                        </>
                    )}
                </button>

                {/* Separator */}
                <div className="login-separator">
                    <span>ou use email</span>
                </div>

                {/* Email/Password Form */}
                <form onSubmit={handleSubmit} className="login-form">
                    <Input
                        label="Email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        icon="📧"
                        required
                        disabled={loading}
                        helperText="Use o email cadastrado na plataforma"
                    />

                    <Input
                        label="Senha"
                        type="password"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        icon="🔒"
                        required
                        disabled={loading}
                    />

                    <Button
                        type="submit"
                        variant="primary"
                        size="large"
                        fullWidth
                        loading={loading}
                    >
                        Entrar
                    </Button>
                </form>

                {/* Forgot Password Link */}
                <Link to="/forgot-password" className="login-forgot-link">
                    Esqueceu a senha?
                </Link>

                {/* Register Link */}
                <div className="login-register">
                    <span>Não tem uma conta? </span>
                    <Link to="/register" className="login-register-link">
                        Cadastre-se aqui
                    </Link>
                </div>
            </FormCard>
        </div>
    );
};

export default Login;
