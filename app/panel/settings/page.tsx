"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import axios from "axios"
import { PageBody } from "@/components/layout/PageBody"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import {
  exchangeRateAdminService,
  ExchangeRatePublic,
  ExchangeSettingsAdmin,
} from "@/services/exchange-rate.service"
import { CreditCard, Loader2, RefreshCw } from "lucide-react"

/**
 * Axios veya bilinmeyen hatalardan kullanıcı mesajı üretir.
 */
function apiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined
    if (data?.message) return data.message
    if (error.message) return error.message
  }
  return fallback
}

/**
 * Ayarlar ana sayfası: ödeme linki ve USD/TRY kur yönetimi.
 */
export default function SettingsIndexPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [savingManual, setSavingManual] = useState(false)
  const [snapshot, setSnapshot] = useState<ExchangeRatePublic | null>(null)
  const [adminRow, setAdminRow] = useState<ExchangeSettingsAdmin | null>(null)
  const [manualInput, setManualInput] = useState("")

  /**
   * Kur verilerini yeniden yükler.
   */
  const loadAll = useCallback(async () => {
    try {
      setLoading(true)
      const [pub, admin] = await Promise.all([
        exchangeRateAdminService.getPublicSnapshot(),
        exchangeRateAdminService.getAdminSettings(),
      ])
      setSnapshot(pub)
      setAdminRow(admin)
      setManualInput(
        admin.manualUsdTryRate != null && admin.manualUsdTryRate !== ""
          ? String(admin.manualUsdTryRate)
          : "",
      )
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: apiErrorMessage(error, "Kur ayarları yüklenemedi."),
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  /**
   * İnternetten kur yeniler.
   */
  const handleRefresh = async () => {
    try {
      setRefreshing(true)
      const next = await exchangeRateAdminService.refreshFromInternet()
      setSnapshot(next)
      const admin = await exchangeRateAdminService.getAdminSettings()
      setAdminRow(admin)
      toast({ title: "Güncellendi", description: "USD/TRY kuru yenilendi." })
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: apiErrorMessage(error, "Kur güncellenemedi."),
      })
    } finally {
      setRefreshing(false)
    }
  }

  /**
   * Manuel kur kaydeder veya temizler.
   */
  const handleSaveManual = async (clear: boolean) => {
    try {
      setSavingManual(true)
      let rateToSave: number | null = null
      if (!clear) {
        const parsed = Number(manualInput.replace(",", "."))
        if (Number.isNaN(parsed) || parsed <= 0) {
          toast({
            variant: "destructive",
            title: "Geçersiz",
            description: "Pozitif bir kur girin veya temizleyin.",
          })
          return
        }
        rateToSave = parsed
      }
      const next = await exchangeRateAdminService.setManualRate(rateToSave)
      setSnapshot(next)
      const admin = await exchangeRateAdminService.getAdminSettings()
      setAdminRow(admin)
      toast({
        title: "Kaydedildi",
        description: clear
          ? "Manuel kur kaldırıldı; otomatik kur kullanılacak."
          : "Manuel kur güncellendi.",
      })
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: apiErrorMessage(error, "Manuel kur kaydedilemedi."),
      })
    } finally {
      setSavingManual(false)
    }
  }

  if (loading) {
    return (
      <PageBody>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageBody>
    )
  }

  return (
    <PageBody>
      <div className="mx-auto flex max-w-2xl flex-col gap-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ayarlar</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Ödeme ve döviz kuru yapılandırması.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Ödeme
            </CardTitle>
            <CardDescription>
              Kredi kartı, havale ve sanal POS ayarları.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <Link href="/panel/settings/payment">Ödeme ayarlarına git</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>USD / TRY kuru</CardTitle>
            <CardDescription>
              Mağaza fiyatları DB&apos;de USD tutulur; müşteriye gösterim için güncel kur ile TL üretilir.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-2">
              <Label>Efektif kur</Label>
              <p className="text-2xl font-semibold tabular-nums">
                {snapshot?.usdTryRate != null
                  ? snapshot.usdTryRate.toFixed(6)
                  : "—"}
              </p>
              <p className="text-muted-foreground text-xs">
                Manuel override:{" "}
                {snapshot?.isManualOverride ? "Evet" : "Hayır"}
                {adminRow?.fetchedAt && (
                  <>
                    {" "}
                    · Son otomatik çekim:{" "}
                    {new Date(adminRow.fetchedAt).toLocaleString("tr-TR")}
                  </>
                )}
                {adminRow?.fetchSource && (
                  <> · Kaynak: {adminRow.fetchSource}</>
                )}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={refreshing}
                onClick={() => handleRefresh()}
              >
                {refreshing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                İnternetten güncelle
              </Button>
            </div>

            <div className="space-y-2 border-t pt-4">
              <Label htmlFor="manual-rate">Manuel USD/TRY (boş bırakıp temizleyebilirsiniz)</Label>
              <Input
                id="manual-rate"
                inputMode="decimal"
                placeholder="Örn: 44.25"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  disabled={savingManual}
                  onClick={() => handleSaveManual(false)}
                >
                  {savingManual ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Manuel kur kaydet
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={savingManual}
                  onClick={() => handleSaveManual(true)}
                >
                  Manuel kur kaldır
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageBody>
  )
}
