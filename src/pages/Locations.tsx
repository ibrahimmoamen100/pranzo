import React, { useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Topbar } from "@/components/Topbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Building,
  Phone,
  Clock,
  AlertCircle,
  Truck,
  Store,
  ShoppingBag,
  Book,
  Shirt,
  Footprints,
  Laptop,
  AlertTriangle,
  MessageCircle,
  MapPin,
  User,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FaWhatsapp } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { useStore } from "@/store/useStore";
import { Helmet } from "react-helmet-async";

const branches = [
  {
    id: 1,
    name: "متجر المرج الرئيسي",
    phone: "01024911062",
    whatsapp: "01024911062",
    workingHours: "من 9 صباحاً حتى 10 مساءً",
    address: "شارع مؤسسة الزكاة، بجوار مسجد الرحمن، المرج، القاهرة",
    icon: Store,
    description: "المتجر الرئيسي لجميع المنتجات بأسعار تنافسية",
  },
  {
    id: 2,
    name: "محل أبو أحمد للملابس",
    phone: "01234567890",
    whatsapp: "01234567890",
    workingHours: "من 10 صباحاً حتى 11 مساءً",
    address: "شارع 9، بجوار مدرسة المرج الثانوية، المرج، القاهرة",
    icon: Shirt,
    description: "أحدث صيحات الموضة بأسعار مناسبة للجميع",
  },
  {
    id: 3,
    name: "بقالة السعادة",
    phone: "01123456789",
    whatsapp: "01123456789",
    workingHours: "24 ساعة",
    address: "شارع النور، بجوار صيدلية الحياة، المرج، القاهرة",
    icon: ShoppingBag,
    description: "كل احتياجاتك المنزلية متوفرة على مدار الساعة",
  },
  {
    id: 4,
    name: "محل الأمل للأحذية",
    phone: "01098765432",
    whatsapp: "01098765432",
    workingHours: "من 9 صباحاً حتى 10 مساءً",
    address: "شارع السلام، بجوار بنك مصر، المرج، القاهرة",
    icon: Footprints,
    description: "أحذية عصرية بجودة عالية وأسعار منافسة",
  },
  {
    id: 5,
    name: "مكتبة المعرفة",
    phone: "01234567891",
    whatsapp: "01234567891",
    workingHours: "من 8 صباحاً حتى 9 مساءً",
    address: "شارع الثقافة، بجوار مدرسة المعرفة، المرج، القاهرة",
    icon: Book,
    description: "كتب ومستلزمات دراسية بأسعار مناسبة",
  },
  {
    id: 6,
    name: "محل الأمانة للأجهزة الكهربائية",
    phone: "01123456790",
    whatsapp: "01123456790",
    workingHours: "من 10 صباحاً حتى 11 مساءً",
    address: "شارع التكنولوجيا، بجوار محطة مترو المرج، المرج، القاهرة",
    icon: Laptop,
    description: "أحدث الأجهزة الكهربائية بضمان شامل",
  },
];

const partners = [
  {
    id: 1,
    name: "متجر الأزياء",
    description: "متجر متخصص في بيع الملابس والأزياء بأسعار تنافسية",
    address: "شارع الثوره 2، متفرع من البترول، المرج، خلف مستشفي اليوم الواحد",
    phone: "01024911062",
    workingHours: "من 9 صباحاً حتى 10 مساءً",
    image: "logo4.png",
  },
  {
    id: 2,
    name: "متجر الإلكترونيات",
    description: "متجر متخصص في بيع الأجهزة الإلكترونية وملحقاتها",
    address: "شارع الثوره 2، متفرع من البترول، المرج، خلف مستشفي اليوم الواحد",
    phone: "01024911062",
    workingHours: "من 9 صباحاً حتى 10 مساءً",
    image: "logo4.png",
  },
  {
    id: 3,
    name: "متجر الأثاث",
    description: "متجر متخصص في بيع الأثاث المنزلي والمكتبي",
    address: "شارع الثوره 2، متفرع من البترول، المرج، خلف مستشفي اليوم الواحد",
    phone: "01024911062",
    workingHours: "من 9 صباحاً حتى 10 مساءً",
    image: "logo4.png",
  },
];

export default function Locations() {
  const products = useStore((state) => state.products);

  // Get unique suppliers with their information
  const suppliers = Array.from(
    new Set(
      products
        .filter((p) => p.wholesaleInfo?.supplierName)
        .map((p) => p.wholesaleInfo?.supplierName)
    )
  ).map((supplierName) => {
    const product = products.find(
      (p) => p.wholesaleInfo?.supplierName === supplierName
    );
    return {
      name: supplierName,
      phone: product?.wholesaleInfo?.supplierPhone || "",
      location: product?.wholesaleInfo?.supplierLocation || "",
      email: product?.wholesaleInfo?.supplierEmail || "",
    };
  });

  const handleWhatsApp = (phone: string) => {
    const message = "مرحباً، أنا مهتم بالتواصل معكم";
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(
      message
    )}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>مواقع الشركاء - متجرنا</title>
        <meta
          name="description"
          content="تعرف على مواقع شركائنا وكيفية التواصل معهم"
        />
      </Helmet>
      <Topbar />
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <div className="relative bg-primary/5 py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent" />
          <div className="container relative">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-5xl font-bold mb-6">مواقع الشركاء</h1>
              <p className="text-xl text-muted-foreground mb-8">
                يمكنك التواصل مع أي من شركائنا للحصول على منتجاتهم ويتم اختيار
                شركائنا بعناية فائقة، وجميع شركائنا هم أصحاب محلات بالفعل. يمكنك
                زيارة مواقعهم للتأكد من ذلك والاطمئنان على موثوقيتهم.
              </p>
            </div>
          </div>
        </div>

        {/* Suppliers Section */}
        <div className="container py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suppliers.map((supplier, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {supplier.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <span>{supplier.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <span>من 10 صباحاً حتى 2 صباحاً</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
