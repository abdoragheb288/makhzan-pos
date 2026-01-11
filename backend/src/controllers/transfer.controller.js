const prisma = require('../config/database');

const createTransfer = async (req, res, next) => {
    try {
        const { fromBranchId, toBranchId, items, notes } = req.body;
        const userId = req.user.id;
        const tenantId = req.user.tenantId;

        if (!fromBranchId || !toBranchId || !items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'بيانات التحويل غير مكتملة',
            });
        }

        if (fromBranchId === toBranchId) {
            return res.status(400).json({
                success: false,
                message: 'لا يمكن التحويل لنفس الفرع',
            });
        }

        // Verify both branches belong to the same tenant
        const [fromBranch, toBranch] = await Promise.all([
            prisma.branch.findFirst({ where: { id: parseInt(fromBranchId), tenantId } }),
            prisma.branch.findFirst({ where: { id: parseInt(toBranchId), tenantId } }),
        ]);

        if (!fromBranch || !toBranch) {
            return res.status(400).json({
                success: false,
                message: 'الفروع غير موجودة أو لا تنتمي لهذه الشركة',
            });
        }

        // Transaction to ensure data integrity
        const transfer = await prisma.$transaction(async (tx) => {
            // 1. Check stock availability
            for (const item of items) {
                const sourceInventory = await tx.inventory.findUnique({
                    where: {
                        variantId_branchId: {
                            variantId: item.variantId,
                            branchId: parseInt(fromBranchId),
                        },
                    },
                });

                if (!sourceInventory || sourceInventory.quantity < item.quantity) {
                    throw new Error(`الكمية غير متوفرة للمنتج رقم ${item.variantId} في الفرع المصدر`);
                }
            }

            // 2. Create StockTransfer record
            const newTransfer = await tx.stockTransfer.create({
                data: {
                    fromBranchId: parseInt(fromBranchId),
                    toBranchId: parseInt(toBranchId),
                    status: 'COMPLETED', // Direct transfer for simplicity
                    notes,
                    createdById: userId,
                    items: {
                        create: items.map((item) => ({
                            variantId: item.variantId,
                            quantity: item.quantity,
                        })),
                    },
                },
                include: { items: { include: { variant: { include: { product: true } } } } },
            });

            // 3. Update Inventory (Decrement Source, Increment Destination)
            for (const item of items) {
                // Decrement Source
                await tx.inventory.update({
                    where: {
                        variantId_branchId: {
                            variantId: item.variantId,
                            branchId: parseInt(fromBranchId),
                        },
                    },
                    data: {
                        quantity: { decrement: item.quantity },
                    },
                });

                // Increment Destination (Upsert: Create if doesn't exist)
                await tx.inventory.upsert({
                    where: {
                        variantId_branchId: {
                            variantId: item.variantId,
                            branchId: parseInt(toBranchId),
                        },
                    },
                    update: {
                        quantity: { increment: item.quantity },
                    },
                    create: {
                        variantId: item.variantId,
                        branchId: parseInt(toBranchId),
                        quantity: item.quantity,
                        minStock: 5, // Default
                    },
                });
            }

            // 4. Log Audit
            await tx.auditLog.create({
                data: {
                    userId,
                    action: 'CREATE_TRANSFER',
                    entity: 'StockTransfer',
                    entityId: newTransfer.id,
                    newData: newTransfer,
                },
            });

            return newTransfer;
        });

        res.status(201).json({
            success: true,
            data: transfer,
            message: 'تم التحويل بنجاح',
        });
    } catch (error) {
        if (error.message.includes('الكمية غير متوفرة')) {
            return res.status(400).json({ success: false, message: error.message });
        }
        next(error);
    }
};

const getTransfers = async (req, res, next) => {
    try {
        const tenantId = req.user.tenantId;

        // Filter transfers by tenant (either source or destination branch belongs to tenant)
        const transfers = await prisma.stockTransfer.findMany({
            where: {
                OR: [
                    { fromBranch: { tenantId } },
                    { toBranch: { tenantId } },
                ]
            },
            include: {
                fromBranch: { select: { id: true, name: true } },
                toBranch: { select: { id: true, name: true } },
                createdBy: { select: { name: true } },
                items: { include: { variant: { include: { product: { select: { name: true } } } } } },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json({
            success: true,
            data: transfers,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createTransfer,
    getTransfers,
};
