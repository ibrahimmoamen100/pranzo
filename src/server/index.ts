import express, {
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from "express";
import uploadRouter from "./upload";
import path from "path";
import fs from "fs";
import cors from "cors";

// Import for thermal printer support (will be loaded dynamically)
let escpos: any = null;
let escposUSB: any = null;

const app = express();
const port = 3001;

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), "public", "upload");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Ensure store.json exists
const storeDir = path.join(process.cwd(), "src", "data");
const storePath = path.join(storeDir, "store.json");
if (!fs.existsSync(storeDir)) {
  fs.mkdirSync(storeDir, { recursive: true });
}
if (!fs.existsSync(storePath)) {
  fs.writeFileSync(storePath, JSON.stringify({ products: [] }, null, 2));
}

// Middleware
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use(cors());

// Add cache control headers middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

// Serve uploaded files
app.use("/upload", express.static(uploadDir));

// Routes
app.use("/api", uploadRouter);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Helper function to read store data
const readStoreData = () => {
  try {
    const fileContent = fs.readFileSync(storePath, "utf8");
    return JSON.parse(fileContent);
  } catch (error) {
    console.error("Error reading store data:", error);
    return { products: [] };
  }
};

// Helper function to write store data
const writeStoreData = (data: any) => {
  try {
    fs.writeFileSync(storePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error("Error writing store data:", error);
    return false;
  }
};

// ========== ORDERS & ANALYTICS ENDPOINTS ========== //

// Add new order
app.post("/api/orders", (req: Request, res: Response) => {
  try {
    const newOrder = req.body;
    const storeData = readStoreData();

    // Ensure orders array exists
    if (!Array.isArray(storeData.orders)) {
      storeData.orders = [];
    }

    // Generate order number and code if not provided
    if (!newOrder.orderNumber) {
      const cashierOrders = storeData.orders.filter((o: any) => o.source === "cashier");
      newOrder.orderNumber = cashierOrders.length + 1;
    }
    
    if (!newOrder.orderCode) {
      newOrder.orderCode = `ORD-${newOrder.orderNumber.toString().padStart(3, '0')}`;
    }

    // Add timestamp
    newOrder.createdAt = newOrder.createdAt || new Date().toISOString();
    storeData.orders.push(newOrder);

    // Save back to file
    if (writeStoreData(storeData)) {
      res.status(201).json({ success: true, order: newOrder });
    } else {
      res.status(500).json({ error: "Failed to add order" });
    }
  } catch (error) {
    console.error("Error adding order:", error);
    res.status(500).json({ error: "Failed to add order" });
  }
});

// Get all orders
app.get("/api/orders", (req: Request, res: Response) => {
  try {
    const storeData = readStoreData();
    res.json(storeData.orders || []);
  } catch (error) {
    console.error("Error reading orders:", error);
    res.status(500).json({ error: "Failed to read orders" });
  }
});

// Delete order by ID
app.delete("/api/orders/:id", ((req: Request, res: Response) => {
  try {
    const orderId = req.params.id;
    const storeData = readStoreData();
    
    if (!Array.isArray(storeData.orders)) {
      storeData.orders = [];
    }
    
    const orderIndex = storeData.orders.findIndex((order: any) => order.orderCode === orderId || order.id === orderId);
    
    if (orderIndex === -1) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    storeData.orders.splice(orderIndex, 1);
    
    if (writeStoreData(storeData)) {
      res.json({ success: true, message: "Order deleted successfully" });
    } else {
      res.status(500).json({ error: "Failed to delete order" });
    }
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ error: "Failed to delete order" });
  }
}) as unknown as express.RequestHandler);

// Clear all orders
app.delete("/api/orders", ((req: Request, res: Response) => {
  try {
    const storeData = readStoreData();
    
    // Clear all orders
    storeData.orders = [];
    
    if (writeStoreData(storeData)) {
      res.json({ success: true, message: "تم مسح جميع الطلبات بنجاح" });
    } else {
      res.status(500).json({ error: "فشل في مسح الطلبات" });
    }
  } catch (error) {
    console.error("Error clearing orders:", error);
    res.status(500).json({ error: "فشل في مسح الطلبات" });
  }
}) as unknown as express.RequestHandler);

// Print receipt to thermal printer
app.post("/api/print-receipt", async (req: Request, res: Response) => {
  try {
    const receiptData = req.body;
    
    // هنا يمكن إضافة كود للاتصال بطابعة الإيصالات الحرارية
    // مثال باستخدام مكتبة مثل node-thermal-printer أو escpos
    
    console.log("Printing receipt:", receiptData);
    
    // إرسال أوامر الطباعة للطابعة الحرارية
    // هذا مثال بسيط - ستحتاج لتثبيت مكتبة مناسبة للطابعة
    
    // استخدام مكتبة escpos للطباعة على طابعة الإيصالات الحرارية
    if (!escpos) {
      escpos = await import('escpos');
      escposUSB = await import('escpos-usb');
      escpos.default.USB = escposUSB.default;
    }
    
    const device = new escpos.default.USB();
    const options = { encoding: "GB18030" };
    const printer = new escpos.default.Printer(device, options);
    
    device.open(function(error){
      if (error) {
        console.error('خطأ في الاتصال بالطابعة:', error);
        res.status(500).json({ error: "فشل في الاتصال بالطابعة" });
        return;
      }
      
      printer
        .font('a')
        .align('ct')
        .style('b')
        .size(1, 1)
        .text(receiptData.storeName)
        .text(receiptData.storePhone)
        .text(receiptData.storeAddress)
        .drawLine()
        .text(`طلب رقم: ${receiptData.orderNumber}`)
        .text(`كود الطلب: ${receiptData.orderCode}`)
        .text(`التاريخ: ${new Date(receiptData.createdAt).toLocaleString('ar-EG')}`)
        .drawLine();
      
      receiptData.items.forEach((item: any) => {
        const itemPrice = Number(item.price) + (item.sizePrice || 0) + (item.extraPrice || 0);
        const itemTotal = itemPrice * item.quantity;
        
        printer
          .align('lt')
          .text(item.productName)
          .text(`${item.quantity} × ${itemPrice} ج.م = ${itemTotal} ج.م`);
        
        if (item.selectedSize || item.selectedExtra) {
          printer.text(`  ${item.selectedSize || ''} ${item.selectedExtra || ''}`);
        }
      });
      
      printer
        .align('rt')
        .drawLine()
        .text(`الإجمالي: ${receiptData.totalAmount} ج.م`)
        .text(`المدفوع: ${receiptData.paid} ج.م`)
        .text(`الباقي: ${receiptData.change} ج.م`)
        .drawLine()
        .align('ct')
        .text("شكراً لزيارتكم")
        .text("نتمنى لكم تجربة طعام ممتعة")
        .text("نرجو العودة مرة أخرى")
        .cut()
        .close();
    });
    
    // تم إرسال البيانات للطباعة بنجاح
    res.json({ 
      success: true, 
      message: "تم إرسال الكوبون للطباعة بنجاح"
    });
    
  } catch (error) {
    console.error("Error printing receipt:", error);
    res.status(500).json({ error: "Failed to print receipt" });
  }
});

// Get analytics
app.get("/api/analytics", (req: Request, res: Response) => {
  try {
    const storeData = readStoreData();
    const orders = storeData.orders || [];
    const products = storeData.products || [];
    
    // Get date range from query params (default: last 30 days)
    const days = parseInt(req.query.days as string) || 30;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Filter orders by date range
    const filteredOrders = orders.filter((o: any) => {
      const orderDate = new Date(o.createdAt);
      return orderDate >= startDate && orderDate <= endDate;
    });

    // Today's data
    const today = new Date().toISOString().slice(0, 10);
    const todaysOrders = orders.filter((o: any) => (o.createdAt || '').slice(0, 10) === today);

    // Basic stats
    const totalOrders = filteredOrders.length;
    const totalRevenue = filteredOrders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Today's stats
    const todaysRevenue = todaysOrders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);
    const todaysOrdersCount = todaysOrders.length;

    // Product analytics
    const productStats: Record<string, { name: string; quantity: number; revenue: number; orders: number }> = {};
    
    filteredOrders.forEach((order: any) => {
      if (Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          if (!productStats[item.productId]) {
            const product = products.find((p: any) => p.id === item.productId);
            productStats[item.productId] = {
              name: product?.name || 'Unknown Product',
              quantity: 0,
              revenue: 0,
              orders: 0
            };
          }
          const itemTotal = (Number(item.price) + (item.sizePrice || 0) + (item.extraPrice || 0)) * item.quantity;
          productStats[item.productId].quantity += item.quantity || 1;
          productStats[item.productId].revenue += itemTotal;
          productStats[item.productId].orders += 1;
        });
      }
    });

    // Top selling products
    const topProducts = Object.entries(productStats)
      .map(([id, stats]) => ({ id, ...stats }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // Hourly sales analysis
    const hourlyStats: Record<number, { orders: number; revenue: number }> = {};
    for (let i = 0; i < 24; i++) {
      hourlyStats[i] = { orders: 0, revenue: 0 };
    }

    filteredOrders.forEach((order: any) => {
      const orderDate = new Date(order.createdAt);
      const hour = orderDate.getHours();
      hourlyStats[hour].orders += 1;
      hourlyStats[hour].revenue += order.totalAmount || 0;
    });

    // Daily sales for chart
    const dailyStats: Record<string, { orders: number; revenue: number }> = {};
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().slice(0, 10);
      dailyStats[dateStr] = { orders: 0, revenue: 0 };
    }

    filteredOrders.forEach((order: any) => {
      const orderDate = new Date(order.createdAt);
      const dateStr = orderDate.toISOString().slice(0, 10);
      if (dailyStats[dateStr]) {
        dailyStats[dateStr].orders += 1;
        dailyStats[dateStr].revenue += order.totalAmount || 0;
      }
    });

    // Category analytics
    const categoryStats: Record<string, { orders: number; revenue: number; quantity: number }> = {};
    filteredOrders.forEach((order: any) => {
      if (Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          const product = products.find((p: any) => p.id === item.productId);
          const category = product?.category || 'Unknown';
          
          if (!categoryStats[category]) {
            categoryStats[category] = { orders: 0, revenue: 0, quantity: 0 };
          }
          
          const itemTotal = (Number(item.price) + (item.sizePrice || 0) + (item.extraPrice || 0)) * item.quantity;
          categoryStats[category].orders += 1;
          categoryStats[category].revenue += itemTotal;
          categoryStats[category].quantity += item.quantity || 1;
        });
      }
    });

    res.json({
      // Basic stats
      totalOrders,
      totalRevenue,
      averageOrderValue,
      todaysRevenue,
      todaysOrdersCount,
      
      // Product analytics
      topProducts,
      
      // Time analytics
      hourlyStats: Object.entries(hourlyStats).map(([hour, stats]) => ({
        hour: parseInt(hour),
        ...stats
      })),
      
      // Daily chart data
      dailyStats: Object.entries(dailyStats)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, stats]) => ({
          date,
          ...stats
        })),
      
      // Category analytics
      categoryStats: Object.entries(categoryStats).map(([category, stats]) => ({
        category,
        ...stats
      }))
    });
  } catch (error) {
    console.error("Error calculating analytics:", error);
    res.status(500).json({ error: "Failed to calculate analytics" });
  }
});

// Save store data endpoint
app.post("/api/save-store", ((req: Request, res: Response) => {
  try {
    const storeData = req.body;

    // Validate the data structure
    if (!storeData || !Array.isArray(storeData.products)) {
      return res.status(400).json({ error: "Invalid store data format" });
    }

    // Write to store.json file
    if (writeStoreData(storeData)) {
      console.log("Store data saved successfully to store.json");
      res.json({ success: true, message: "Store data saved successfully" });
    } else {
      res.status(500).json({ error: "Failed to save store data" });
    }
  } catch (error) {
    console.error("Error saving store data:", error);
    res.status(500).json({ error: "Failed to save store data" });
  }
}) as unknown as express.RequestHandler);

// Save store data endpoint (for /api/store)
app.post("/api/store", ((req: Request, res: Response) => {
  try {
    const storeData = req.body;

    // Validate the data structure
    if (!storeData || !Array.isArray(storeData.products)) {
      return res.status(400).json({ error: "Invalid store data format" });
    }

    // Write to store.json file
    if (writeStoreData(storeData)) {
      console.log(
        "Store data saved successfully to store.json (via /api/store)"
      );
      res.json({ success: true, message: "Store data saved successfully" });
    } else {
      res.status(500).json({ error: "Failed to save store data" });
    }
  } catch (error) {
    console.error("Error saving store data (via /api/store):", error);
    res.status(500).json({ error: "Failed to save store data" });
  }
}) as unknown as express.RequestHandler);

// Get store data endpoint
app.get("/api/store", ((req: Request, res: Response) => {
  try {
    const storeData = readStoreData();
    res.json(storeData);
  } catch (error) {
    console.error("Error reading store data:", error);
    res.status(500).json({ error: "Failed to read store data" });
  }
}) as unknown as express.RequestHandler);

// Add single product endpoint
app.post("/api/products", (req: Request, res: Response) => {
  try {
    const newProduct = req.body;
    const storeData = readStoreData();

    // Add new product
    storeData.products.push(newProduct);

    // Save back to file
    if (writeStoreData(storeData)) {
      console.log("Product added successfully to store.json:", newProduct.name);
      res.status(201).json({
        success: true,
        message: "Product added successfully",
        product: newProduct,
      });
    } else {
      res.status(500).json({ error: "Failed to add product" });
    }
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({ error: "Failed to add product" });
  }
});

// Add single branch endpoint
app.post("/api/branches", (req: Request, res: Response) => {
  try {
    const newBranch = req.body;
    const storeData = readStoreData();

    // Ensure branches array exists
    if (!Array.isArray(storeData.branches)) {
      storeData.branches = [];
    }

    // Add new branch
    storeData.branches.push(newBranch);

    // Save back to file
    if (writeStoreData(storeData)) {
      console.log("Branch added successfully to store.json:", newBranch.name);
      res.status(201).json({
        success: true,
        message: "Branch added successfully",
        branch: newBranch,
      });
    } else {
      res.status(500).json({ error: "Failed to add branch" });
    }
  } catch (error) {
    console.error("Error adding branch:", error);
    res.status(500).json({ error: "Failed to add branch" });
  }
});

// Update product endpoint
app.put("/api/products/:id", ((req: Request, res: Response) => {
  try {
    const productId = req.params.id;
    const updatedProduct = req.body;
    const storeData = readStoreData();

    // Find and update product
    const productIndex = storeData.products.findIndex(
      (p: any) => p.id === productId
    );
    if (productIndex === -1) {
      return res.status(404).json({ error: "Product not found" });
    }

    storeData.products[productIndex] = updatedProduct;

    // Save back to file
    if (writeStoreData(storeData)) {
      console.log(
        "Product updated successfully in store.json:",
        updatedProduct.name
      );
      res.json({
        success: true,
        message: "Product updated successfully",
        product: updatedProduct,
      });
    } else {
      res.status(500).json({ error: "Failed to update product" });
    }
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ error: "Failed to update product" });
  }
}) as unknown as express.RequestHandler);

// Delete product endpoint
app.delete("/api/products/:id", ((req: Request, res: Response) => {
  try {
    const productId = req.params.id;
    const storeData = readStoreData();

    // Find and remove product
    const productIndex = storeData.products.findIndex(
      (p: any) => p.id === productId
    );
    if (productIndex === -1) {
      return res.status(404).json({ error: "Product not found" });
    }

    const deletedProduct = storeData.products.splice(productIndex, 1)[0];

    // Save back to file
    if (writeStoreData(storeData)) {
      console.log(
        "Product deleted successfully from store.json:",
        deletedProduct.name
      );
      res.json({
        success: true,
        message: "Product deleted successfully",
        product: deletedProduct,
      });
    } else {
      res.status(500).json({ error: "Failed to delete product" });
    }
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ error: "Failed to delete product" });
  }
}) as unknown as express.RequestHandler);

// Error handling middleware
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Server error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
