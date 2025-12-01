export default {
    prisma: {
        schema: 'src/prisma/schema.prisma',
    },
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
}
