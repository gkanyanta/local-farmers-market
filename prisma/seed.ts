import { PrismaClient, Role } from "@prisma/client";
import * as crypto from "crypto";

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

async function main() {
  console.log("Seeding database...");

  // Create settings
  await prisma.settings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      minOrderValue: 150,
      cutOffTime: "08:30",
      pickupAddressText:
        "Collection Point: Woodlands Area, Lusaka. Exact location shared after order confirmation.",
      contactPhone: "+260977123456",
      supportWhatsApp: "+260977123456",
    },
  });

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@localfarmersmarket.zm" },
    update: {},
    create: {
      email: "admin@localfarmersmarket.zm",
      name: "Admin User",
      phone: "+260977000001",
      password: hashPassword("admin123"),
      role: Role.ADMIN,
    },
  });

  // Create staff user
  const staffUser = await prisma.user.upsert({
    where: { email: "staff@localfarmersmarket.zm" },
    update: {},
    create: {
      email: "staff@localfarmersmarket.zm",
      name: "Staff Buyer",
      phone: "+260977000002",
      password: hashPassword("staff123"),
      role: Role.STAFF,
    },
  });

  // Create test customer
  const testCustomer = await prisma.user.upsert({
    where: { email: "customer@test.zm" },
    update: {},
    create: {
      email: "customer@test.zm",
      name: "Test Customer",
      phone: "+260977000003",
      password: hashPassword("customer123"),
      role: Role.CUSTOMER,
    },
  });

  console.log("Created users:", { adminUser: adminUser.email, staffUser: staffUser.email, testCustomer: testCustomer.email });

  // Create categories
  const vegetables = await prisma.category.upsert({
    where: { slug: "vegetables" },
    update: {},
    create: {
      name: "Fresh Vegetables",
      slug: "vegetables",
      imageUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400",
      sortOrder: 1,
    },
  });

  const fruits = await prisma.category.upsert({
    where: { slug: "fruits" },
    update: {},
    create: {
      name: "Fresh Fruits",
      slug: "fruits",
      imageUrl: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400",
      sortOrder: 2,
    },
  });

  const pantry = await prisma.category.upsert({
    where: { slug: "pantry" },
    update: {},
    create: {
      name: "Pantry Essentials",
      slug: "pantry",
      imageUrl: "https://images.unsplash.com/photo-1584473457406-6240486418e9?w=400",
      sortOrder: 3,
    },
  });

  console.log("Created categories:", { vegetables: vegetables.name, fruits: fruits.name, pantry: pantry.name });

  // Create products
  const products = [
    // Vegetables (perishable)
    {
      name: "Fresh Tomatoes",
      description: "Ripe, juicy tomatoes freshly sourced from local hardworking Zambian farmers. Perfect for salads, cooking, and sauces.",
      categoryId: vegetables.id,
      unit: "kg",
      price: 35,
      imageUrl: "https://images.unsplash.com/photo-1546470427-e26264be0b11?w=400",
      isPerishable: true,
      isActive: true,
    },
    {
      name: "Green Leafy Rape",
      description: "Fresh rape leaves, a Zambian staple. Sourced from local hardworking Zambian farmers.",
      categoryId: vegetables.id,
      unit: "bundle",
      price: 15,
      imageUrl: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400",
      isPerishable: true,
      isActive: true,
    },
    {
      name: "Fresh Onions",
      description: "Quality onions for all your cooking needs. From local hardworking Zambian farmers.",
      categoryId: vegetables.id,
      unit: "kg",
      price: 28,
      imageUrl: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400",
      isPerishable: true,
      isActive: true,
    },
    {
      name: "Cabbage",
      description: "Fresh, crisp cabbage heads. Sourced from local hardworking Zambian farmers.",
      categoryId: vegetables.id,
      unit: "each",
      price: 25,
      imageUrl: "https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=400",
      isPerishable: true,
      isActive: true,
    },
    // Fruits (perishable)
    {
      name: "Ripe Bananas",
      description: "Sweet, ripe bananas. Freshly sourced from local hardworking Zambian farmers.",
      categoryId: fruits.id,
      unit: "bunch",
      price: 20,
      imageUrl: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400",
      isPerishable: true,
      isActive: true,
    },
    {
      name: "Fresh Mangoes",
      description: "Juicy, sweet mangoes when in season. From local hardworking Zambian farmers.",
      categoryId: fruits.id,
      unit: "each",
      price: 12,
      imageUrl: "https://images.unsplash.com/photo-1553279768-865429fa0078?w=400",
      isPerishable: true,
      isActive: true,
    },
    {
      name: "Watermelon",
      description: "Refreshing watermelon, perfect for hot Lusaka days. Sourced locally.",
      categoryId: fruits.id,
      unit: "each",
      price: 45,
      imageUrl: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400",
      isPerishable: true,
      isActive: true,
    },
    // Pantry (non-perishable)
    {
      name: "Mealie Meal (Breakfast)",
      description: "Premium breakfast mealie meal. 10kg bag.",
      categoryId: pantry.id,
      unit: "pack",
      price: 180,
      imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400",
      isPerishable: false,
      isActive: true,
      stockQty: 50,
    },
    {
      name: "Cooking Oil",
      description: "Quality cooking oil. 2L bottle.",
      categoryId: pantry.id,
      unit: "bottle",
      price: 95,
      imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400",
      isPerishable: false,
      isActive: true,
      stockQty: 100,
    },
    {
      name: "Dried Kapenta",
      description: "Sun-dried kapenta fish. Perfect with nshima. 500g pack.",
      categoryId: pantry.id,
      unit: "pack",
      price: 85,
      imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400",
      isPerishable: false,
      isActive: true,
      stockQty: 30,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: {
        id: product.name.toLowerCase().replace(/\s+/g, "-"),
      },
      update: product,
      create: {
        id: product.name.toLowerCase().replace(/\s+/g, "-"),
        ...product,
      },
    });
  }

  console.log(`Created ${products.length} products`);

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
