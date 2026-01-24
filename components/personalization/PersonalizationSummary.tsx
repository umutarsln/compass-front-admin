"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import { FileImage } from "lucide-react"

interface PersonalizationSummaryProps {
  personalization: {
    form: {
      formId: string
      versionId: string
      title: string
      slug: string
    }
    schemaSnapshot: {
      fields: any[]
      conditions: any[]
    }
    userValues: Record<string, any>
    pricingBreakdown: Array<{
      fieldKey: string
      fieldTitle: string
      amount: number
      currency: string
    }>
    totalPersonalizationAmount: number
    currency: string
  }
  readOnly?: boolean
}

export function PersonalizationSummary({
  personalization,
  readOnly = false,
}: PersonalizationSummaryProps) {
  const { form, schemaSnapshot, userValues, pricingBreakdown, totalPersonalizationAmount } =
    personalization

  // Get field definitions from schema
  const getFieldDefinition = (fieldKey: string) => {
    return schemaSnapshot.fields.find((f) => f.key === fieldKey)
  }

  // Render field value based on type
  const renderFieldValue = (fieldKey: string, value: any) => {
    const field = getFieldDefinition(fieldKey)
    if (!field) return String(value)

    switch (field.type) {
      case "IMAGE_PICKER_SINGLE":
      case "FILE_UPLOAD_SINGLE":
        if (typeof value === "string" && value.startsWith("http")) {
          return (
            <div className="mt-2">
              <Image
                src={value}
                alt={field.title}
                width={100}
                height={100}
                className="rounded-lg object-cover"
              />
            </div>
          )
        }
        return <span className="text-sm text-muted-foreground">Dosya yüklendi</span>

      case "IMAGE_PICKER_MULTI":
      case "FILE_UPLOAD_MULTI":
        if (Array.isArray(value)) {
          return (
            <div className="mt-2 flex gap-2 flex-wrap">
              {value.map((url, idx) => (
                <div key={idx}>
                  {typeof url === "string" && url.startsWith("http") ? (
                    <Image
                      src={url}
                      alt={`${field.title} ${idx + 1}`}
                      width={80}
                      height={80}
                      className="rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 border rounded-lg flex items-center justify-center">
                      <FileImage className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        }
        return <span className="text-sm text-muted-foreground">Dosyalar yüklendi</span>

      case "COLOR_PICKER":
        return (
          <div className="flex items-center gap-2 mt-2">
            <div
              className="w-6 h-6 rounded-full border border-border"
              style={{ backgroundColor: value }}
            />
            <span className="text-sm">{value}</span>
          </div>
        )

      case "CHECKBOX":
      case "TOGGLE":
        return (
          <Badge variant={value ? "default" : "secondary"} className="mt-2">
            {value ? "Evet" : "Hayır"}
          </Badge>
        )

      case "MULTISELECT":
        if (Array.isArray(value)) {
          return (
            <div className="mt-2 flex flex-wrap gap-2">
              {value.map((v, idx) => (
                <Badge key={idx} variant="outline">
                  {v}
                </Badge>
              ))}
            </div>
          )
        }
        return String(value)

      case "DIMENSIONS":
        if (typeof value === "object" && value !== null) {
          return (
            <div className="mt-2 text-sm">
              {value.width && <span>Genişlik: {value.width}cm</span>}
              {value.height && <span className="ml-4">Yükseklik: {value.height}cm</span>}
              {value.depth && <span className="ml-4">Derinlik: {value.depth}cm</span>}
            </div>
          )
        }
        return String(value)

      default:
        return <span className="text-sm">{String(value)}</span>
    }
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-base">Kişiselleştirme</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Form Info */}
        <div className="text-sm text-muted-foreground">
          <span className="font-medium">{form.title}</span>
        </div>

        {/* User Values */}
        {Object.keys(userValues).length > 0 && (
          <div className="space-y-3">
            {Object.entries(userValues).map(([fieldKey, value]) => {
              const field = getFieldDefinition(fieldKey)
              if (!field || (value === null || value === undefined || value === "")) return null

              return (
                <div key={fieldKey} className="border-b pb-3 last:border-0">
                  <div className="text-sm font-medium text-foreground">{field.title}</div>
                  {field.subtitle && (
                    <div className="text-xs text-muted-foreground mb-1">{field.subtitle}</div>
                  )}
                  <div className="mt-1">{renderFieldValue(fieldKey, value)}</div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pricing Breakdown */}
        {pricingBreakdown.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium text-foreground mb-2">
              Kişiselleştirme Fiyatlandırması
            </h4>
            <div className="space-y-1">
              {pricingBreakdown.map((item) => (
                <div key={item.fieldKey} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.fieldTitle}:</span>
                  <span className="font-medium">
                    +{item.amount.toLocaleString("tr-TR")} ₺
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t flex justify-between text-sm font-semibold">
              <span>Toplam Kişiselleştirme:</span>
              <span>+{totalPersonalizationAmount.toLocaleString("tr-TR")} ₺</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
