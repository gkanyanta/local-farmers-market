import Link from "next/link";
import { Phone, MessageCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { unstable_noStore as noStore } from "next/cache";

async function getSettings() {
  noStore(); // Disable caching to always fetch fresh settings
  try {
    const settings = await prisma.settings.findUnique({
      where: { id: "default" },
    });
    return settings;
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return null;
  }
}

export async function Footer() {
  const settings = await getSettings();

  const contactPhone = settings?.contactPhone || "+260 965 982 894";
  const whatsappNumber = settings?.supportWhatsApp || "260965982894";

  // Format phone for display (add spaces)
  const displayPhone = contactPhone.replace(/(\+\d{3})(\d{3})(\d{3})(\d{3})/, "$1 $2 $3 $4");

  // Clean WhatsApp number for link (remove spaces and +)
  const whatsappLink = whatsappNumber.replace(/[\s+]/g, "");

  return (
    <footer className="border-t bg-gray-50">
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <h3 className="font-bold text-lg">Local Farmers Market</h3>
            <p className="text-sm text-muted-foreground">
              Fresh produce sourced from local hardworking Zambian farmers.
            </p>
            <p className="text-xs text-muted-foreground italic">
              We are not a delivery company. Pickup is via your rider or a rider booked at your cost.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Quick Links</h4>
            <nav className="space-y-2 text-sm">
              <Link href="/shop" className="block text-muted-foreground hover:text-primary">
                Shop
              </Link>
              <Link href="/about" className="block text-muted-foreground hover:text-primary">
                About Us
              </Link>
              <Link href="/faq" className="block text-muted-foreground hover:text-primary">
                FAQ
              </Link>
            </nav>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Account</h4>
            <nav className="space-y-2 text-sm">
              <Link href="/orders" className="block text-muted-foreground hover:text-primary">
                My Orders
              </Link>
              <Link href="/cart" className="block text-muted-foreground hover:text-primary">
                Cart
              </Link>
            </nav>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Contact</h4>
            <div className="space-y-2 text-sm">
              <a
                href={`tel:${contactPhone.replace(/\s/g, "")}`}
                className="flex items-center gap-2 text-muted-foreground hover:text-primary"
              >
                <Phone className="h-4 w-4" />
                {displayPhone}
              </a>
              <a
                href={`https://wa.me/${whatsappLink}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground hover:text-primary"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Local Farmers Market. All rights reserved.</p>
          <p className="mt-1">Lusaka, Zambia</p>
        </div>
      </div>
    </footer>
  );
}
