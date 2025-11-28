import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import FormCard from '../components/FormCard';
import Input from '../components/Input';
import Button from '../components/Button';
import toast from 'react-hot-toast';
import './ResetPassword.css';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const getPasswordStrength = (pwd) => {
        if (pwd.length < 6) return { level: 'weak', text: 'Fraca', color: 'var(--color-error)' };
        if (pwd.length < 10) return { level: 'medium', text: 'Média', color: 'var(--color-warning)' };
        return { level: 'strong', text: 'Forte', color: 'var(--color-success)' };
    };

    const strength = password ? getPasswordStrength(password) : null;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error('As senhas não coincidem!');
            return;
        }

        if (password.length < 6) {
            toast.error('A senha deve ter pelo menos 6 caracteres');
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({ password });

            if (error) throw error;

            toast.success('✅ Senha atualizada com sucesso!');
            setTimeout(() => navigate('/login'), 2000);
        } catch (error) {
            console.error('Error:', error);
            toast.error(error.message || 'Erro ao atualizar senha');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="reset-page">
            <div className="reset-background"></div>

            <FormCard
                title="Nova Senha"
                subtitle="Crie uma senha segura para sua conta"
                maxWidth={450}
            >
                <div className="reset-icon">
                    🔐
                </div>

                <form onSubmit={handleSubmit} className="reset-form">
                    <div>
                        <Input
                            label="Nova Senha"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            icon="🔒"
                            required
                            disabled={loading}
                            helperText="Mínimo 6 caracteres"
                        />

                        {strength && (
                            <div className="password-strength">
                                <div className="password-strength-label">
                                    Força da senha: <span style={{ color: strength.color, fontWeight: 600 }}>{strength.text}</span>
                                </div>
                                <div className="password-strength-bar">
                                    <div
                                        className={`password-strength-fill ${strength.level}`}
                                        style={{ width: strength.level === 'weak' ? '33%' : strength.level === 'medium' ? '66%' : '100%' }}
                                    ></div>
                                </div>
                            </div>
                        )}
                    </div>

                    <Input
                        label="Confirmar Senha"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        icon="🔒"
                        required
                        disabled={loading}
                        error={confirmPassword && password !== confirmPassword ? 'As senhas não coincidem' : ''}
                    />

                    <Button
                        type="submit"
                        variant="success"
                        size="large"
                        fullWidth
                        loading={loading}
                    >
                        Redefinir Senha
                    </Button>
                </form>
            </FormCard>
        </div>
    );
};

export default ResetPassword;
