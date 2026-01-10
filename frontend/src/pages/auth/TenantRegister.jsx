import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Loader2, Building2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '../../services';

export default function TenantRegister() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        adminName: '',
        adminEmail: '',
        adminPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await authService.registerTenant(formData);
            if (response.success) {
                toast.success('تم إنشاء حساب شركتك بنجاح! يرجى تسجيل الدخول.');
                navigate('/login');
            }
        } catch (error) {
            const message = error.response?.data?.message || 'حدث خطأ في التسجيل';
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
                        <div className="auth-logo-icon">
                            <Building2 size={28} />
                        </div>
                        <span className="auth-logo-text">مخزن POS</span>
                    </div>

                    <h1 className="auth-title">أنشئ حساب لشركتك</h1>
                    <p className="auth-subtitle">
                        ابدأ فترتك التجريبية لمدة 7 أيام مجاناً
                    </p>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">اسم الشركة / المحل</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="مثال: سوبر ماركت الحمد"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div className="form-group">
                                <label className="form-label">بريد الشركة</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="company@example.com"
                                    required
                                    disabled={loading}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">هاتف الشركة</label>
                                <input
                                    type="text"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="010xxxxxxx"
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="divider" style={{ margin: '24px 0', borderTop: '1px solid var(--border-color)', position: 'relative' }}>
                            <span style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: 'var(--bg-primary)', padding: '0 12px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>بيانات المدير</span>
                        </div>

                        <div className="form-group">
                            <label className="form-label">اسم المدير</label>
                            <input
                                type="text"
                                value={formData.adminName}
                                onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                                placeholder="الاسم بالكامل"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">بريد تسجيل الدخول</label>
                            <input
                                type="email"
                                value={formData.adminEmail}
                                onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                                placeholder="admin@example.com"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">كلمة المرور</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.adminPassword}
                                    onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                                    placeholder="••••••••"
                                    disabled={loading}
                                    style={{ paddingLeft: 44 }}
                                    required
                                    minLength={6}
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
                            style={{ marginTop: 24, padding: 12, fontSize: '1rem' }}
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    جاري إنشاء الحساب...
                                </>
                            ) : (
                                'إنشاء حساب جديد'
                            )}
                        </button>
                    </form>

                    <div style={{ marginTop: 24, textAlign: 'center' }}>
                        <p style={{ color: 'var(--text-muted)' }}>
                            لديك حساب بالفعل؟{' '}
                            <Link to="/login" style={{ color: 'var(--color-primary-600)', fontWeight: 600 }}>
                                تسجيل الدخول
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            <div className="auth-right">
                <div style={{ textAlign: 'center', maxWidth: 400 }}>
                    <div style={{
                        width: 80,
                        height: 80,
                        background: 'rgba(255,255,255,0.2)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 24px',
                    }}>
                        <UserPlus size={40} color="white" />
                    </div>
                    <h2 style={{ color: 'white', fontSize: '2rem', marginBottom: 16 }}>انضم إلينا اليوم</h2>
                    <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, fontSize: '1.1rem' }}>
                        نظام مخزن POS هو الحل الأمثل لإدارة مبيعاتك ومخزونك. سجل الآن واحصل على فترة تجريبية مجانية.
                    </p>
                </div>
            </div>
        </div>
    );
}
