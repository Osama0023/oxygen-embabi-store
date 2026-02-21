import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth-options";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CheckoutPage from "@/components/checkout/checkout-page";

interface CheckoutPageProps {
  params: Promise<{ locale: string }>;
}

// This is a simple server component that checks authentication
export default async function CheckoutRoute({ params }: CheckoutPageProps) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect(`/${locale}/login?returnUrl=/${locale}/checkout`);
  }

  // Get user data
  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id
    },
    select: {
      name: true,
      email: true,
      role: true
    }
  });

  if (!user) {
    redirect("/en/login?returnUrl=/checkout");
  }

  // Pass only the user data to the client component
  // We'll use the cart storage data instead of pending orders
  return <CheckoutPage user={user} />;
} 