import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Store, Receipt, Bell, Shield, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store';

export default function Settings() {
    const { user, updateUser } = useAuthStore();
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(false);

    const [generalSettings, setGeneralSettings] = useState({
        storeName: 'مخزن POS',
        storePhone: '02-12345678',
        storeAddress: 'شارع التحرير، القاهرة',
        currency: 'EGP',
        taxRate: 14,
    });

    const [receiptSettings, setReceiptSettings] = useState({
        showLogo: true,
        showAddress: true,
        showPhone: true,
        footerText: 'شكراً لتعاملكم معنا',
        printAutomatically: false,
    });

    const [notificationSettings, setNotificationSettings] = useState({
        lowStockAlert: true,
        lowStockThreshold: 5,
        salesNotification: true,
        transferNotification: true,
    });

    const [profileData, setProfileData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    useEffect(() => {
        if (user) {
            setProfileData({
                ...profileData,
                name: user.name,
                email: user.email,
                phone: user.phone || '',
            });
        }
    }, [user]);

    const handleSaveGeneral = async () => {
        setLoading(true);
        await new Promise(r => setTimeout(r, 500));
        localStorage.setItem('generalSettings', JSON.stringify(generalSettings));
        toast.success('تم حفظ الإعدادات');
        setLoading(false);
    };

    const handleSaveReceipt = async () => {
        setLoading(true);
        await new Promise(r => setTimeout(r, 500));
        localStorage.setItem('receiptSettings', JSON.stringify(receiptSettings));
        toast.success('تم حفظ إعدادات الفاتورة');
        setLoading(false);
    };

    const handleSaveNotifications = async () => {
        setLoading(true);
        await new Promise(r => setTimeout(r, 500));
        localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
        toast.success('تم حفظ إعدادات الإشعارات');
        setLoading(false);
    };

    const handleSaveProfile = async () => {
        if (profileData.newPassword && profileData.newPassword !== profileData.confirmPassword) {
            toast.error('كلمة المرور الجديدة غير متطابقة');
            return;
        }
        setLoading(true);
        await new Promise(r => setTimeout(r, 500));
        updateUser({ name: profileData.name, phone: profileData.phone });
        toast.success('تم تحديث الملف الشخصي');
        setLoading(false);
    };

    const tabs = [
        { id: 'general', label: 'الإعدادات العامة', icon: Store },
        { id: 'receipt', label: 'إعدادات الفاتورة', icon: Receipt },
        { id: 'notifications', label: 'الإشعارات', icon: Bell },
        { id: 'profile', label: 'الملف الشخصي', icon: Shield },
    ];

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div className="page-header-info">
                    <h1>الإعدادات</h1>
                    <p>إعدادات النظام والتخصيص</p>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--spacing-xl)' }}>
                {/* Sidebar */}
                <div style={{ width: 250, flexShrink: 0 }}>
                    <div className="card">
                        <div className="card-body" style={{ padding: 'var(--spacing-sm)' }}>
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--spacing-md)',
                                        width: '100%',
                                        padding: 'var(--spacing-md)',
                                        borderRadius: 'var(--border-radius)',
                                        border: 'none',
                                        background: activeTab === tab.id ? 'var(--color-primary-50)' : 'transparent',
                                        color: activeTab === tab.id ? 'var(--color-primary-700)' : 'var(--text-secondary)',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        textAlign: 'right',
                                        marginBottom: 4,
                                    }}
                                >
                                    <tab.icon size={18} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div style={{ flex: 1 }}>
                    {activeTab === 'general' && (
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">الإعدادات العامة</h3>
                            </div>
                            <div className="card-body">
                                <div className="form-group">
                                    <label className="form-label">اسم المتجر</label>
                                    <input
                                        type="text"
                                        value={generalSettings.storeName}
                                        onChange={(e) => setGeneralSettings({ ...generalSettings, storeName: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">رقم الهاتف</label>
                                    <input
                                        type="tel"
                                        value={generalSettings.storePhone}
                                        onChange={(e) => setGeneralSettings({ ...generalSettings, storePhone: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">العنوان</label>
                                    <textarea
                                        value={generalSettings.storeAddress}
                                        onChange={(e) => setGeneralSettings({ ...generalSettings, storeAddress: e.target.value })}
                                        rows={2}
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                                    <div className="form-group">
                                        <label className="form-label">العملة</label>
                                        <select
                                            value={generalSettings.currency}
                                            onChange={(e) => setGeneralSettings({ ...generalSettings, currency: e.target.value })}
                                        >
                                            <option value="EGP">جنيه مصري (EGP)</option>
                                            <option value="SAR">ريال سعودي (SAR)</option>
                                            <option value="AED">درهم إماراتي (AED)</option>
                                            <option value="USD">دولار أمريكي (USD)</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">نسبة الضريبة (%)</label>
                                        <input
                                            type="number"
                                            value={generalSettings.taxRate}
                                            onChange={(e) => setGeneralSettings({ ...generalSettings, taxRate: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                </div>
                                <button className="btn btn-primary" onClick={handleSaveGeneral} disabled={loading}>
                                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                    حفظ الإعدادات
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'receipt' && (
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">إعدادات الفاتورة</h3>
                            </div>
                            <div className="card-body">
                                <div className="form-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={receiptSettings.showLogo}
                                            onChange={(e) => setReceiptSettings({ ...receiptSettings, showLogo: e.target.checked })}
                                            style={{ width: 'auto' }}
                                        />
                                        إظهار الشعار في الفاتورة
                                    </label>
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={receiptSettings.showAddress}
                                            onChange={(e) => setReceiptSettings({ ...receiptSettings, showAddress: e.target.checked })}
                                            style={{ width: 'auto' }}
                                        />
                                        إظهار العنوان في الفاتورة
                                    </label>
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={receiptSettings.showPhone}
                                            onChange={(e) => setReceiptSettings({ ...receiptSettings, showPhone: e.target.checked })}
                                            style={{ width: 'auto' }}
                                        />
                                        إظهار رقم الهاتف في الفاتورة
                                    </label>
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={receiptSettings.printAutomatically}
                                            onChange={(e) => setReceiptSettings({ ...receiptSettings, printAutomatically: e.target.checked })}
                                            style={{ width: 'auto' }}
                                        />
                                        طباعة تلقائية بعد كل عملية بيع
                                    </label>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">نص أسفل الفاتورة</label>
                                    <textarea
                                        value={receiptSettings.footerText}
                                        onChange={(e) => setReceiptSettings({ ...receiptSettings, footerText: e.target.value })}
                                        rows={2}
                                        placeholder="مثال: شكراً لتعاملكم معنا"
                                    />
                                </div>
                                <button className="btn btn-primary" onClick={handleSaveReceipt} disabled={loading}>
                                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                    حفظ الإعدادات
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">إعدادات الإشعارات</h3>
                            </div>
                            <div className="card-body">
                                <div className="form-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={notificationSettings.lowStockAlert}
                                            onChange={(e) => setNotificationSettings({ ...notificationSettings, lowStockAlert: e.target.checked })}
                                            style={{ width: 'auto' }}
                                        />
                                        تنبيهات المخزون المنخفض
                                    </label>
                                </div>
                                {notificationSettings.lowStockAlert && (
                                    <div className="form-group" style={{ marginRight: 28 }}>
                                        <label className="form-label">الحد الأدنى للتنبيه</label>
                                        <input
                                            type="number"
                                            value={notificationSettings.lowStockThreshold}
                                            onChange={(e) => setNotificationSettings({ ...notificationSettings, lowStockThreshold: parseInt(e.target.value) || 0 })}
                                            style={{ width: 100 }}
                                        />
                                    </div>
                                )}
                                <div className="form-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={notificationSettings.salesNotification}
                                            onChange={(e) => setNotificationSettings({ ...notificationSettings, salesNotification: e.target.checked })}
                                            style={{ width: 'auto' }}
                                        />
                                        إشعارات المبيعات الجديدة
                                    </label>
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={notificationSettings.transferNotification}
                                            onChange={(e) => setNotificationSettings({ ...notificationSettings, transferNotification: e.target.checked })}
                                            style={{ width: 'auto' }}
                                        />
                                        إشعارات طلبات نقل البضائع
                                    </label>
                                </div>
                                <button className="btn btn-primary" onClick={handleSaveNotifications} disabled={loading}>
                                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                    حفظ الإعدادات
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">الملف الشخصي</h3>
                            </div>
                            <div className="card-body">
                                <div className="form-group">
                                    <label className="form-label">الاسم</label>
                                    <input
                                        type="text"
                                        value={profileData.name}
                                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">البريد الإلكتروني</label>
                                    <input
                                        type="email"
                                        value={profileData.email}
                                        disabled
                                        style={{ opacity: 0.7 }}
                                    />
                                    <p className="form-hint">لا يمكن تغيير البريد الإلكتروني</p>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">رقم الهاتف</label>
                                    <input
                                        type="tel"
                                        value={profileData.phone}
                                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                    />
                                </div>

                                <h4 style={{ marginTop: 'var(--spacing-xl)', marginBottom: 'var(--spacing-md)' }}>تغيير كلمة المرور</h4>
                                <div className="form-group">
                                    <label className="form-label">كلمة المرور الحالية</label>
                                    <input
                                        type="password"
                                        value={profileData.currentPassword}
                                        onChange={(e) => setProfileData({ ...profileData, currentPassword: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">كلمة المرور الجديدة</label>
                                    <input
                                        type="password"
                                        value={profileData.newPassword}
                                        onChange={(e) => setProfileData({ ...profileData, newPassword: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">تأكيد كلمة المرور الجديدة</label>
                                    <input
                                        type="password"
                                        value={profileData.confirmPassword}
                                        onChange={(e) => setProfileData({ ...profileData, confirmPassword: e.target.value })}
                                    />
                                </div>
                                <button className="btn btn-primary" onClick={handleSaveProfile} disabled={loading}>
                                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                    حفظ التغييرات
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
