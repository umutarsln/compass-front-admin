"use client"

import { useState, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { CategoryTree } from "@/services/category.service"
import { ChevronRight, ChevronDown } from "lucide-react"

interface CategoryFilterProps {
  categories: CategoryTree[]
}

export function CategoryFilter({ categories }: CategoryFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const selectedCategorySlugs = useMemo(() => {
    const slugs = searchParams.get("categorySlugs")?.split(",").filter(Boolean) || []
    return new Set(slugs)
  }, [searchParams])

  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  // Tüm kategori slug'larını ve parent-child ilişkilerini map'le
  const categoryMap = useMemo(() => {
    const map = new Map<string, { category: CategoryTree; parentSlug: string | null; childrenSlugs: string[] }>()

    const buildMap = (cats: CategoryTree[], parentSlug: string | null = null) => {
      for (const cat of cats) {
        const childrenSlugs = cat.children?.map(c => c.slug) || []
        map.set(cat.slug, { category: cat, parentSlug, childrenSlugs })
        if (cat.children && cat.children.length > 0) {
          buildMap(cat.children, cat.slug)
        }
      }
    }

    buildMap(categories)
    return map
  }, [categories])

  // Bir kategorinin tüm children slug'larını bul
  const getAllChildrenSlugs = (categorySlug: string): string[] => {
    const category = categoryMap.get(categorySlug)
    if (!category) return []

    const allChildren: string[] = []
    const stack = [...category.childrenSlugs]

    while (stack.length > 0) {
      const childSlug = stack.pop()!
      allChildren.push(childSlug)
      const child = categoryMap.get(childSlug)
      if (child) {
        stack.push(...child.childrenSlugs)
      }
    }

    return allChildren
  }

  // Bir kategorinin tüm parent slug'larını bul
  const getAllParentSlugs = (categorySlug: string): string[] => {
    const allParents: string[] = []
    let current = categoryMap.get(categorySlug)

    while (current?.parentSlug) {
      allParents.push(current.parentSlug)
      current = categoryMap.get(current.parentSlug)
    }

    return allParents
  }

  // Bir kategorinin seçili olup olmadığını kontrol et
  const isCategorySelected = (categorySlug: string): boolean => {
    return selectedCategorySlugs.has(categorySlug)
  }

  // Bir kategorinin kısmen seçili olup olmadığını kontrol et (bazı children'lar seçili)
  const isCategoryIndeterminate = (categorySlug: string): boolean => {
    const category = categoryMap.get(categorySlug)
    if (!category || category.childrenSlugs.length === 0) return false

    const childrenSelected = category.childrenSlugs.some(childSlug =>
      isCategorySelected(childSlug) || isCategoryIndeterminate(childSlug)
    )
    const allChildrenSelected = category.childrenSlugs.every(childSlug =>
      isCategorySelected(childSlug)
    )

    return childrenSelected && !allChildrenSelected
  }

  const updateCategoryFilter = (categorySlugs: string[]) => {
    const params = new URLSearchParams(searchParams.toString())

    if (categorySlugs.length === 0) {
      params.delete("categorySlugs")
    } else {
      params.set("categorySlugs", categorySlugs.join(","))
    }

    params.set("page", "1")
    router.push(`/panel/store?${params.toString()}`)
  }

  const handleCategoryToggle = (categorySlug: string, checked: boolean) => {
    const newSelected = new Set(selectedCategorySlugs)

    if (checked) {
      // Kategori seçildiğinde: kendisi + tüm children'ları ekle
      newSelected.add(categorySlug)
      const allChildren = getAllChildrenSlugs(categorySlug)
      allChildren.forEach(childSlug => newSelected.add(childSlug))
    } else {
      // Kategori seçimi kaldırıldığında: 
      // 1. Kendisi + tüm children'ları kaldır
      newSelected.delete(categorySlug)
      const allChildren = getAllChildrenSlugs(categorySlug)
      allChildren.forEach(childSlug => newSelected.delete(childSlug))

      // 2. Tüm parent'larını recursive olarak kontrol et ve deselect et
      // Bir child deselect edilirse, parent'ın tüm child'ları seçili olmadığı için parent da deselect olmalı
      const deselectParentsRecursively = (slug: string) => {
        const category = categoryMap.get(slug)
        if (!category || !category.parentSlug) return

        const parent = categoryMap.get(category.parentSlug)
        if (!parent) return

        // Parent'ın hiçbir child'ı seçili mi kontrol et
        const hasAnySelectedChild = parent.childrenSlugs.some(childSlug =>
          newSelected.has(childSlug)
        )

        // Eğer parent'ın hiçbir child'ı seçili değilse, parent'ı da deselect et
        if (!hasAnySelectedChild) {
          newSelected.delete(category.parentSlug)
          // Parent'ın parent'ını da recursive olarak kontrol et
          deselectParentsRecursively(category.parentSlug)
        }
      }

      deselectParentsRecursively(categorySlug)
    }

    updateCategoryFilter(Array.from(newSelected))
  }

  const toggleExpand = (categorySlug: string) => {
    setExpanded(prev => {
      const newExpanded = new Set(prev)
      if (newExpanded.has(categorySlug)) {
        newExpanded.delete(categorySlug)
      } else {
        newExpanded.add(categorySlug)
      }
      return newExpanded
    })
  }

  const renderCategory = (category: CategoryTree, level: number = 0) => {
    const hasChildren = category.children && category.children.length > 0
    const isExpanded = expanded.has(category.slug)
    const isSelected = isCategorySelected(category.slug)
    const isIndeterminate = isCategoryIndeterminate(category.slug)

    return (
      <div key={category.slug} className="select-none">
        <div
          className="flex items-center gap-2 py-1.5 px-2 hover:bg-muted/50 rounded-md cursor-pointer"
          style={{ paddingLeft: `${level * 20 + 8}px` }}
        >
          {/* Expand/Collapse Icon */}
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleExpand(category.slug)
              }}
              className="p-0.5 hover:bg-muted rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          ) : (
            <div className="w-5" /> // Spacer for alignment
          )}

          {/* Checkbox */}
          <div className="relative">
            <Checkbox
              id={`category-${category.slug}`}
              checked={isSelected}
              onCheckedChange={(checked) => handleCategoryToggle(category.slug, checked as boolean)}
              className={isIndeterminate ? "data-[state=indeterminate]:bg-primary data-[state=indeterminate]:border-primary" : ""}
              onClick={(e) => e.stopPropagation()}
            />
            {isIndeterminate && !isSelected && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-2 h-0.5 bg-primary-foreground rounded" />
              </div>
            )}
          </div>

          {/* Label */}
          <Label
            htmlFor={`category-${category.slug}`}
            className="flex-1 cursor-pointer text-sm font-normal"
            onClick={(e) => {
              e.preventDefault()
              handleCategoryToggle(category.slug, !isSelected)
            }}
          >
            {category.name}
          </Label>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div>
            {category.children!.map((child) => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Label className="text-base font-semibold">Kategori</Label>
      <div className="">
        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Kategori bulunamadı
          </p>
        ) : (
          <div className="space-y-1">
            {categories.map((category) => renderCategory(category, 0))}
          </div>
        )}
      </div>
    </div>
  )
}
