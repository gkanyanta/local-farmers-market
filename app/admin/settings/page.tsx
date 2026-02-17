"use client";

import { useState, useEffect } from "react";
import { Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";

interface Settings {
  minOrderValue: number | string;
  cutOffTime: string;
  pickupAddressText: string | null;
  contactPhone: string | null;
  supportWhatsApp: string | null;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    minOrderValue: 200,
    cutOffTime: "08:30",
    pickupAddressText: "",
    contactPhone: "",
    supportWhatsApp: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/admin/settings");
        if (res.ok) {
          const data = await res.json();
          setSettings({
            minOrderValue: data.minOrderValue,
            cutOffTime: data.cutOffTime,
            pickupAddressText: data.pickupAddressText || "",
            contactPhone: data.contactPhone || "",
            supportWhatsApp: data.supportWhatsApp || "",
          });
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
        toast({ title: "Error", description: "Failed to load settings", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }

    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          minOrderValue: Number(settings.minOrderValue),
          cutOffTime: settings.cutOffTime,
          pickupAddressText: settings.pickupAddressText || null,
          contactPhone: settings.contactPhone || null,
          supportWhatsApp: settings.supportWhatsApp || null,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save settings");
      }

      toast({
        title: "Settings Saved",
        description: "Your changes have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Settings</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Order Settings</CardTitle>
            <CardDescription>
              Configure order-related settings for customers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="minOrderValue">Minimum Order Value (ZMW)</Label>
              <Input
                id="minOrderValue"
                type="number"
                value={settings.minOrderValue}
                onChange={(e) =>
                  setSettings({ ...settings, minOrderValue: e.target.value })
                }
                required
              />
              <p className="text-sm text-muted-foreground mt-1">
                Customers must order at least this amount to checkout.
              </p>
            </div>
            <div>
              <Label htmlFor="cutOffTime">Daily Cut-off Time</Label>
              <Input
                id="cutOffTime"
                type="time"
                value={settings.cutOffTime}
                onChange={(e) =>
                  setSettings({ ...settings, cutOffTime: e.target.value })
                }
                required
              />
              <p className="text-sm text-muted-foreground mt-1">
                Orders placed after this time may be processed the next day.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pickup Information</CardTitle>
            <CardDescription>
              Information shown to customers after order confirmation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="pickupAddressText">Pickup Address</Label>
              <Textarea
                id="pickupAddressText"
                value={settings.pickupAddressText || ""}
                onChange={(e) =>
                  setSettings({ ...settings, pickupAddressText: e.target.value })
                }
                rows={3}
                placeholder="Enter the pickup location details..."
              />
              <p className="text-sm text-muted-foreground mt-1">
                This address is shown to customers after payment is confirmed.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>
              Contact details for customer support.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="contactPhone">Phone Number</Label>
              <Input
                id="contactPhone"
                type="tel"
                value={settings.contactPhone || ""}
                onChange={(e) =>
                  setSettings({ ...settings, contactPhone: e.target.value })
                }
                placeholder="+260..."
              />
            </div>
            <div>
              <Label htmlFor="supportWhatsApp">WhatsApp Number</Label>
              <Input
                id="supportWhatsApp"
                type="tel"
                value={settings.supportWhatsApp || ""}
                onChange={(e) =>
                  setSettings({ ...settings, supportWhatsApp: e.target.value })
                }
                placeholder="+260..."
              />
              <p className="text-sm text-muted-foreground mt-1">
                Include country code without + for WhatsApp link.
              </p>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={isSaving} className="w-full">
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
