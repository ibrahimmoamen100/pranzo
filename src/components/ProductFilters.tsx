import { useStore } from "@/store/useStore";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { useState, useMemo } from "react";
import { DEFAULT_SUPPLIER } from "@/constants/supplier";
import { formatPrice } from "@/utils/format";

export function ProductFilters() {
  const filters = useStore((state) => state.filters) || {};
  const setFilters = useStore((state) => state.setFilters);
  const products = useStore((state) => state.products) || [];
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState({
    price: true,
    category: true,
    color: false,
    size: false,
  });

  // Get filtered products based on current filters
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Category filter
      if (filters.category && product.category !== filters.category) {
        return false;
      }
      // Subcategory filter
      if (filters.subcategory && product.subcategory !== filters.subcategory) {
        return false;
      }
      return true;
    });
  }, [products, filters.category, filters.subcategory]);

  // Get unique values for filters based on filtered products
  const categories = useMemo(() => {
    return Array.from(
      new Set(products?.map((p) => p.category).filter(Boolean) || [])
    );
  }, [products]);

  // Get unique subcategories for the selected category
  const subcategories = useMemo(() => {
    if (!filters.category) return [];

    return Array.from(
      new Set(
        products
          ?.filter((p) => p.category === filters.category)
          .map((p) => p.subcategory)
          .filter(Boolean) || []
      )
    );
  }, [products, filters.category]);

  const suppliers = useMemo(() => {
    const supplierCounts = products.reduce((acc, product) => {
      const supplierName =
        product.wholesaleInfo?.supplierName || DEFAULT_SUPPLIER.name;
      if (supplierName) {
        acc[supplierName] = (acc[supplierName] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Add default supplier if not exists
    if (!supplierCounts[DEFAULT_SUPPLIER.name]) {
      supplierCounts[DEFAULT_SUPPLIER.name] = 0;
    }

    return Object.entries(supplierCounts).map(([name, count]) => ({
      name,
      count,
    }));
  }, [products]);

  const colors = useMemo(() => {
    return Array.from(
      new Set(
        filteredProducts
          ?.map((p) => p.color)
          .filter(Boolean)
          .flatMap((color) => color.split(","))
      ) || []
    ).map((color) => {
      // Map color codes to color names
      const colorMap: { [key: string]: string } = {
        "#000000": "Black",
        "#FFFFFF": "White",
        "#FF0000": "Red",
        "#008000": "Green",
        "#0000FF": "Blue",
        "#FFFF00": "Yellow",
        "#800080": "Purple",
        "#FFA500": "Orange",
        "#FFC0CB": "Pink",
        "#808080": "Gray",
        "#A52A2A": "Brown",
        "#F5F5DC": "Beige",
        "#000080": "Navy",
        "#800000": "Maroon",
        "#008080": "Teal",
        "#FFD700": "Gold",
        "#C0C0C0": "Silver",
      };
      return {
        code: color,
        name: colorMap[color] || color,
      };
    });
  }, [filteredProducts]);

  const sizes = useMemo(() => {
    return Array.from(
      new Set(
        filteredProducts
          ?.map((p) => p.size)
          .filter(Boolean)
          .flatMap((size) => size.split(","))
      ) || []
    );
  }, [filteredProducts]);

  // Get min and max prices for the price range slider based on filtered products
  const prices = useMemo(() => {
    return filteredProducts?.map((p) => p.price) || [];
  }, [filteredProducts]);

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  // Reset dependent filters when category changes
  const handleCategoryChange = (value: string) => {
    const newCategory = value === "all" ? undefined : value;
    setFilters({
      ...filters,
      category: newCategory,
      subcategory: undefined, // Reset subcategory when category changes
    });

    // Update URL with the selected category
    if (newCategory) {
      navigate(`/products?category=${newCategory}`);
    } else {
      navigate("/products");
    }
  };

  // Reset dependent filters when subcategory changes
  const handleSubcategoryChange = (value: string) => {
    setFilters({
      ...filters,
      subcategory: value === "all" ? undefined : value,
    });
  };

  const clearAllFilters = () => {
    setFilters({
      category: undefined,
      subcategory: undefined,
      supplier: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      sortBy: undefined,
    });
    // Reset URL parameters
    navigate("/products");
  };

  return (
    <div className="w-full space-y-4">
      <Accordion
        type="multiple"
        className="w-full"
        defaultValue={["price", "category"]}
      >
        {/* Price Range Filter */}
        <AccordionItem value="price">
          <AccordionTrigger>{t("filters.priceRange")}</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {formatPrice(filters.minPrice || minPrice)}{" "}
                  {t("common.currency")}
                </span>
                <span className="text-sm text-muted-foreground">
                  {formatPrice(filters.maxPrice || maxPrice)}{" "}
                  {t("common.currency")}
                </span>
              </div>
              <Slider
                defaultValue={[minPrice, maxPrice]}
                min={minPrice}
                max={maxPrice}
                step={1}
                onValueChange={(value) =>
                  setFilters({
                    ...filters,
                    minPrice: value[0],
                    maxPrice: value[1],
                  })
                }
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Category Filter */}
        <AccordionItem value="category">
          <AccordionTrigger>{t("filters.category")}</AccordionTrigger>
          <AccordionContent>
            <RadioGroup
              value={filters.category || "all"}
              onValueChange={handleCategoryChange}
              className="space-y-2 pt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all-categories" />
                <Label htmlFor="all-categories">
                  {t("filters.allCategories")}
                </Label>
              </div>
              {categories.map((category) => (
                <div key={category} className="flex items-center space-x-2">
                  <RadioGroupItem value={category} id={category} />
                  <Label htmlFor={category}>{category}</Label>
                </div>
              ))}
            </RadioGroup>
          </AccordionContent>
        </AccordionItem>

        {/* Subcategory Filter - Always show but disable when no category is selected */}
        <AccordionItem value="subcategory">
          <AccordionTrigger
            className={!filters.category ? "text-muted-foreground" : ""}
            disabled={!filters.category}
          >
            {t("filters.subcategory")}
            {!filters.category && (
              <span className="text-xs text-muted-foreground ml-2">
                ({t("filters.selectCategoryFirst")})
              </span>
            )}
          </AccordionTrigger>
          <AccordionContent>
            {filters.category ? (
              <RadioGroup
                value={filters.subcategory || "all"}
                onValueChange={handleSubcategoryChange}
                className="space-y-2 pt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all-subcategories" />
                  <Label htmlFor="all-subcategories">
                    {t("filters.allSubcategories")}
                  </Label>
                </div>
                {subcategories.map((subcategory) => (
                  <div
                    key={subcategory}
                    className="flex items-center space-x-2"
                  >
                    <RadioGroupItem value={subcategory} id={subcategory} />
                    <Label htmlFor={subcategory}>{subcategory}</Label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <div className="text-sm text-muted-foreground py-2">
                {t("filters.selectCategoryFirst")}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Color Filter */}
        {/* <AccordionItem value="color">
          <AccordionTrigger className="text-sm font-medium">
            {t("filters.color")} {filters.category && `(${filters.category})`}{" "}
          </AccordionTrigger>
          <AccordionContent>
            <RadioGroup
              value={filters.color || "all"}
              onValueChange={(value) =>
                setFilters({
                  ...filters,
                  color: value === "all" ? undefined : value,
                })
              }
              className="space-y-2 pt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all-colors" />
                <Label htmlFor="all-colors">{t("filters.allColors")}</Label>
              </div>
              {colors.map((color) => (
                <div key={color.code} className="flex items-center space-x-2">
                  <RadioGroupItem value={color.code} id={color.code} />
                  <div className="flex items-center gap-2">
                    <div
                      className="h-4 w-4 rounded-full border"
                      style={{ backgroundColor: color.code }}
                    />
                    <Label htmlFor={color.code}>
                      {t(`colors.${color.name}`)}
                    </Label>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </AccordionContent>
        </AccordionItem> */}

        {/* Size Filter */}
        {/* <AccordionItem value="size">
          <AccordionTrigger className="text-sm font-medium">
            {t("filters.size")} {filters.category && `(${filters.category})`}{" "}
          </AccordionTrigger>
          <AccordionContent>
            <RadioGroup
              value={filters.size || "all"}
              onValueChange={(value) =>
                setFilters({
                  ...filters,
                  size: value === "all" ? undefined : value,
                })
              }
              className="space-y-2 pt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all-sizes" />
                <Label htmlFor="all-sizes">{t("filters.allSizes")}</Label>
              </div>
              {sizes.map((size) => (
                <div key={size} className="flex items-center space-x-2">
                  <RadioGroupItem value={size} id={size} />
                  <Label htmlFor={size}>{size}</Label>
                </div>
              ))}
            </RadioGroup>
          </AccordionContent>
        </AccordionItem> */}

        {/* Sort Filter */}
        <AccordionItem value="sort">
          <AccordionTrigger className="text-sm font-medium">
            {t("filters.sortBy")}
          </AccordionTrigger>
          <AccordionContent>
            <RadioGroup
              value={filters.sortBy || "default"}
              onValueChange={(
                value:
                  | "default"
                  | "price-asc"
                  | "price-desc"
                  | "name-asc"
                  | "name-desc"
              ) =>
                setFilters({
                  ...filters,
                  sortBy: value === "default" ? undefined : value,
                })
              }
              className="space-y-2 pt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="default" id="default-sort" />
                <Label htmlFor="default-sort">{t("filters.default")}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="price-asc" id="price-asc" />
                <Label htmlFor="price-asc">{t("filters.priceAsc")}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="price-desc" id="price-desc" />
                <Label htmlFor="price-desc">{t("filters.priceDesc")}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="name-asc" id="name-asc" />
                <Label htmlFor="name-asc">{t("filters.nameAsc")}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="name-desc" id="name-desc" />
                <Label htmlFor="name-desc">{t("filters.nameDesc")}</Label>
              </div>
            </RadioGroup>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Clear Filters Button */}
      <Button variant="outline" className="w-full" onClick={clearAllFilters}>
        {t("filters.clearAll")}
      </Button>
    </div>
  );
}
