"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { couponService, Coupon } from "@/services/coupon.service"
import { useToast } from "@/components/ui/use-toast"
import { Plus, Edit, Trash2, Loader2 } from "lucide-react"
import { CouponForm } from "./CouponForm"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

function formatDate(value: string | null): string {
  if (!value) return "-"
  return new Date(value).toLocaleDateString("tr-TR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function formatValidity(validFrom: string | null, validTo: string | null): string {
  if (!validFrom && !validTo) return "-"
  if (validFrom && validTo) return `${formatDate(validFrom)} – ${formatDate(validTo)}`
  if (validFrom) return `${formatDate(validFrom)} –`
  return `– ${formatDate(validTo)}`
}

export function CouponList() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [deletingCoupon, setDeletingCoupon] = useState<Coupon | null>(null)

  const { data: coupons, isLoading } = useQuery({
    queryKey: ["coupons"],
    queryFn: () => couponService.getAll(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => couponService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] })
      toast({
        variant: "success",
        title: "Başarılı",
        description: "Kupon başarıyla silindi.",
      })
      setDeletingCoupon(null)
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.response?.data?.message || "Kupon silinirken bir hata oluştu.",
      })
    },
  })

  const handleAdd = () => {
    setEditingCoupon(null)
    setIsFormOpen(true)
  }

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon)
    setIsFormOpen(true)
  }

  const handleDelete = (coupon: Coupon) => {
    setDeletingCoupon(coupon)
  }

  const handleDeleteConfirm = () => {
    if (deletingCoupon) {
      deleteMutation.mutate(deletingCoupon.id)
    }
  }

  const handleFormSuccess = () => {
    setIsFormOpen(false)
    setEditingCoupon(null)
    queryClient.invalidateQueries({ queryKey: ["coupons"] })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <>
      <div className="rounded-lg border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">Kupon Listesi</h2>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Yeni Kupon Ekle
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Kod
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Ad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Tür
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  İndirim
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Kullanım
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Min. tutar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Geçerlilik
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {coupons && coupons.length > 0 ? (
                coupons.map((coupon) => (
                  <tr
                    key={coupon.id}
                    className="hover:bg-muted/50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-foreground font-mono">
                        {coupon.code}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground">{coupon.name}</div>
                      {coupon.description && (
                        <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1 max-w-[200px]">
                          {coupon.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={coupon.type === "PERCENTAGE" ? "default" : "secondary"}>
                        {coupon.type === "PERCENTAGE" ? "Yüzde" : "Sabit TL"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground">
                        {coupon.type === "PERCENTAGE"
                          ? `%${coupon.discountValue}`
                          : `${coupon.discountValue} TL`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-muted-foreground">
                        {coupon.usageLimit != null
                          ? `${coupon.usageCount} / ${coupon.usageLimit}`
                          : `${coupon.usageCount} (Sınırsız)`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-muted-foreground">
                        {coupon.minOrderAmount != null
                          ? `${coupon.minOrderAmount} TL`
                          : "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-muted-foreground">
                        {formatValidity(coupon.validFrom, coupon.validTo)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(coupon)}
                          className="p-2 rounded-lg text-muted-foreground hover:bg-hover hover:text-foreground transition-all duration-200 hover:scale-110 active:scale-95"
                          title="Düzenle"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(coupon)}
                          className="p-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200 hover:scale-110 active:scale-95"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="text-sm text-muted-foreground">
                      Henüz kupon bulunmuyor.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isFormOpen && (
        <CouponForm
          coupon={editingCoupon}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setIsFormOpen(false)
            setEditingCoupon(null)
          }}
        />
      )}

      <AlertDialog open={!!deletingCoupon} onOpenChange={() => setDeletingCoupon(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kuponu Sil</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingCoupon && (
                <>
                  <strong>{deletingCoupon.name}</strong> ({deletingCoupon.code}) kuponunu silmek
                  istediğinizden emin misiniz? Bu işlem geri alınamaz.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Siliniyor..." : "Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
