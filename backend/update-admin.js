const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const updated = await prisma.user.updateMany({
            where: { email: 'admin@makhzan.com' },
            data: { branchId: 1 } //Assign default warehouse branch
        });
        console.log('Updated user:', updated);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
