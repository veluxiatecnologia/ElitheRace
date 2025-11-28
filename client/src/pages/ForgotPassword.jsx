import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import FormCard from '../components/FormCard';
import Input from '../components/Input';
import Button from '../components/Button';
import toast from 'react-hot-toast';
import './ForgotPassword.css';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) throw error;

            setSuccess(true);
            toast.success('Email de recuperação enviado!');
        } catch (error) {
            console.error('Error:', error);
            toast.error(error.message || 'Erro ao enviar email');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="forgot-page">
            <div className="forgot-background"></div>

            <FormCard
                title={success ? "Email Enviado!" : "Recuperar Senha"}
                subtitle={success ? "Verifique sua caixa de entrada" : "Informe seu email para recuperação"}
                maxWidth={450}
            >
                <div className="forgot-icon">
                    {success ? '✅' : '🔑'}
                </div>

                {success ? (
                    <div className="forgot-success">
                        <p className="forgot-success-text">
                            Enviamos um link de recuperação para <strong>{email}</strong>
                        </p>
                        <p className="forgot-success-helper">
                            Verifique sua caixa de entrada e spam. O link expira em 1 hora.
                        </p>
                        <Link to="/login">
                            <Button variant="primary" size="large" fullWidth>
                                Voltar para Login
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="forgot-form">
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

                        <Button
                            type="submit"
                            variant="primary"
                            size="large"
                            fullWidth
                            loading={loading}
                        >
                            Enviar Link de Recuperação
                        </Button>

                        <Link to="/login" className="forgot-back-link">
                            ← Voltar para login
                        </Link>
                    </form>
                )}
            </FormCard>
        </div>
    );
};

export default ForgotPassword;
