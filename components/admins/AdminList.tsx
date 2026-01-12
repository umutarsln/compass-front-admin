"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { userService, User, CreateUserDto, UpdateUserDto } from "@/services/user.service"
import { useToast } from "@/components/ui/use-toast"
import { Plus, Edit, Trash2, Loader2 } from "lucide-react"
import { AdminForm } from "./AdminForm"
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

export function AdminList() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<User | null>(null)
  const [deletingAdmin, setDeletingAdmin] = useState<User | null>(null)

  // Admin listesi
  const { data: admins, isLoading } = useQuery({
    queryKey: ["admins"],
    queryFn: () => userService.getAllAdmins(),
  })

  // Admin silme mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => userService.deleteAdmin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] })
      toast({
        variant: "success",
        title: "Başarılı",
        description: "Admin kullanıcısı başarıyla silindi.",
      })
      setDeletingAdmin(null)
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.response?.data?.message || "Admin silinirken bir hata oluştu.",
      })
    },
  })

  const handleAdd = () => {
    setEditingAdmin(null)
    setIsFormOpen(true)
  }

  const handleEdit = (admin: User) => {
    setEditingAdmin(admin)
    setIsFormOpen(true)
  }

  const handleDelete = (admin: User) => {
    setDeletingAdmin(admin)
  }

  const handleDeleteConfirm = () => {
    if (deletingAdmin) {
      deleteMutation.mutate(deletingAdmin.id)
    }
  }

  const handleFormSuccess = () => {
    setIsFormOpen(false)
    setEditingAdmin(null)
    queryClient.invalidateQueries({ queryKey: ["admins"] })
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
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">Admin Listesi</h2>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Yeni Admin Ekle
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Ad Soyad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Telefon
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Oluşturulma
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {admins && admins.length > 0 ? (
                admins.map((admin) => (
                  <tr
                    key={admin.id}
                    className="hover:bg-muted/50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-foreground">
                        {admin.firstname} {admin.lastname}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-muted-foreground">{admin.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-muted-foreground">{admin.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-muted-foreground">
                        {new Date(admin.createdAt).toLocaleDateString("tr-TR")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(admin)}
                          className="p-2 rounded-lg text-muted-foreground hover:bg-hover hover:text-foreground transition-all duration-200 hover:scale-110 active:scale-95"
                          title="Düzenle"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(admin)}
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
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="text-sm text-muted-foreground">
                      Henüz admin kullanıcısı bulunmuyor.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Form Dialog */}
      {isFormOpen && (
        <AdminForm
          admin={editingAdmin}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setIsFormOpen(false)
            setEditingAdmin(null)
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingAdmin} onOpenChange={() => setDeletingAdmin(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Admin Kullanıcısını Sil</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingAdmin && (
                <>
                  <strong>{deletingAdmin.firstname} {deletingAdmin.lastname}</strong> adlı admin
                  kullanıcısını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
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
