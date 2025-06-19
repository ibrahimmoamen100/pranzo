import React, { useState, useEffect } from "react";
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

// دالة لتحويل الوقت من 24 إلى 12 ساعة مع AM/PM
function formatTime12Hour(time: string) {
  if (!time) return "";
  const [hourStr, minuteStr] = time.split(":");
  let hour = parseInt(hourStr, 10);
  const minute = minuteStr || "00";
  const ampm = hour >= 12 ? "م" : "ص";
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return `${hour}:${minute} ${ampm}`;
}

export default function Locations() {
  const products = useStore((state) => state.products);

  // حالة لتخزين الفروع الحقيقية
  const [branches, setBranches] = useState<any[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [branchesError, setBranchesError] = useState("");

  // جلب الفروع من backend
  useEffect(() => {
    setLoadingBranches(true);
    fetch("http://localhost:3001/api/store")
      .then((res) => {
        if (!res.ok) throw new Error("فشل في جلب الفروع");
        return res.json();
      })
      .then((data) => {
        setBranches(Array.isArray(data.branches) ? data.branches : []);
        setLoadingBranches(false);
      })
      .catch((err) => {
        setBranchesError("تعذر تحميل الفروع. حاول لاحقاً.");
        setLoadingBranches(false);
      });
  }, []);

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

        {/* Branches Section */}
        <div className="container py-10">
          <h2 className="text-3xl font-bold mb-8 text-primary text-center flex items-center justify-center gap-2">
            <Store className="w-7 h-7 text-primary" /> فروعنا
          </h2>
          {loadingBranches ? (
            <div className="text-center text-lg text-gray-500 py-10">
              جاري تحميل الفروع...
            </div>
          ) : branchesError ? (
            <div className="text-center text-red-500 py-10">
              {branchesError}
            </div>
          ) : branches.length === 0 ? (
            <div className="text-center text-gray-500 py-10">
              لا يوجد فروع مضافة حالياً.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {branches.map((branch, idx) => (
                <Card
                  key={branch.id || idx}
                  className="rounded-2xl shadow-md border border-primary/20 hover:shadow-xl transition-all bg-white"
                >
                  <CardHeader className="flex flex-row items-center gap-3 pb-2">
                    <div className="bg-primary/10 p-3 rounded-full">
                      <Store className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-primary mb-1">
                        {branch.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {branch.description}
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    <div className="flex items-center gap-2 text-gray-700">
                      <MapPin className="w-5 h-5 text-primary" />
                      <span>{branch.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Phone className="w-5 h-5 text-primary" />
                      <span>{branch.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Clock className="w-5 h-5 text-primary" />
                      {branch.openingTime || branch.closingTime ? (
                        <span>
                          {branch.openingTime && branch.closingTime
                            ? `من ${formatTime12Hour(
                                branch.openingTime
                              )} حتى ${formatTime12Hour(branch.closingTime)}`
                            : branch.openingTime
                            ? `يفتح: ${formatTime12Hour(branch.openingTime)}`
                            : branch.closingTime
                            ? `يغلق: ${formatTime12Hour(branch.closingTime)}`
                            : null}
                        </span>
                      ) : (
                        <span>{branch.workingHours}</span>
                      )}
                    </div>
                    <Button
                      variant="default"
                      className="w-full flex gap-2 items-center mt-4 bg-[#25D366] hover:bg-[#1ebe57] text-white font-bold text-lg"
                      onClick={() => handleWhatsApp(branch.whatsapp)}
                    >
                      <FaWhatsapp className="w-5 h-5" /> تواصل عبر واتساب
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
