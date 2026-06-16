/**
 * POS Service Grid Component
 * 
 * Displays services and products in a grid layout with filtering capabilities.
 * Supports category filtering, type filtering (service/product), and stock indicators.
 */

"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  ShoppingCart,
  Scissors,
  Sparkles,
  Droplets,
  Zap,
  Clock,
  Package,
  AlertTriangle
} from "lucide-react"
import type {
  ServiceWithCategory,
  ServiceCategory,
  ServiceType,
  OutletStock
} from "../types"
import { formatCurrency } from "@/lib/utils/pos-helpers"

// ============================================================================
// PROPS
// ============================================================================

interface POSServiceGridProps {
  services: ServiceWithCategory[]
  categories: ServiceCategory[]
  selectedCategory: string
  onCategoryChange: (category: string) => void
  selectedType: ServiceType
  onTypeChange: (type: ServiceType) => void
  onAddToCart: (service: ServiceWithCategory) => void
  outletStock: OutletStock[]
  currentBranchId: string | null
  loading?: boolean
}

// ============================================================================
// CATEGORY ICONS
// ============================================================================

const categoryIcons = {
  "Potong Rambut": Scissors,
  "Cukur": Zap,
  "Perawatan Rambut": Droplets,
  "Styling": Sparkles,
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * POS Service Grid Component
 * 
 * Features:
 * - Type filter (All, Services, Products)
 * - Category filter tabs
 * - Service/product cards
 * - Stock indicators for products
 * - Add to cart functionality
 * - Responsive grid layout
 * - Loading state
 */
export function POSServiceGrid({
  services,
  categories,
  selectedCategory,
  onCategoryChange,
  selectedType,
  onTypeChange,
  onAddToCart,
  outletStock,
  currentBranchId,
  loading = false
}: POSServiceGridProps) {
  
  // ============================================================================
  // FILTERED DATA
  // ============================================================================
  
  /**
   * Filter services by type and category
   */
  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      // Filter by type
      if (selectedType !== "all" && service.type !== selectedType) {
        return false
      }
      
      // Filter by category
      if (selectedCategory !== "semua") {
        const categoryName = service.service_categories?.name || "Lainnya"
        if (categoryName !== selectedCategory) {
          return false
        }
      }
      
      return true
    })
  }, [services, selectedType, selectedCategory])
  
  /**
   * Filter categories by selected type
   */
  const filteredCategories = useMemo(() => {
    // Remove duplicates and filter by type
    const uniqueCategories = categories.filter((category, index, self) => {
      const isDuplicate = index !== self.findIndex((c) => c.name === category.name)
      if (isDuplicate) return false
      
      // Filter by type
      if (selectedType !== "all" && category.type !== selectedType) {
        return false
      }
      
      return true
    })
    
    return uniqueCategories
  }, [categories, selectedType])
  
  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================
  
  /**
   * Get stock information for a service/product
   */
  const getStockInfo = (serviceId: string) => {
    if (!currentBranchId) return null
    
    const stockItem = outletStock.find(
      (os) => os.service_id === serviceId && os.outlet_id === currentBranchId
    )
    
    if (!stockItem) return null
    
    return {
      quantity: stockItem.stock_quantity || 0,
      minThreshold: stockItem.min_stock_threshold || 5,
      isLow: (stockItem.stock_quantity || 0) <= (stockItem.min_stock_threshold || 5),
      isOutOfStock: (stockItem.stock_quantity || 0) <= 0
    }
  }
  
  /**
   * Get icon component for category
   */
  const getCategoryIcon = (categoryName: string) => {
    return categoryIcons[categoryName as keyof typeof categoryIcons] || Scissors
  }
  
  /**
   * Handle add to cart with stock validation
   */
  const handleAddToCart = (service: ServiceWithCategory) => {
    // Check stock for products
    if (service.type === "product") {
      const stockInfo = getStockInfo(service.id)
      if (stockInfo?.isOutOfStock) {
        return // Don't add if out of stock
      }
    }
    
    onAddToCart(service)
  }
  
  // ============================================================================
  // RENDER
  // ============================================================================
  
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 w-32 bg-gray-200 animate-pulse rounded" />
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-48 bg-gray-200 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      {/* Type Filter */}
      <div className="flex gap-2">
        <Button
          variant={selectedType === "all" ? "default" : "outline"}
          className={`flex-1 ${selectedType === "all" ? "" : "bg-transparent"}`}
          onClick={() => {
            onTypeChange("all")
            onCategoryChange("semua")
          }}
        >
          Semua Menu
        </Button>
        <Button
          variant={selectedType === "service" ? "default" : "outline"}
          className={`flex-1 ${selectedType === "service" ? "" : "bg-transparent"}`}
          onClick={() => {
            onTypeChange("service")
            onCategoryChange("semua")
          }}
        >
          💈 Layanan
        </Button>
        <Button
          variant={selectedType === "product" ? "default" : "outline"}
          className={`flex-1 ${selectedType === "product" ? "" : "bg-transparent"}`}
          onClick={() => {
            onTypeChange("product")
            onCategoryChange("semua")
          }}
        >
          📦 Produk
        </Button>
      </div>
      
      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
        <Button
          variant={selectedCategory === "semua" ? "default" : "outline"}
          className={`flex items-center gap-2 whitespace-nowrap text-xs md:text-sm h-9 md:h-10 px-3 md:px-4 ${
            selectedCategory === "semua" ? "" : "bg-transparent"
          }`}
          onClick={() => onCategoryChange("semua")}
        >
          <ShoppingCart className="h-4 w-4" />
          Semua Kategori
        </Button>
        
        {filteredCategories.map((category) => {
          const IconComponent = getCategoryIcon(category.name)
          return (
            <Button
              key={category.id}
              variant={selectedCategory === category.name ? "default" : "outline"}
              className={`flex items-center gap-2 whitespace-nowrap text-xs md:text-sm h-9 md:h-10 px-3 md:px-4 ${
                selectedCategory === category.name ? "" : "bg-transparent"
              }`}
              onClick={() => onCategoryChange(category.name)}
            >
              <IconComponent className="h-4 w-4" />
              {category.name}
            </Button>
          )
        })}
      </div>
      
      {/* Services Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {filteredServices.map((service) => {
          const categoryName = service.service_categories?.name || "Lainnya"
          const IconComponent = getCategoryIcon(categoryName)
          const stockInfo = service.type === "product" ? getStockInfo(service.id) : null
          const isOutOfStock = stockInfo?.isOutOfStock || false
          const isLowStock = stockInfo?.isLow || false
          
          return (
            <Card
              key={service.id}
              className={`min-h-[140px] md:min-h-[180px] flex flex-col hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/20 ${
                isOutOfStock ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onClick={() => handleAddToCart(service)}
            >
              <CardHeader className="p-3 md:p-4 pb-2">
                <div className="flex items-start gap-2">
                  {service.image_url ? (
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg overflow-hidden flex-shrink-0">
                      <img 
                        src={service.image_url} 
                        alt={service.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <IconComponent className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-xs md:text-base font-semibold truncate">
                      {service.name}
                    </CardTitle>
                    <CardDescription className="text-[10px] md:text-xs line-clamp-1">
                      {service.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-3 md:p-4 pt-0 mt-auto">
                <div className="space-y-2">
                  <p className="text-base md:text-xl font-bold text-primary truncate">
                    {formatCurrency(service.price)}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-1.5 md:gap-2 text-[10px] md:text-xs text-muted-foreground">
                    {/* Duration for services */}
                    {service.duration && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{service.duration} menit</span>
                      </div>
                    )}
                    
                    {/* Stock indicator for products */}
                    {service.type === "product" && stockInfo && (
                      <div className={`flex items-center gap-1 ${
                        isOutOfStock ? "text-red-600" : isLowStock ? "text-yellow-600" : "text-green-600"
                      }`}>
                        {isOutOfStock ? (
                          <>
                            <AlertTriangle className="h-3 w-3" />
                            <span>Habis</span>
                          </>
                        ) : (
                          <>
                            <Package className="h-3 w-3" />
                            <span>Stok: {stockInfo.quantity}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
      
      {/* Empty State */}
      {filteredServices.length === 0 && (
        <div className="text-center py-12">
          <ShoppingCart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 font-medium">Tidak ada layanan/produk</p>
          <p className="text-gray-400 text-sm mt-1">
            Coba ubah filter atau kategori
          </p>
        </div>
      )}
    </div>
  )
}
