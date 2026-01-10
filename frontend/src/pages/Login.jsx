import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '../services';
import { useAuthStore } from '../store';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { setAuth } = useAuthStore();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email || !password) {
            toast.error('يرجى إدخال البريد الإلكتروني وكلمة المرور');
            return;
        }

        setLoading(true);
        try {
            const response = await authService.login(email, password);

            if (response.success) {
                localStorage.setItem('token', response.data.token);
                setAuth(response.data.user, response.data.token);
                toast.success('تم تسجيل الدخول بنجاح');
                navigate('/');
            }
        } catch (error) {
            const message = error.response?.data?.message || 'حدث خطأ في تسجيل الدخول';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-layout">
            <div className="auth-left">
                <div className="auth-form-container animate-fade-in">
                    <div className="auth-logo">
                        <div className="auth-logo-icon">م</div>
                        <span className="auth-logo-text">مخزن POS</span>
                    </div>

                    <h1 className="auth-title">مرحباً بعودتك</h1>
                    <p className="auth-subtitle">
                        قم بتسجيل الدخول للوصول إلى لوحة التحكم
                    </p>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">البريد الإلكتروني</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="example@email.com"
                                disabled={loading}
                                autoFocus
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">كلمة المرور</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    disabled={loading}
                                    style={{ paddingLeft: 44 }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        left: 12,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--text-muted)',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary w-full"
                            disabled={loading}
                            style={{ marginTop: 8 }}
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    جاري تسجيل الدخول...
                                </>
                            ) : (
                                'تسجيل الدخول'
                            )}
                        </button>
                    </form>

                    <div style={{ marginTop: 32, padding: 16, background: 'var(--color-gray-50)', borderRadius: 'var(--border-radius)', fontSize: '0.875rem' }}>
                        <strong>بيانات تجريبية:</strong>
                        <div style={{ marginTop: 8, color: 'var(--text-secondary)' }}>
                            <div>البريد: admin@makhzan.com</div>
                            <div>كلمة المرور: admin123</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="auth-right">
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: 120,
                        height: 120,
                        background: 'rgba(255,255,255,0.15)',
                        borderRadius: 24,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 32px',
                        fontSize: 48,
                        fontWeight: 700
                    }}>
                        م
                    </div>
                    <h2>نظام مخزن POS</h2>
                    <p>نظام متكامل لإدارة مخزون الملابس، الفروع، ونقاط البيع</p>
                </div>
            </div>
        </div>
    );
}
