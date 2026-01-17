"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { customerService, GetCustomersParams } from "@/services/customer.service"
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Loader2 } from "lucide-react"

type SortField = "firstname" | "lastname" | "email" | "phone" | "createdAt" | null
type SortOrder = "asc" | "desc"

export function CustomerList() {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<SortField>(null)
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")

  // Query parametreleri
  const queryParams: GetCustomersParams = {
    ...(searchQuery && { search: searchQuery }),
    ...(sortField && { sortBy: sortField, sortOrder }),
  }

  // Müşteri listesi
  const { data: customers, isLoading } = useQuery({
    queryKey: ["customers", queryParams],
    queryFn: () => customerService.getAll(queryParams),
  })

  // Client-side sorting (backend'de sort yoksa)
  const sortedCustomers = customers
    ? [...customers].sort((a, b) => {
      if (!sortField) return 0

      let aValue: string | number = ""
      let bValue: string | number = ""

      switch (sortField) {
        case "firstname":
          aValue = a.firstname.toLowerCase()
          bValue = b.firstname.toLowerCase()
          break
        case "lastname":
          aValue = a.lastname.toLowerCase()
          bValue = b.lastname.toLowerCase()
          break
        case "email":
          aValue = a.email.toLowerCase()
          bValue = b.email.toLowerCase()
          break
        case "phone":
          aValue = a.phone
          bValue = b.phone
          break
        case "createdAt":
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1
      return 0
    })
    : []

  // Client-side search (backend'de search yoksa)
  const filteredCustomers = sortedCustomers.filter((customer) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      customer.firstname.toLowerCase().includes(query) ||
      customer.lastname.toLowerCase().includes(query) ||
      customer.email.toLowerCase().includes(query) ||
      customer.phone.includes(query)
    )
  })

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="w-4 h-4 text-primary" />
    ) : (
      <ArrowDown className="w-4 h-4 text-primary" />
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm">
      {/* Search Bar */}
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Müşteri ara (ad, soyad, email, telefon)..."
              className="w-full h-12 pl-10 pr-4 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Temizle
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <button
                  onClick={() => handleSort("firstname")}
                  className="flex items-center gap-2 hover:text-foreground transition-colors"
                >
                  Ad
                  {getSortIcon("firstname")}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <button
                  onClick={() => handleSort("lastname")}
                  className="flex items-center gap-2 hover:text-foreground transition-colors"
                >
                  Soyad
                  {getSortIcon("lastname")}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <button
                  onClick={() => handleSort("email")}
                  className="flex items-center gap-2 hover:text-foreground transition-colors"
                >
                  Email
                  {getSortIcon("email")}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <button
                  onClick={() => handleSort("phone")}
                  className="flex items-center gap-2 hover:text-foreground transition-colors"
                >
                  Telefon
                  {getSortIcon("phone")}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <button
                  onClick={() => handleSort("createdAt")}
                  className="flex items-center gap-2 hover:text-foreground transition-colors"
                >
                  Kayıt Tarihi
                  {getSortIcon("createdAt")}
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredCustomers && filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => (
                <tr
                  key={customer.id}
                  className="hover:bg-muted/50 transition-colors duration-150"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-foreground">
                      {customer.firstname}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-muted-foreground">
                      {customer.lastname}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-muted-foreground">{customer.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-muted-foreground">{customer.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-muted-foreground">
                      {new Date(customer.createdAt).toLocaleDateString("tr-TR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className="text-sm text-muted-foreground">
                    {searchQuery
                      ? "Arama kriterlerine uygun müşteri bulunamadı."
                      : "Henüz müşteri bulunmuyor."}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      {filteredCustomers && filteredCustomers.length > 0 && (
        <div className="border-t border-border px-6 py-3 bg-muted/30">
          <div className="text-xs text-muted-foreground">
            Toplam {filteredCustomers.length} müşteri gösteriliyor
          </div>
        </div>
      )}
    </div>
  )
}
