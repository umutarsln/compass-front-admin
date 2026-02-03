"use client"

import { useState, useEffect } from "react"
import { useMutation } from "@tanstack/react-query"
import {
  couponService,
  Coupon,
  CreateCouponDto,
  UpdateCouponDto,
  CouponType,
} from "@/services/coupon.service"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"

interface FormState {
  code: string
  name: string
  description: string
  type: CouponType
  discountValue: string
  usageLimit: string
  minOrderAmount: string
  validFrom: string
  validTo: string
}

const emptyForm: FormState = {
  code: "",
  name: "",
  description: "",
  type: "PERCENTAGE",
  discountValue: "",
  usageLimit: "",
  minOrderAmount: "",
  validFrom: "",
  validTo: "",
}

function toDateInputValue(iso: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  return d.toISOString().slice(0, 16)
}

interface CouponFormProps {
  coupon: Coupon | null
  onSuccess: () => void
  onCancel: () => void
}

export function CouponForm({ coupon, onSuccess, onCancel }: CouponFormProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState<FormState>(emptyForm)

  const isEditing = !!coupon

  useEffect(() => {
    if (coupon) {
      setFormData({
        code: coupon.code,
        name: coupon.name,
        description: coupon.description ?? "",
        type: coupon.type,
        discountValue: String(coupon.discountValue),
        usageLimit: coupon.usageLimit != null ? String(coupon.usageLimit) : "",
        minOrderAmount:
          coupon.minOrderAmount != null ? String(coupon.minOrderAmount) : "",
        validFrom: coupon.validFrom ? toDateInputValue(coupon.validFrom) : "",
        validTo: coupon.validTo ? toDateInputValue(coupon.validTo) : "",
      })
    } else {
      setFormData(emptyForm)
    }
  }, [coupon])

  const createMutation = useMutation({
    mutationFn: (data: CreateCouponDto) => couponService.create(data),
    onSuccess: () => {
      toast({
        variant: "success",
        title: "Başarılı",
        description: "Kupon başarıyla oluşturuldu.",
      })
      onSuccess()
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description:
          error.response?.data?.message || "Kupon oluşturulurken bir hata oluştu.",
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCouponDto }) =>
      couponService.update(id, data),
    onSuccess: () => {
      toast({
        variant: "success",
        title: "Başarılı",
        description: "Kupon başarıyla güncellendi.",
      })
      onSuccess()
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description:
          error.response?.data?.message || "Kupon güncellenirken bir hata oluştu.",
      })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const discountNum = parseFloat(formData.discountValue)
    if (isNaN(discountNum) || discountNum < 0) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "İndirim değeri 0 veya pozitif bir sayı olmalıdır.",
      })
      return
    }
    if (formData.type === "PERCENTAGE" && (discountNum > 100 || discountNum < 0)) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Yüzdelik indirim 0–100 arasında olmalıdır.",
      })
      return
    }

    if (isEditing && coupon) {
      const updateData: UpdateCouponDto = {
        code: formData.code.trim(),
        name: formData.name.trim(),
        description: formData.description.trim() === "" ? null : formData.description.trim(),
        type: formData.type,
        discountValue: discountNum,
        usageLimit: formData.usageLimit.trim() === "" ? null : parseInt(formData.usageLimit, 10),
        minOrderAmount:
          formData.minOrderAmount.trim() === ""
            ? null
            : parseFloat(formData.minOrderAmount),
        validFrom: formData.validFrom ? new Date(formData.validFrom).toISOString() : null,
        validTo: formData.validTo ? new Date(formData.validTo).toISOString() : null,
      }
      if (Number.isNaN(updateData.usageLimit as number)) updateData.usageLimit = null
      if (updateData.minOrderAmount != null && Number.isNaN(updateData.minOrderAmount))
        updateData.minOrderAmount = null
      updateMutation.mutate({ id: coupon.id, data: updateData })
    } else {
      const createData: CreateCouponDto = {
        code: formData.code.trim(),
        name: formData.name.trim(),
        type: formData.type,
        discountValue: discountNum,
      }
      if (formData.description.trim()) createData.description = formData.description.trim()
      const ul = parseInt(formData.usageLimit, 10)
      if (!Number.isNaN(ul) && ul > 0) createData.usageLimit = ul
      const minOrder = parseFloat(formData.minOrderAmount)
      if (!Number.isNaN(minOrder) && minOrder >= 0) createData.minOrderAmount = minOrder
      if (formData.validFrom) createData.validFrom = new Date(formData.validFrom).toISOString()
      if (formData.validTo) createData.validTo = new Date(formData.validTo).toISOString()
      createMutation.mutate(createData)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  const inputClass =
    "h-12 rounded-lg border border-border bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Kupon Düzenle" : "Yeni Kupon Ekle"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Kupon bilgilerini güncelleyin."
              : "Yeni bir kupon oluşturun. Kod benzersiz olmalıdır."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="code">
              Kupon kodu *
            </label>
            <input
              id="code"
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
              className={inputClass}
              placeholder="HOSGELDIN20"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="name">
              Kupon adı *
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className={inputClass}
              placeholder="Hoş geldin indirimi"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="description">
              Açıklama
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Opsiyonel"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="type">
                Tür *
              </label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as CouponType })
                }
                className={inputClass}
              >
                <option value="PERCENTAGE">Yüzde</option>
                <option value="FIXED">Sabit TL</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="discountValue">
                İndirim değeri *{" "}
                {formData.type === "PERCENTAGE" ? "(0–100)" : "(TL)"}
              </label>
              <input
                id="discountValue"
                type="number"
                min={0}
                max={formData.type === "PERCENTAGE" ? 100 : undefined}
                step={formData.type === "PERCENTAGE" ? 1 : 0.01}
                value={formData.discountValue}
                onChange={(e) =>
                  setFormData({ ...formData, discountValue: e.target.value })
                }
                required
                className={inputClass}
                placeholder={formData.type === "PERCENTAGE" ? "20" : "50"}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="usageLimit">
                Kullanım limiti
              </label>
              <input
                id="usageLimit"
                type="number"
                min={0}
                value={formData.usageLimit}
                onChange={(e) =>
                  setFormData({ ...formData, usageLimit: e.target.value })
                }
                className={inputClass}
                placeholder="Sınırsız"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="minOrderAmount">
                Min. sepet tutarı (TL)
              </label>
              <input
                id="minOrderAmount"
                type="number"
                min={0}
                step={0.01}
                value={formData.minOrderAmount}
                onChange={(e) =>
                  setFormData({ ...formData, minOrderAmount: e.target.value })
                }
                className={inputClass}
                placeholder="Opsiyonel"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="validFrom">
                Geçerlilik başlangıç
              </label>
              <input
                id="validFrom"
                type="datetime-local"
                value={formData.validFrom}
                onChange={(e) =>
                  setFormData({ ...formData, validFrom: e.target.value })
                }
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="validTo">
                Geçerlilik bitiş
              </label>
              <input
                id="validTo"
                type="datetime-local"
                value={formData.validTo}
                onChange={(e) =>
                  setFormData({ ...formData, validTo: e.target.value })
                }
                className={inputClass}
              />
            </div>
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="h-12 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-hover transition-colors disabled:opacity-50"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="h-12 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEditing ? "Güncelle" : "Oluştur"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
