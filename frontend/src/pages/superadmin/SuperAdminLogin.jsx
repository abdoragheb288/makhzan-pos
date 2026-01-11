import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { superAdminService } from '../../services/superadmin.service';

export default function SuperAdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email || !password) {
            toast.error('يرجى إدخال البريد الإلكتروني وكلمة المرور');
            return;
        }

        setLoading(true);
        try {
            const response = await superAdminService.login(email, password);

            if (response.success) {
                sessionStorage.setItem('superAdminToken', response.data.token);
                sessionStorage.setItem('superAdmin', JSON.stringify(response.data.user));
                toast.success('تم تسجيل الدخول بنجاح');
                navigate('/superadmin/dashboard');
            }
        } catch (error) {
            const message = error.response?.data?.message || 'حدث خطأ في تسجيل الدخول';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-layout" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}>
            <div className="auth-left">
                <div className="auth-form-container animate-fade-in">
                    <div className="auth-logo">
                        <div className="auth-logo-icon" style={{ background: 'linear-gradient(135deg, #e94560, #0f3460)' }}>
                            <Shield size={28} />
                        </div>
                        <span className="auth-logo-text">Super Admin</span>
                    </div>

                    <h1 className="auth-title">لوحة تحكم المسؤول</h1>
                    <p className="auth-subtitle">
                        قم بتسجيل الدخول لإدارة المشتركين والاشتراكات
                    </p>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">البريد الإلكتروني</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="superadmin@makhzan.com"
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
                            style={{ marginTop: 8, background: 'linear-gradient(135deg, #e94560, #0f3460)' }}
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

                    <div style={{ marginTop: 24, textAlign: 'center' }}>
                        <a href="/login" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                            ← العودة لتسجيل دخول المستخدمين
                        </a>
                    </div>
                </div>
            </div>

            <div className="auth-right" style={{ background: 'linear-gradient(135deg, #e94560 0%, #0f3460 100%)' }}>
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
                    }}>
                        <Shield size={60} />
                    </div>
                    <h2>لوحة تحكم Super Admin</h2>
                    <p>إدارة المشتركين والاشتراكات ومراقبة النظام</p>
                </div>
            </div>
        </div>
    );
}
