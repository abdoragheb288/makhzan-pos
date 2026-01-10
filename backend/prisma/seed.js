const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 بدء تهيئة قاعدة البيانات...');

    // Create main warehouse FIRST
    const warehouse = await prisma.branch.upsert({
        where: { id: 1 },
        update: {},
        create: {
            name: 'المخزن الرئيسي',
            address: 'شارع التحرير، القاهرة',
            phone: '02-12345678',
            isWarehouse: true,
        },
    });
    console.log('✅ تم إنشاء المخزن الرئيسي:', warehouse.name);

    // Create branches
    const branch1 = await prisma.branch.upsert({
        where: { id: 2 },
        update: {},
        create: {
            name: 'فرع المعادي',
            address: 'شارع 9، المعادي',
            phone: '02-23456789',
            isWarehouse: false,
        },
    });

    const branch2 = await prisma.branch.upsert({
        where: { id: 3 },
        update: {},
        create: {
            name: 'فرع مدينة نصر',
            address: 'شارع عباس العقاد',
            phone: '02-34567890',
            isWarehouse: false,
        },
    });
    console.log('✅ تم إنشاء الفروع');

    // Create admin user AFTER branches
    const hashedPassword = await bcrypt.hash('admin123', 12);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@makhzan.com' },
        update: { branchId: warehouse.id },
        create: {
            name: 'مدير النظام',
            email: 'admin@makhzan.com',
            password: hashedPassword,
            phone: '01000000000',
            role: 'ADMIN',
            branchId: warehouse.id,
            permissions: [],
        },
    });
    console.log('✅ تم إنشاء المستخدم الرئيسي:', admin.email);
    console.log('✅ تم إنشاء الفروع');

    // Create manager and cashier
    const manager = await prisma.user.upsert({
        where: { email: 'manager@makhzan.com' },
        update: {},
        create: {
            name: 'أحمد محمد',
            email: 'manager@makhzan.com',
            password: hashedPassword,
            phone: '01100000000',
            role: 'MANAGER',
            branchId: branch1.id,
        },
    });

    const cashier = await prisma.user.upsert({
        where: { email: 'cashier@makhzan.com' },
        update: {},
        create: {
            name: 'محمد علي',
            email: 'cashier@makhzan.com',
            password: hashedPassword,
            phone: '01200000000',
            role: 'CASHIER',
            branchId: branch1.id,
        },
    });
    console.log('✅ تم إنشاء المستخدمين');

    // Create categories
    const menCategory = await prisma.category.upsert({
        where: { id: 1 },
        update: {},
        create: {
            name: 'ملابس رجالي',
            description: 'جميع أنواع الملابس الرجالية',
        },
    });

    const womenCategory = await prisma.category.upsert({
        where: { id: 2 },
        update: {},
        create: {
            name: 'ملابس حريمي',
            description: 'جميع أنواع الملابس الحريمية',
        },
    });

    const kidsCategory = await prisma.category.upsert({
        where: { id: 3 },
        update: {},
        create: {
            name: 'ملابس أطفال',
            description: 'ملابس الأطفال ولاد وبنات',
        },
    });

    // Subcategories - use upsert to avoid duplicates
    const menShirts = await prisma.category.upsert({
        where: { id: 4 },
        update: {},
        create: {
            name: 'قمصان رجالي',
            parentId: menCategory.id,
        },
    });

    const menPants = await prisma.category.upsert({
        where: { id: 5 },
        update: {},
        create: {
            name: 'بناطيل رجالي',
            parentId: menCategory.id,
        },
    });

    const womenDresses = await prisma.category.upsert({
        where: { id: 6 },
        update: {},
        create: {
            name: 'فساتين',
            parentId: womenCategory.id,
        },
    });
    console.log('✅ تم إنشاء التصنيفات');

    // Create products with variants
    const shirt1 = await prisma.product.create({
        data: {
            name: 'قميص كلاسيكي أبيض',
            sku: 'MEN-SHT-001',
            barcode: '1234567890123',
            categoryId: menShirts.id,
            basePrice: 450,
            costPrice: 300,
            description: 'قميص رجالي كلاسيكي قطن 100%',
            variants: {
                create: [
                    { size: 'S', color: 'أبيض', sku: 'MEN-SHT-001-S-W', price: 450, costPrice: 300 },
                    { size: 'M', color: 'أبيض', sku: 'MEN-SHT-001-M-W', price: 450, costPrice: 300 },
                    { size: 'L', color: 'أبيض', sku: 'MEN-SHT-001-L-W', price: 450, costPrice: 300 },
                    { size: 'XL', color: 'أبيض', sku: 'MEN-SHT-001-XL-W', price: 450, costPrice: 300 },
                ],
            },
        },
        include: { variants: true },
    });

    const shirt2 = await prisma.product.create({
        data: {
            name: 'قميص كاجوال أزرق',
            sku: 'MEN-SHT-002',
            barcode: '1234567890124',
            categoryId: menShirts.id,
            basePrice: 380,
            costPrice: 250,
            description: 'قميص كاجوال مريح',
            variants: {
                create: [
                    { size: 'S', color: 'أزرق', sku: 'MEN-SHT-002-S-B', price: 380, costPrice: 250 },
                    { size: 'M', color: 'أزرق', sku: 'MEN-SHT-002-M-B', price: 380, costPrice: 250 },
                    { size: 'L', color: 'أزرق', sku: 'MEN-SHT-002-L-B', price: 380, costPrice: 250 },
                ],
            },
        },
        include: { variants: true },
    });

    const pants1 = await prisma.product.create({
        data: {
            name: 'بنطلون جينز كلاسيك',
            sku: 'MEN-PNT-001',
            barcode: '1234567890125',
            categoryId: menPants.id,
            basePrice: 650,
            costPrice: 400,
            variants: {
                create: [
                    { size: '30', color: 'كحلي', sku: 'MEN-PNT-001-30-N', price: 650, costPrice: 400 },
                    { size: '32', color: 'كحلي', sku: 'MEN-PNT-001-32-N', price: 650, costPrice: 400 },
                    { size: '34', color: 'كحلي', sku: 'MEN-PNT-001-34-N', price: 650, costPrice: 400 },
                    { size: '36', color: 'كحلي', sku: 'MEN-PNT-001-36-N', price: 650, costPrice: 400 },
                ],
            },
        },
        include: { variants: true },
    });

    const dress1 = await prisma.product.create({
        data: {
            name: 'فستان سواريه أسود',
            sku: 'WOM-DRS-001',
            barcode: '1234567890126',
            categoryId: womenDresses.id,
            basePrice: 1200,
            costPrice: 750,
            variants: {
                create: [
                    { size: 'S', color: 'أسود', sku: 'WOM-DRS-001-S-BK', price: 1200, costPrice: 750 },
                    { size: 'M', color: 'أسود', sku: 'WOM-DRS-001-M-BK', price: 1200, costPrice: 750 },
                    { size: 'L', color: 'أسود', sku: 'WOM-DRS-001-L-BK', price: 1200, costPrice: 750 },
                ],
            },
        },
        include: { variants: true },
    });
    console.log('✅ تم إنشاء المنتجات والمتغيرات');

    // Add inventory to warehouse
    const allVariants = [
        ...shirt1.variants,
        ...shirt2.variants,
        ...pants1.variants,
        ...dress1.variants,
    ];

    // Add inventory to warehouse - use upsert to avoid duplicates
    for (const variant of allVariants) {
        await prisma.inventory.upsert({
            where: {
                variantId_branchId: { variantId: variant.id, branchId: warehouse.id },
            },
            update: { quantity: { increment: 0 } },
            create: {
                variantId: variant.id,
                branchId: warehouse.id,
                quantity: Math.floor(Math.random() * 50) + 20,
                minStock: 5,
            },
        });

        // Add some to branches too
        await prisma.inventory.upsert({
            where: {
                variantId_branchId: { variantId: variant.id, branchId: branch1.id },
            },
            update: { quantity: { increment: 0 } },
            create: {
                variantId: variant.id,
                branchId: branch1.id,
                quantity: Math.floor(Math.random() * 20) + 5,
                minStock: 3,
            },
        });
    }
    console.log('✅ تم إضافة المخزون');

    // Create suppliers
    const supplier1 = await prisma.supplier.create({
        data: {
            name: 'مصنع النيل للملابس',
            phone: '01500000000',
            email: 'nile@factory.com',
            address: '6 أكتوبر، الجيزة',
        },
    });

    const supplier2 = await prisma.supplier.create({
        data: {
            name: 'شركة الدلتا للتصنيع',
            phone: '01600000000',
            email: 'delta@textiles.com',
            address: 'المحلة الكبرى',
        },
    });
    console.log('✅ تم إنشاء الموردين');

    console.log('');
    console.log('🎉 تم تهيئة قاعدة البيانات بنجاح!');
    console.log('');
    console.log('📋 بيانات تسجيل الدخول:');
    console.log('   المدير: admin@makhzan.com / admin123');
    console.log('   المشرف: manager@makhzan.com / admin123');
    console.log('   الكاشير: cashier@makhzan.com / admin123');
}

main()
    .catch((e) => {
        console.error('❌ خطأ:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
