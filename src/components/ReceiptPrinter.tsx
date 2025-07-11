import React from 'react';
import { toast } from 'sonner';

interface ReceiptItem {
  productName: string;
  quantity: number;
  price: number;
  selectedSize?: string;
  selectedExtra?: string;
  sizePrice?: number;
  extraPrice?: number;
}

interface ReceiptData {
  orderNumber: number;
  orderCode: string;
  items: ReceiptItem[];
  totalAmount: number;
  paid: number;
  change: number;
  createdAt: string;
}

interface ReceiptPrinterProps {
  receiptData: ReceiptData | null;
  onClose: () => void;
}

const ReceiptPrinter: React.FC<ReceiptPrinterProps> = ({ receiptData, onClose }) => {
  if (!receiptData) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // دالة لطباعة الكوبون على طابعة الإيصالات الحرارية
  const printToThermalPrinter = async () => {
    try {
      // إعداد بيانات الكوبون للطابعة الحرارية
      const printData = {
        orderNumber: receiptData.orderNumber,
        orderCode: receiptData.orderCode,
        items: receiptData.items,
        totalAmount: receiptData.totalAmount,
        paid: receiptData.paid,
        change: receiptData.change,
        createdAt: receiptData.createdAt,
        storeName: "مطعم الطعام للواحد",
        storePhone: "0123456789",
        storeAddress: "شارع الرئيسي، المدينة"
      };

      // إرسال البيانات إلى السيرفر للطباعة
      const response = await fetch('/api/print-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(printData),
      });

      if (response.ok) {
        toast.success("تم إرسال الكوبون للطباعة بنجاح");
        onClose();
      } else {
        throw new Error('فشل في الطباعة');
      }
    } catch (error) {
      console.error('خطأ في الطباعة:', error);
      toast.error("فشل في الطباعة. تأكد من توصيل الطابعة");
    }
  };

  // دالة للطباعة في المتصفح (كبديل)
  const printInBrowser = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const receiptHTML = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>كوبون الطلب ${receiptData.orderCode}</title>
        <style>
          @media print {
            body { margin: 0; padding: 0; }
            .no-print { display: none !important; }
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.2;
            color: #000;
            background: #fff;
            direction: rtl;
            text-align: right;
            width: 80mm;
            margin: 0 auto;
            padding: 5px;
          }
          
          .receipt {
            width: 100%;
            padding: 5px;
            background: #fff;
          }
          
          .header {
            text-align: center;
            border-bottom: 1px dashed #000;
            padding-bottom: 10px;
            margin-bottom: 10px;
          }
          
          .store-name {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 3px;
          }
          
          .store-info {
            font-size: 9px;
            color: #666;
            margin-bottom: 2px;
          }
          
          .order-info {
            text-align: center;
            border-bottom: 1px dashed #000;
            padding: 10px 0;
            margin-bottom: 10px;
          }
          
          .order-number {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          
          .order-code {
            font-size: 12px;
            color: #666;
            margin-bottom: 5px;
          }
          
          .order-date {
            font-size: 10px;
            color: #666;
          }
          
          .items {
            margin-bottom: 10px;
          }
          
          .item {
            border-bottom: 1px dotted #ccc;
            padding: 5px 0;
          }
          
          .item-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 2px;
          }
          
          .item-name {
            font-weight: bold;
            flex: 1;
          }
          
          .item-price {
            font-weight: bold;
          }
          
          .item-details {
            font-size: 10px;
            color: #666;
            margin-bottom: 2px;
          }
          
          .item-quantity {
            font-size: 10px;
            color: #666;
          }
          
          .total-section {
            border-top: 1px dashed #000;
            padding-top: 10px;
            margin-top: 10px;
          }
          
          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
          }
          
          .total-label {
            font-weight: bold;
          }
          
          .total-value {
            font-weight: bold;
          }
          
          .grand-total {
            font-size: 14px;
            font-weight: bold;
            border-top: 2px solid #000;
            padding-top: 5px;
            margin-top: 5px;
          }
          
          .payment-info {
            border-top: 1px dashed #000;
            padding-top: 10px;
            margin-top: 10px;
            text-align: center;
          }
          
          .footer {
            text-align: center;
            margin-top: 15px;
            padding-top: 10px;
            border-top: 1px dashed #000;
            font-size: 10px;
            color: #666;
          }
          
          .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #007bff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
          }
          
          .print-button:hover {
            background: #0056b3;
          }
          
          .close-button {
            position: fixed;
            top: 20px;
            left: 20px;
            background: #dc3545;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
          }
          
          .close-button:hover {
            background: #c82333;
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="store-name">مطعم الطعام للواحد</div>
            <div class="store-info">Food For One Restaurant</div>
            <div class="store-info">تليفون: 0123456789</div>
            <div class="store-info">العنوان: شارع الرئيسي، المدينة</div>
          </div>
          
          <div class="order-info">
            <div class="order-number">طلب رقم: ${receiptData.orderNumber}</div>
            <div class="order-code">كود الطلب: ${receiptData.orderCode}</div>
            <div class="order-date">التاريخ: ${formatDate(receiptData.createdAt)}</div>
          </div>
          
          <div class="items">
            ${receiptData.items.map(item => `
              <div class="item">
                <div class="item-header">
                  <div class="item-name">${item.productName}</div>
                  <div class="item-price">${(Number(item.price) + (item.sizePrice || 0) + (item.extraPrice || 0)) * item.quantity} ج.م</div>
                </div>
                ${item.selectedSize || item.selectedExtra ? `
                  <div class="item-details">
                    ${item.selectedSize ? `الحجم: ${item.selectedSize}` : ''}
                    ${item.selectedSize && item.selectedExtra ? ' | ' : ''}
                    ${item.selectedExtra ? `الإضافة: ${item.selectedExtra}` : ''}
                  </div>
                ` : ''}
                <div class="item-quantity">
                  الكمية: ${item.quantity} × ${Number(item.price) + (item.sizePrice || 0) + (item.extraPrice || 0)} ج.م
                </div>
              </div>
            `).join('')}
          </div>
          
          <div class="total-section">
            <div class="total-row">
              <div class="total-label">المجموع:</div>
              <div class="total-value">${receiptData.totalAmount} ج.م</div>
            </div>
            <div class="total-row">
              <div class="total-label">المدفوع:</div>
              <div class="total-value">${receiptData.paid} ج.م</div>
            </div>
            <div class="total-row">
              <div class="total-label">الباقي:</div>
              <div class="total-value">${receiptData.change} ج.م</div>
            </div>
            <div class="total-row grand-total">
              <div class="total-label">الإجمالي:</div>
              <div class="total-value">${receiptData.totalAmount} ج.م</div>
            </div>
          </div>
          
          <div class="payment-info">
            <div>طريقة الدفع: نقداً</div>
            <div>حالة الطلب: مكتمل</div>
          </div>
          
          <div class="footer">
            <div>شكراً لزيارتكم</div>
            <div>نتمنى لكم تجربة طعام ممتعة</div>
            <div>نرجو العودة مرة أخرى</div>
            <div style="margin-top: 10px;">--- انتهى ---</div>
          </div>
        </div>
        
        <button class="print-button no-print" onclick="window.print()">🖨️ طباعة الكوبون</button>
        <button class="close-button no-print" onclick="window.close()">❌ إغلاق</button>
      </body>
      </html>
    `;

    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    
    // طباعة تلقائية بعد تحميل الصفحة
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-primary mb-2">طباعة الكوبون</h2>
          <p className="text-muted-foreground">اختر طريقة الطباعة المناسبة</p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="text-center">
            <div className="font-bold text-lg text-primary mb-2">
              طلب رقم: {receiptData.orderNumber}
            </div>
            <div className="text-sm text-muted-foreground mb-2">
              كود الطلب: {receiptData.orderCode}
            </div>
            <div className="text-sm text-muted-foreground">
              الإجمالي: {receiptData.totalAmount} ج.م
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <button
            onClick={printToThermalPrinter}
            className="w-full bg-primary text-white py-3 px-6 rounded-xl font-semibold hover:bg-primary/90 transition flex items-center justify-center gap-2"
          >
            🖨️ طباعة على طابعة الإيصالات
            <span className="text-xs">(Xprinter XP-N160I)</span>
          </button>
          
          <button
            onClick={printInBrowser}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
          >
            🌐 طباعة في المتصفح
            <span className="text-xs">(بديل)</span>
          </button>
          
          <button
            onClick={onClose}
            className="w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-300 transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptPrinter; 