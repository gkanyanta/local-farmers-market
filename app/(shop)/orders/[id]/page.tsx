import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { ArrowLeft, Phone, MessageCircle, AlertCircle } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDateTime, getStatusColor, getStatusLabel } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OrderTimeline } from "@/components/shop/order-timeline";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paid?: string }>;
}

async function getOrder(id: string, userId: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: { product: true },
      },
      payments: true,
    },
  });

  if (!order || order.userId !== userId) {
    return null;
  }

  return order;
}

export default async function OrderDetailPage({ params, searchParams }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login?redirect=/orders");
  }

  const { id } = await params;
  const { paid } = await searchParams;
  const order = await getOrder(id, session.user.id);

  if (!order) {
    notFound();
  }

  const settings = await prisma.settings.findUnique({
    where: { id: "default" },
  });

  const showPaymentPending = paid === "pending" && order.status === "PENDING_PAYMENT";

  return (
    <div className="container py-6 max-w-2xl">
      <Link
        href="/orders"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Orders
      </Link>

      {showPaymentPending && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6 flex gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-800">Payment Processing</p>
            <p className="text-sm text-yellow-700">
              Your payment is being processed. This page will update automatically
              once confirmed. If the payment was successful, your order will be
              confirmed shortly.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{order.orderNumber}</h1>
          <p className="text-muted-foreground">
            {formatDateTime(order.createdAt)}
          </p>
        </div>
        <Badge className={`${getStatusColor(order.status)} text-sm px-3 py-1`}>
          {getStatusLabel(order.status)}
        </Badge>
      </div>

      <div className="space-y-6">
        {/* Order Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Status</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderTimeline currentStatus={order.status} />
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{item.nameSnapshot}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(item.priceSnapshot.toNumber())} x {item.qty}{" "}
                      {item.unitSnapshot}
                    </p>
                  </div>
                  <span className="font-medium">
                    {formatCurrency(item.priceSnapshot.toNumber() * item.qty)}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t mt-4 pt-4 flex justify-between font-bold">
              <span>Total</span>
              <span>{formatCurrency(order.subtotal.toNumber())}</span>
            </div>
          </CardContent>
        </Card>

        {/* Pickup Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pickup Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Customer</p>
              <p className="font-medium">{order.customerName}</p>
              <p className="text-sm">{order.customerPhone}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Pickup Option</p>
              <p className="font-medium">
                {order.pickupOption === "OWN_RIDER"
                  ? "Sending Own Rider"
                  : "Requesting Rider Booking"}
              </p>
            </div>

            {order.pickupOption === "OWN_RIDER" && (order.riderName || order.riderPhone) && (
              <div>
                <p className="text-sm text-muted-foreground">Rider Details</p>
                {order.riderName && <p>{order.riderName}</p>}
                {order.riderPhone && <p>{order.riderPhone}</p>}
              </div>
            )}

            {order.pickupTime && (
              <div>
                <p className="text-sm text-muted-foreground">Expected Pickup</p>
                <p>{order.pickupTime}</p>
              </div>
            )}

            {order.pickupNotes && (
              <div>
                <p className="text-sm text-muted-foreground">Notes</p>
                <p>{order.pickupNotes}</p>
              </div>
            )}

            {settings?.pickupAddressText && order.status !== "PENDING_PAYMENT" && (
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-green-800 mb-1">
                  Pickup Location
                </p>
                <p className="text-sm text-green-700">{settings.pickupAddressText}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact */}
        {settings && (settings.contactPhone || settings.supportWhatsApp) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {settings.contactPhone && (
                <a
                  href={`tel:${settings.contactPhone}`}
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <Phone className="h-4 w-4" />
                  {settings.contactPhone}
                </a>
              )}
              {settings.supportWhatsApp && (
                <a
                  href={`https://wa.me/${settings.supportWhatsApp.replace(/\+/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <MessageCircle className="h-4 w-4" />
                  Chat on WhatsApp
                </a>
              )}
            </CardContent>
          </Card>
        )}

        {/* Disclaimer */}
        <p className="text-xs text-center text-muted-foreground">
          We are not a delivery company. Pickup is via your rider or a rider
          booked at your cost. Produce is sourced from local hardworking Zambian
          farmers.
        </p>
      </div>
    </div>
  );
}
