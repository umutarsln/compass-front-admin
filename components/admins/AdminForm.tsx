"use client"

import { useState, useEffect } from "react"
import { useMutation } from "@tanstack/react-query"
import { userService, User, CreateUserDto, UpdateUserDto } from "@/services/user.service"
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

interface AdminFormProps {
  admin: User | null
  onSuccess: () => void
  onCancel: () => void
}

export function AdminForm({ admin, onSuccess, onCancel }: AdminFormProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState<CreateUserDto>({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    phone: "",
  })

  const isEditing = !!admin

  useEffect(() => {
    if (admin) {
      setFormData({
        firstname: admin.firstname,
        lastname: admin.lastname,
        email: admin.email,
        password: "", // Şifre güncelleme için boş bırak
        phone: admin.phone,
      })
    } else {
      setFormData({
        firstname: "",
        lastname: "",
        email: "",
        password: "",
        phone: "",
      })
    }
  }, [admin])

  const createMutation = useMutation({
    mutationFn: (data: CreateUserDto) => userService.createAdmin(data),
    onSuccess: () => {
      toast({
        variant: "success",
        title: "Başarılı",
        description: "Admin kullanıcısı başarıyla oluşturuldu.",
      })
      onSuccess()
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.response?.data?.message || "Admin oluşturulurken bir hata oluştu.",
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserDto }) =>
      userService.updateAdmin(id, data),
    onSuccess: () => {
      toast({
        variant: "success",
        title: "Başarılı",
        description: "Admin kullanıcısı başarıyla güncellendi.",
      })
      onSuccess()
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.response?.data?.message || "Admin güncellenirken bir hata oluştu.",
      })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (isEditing) {
      // Güncelleme - şifre opsiyonel
      const updateData: UpdateUserDto = {
        firstname: formData.firstname,
        lastname: formData.lastname,
        email: formData.email,
        phone: formData.phone,
      }
      if (formData.password) {
        updateData.password = formData.password
      }
      updateMutation.mutate({ id: admin!.id, data: updateData })
    } else {
      // Oluşturma - şifre zorunlu
      if (!formData.password || formData.password.length < 6) {
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Şifre en az 6 karakter olmalıdır.",
        })
        return
      }
      createMutation.mutate(formData)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Admin Düzenle" : "Yeni Admin Ekle"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Admin kullanıcısının bilgilerini güncelleyin."
              : "Yeni bir admin kullanıcısı oluşturun."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="firstname">
                Ad
              </label>
              <input
                id="firstname"
                type="text"
                value={formData.firstname}
                onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
                required
                className="h-12 rounded-lg border border-border bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Ad"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="lastname">
                Soyad
              </label>
              <input
                id="lastname"
                type="text"
                value={formData.lastname}
                onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                required
                className="h-12 rounded-lg border border-border bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Soyad"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="h-12 rounded-lg border border-border bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="email@example.com"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="phone">
              Telefon
            </label>
            <input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
              className="h-12 rounded-lg border border-border bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="+905551234567"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="password">
              Şifre {isEditing && "(Değiştirmek için doldurun)"}
            </label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!isEditing}
              minLength={6}
              className="h-12 rounded-lg border border-border bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder={isEditing ? "Yeni şifre (opsiyonel)" : "Şifre (min 6 karakter)"}
            />
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
