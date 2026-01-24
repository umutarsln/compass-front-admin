"use client"

import { useEffect } from "react"
import { Controller } from "react-hook-form"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PersonalizationForm } from "@/services/personalization.service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface PersonalizationStepProps {
  control: any
  errors: any
  personalizationForms?: PersonalizationForm[]
}

export function PersonalizationStep({
  control,
  errors,
  personalizationForms = [],
}: PersonalizationStepProps) {
  useEffect(() => {
    console.log("PersonalizationStep - personalizationForms:", personalizationForms)
    console.log("PersonalizationStep - personalizationForms length:", personalizationForms?.length)
    const availableForms = personalizationForms?.filter((form) => form.isActive && form.currentPublishedVersion) || []
    console.log("PersonalizationStep - availableForms:", availableForms)
    console.log("PersonalizationStep - availableForms length:", availableForms.length)
  }, [personalizationForms])

  const availableForms = personalizationForms?.filter((form) => form.isActive && form.currentPublishedVersion) || []

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Kişiselleştirme Formu
        </h3>
        <p className="text-sm text-muted-foreground">
          Bu ürün için kullanılacak kişiselleştirme formunu seçin. Sadece yayında olan formlar gösterilir.
        </p>
      </div>

      <div>
        <Label htmlFor="personalizationFormId">Kişiselleştirme Formu</Label>
        <Controller
          name="personalizationFormId"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value || "none"}
              onValueChange={(value) => field.onChange(value === "none" ? null : value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Form seçin (opsiyonel)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Form seçilmedi</SelectItem>
                {availableForms.map((form) => (
                  <SelectItem key={form.id} value={form.id}>
                    {form.title}
                    {form.currentPublishedVersion && (
                      <span className="text-muted-foreground ml-2">
                        (v{form.currentPublishedVersion.version})
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.personalizationFormId && (
          <p className="text-sm text-red-600 mt-1">
            {errors.personalizationFormId.message}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          Kişiselleştirme formu seçildiğinde, müşteriler ürünü sepete eklerken bu formu dolduracaklar.
        </p>
      </div>

      {personalizationForms.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center">
              Henüz kişiselleştirme formu oluşturulmamış.{" "}
              <a
                href="/panel/personalization/forms"
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Form oluşturmak için tıklayın
              </a>
            </p>
          </CardContent>
        </Card>
      )}

      {availableForms.length === 0 && personalizationForms.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center">
              Aktif ve yayında olan kişiselleştirme formu bulunmuyor.
            </p>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Toplam {personalizationForms.length} form bulundu, ancak hiçbiri aktif ve yayında değil.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
