import { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Eye, ShoppingCart, Timer } from "lucide-react";
import { useStore } from "@/store/useStore";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { formatPrice } from "@/utils/format";

interface ProductCardProps {
  product: Product;
  onView: () => void;
  onAddToCart?: () => void;
}

export const ProductCard = ({
  product,
  onView,
  onAddToCart,
}: ProductCardProps) => {
  const addToCart = useStore((state) => state.addToCart);
  const cart = useStore((state) => state.cart);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);

  // Calculate time remaining for special offers
  useEffect(() => {
    if (!product.specialOffer || !product.offerEndsAt) return;

    const calculateTimeRemaining = () => {
      const now = new Date();
      const endTime = new Date(product.offerEndsAt as string);
      const timeDiff = endTime.getTime() - now.getTime();

      if (timeDiff <= 0) {
        setTimeRemaining(null);
        return;
      }

      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      }
    };

    calculateTimeRemaining();
    const timer = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(timer);
  }, [product.specialOffer, product.offerEndsAt]);

  // Check if product is in cart
  const isInCart = cart.some((item) => item.product.id === product.id);

  const handleAddToCart = () => {
    if (
      (product.sizesWithPrices && product.sizesWithPrices.length > 0) ||
      (product.extras && product.extras.length > 0)
    ) {
      navigate(`/products/${product.id}`);
      return;
    }
    if (isInCart) {
      toast.error(t("cart.productAlreadyInCart"), {
        description: t("cart.pleaseUpdateQuantity"),
        action: {
          label: t("cart.viewCart"),
          onClick: () => navigate("/cart"),
        },
      });
      return;
    }
    addToCart(product, 1);
    toast.success(`${t("cart.productAdded")}: ${product.name}`, {
      description: t("cart.whatWouldYouLikeToDo"),
      action: {
        label: t("cart.checkout"),
        onClick: () => navigate("/cart"),
      },
      cancel: {
        label: t("cart.continueShopping"),
        onClick: () => {},
      },
      duration: 5000,
      dismissible: true,
    });
    onAddToCart?.();
  };

  // Calculate the discounted price if there's a special offer
  const discountedPrice =
    product.specialOffer && product.discountPercentage
      ? product.price - product.price * (product.discountPercentage / 100)
      : null;

  return (
    <motion.div className="group relative overflow-hidden rounded-xl border bg-card transition-all duration-300 hover:shadow-lg">
      <div className="aspect-[1/1] sm:aspect-[3/4] overflow-hidden">
        <img
          src={product.images[0]}
          alt={product.name}
          className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      {product.specialOffer && timeRemaining && (
        <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded-md text-xs font-bold">
          -{product.discountPercentage}%
        </div>
      )}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          className="bg-white/90 hover:bg-white text-black"
          onClick={() => navigate(`/products/${product.id}`)}
        >
          {t("product.viewDetails")}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="bg-white/90 hover:bg-white text-black"
          onClick={handleAddToCart}
        >
          <ShoppingCart className="h-4 w-4" />
        </Button>
      </div>
      <div className="p-2 sm:p-4">
        <h3 className="font-medium text-sm sm:text-base line-clamp-1 group-hover:text-blue-600 transition-colors duration-300">
          {product.name}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
          {product.brand}
        </p>
        <div className="mt-1 sm:mt-2 flex gap-2 items-baseline">
          {discountedPrice !== null ? (
            <>
              <p className="font-semibold text-sm sm:text-base text-red-600">
                {formatPrice(discountedPrice)} EGP
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground line-through">
                {formatPrice(product.price)} EGP
              </p>
            </>
          ) : (
            <p className="font-semibold text-sm sm:text-base group-hover:text-blue-600 transition-colors duration-300">
              {formatPrice(product.price)} EGP
            </p>
          )}
        </div>
        {product.specialOffer && timeRemaining && (
          <div className="mt-1 flex items-center text-xs font-medium text-red-600">
            <Timer className="h-3 w-3 mr-1" /> {timeRemaining}
          </div>
        )}
      </div>
    </motion.div>
  );
};
