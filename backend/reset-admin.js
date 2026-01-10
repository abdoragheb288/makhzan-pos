const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Connecting to database...');
        const user = await prisma.user.findUnique({
            where: { email: 'admin@makhzan.com' },
        });

        if (user) {
            console.log('User found:', user.email);
            console.log('Permissions:', user.permissions);
            console.log('Role:', user.role);
        } else {
            console.log('User NOT found!');
        }
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
