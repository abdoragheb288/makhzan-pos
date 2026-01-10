import { useState, useEffect } from 'react';
import { Search, FileText, Eye } from 'lucide-react';
import { saleService } from '../services';
import { formatCurrency, formatDateTime, getPaymentMethodLabel } from '../utils/helpers';

export default function Sales() {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

    useEffect(() => {
        fetchSales();
    }, [pagination.page]);

    const fetchSales = async () => {
        setLoading(true);
        try {
            const response = await saleService.getAll({ page: pagination.page, limit: 20 });
            if (response.success) {
                setSales(response.data);
                setPagination(response.pagination);
            }
        } catch (error) {
            console.error('Error fetching sales:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div className="page-header-info">
                    <h1>المبيعات</h1>
                    <p>سجل جميع عمليات البيع</p>
                </div>
            </div>

            <div className="card">
                <div className="card-body" style={{ padding: 0 }}>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
                            <div className="loading-spinner" />
                        </div>
                    ) : sales.length === 0 ? (
                        <div className="empty-state">
                            <FileText size={60} className="empty-state-icon" />
                            <div className="empty-state-title">لا توجد مبيعات</div>
                        </div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>رقم الفاتورة</th>
                                    <th>الفرع</th>
                                    <th>الكاشير</th>
                                    <th>طريقة الدفع</th>
                                    <th>عدد الأصناف</th>
                                    <th>الإجمالي</th>
                                    <th>التاريخ</th>
                                    <th>الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sales.map((sale) => (
                                    <tr key={sale.id}>
                                        <td>
                                            <span style={{ fontWeight: 600, color: 'var(--color-primary-600)' }}>
                                                {sale.invoiceNumber}
                                            </span>
                                        </td>
                                        <td>{sale.branch?.name}</td>
                                        <td>{sale.user?.name}</td>
                                        <td>
                                            <span className="badge badge-gray">
                                                {getPaymentMethodLabel(sale.paymentMethod)}
                                            </span>
                                        </td>
                                        <td>{sale._count?.items}</td>
                                        <td style={{ fontWeight: 700 }}>{formatCurrency(sale.total)}</td>
                                        <td style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                            {formatDateTime(sale.createdAt)}
                                        </td>
                                        <td>
                                            <button className="btn btn-ghost btn-icon">
                                                <Eye size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {pagination.totalPages > 1 && (
                    <div className="card-footer" style={{ display: 'flex', justifyContent: 'center' }}>
                        <div className="pagination">
                            <button
                                className="pagination-btn"
                                disabled={pagination.page === 1}
                                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                            >
                                السابق
                            </button>
                            <span style={{ padding: '0 var(--spacing-md)' }}>
                                {pagination.page} من {pagination.totalPages}
                            </span>
                            <button
                                className="pagination-btn"
                                disabled={pagination.page === pagination.totalPages}
                                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                            >
                                التالي
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
