"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { CategoryTree } from "@/services/category.service"
import { StoreTag } from "@/services/store.service"
import { CategoryFilter } from "./CategoryFilter"

interface StoreFiltersProps {
  categories: CategoryTree[]
  tags: StoreTag[]
}

export function StoreFilters({ categories, tags }: StoreFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "")
  const [priceRange, setPriceRange] = useState({
    min: searchParams.get("minPrice") || "",
    max: searchParams.get("maxPrice") || "",
  })

  const currentTagSlugs = searchParams.get("tagSlugs")?.split(",") || []

  const updateSearchParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "" || value === "all") {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })
    
    // Sayfa numarasını 1'e sıfırla (filtre değiştiğinde)
    params.set("page", "1")
    
    router.push(`/panel/store?${params.toString()}`)
  }

  const handleSearch = () => {
    updateSearchParams({ search: searchInput || null })
  }

  const handleTagChange = (tagSlug: string) => {
    const newTagSlugs = currentTagSlugs.includes(tagSlug)
      ? currentTagSlugs.filter((slug) => slug !== tagSlug)
      : [...currentTagSlugs, tagSlug]

    updateSearchParams({
      tagSlugs: newTagSlugs.length > 0 ? newTagSlugs.join(",") : null,
    })
  }

  const handlePriceRangeApply = () => {
    updateSearchParams({
      minPrice: priceRange.min || null,
      maxPrice: priceRange.max || null,
    })
  }

  const clearFilters = () => {
    setSearchInput("")
    setPriceRange({ min: "", max: "" })
    router.push("/panel/store")
  }

  const hasActiveFilters =
    searchParams.get("categorySlugs") ||
    searchParams.get("tagSlugs") ||
    searchParams.get("minPrice") ||
    searchParams.get("maxPrice") ||
    searchParams.get("search")

  return (
    <Card className="sticky top-4">
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Arama */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">Arama</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Ürün ara..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch} size="icon">
                ARA
              </Button>
            </div>
          </div>

          {/* Kategori Filtresi */}
          <CategoryFilter categories={categories} />

          {/* Fiyat Aralığı */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">Fiyat Aralığı</Label>
            <div className="space-y-2">
              <Input
                type="number"
                placeholder="Min Fiyat"
                value={priceRange.min}
                onChange={(e) =>
                  setPriceRange((prev) => ({ ...prev, min: e.target.value }))
                }
              />
              <Input
                type="number"
                placeholder="Max Fiyat"
                value={priceRange.max}
                onChange={(e) =>
                  setPriceRange((prev) => ({ ...prev, max: e.target.value }))
                }
              />
              <Button onClick={handlePriceRangeApply} size="sm" className="w-full">
                Uygula
              </Button>
            </div>
          </div>

          {/* Tag Filtreleri */}
          {tags.length > 0 && (
            <div className="space-y-2">
              <Label className="text-base font-semibold">Tag'ler</Label>
              <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto">
                {tags.map((tag) => {
                  const isSelected = currentTagSlugs.includes(tag.slug)
                  return (
                    <Badge
                      key={tag.id}
                      variant={isSelected ? "default" : "outline"}
                      className="cursor-pointer justify-start w-full"
                      onClick={() => handleTagChange(tag.slug)}
                      style={
                        isSelected && tag.color
                          ? {
                              backgroundColor: tag.color,
                              color: "white",
                              borderColor: tag.color,
                            }
                          : tag.color
                            ? {
                                borderColor: tag.color,
                                color: tag.color,
                              }
                            : {}
                      }
                    >
                      {tag.name}
                    </Badge>
                  )
                })}
              </div>
            </div>
          )}

          {/* Filtreleri Temizle */}
          {hasActiveFilters && (
            <div>
              <Button variant="outline" onClick={clearFilters} size="sm" className="w-full">
                <X className="w-4 h-4 mr-2" />
                Filtreleri Temizle
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
