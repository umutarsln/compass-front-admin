"use client"

import { useState, useEffect } from "react"
import { PageBody } from "@/components/layout/PageBody"
import { paymentSettingsService, PaymentSettings } from "@/services/payment-settings.service"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Loader2, Save } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function PaymentSettingsPage() {
  const [settings, setSettings] = useState<PaymentSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const data = await paymentSettingsService.getSettings()
      setSettings(data)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error?.response?.data?.message || "Ayarlar yüklenirken bir hata oluştu.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!settings) return

    try {
      setSaving(true)
      await paymentSettingsService.updateSettings(settings)
      toast({
        variant: "success",
        title: "Başarılı",
        description: "Ödeme ayarları başarıyla güncellendi.",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error?.response?.data?.message || "Ayarlar güncellenirken bir hata oluştu.",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <PageBody>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </PageBody>
    )
  }

  if (!settings) {
    return (
      <PageBody>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Ayarlar yüklenemedi</p>
        </div>
      </PageBody>
    )
  }

  return (
    <PageBody>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Ödeme Ayarları</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Iyzico, QNBpay ve IBAN EFT ödeme ayarlarını yönetin.
            </p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Kaydediliyor...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Kaydet
              </>
            )}
          </Button>
        </div>

        {/* Iyzico Settings */}
        <div className="space-y-6 p-6 border border-border rounded-lg bg-card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Iyzico Ayarları</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Iyzico ödeme entegrasyonu ayarları
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={settings.iyzicoEnabled}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, iyzicoEnabled: checked })
                }
              />
              <Label>Iyzico Aktif</Label>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="iyzicoApiKey">Iyzico API Key</Label>
              <Input
                id="iyzicoApiKey"
                type="password"
                value={settings.iyzicoApiKey || ""}
                onChange={(e) =>
                  setSettings({ ...settings, iyzicoApiKey: e.target.value })
                }
                placeholder="Iyzico API Key"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="iyzicoSecretKey">Iyzico Secret Key</Label>
              <Input
                id="iyzicoSecretKey"
                type="password"
                value={settings.iyzicoSecretKey || ""}
                onChange={(e) =>
                  setSettings({ ...settings, iyzicoSecretKey: e.target.value })
                }
                placeholder="Iyzico Secret Key"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="iyzicoBaseUrl">Iyzico Base URL</Label>
              <Input
                id="iyzicoBaseUrl"
                value={settings.iyzicoBaseUrl || ""}
                onChange={(e) =>
                  setSettings({ ...settings, iyzicoBaseUrl: e.target.value })
                }
                placeholder="https://api.iyzipay.com veya https://sandbox-api.iyzipay.com"
              />
            </div>
          </div>
        </div>

        {/* QNBpay */}
        <div className="space-y-6 p-6 border border-border rounded-lg bg-card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">QNBpay</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Hosted link veya paySmart3D. Webhook için panelde URL:{" "}
                <span className="font-mono text-xs">
                  {"{"}APP_PUBLIC_URL{"}"}/payments/qnbpay/webhook
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={settings.qnbpayEnabled ?? false}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, qnbpayEnabled: checked })
                }
              />
              <Label>QNBpay aktif</Label>
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="qnbpayAppId">APP ID (app_id)</Label>
              <Input
                id="qnbpayAppId"
                type="password"
                value={settings.qnbpayAppId || ""}
                onChange={(e) =>
                  setSettings({ ...settings, qnbpayAppId: e.target.value })
                }
                placeholder="APP KEY"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qnbpayAppSecret">APP Secret</Label>
              <Input
                id="qnbpayAppSecret"
                type="password"
                value={settings.qnbpayAppSecret || ""}
                onChange={(e) =>
                  setSettings({ ...settings, qnbpayAppSecret: e.target.value })
                }
                placeholder="APP SECRET"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qnbpayMerchantKey">Merchant Key</Label>
              <Input
                id="qnbpayMerchantKey"
                type="password"
                value={settings.qnbpayMerchantKey || ""}
                onChange={(e) =>
                  setSettings({ ...settings, qnbpayMerchantKey: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qnbpayMerchantId">Merchant ID (opsiyonel)</Label>
              <Input
                id="qnbpayMerchantId"
                value={settings.qnbpayMerchantId || ""}
                onChange={(e) =>
                  setSettings({ ...settings, qnbpayMerchantId: e.target.value })
                }
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="qnbpayBaseUrl">Base URL</Label>
              <Input
                id="qnbpayBaseUrl"
                value={settings.qnbpayBaseUrl || ""}
                onChange={(e) =>
                  setSettings({ ...settings, qnbpayBaseUrl: e.target.value })
                }
                placeholder="https://test.qnbpay.com.tr/ccpayment"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Checkout modu</Label>
              <Select
                value={settings.qnbpayCheckoutMode || "hosted_link"}
                onValueChange={(v) =>
                  setSettings({ ...settings, qnbpayCheckoutMode: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Mod seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hosted_link">Hosted link (önerilen)</SelectItem>
                  <SelectItem value="pay_smart_3d">paySmart3D (kart bu sitede)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="qnbpaySaleWebhookKey">Satış webhook anahtarı (opsiyonel)</Label>
              <Input
                id="qnbpaySaleWebhookKey"
                type="password"
                value={settings.qnbpaySaleWebhookKey || ""}
                onChange={(e) =>
                  setSettings({ ...settings, qnbpaySaleWebhookKey: e.target.value })
                }
                placeholder="Paneldeki sale_web_hook_key"
              />
            </div>
          </div>
        </div>

        {/* IBAN EFT Settings */}
        <div className="space-y-6 p-6 border border-border rounded-lg bg-card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">IBAN EFT/Havale Ayarları</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Havale/EFT ödeme yöntemi ayarları
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={settings.ibanEftEnabled}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, ibanEftEnabled: checked })
                }
              />
              <Label>IBAN EFT Aktif</Label>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ibanNumber">IBAN Numarası</Label>
              <Input
                id="ibanNumber"
                value={settings.ibanNumber || ""}
                onChange={(e) =>
                  setSettings({ ...settings, ibanNumber: e.target.value })
                }
                placeholder="TR00 0000 0000 0000 0000 0000 00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountName">Hesap İsmi</Label>
              <Input
                id="accountName"
                value={settings.accountName || ""}
                onChange={(e) =>
                  setSettings({ ...settings, accountName: e.target.value })
                }
                placeholder="Şirket Adı"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankName">Banka İsmi</Label>
              <Input
                id="bankName"
                value={settings.bankName || ""}
                onChange={(e) =>
                  setSettings({ ...settings, bankName: e.target.value })
                }
                placeholder="Banka A.Ş."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsappNumber">WhatsApp Numarası</Label>
              <Input
                id="whatsappNumber"
                value={settings.whatsappNumber || ""}
                onChange={(e) =>
                  setSettings({ ...settings, whatsappNumber: e.target.value })
                }
                placeholder="+90 555 123 45 67"
              />
            </div>
          </div>
        </div>
      </div>
    </PageBody>
  )
}
