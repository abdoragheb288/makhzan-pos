import { useState, useEffect } from 'react';
import { Clock, Play, Square } from 'lucide-react';
import toast from 'react-hot-toast';
import { shiftService, branchService } from '../services';
import { useAuthStore } from '../store';
import { formatCurrency } from '../utils/helpers';

export default function ShiftWidget() {
    const { user } = useAuthStore();
    const [currentShift, setCurrentShift] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showStartModal, setShowStartModal] = useState(false);
    const [showEndModal, setShowEndModal] = useState(false);
    const [startData, setStartData] = useState({ openingBalance: '' });
    const [endData, setEndData] = useState({ actualCash: '', notes: '' });
    const [elapsed, setElapsed] = useState('');
    const [branches, setBranches] = useState([]);

    useEffect(() => {
        fetchCurrentShift();
        branchService.getAll({ limit: 100 }).then(res => res.success && setBranches(res.data)).catch(() => { });
    }, []);

    // Update elapsed time every minute
    useEffect(() => {
        if (!currentShift) return;

        const updateElapsed = () => {
            const start = new Date(currentShift.openedAt);
            const now = new Date();
            const diff = Math.floor((now - start) / 1000 / 60);
            const hours = Math.floor(diff / 60);
            const mins = diff % 60;
            setElapsed(`${hours}س ${mins}د`);
        };

        updateElapsed();
        const interval = setInterval(updateElapsed, 60000);
        return () => clearInterval(interval);
    }, [currentShift]);

    const fetchCurrentShift = async () => {
        try {
            const response = await shiftService.getCurrent();
            if (response.success) setCurrentShift(response.data);
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    const handleStartShift = async (e) => {
        e.preventDefault();
        if (!user?.branchId) {
            toast.error('لم يتم تعيين فرع لك. تواصل مع المشرف.');
            return;
        }
        try {
            await shiftService.open({
                branchId: user.branchId,
                openingBalance: startData.openingBalance,
            });
            toast.success('تم بدء الوردية بنجاح ✅');
            setShowStartModal(false);
            setStartData({ openingBalance: '' });
            fetchCurrentShift();
        } catch (error) {
            toast.error(error.response?.data?.message || 'حدث خطأ');
        }
    };

    const handleEndShift = async (e) => {
        e.preventDefault();
        if (!currentShift) return;
        try {
            const response = await shiftService.close(currentShift.id, endData);
            const diff = response.data?.difference || 0;
            if (diff === 0) {
                toast.success('تم إنهاء الوردية بنجاح ✅ الصندوق مطابق');
            } else {
                toast(diff > 0 ? `فارق +${formatCurrency(diff)} زيادة` : `فارق ${formatCurrency(diff)} نقص`, { icon: '⚠️' });
            }
            setShowEndModal(false);
            setEndData({ actualCash: '', notes: '' });
            setCurrentShift(null);
        } catch (error) {
            toast.error(error.response?.data?.message || 'حدث خطأ');
        }
    };

    if (loading) return null;

    return (
        <>
            {/* Shift Status Button */}
            <div style={{ position: 'relative' }}>
                {currentShift ? (
                    <button
                        onClick={() => setShowEndModal(true)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 16px',
                            background: 'linear-gradient(135deg, var(--color-success-500), var(--color-success-600))',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)',
                        }}
                        title="اضغط لإنهاء الوردية"
                    >
                        <div style={{
                            width: 8, height: 8,
                            background: '#fff',
                            borderRadius: '50%',
                            animation: 'pulse 2s infinite'
                        }} />
                        <Clock size={16} />
                        <span>وردية مفتوحة • {elapsed}</span>
                    </button>
                ) : (
                    <button
                        onClick={() => setShowStartModal(true)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 16px',
                            background: 'var(--bg-tertiary)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 500,
                            fontSize: '0.875rem',
                        }}
                        title="بدء وردية جديدة"
                    >
                        <Play size={16} />
                        <span>بدء الوردية</span>
                    </button>
                )}
            </div>

            {/* Start Shift Modal */}
            {showStartModal && (
                <div className="modal-overlay" onClick={() => setShowStartModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
                        <div className="modal-header">
                            <h3 className="modal-title">🟢 بدء وردية جديدة</h3>
                            <button className="modal-close" onClick={() => setShowStartModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleStartShift}>
                            <div className="modal-body">
                                <div style={{ background: 'var(--color-primary-50)', padding: 'var(--spacing-md)', borderRadius: 8, marginBottom: 'var(--spacing-md)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <span style={{ color: 'var(--color-primary-700)' }}>👤 الموظف:</span>
                                        <strong style={{ color: 'var(--color-primary-700)' }}>{user?.name}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--color-primary-700)' }}>🏢 الفرع:</span>
                                        <strong style={{ color: 'var(--color-primary-700)' }}>
                                            {user?.branchId
                                                ? branches.find(b => b.id === user.branchId)?.name || 'الفرع الأساسي'
                                                : 'غير محدد'}
                                        </strong>
                                    </div>
                                </div>
                                {!user?.branchId && (
                                    <div style={{ background: 'var(--color-warning-50)', padding: 'var(--spacing-sm)', borderRadius: 8, marginBottom: 'var(--spacing-md)', color: 'var(--color-warning-700)', fontSize: '0.875rem' }}>
                                        ⚠️ لم يتم تعيين فرع لك. تواصل مع المشرف.
                                    </div>
                                )}
                                <div className="form-group">
                                    <label className="form-label">رصيد الافتتاح (النقدية في الصندوق)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={startData.openingBalance}
                                        onChange={(e) => setStartData({ ...startData, openingBalance: e.target.value })}
                                        required
                                        min="0"
                                        step="0.01"
                                        placeholder="أدخل المبلغ الموجود في الصندوق"
                                        style={{ fontSize: '1.25rem', fontWeight: 600, textAlign: 'center' }}
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowStartModal(false)}>إلغاء</button>
                                <button type="submit" className="btn btn-success" disabled={!user?.branchId}>
                                    <Play size={18} /> بدء الوردية
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* End Shift Modal */}
            {showEndModal && currentShift && (
                <div className="modal-overlay" onClick={() => setShowEndModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
                        <div className="modal-header">
                            <h3 className="modal-title">🔴 إنهاء الوردية</h3>
                            <button className="modal-close" onClick={() => setShowEndModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleEndShift}>
                            <div className="modal-body">
                                <div style={{ background: 'var(--color-success-50)', padding: 'var(--spacing-md)', borderRadius: 8, marginBottom: 'var(--spacing-md)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <span>رصيد الافتتاح:</span>
                                        <strong>{formatCurrency(currentShift.openingBalance)}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <span>الفرع:</span>
                                        <strong>{currentShift.branch?.name}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>مدة الوردية:</span>
                                        <strong>{elapsed}</strong>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">النقدية الفعلية في الصندوق الآن</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={endData.actualCash}
                                        onChange={(e) => setEndData({ ...endData, actualCash: e.target.value })}
                                        required
                                        min="0"
                                        step="0.01"
                                        placeholder="عد النقدية وأدخل المبلغ"
                                        style={{ fontSize: '1.25rem', fontWeight: 600, textAlign: 'center' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">ملاحظات (اختياري)</label>
                                    <textarea
                                        className="form-input"
                                        value={endData.notes}
                                        onChange={(e) => setEndData({ ...endData, notes: e.target.value })}
                                        rows={2}
                                        placeholder="أي ملاحظات عن الوردية..."
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowEndModal(false)}>إلغاء</button>
                                <button type="submit" className="btn btn-danger">
                                    <Square size={18} /> إنهاء الوردية
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>
        </>
    );
}
