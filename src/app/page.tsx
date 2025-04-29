import prisma from "@/lib/prisma";

export default async function Home() {
  const systemRoles = await prisma.system_roles.findMany();
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <div>
          <h1>System Roles</h1>
          <ul>
            {systemRoles.map((role) => (
              <li key={role.id}>
                {role.name} — {role.description}
              </li>
            ))}
          </ul>
        </div>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        --- footer ----
      </footer>
    </div>
  );
}