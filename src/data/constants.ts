export const SYSTEM_ROLES = {
    member: "member",
    volunteer: "volunteer",
    leader: "leader",
    admin: "admin"
}
export const STATUSES = {
    active: "active",
    inactive: "inactive",
    deceased: "deceased"
}

export const GLOBAL_PRISMA_ACCELERATE_CACHE_STRATEGY = {
    ttl: 60 * 5, // cache for 5 minutes
    swr: 60 * 10 // stale-while-revalidate for 10 minutes
}

export const SPECIFIC_PRISMA_ACCELERATE_CACHE_STRATEGY_LONGER = {
    ttl: 60 * 60 * 24, // cache for 24 hours minutes
    swr: 60 * 60 * 30 // stale-while-revalidate for 30 hours
}

export const SPECIFIC_PRISMA_ACCELERATE_CACHE_STRATEGY_SHORTER = {
    ttl: 60, // cache for 60 seconds
    swr: 60  // stale-while-revalidate for 60 seconds
}