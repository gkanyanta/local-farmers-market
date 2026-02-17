import type { Metadata } from "next";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about ordering, payments, pickup, and freshness at Local Farmers Market.",
};

async function getSettings() {
  const settings = await prisma.settings.findUnique({
    where: { id: "default" },
    select: {
      minOrderValue: true,
      cutOffTime: true,
      contactPhone: true,
      supportWhatsApp: true,
    },
  });

  const minOrder = settings?.minOrderValue.toNumber() ?? 200;
  const cutOffTime = settings?.cutOffTime ?? "09:00";
  const [h, m] = cutOffTime.split(":");
  const hour = parseInt(h);
  const formattedCutOff = `${hour > 12 ? hour - 12 : hour || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
  const contactPhone = settings?.contactPhone || "+260965982894";
  const whatsApp = settings?.supportWhatsApp || "260965982894";

  return { minOrder, formattedCutOff, contactPhone, whatsApp };
}

export default async function FAQPage() {
  const { minOrder, formattedCutOff, contactPhone, whatsApp } = await getSettings();

  const faqs = [
    {
      question: "How does ordering work?",
      answer: `Browse our selection, add items to your cart, and checkout when your order reaches the minimum of K${minOrder}. After payment is confirmed, we source your items fresh and notify you when they're ready for pickup.`,
    },
    {
      question: "When will my order be ready?",
      answer: `Orders placed before ${formattedCutOff} are sourced fresh and ready for pickup the same day. If you order after ${formattedCutOff}, your items will be sourced the following day. This ensures every order is as fresh as possible — straight from our local farmers to you.`,
    },
    {
      question: "What is the minimum order value?",
      answer: `The minimum order value is K${minOrder}. This helps us ensure efficient sourcing from our local farmers.`,
    },
    {
      question: "How do I get my order?",
      answer:
        "We are not a delivery company. You have two options: 1) Send your own rider to pick up the order, or 2) Request us to help book a rider for you. In both cases, rider fees are paid separately by you directly to the rider.",
    },
    {
      question: "Where does the produce come from?",
      answer:
        "All our produce is sourced from local hardworking Zambian farmers. We work directly with farming communities to bring you the freshest products.",
    },
    {
      question: "Are the vegetables and fruits fresh?",
      answer:
        "Yes! Perishable items are sourced fresh after your order is confirmed. We don't pre-stock perishables to ensure maximum freshness.",
    },
    {
      question: "How do I pay for my order?",
      answer:
        "We accept secure online payments through Lenco. Your order is only confirmed after payment is successfully processed.",
    },
    {
      question: "Can I cancel my order?",
      answer:
        "You can cancel your order while it's still pending payment. Once payment is confirmed, please contact us as soon as possible if you need to cancel. Orders that are already being sourced cannot be cancelled.",
    },
    {
      question: "How will I know when my order is ready?",
      answer:
        "You can track your order status in real-time on your orders page. We'll also contact you when your order is ready for pickup.",
    },
    {
      question: "What if there's an issue with my order?",
      answer:
        "Please contact us immediately through WhatsApp or phone. We're committed to resolving any issues and ensuring your satisfaction.",
    },
    {
      question: "Do you have a physical store?",
      answer:
        "We operate as an online marketplace connecting you with local farmers. We have a pickup point in Lusaka where orders can be collected.",
    },
  ];

  return (
    <div className="container py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-2">Frequently Asked Questions</h1>
      <p className="text-muted-foreground mb-8">
        Find answers to common questions about our service.
      </p>

      <Accordion type="single" collapsible className="space-y-2">
        {faqs.map((faq, index) => (
          <AccordionItem
            key={index}
            value={`item-${index}`}
            className="border rounded-lg px-4"
          >
            <AccordionTrigger className="text-left hover:no-underline">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="mt-12 p-6 bg-gray-50 rounded-xl text-center">
        <h2 className="font-semibold mb-2">Still have questions?</h2>
        <p className="text-muted-foreground mb-4">
          We&apos;re here to help. Reach out to us anytime.
        </p>
        <div className="flex justify-center gap-4">
          <a
            href={`tel:${contactPhone}`}
            className="text-primary hover:underline"
          >
            Call Us
          </a>
          <span className="text-gray-300">|</span>
          <a
            href={`https://wa.me/${whatsApp.replace(/\+/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
