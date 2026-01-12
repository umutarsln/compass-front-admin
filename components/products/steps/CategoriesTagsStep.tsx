"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Category, CategoryTree } from "@/services/category.service"
import { Tag } from "@/services/tag.service"
import { CategoryForm } from "../CategoryForm"
import { TagForm } from "../TagForm"
import { Plus, ChevronRight, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface CategoriesTagsStepProps {
  categories: Category[]
  categoryTree: CategoryTree[]
  tags: Tag[]
  categoryIds: string[]
  tagIds: string[]
  onToggleCategory: (categoryId: string) => void
  onToggleTag: (tagId: string) => void
}

interface CategoryTreeNodeProps {
  category: CategoryTree
  level: number
  selectedIds: string[]
  onToggle: (categoryId: string) => void
}

function CategoryTreeNode({
  category,
  level,
  selectedIds,
  onToggle,
}: CategoryTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level === 0)
  const hasChildren = category.children && category.children.length > 0
  const isSelected = selectedIds.includes(category.id)

  // Her seviye için girinti hesapla (chevron + checkbox + label için alan)
  const indent = level * 1.5 // rem cinsinden

  return (
    <div>
      <div
        className="flex items-center space-x-2 py-1.5 px-2 rounded hover:bg-muted/50"
        style={{ paddingLeft: `${indent}rem` }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-0.5 hover:bg-muted rounded flex-shrink-0"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        ) : (
          <div className="w-5 flex-shrink-0" />
        )}
        <input
          type="checkbox"
          id={`category-${category.id}`}
          checked={isSelected}
          onChange={() => onToggle(category.id)}
          className="w-4 h-4 rounded border-border flex-shrink-0"
        />
        <Label
          htmlFor={`category-${category.id}`}
          className="cursor-pointer text-sm flex-1"
        >
          {category.name}
        </Label>
      </div>
      {hasChildren && isExpanded && (
        <div>
          {category.children.map((child) => (
            <CategoryTreeNode
              key={child.id}
              category={child}
              level={level + 1}
              selectedIds={selectedIds}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function CategoriesTagsStep({
  categories,
  categoryTree,
  tags,
  categoryIds,
  tagIds,
  onToggleCategory,
  onToggleTag,
}: CategoriesTagsStepProps) {
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Kategoriler ve Tag'ler
        </h3>
        <p className="text-sm text-muted-foreground">
          Ürünü kategorilere ve tag'lere atayın. Yeni kategori veya tag
          oluşturabilirsiniz.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Kategoriler */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Kategoriler</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCategoryDialogOpen(true)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Kategori Ekle
            </Button>
          </div>
          <div className="mt-2 border border-border rounded-lg p-4 max-h-96 overflow-y-auto space-y-1">
            {categoryTree.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Kategori bulunamadı
              </p>
            ) : (
              categoryTree.map((category) => (
                <CategoryTreeNode
                  key={category.id}
                  category={category}
                  level={0}
                  selectedIds={categoryIds}
                  onToggle={onToggleCategory}
                />
              ))
            )}
          </div>
        </div>

        {/* Tag'ler */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Tag'ler</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsTagDialogOpen(true)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Tag Ekle
            </Button>
          </div>
          <div className="mt-2 border border-border rounded-lg p-4 max-h-96 overflow-y-auto space-y-2">
            {tags.length === 0 ? (
              <p className="text-sm text-muted-foreground">Tag bulunamadı</p>
            ) : (
              tags.map((tag) => (
                <div key={tag.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`tag-${tag.id}`}
                    checked={tagIds?.includes(tag.id) || false}
                    onChange={() => onToggleTag(tag.id)}
                    className="w-4 h-4 rounded border-border"
                  />
                  <Label
                    htmlFor={`tag-${tag.id}`}
                    className="cursor-pointer text-sm"
                  >
                    <span
                      className="inline-block w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.name}
                  </Label>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Kategori Oluşturma Dialog */}
      <CategoryForm
        open={isCategoryDialogOpen}
        onOpenChange={setIsCategoryDialogOpen}
        categories={categories}
        categoryTree={categoryTree}
      />

      {/* Tag Oluşturma Dialog */}
      <TagForm
        open={isTagDialogOpen}
        onOpenChange={setIsTagDialogOpen}
      />
    </div>
  )
}
