import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Change these before running if you want a different account
  const email = "media.buyer@gmail.com";
  const plainPassword = "Embabi@Media#2024";

  const hashedPassword = await hash(plainPassword, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      // MEDIA_BUYER enum will exist after running `prisma migrate dev` + `prisma generate`
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      role: "MEDIA_BUYER" as any,
      emailVerified: true,
    },
    create: {
      email,
      name: "Media Buyer",
      password: hashedPassword,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      role: "MEDIA_BUYER" as any,
      emailVerified: true,
    },
  });

  console.log("Media buyer user created/updated successfully!");
  console.log("Email:", user.email);
  console.log("Password:", plainPassword);
  console.log("Role:", user.role);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

