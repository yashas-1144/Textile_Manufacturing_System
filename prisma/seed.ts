import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password || password.length < 12) {
    throw new Error(
      "Set ADMIN_EMAIL and a strong ADMIN_PASSWORD"
    );
  }

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name: "System Administrator",
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role: Role.ADMIN,
    },
  });

  console.log("Admin user is ready.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
