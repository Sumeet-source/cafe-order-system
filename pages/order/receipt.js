import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function Receipt() {
  const router = useRouter();
  const { orderId } = router.query;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    fetch(`/api/orders/${orderId}/receipt`)
      .then((r) => r.json())
      .then((data) => {
        setOrder(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [orderId]);

  const downloadPDF = async () => {
    setDownloading(true);
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    // Header
    doc.setFillColor(4, 120, 87);
    doc.rect(0, 0, 210, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('House Bird Cafe', 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Fresh Brews • Warm Vibes', 105, 22, { align: 'center' });
    doc.setFontSize(8);
    doc.text('GSTIN: 27XXXXXXXXXXXXXZ5', 105, 28, { align: 'center' });

    // Receipt info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT RECEIPT', 105, 50, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const leftX = 15;
    const rightX = 130;
    let y = 65;

    doc.text(`Receipt No: ${order._id.slice(-8).toUpperCase()}`, leftX, y);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, rightX, y);
    y += 7;
    doc.text(`Table: ${order.tableNumber}`, leftX, y);
    doc.text(`Time: ${new Date(order.createdAt).toLocaleTimeString('en-IN')}`, rightX, y);
    y += 7;
    doc.text(`Customer: ${order.customerName}`, leftX, y);
    y += 7;
    doc.text(`Payment ID: ${order.razorpayPaymentId || 'N/A'}`, leftX, y);

    // Items table
    const tableBody = order.items.map((it) => [
      it.name,
      it.quantity.toString(),
      `Rs. ${it.price}`,
      `Rs. ${it.price * it.quantity}`,
    ]);

    autoTable(doc, {
      startY: y + 10,
      head: [['Item', 'Qty', 'Price', 'Total']],
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: [4, 120, 87], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 90 },
        1: { halign: 'center', cellWidth: 20 },
        2: { halign: 'right', cellWidth: 35 },
        3: { halign: 'right', cellWidth: 40 },
      },
    });

    // Totals
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal:', 140, finalY);
    doc.text(`Rs. ${order.subtotal?.toFixed(2)}`, 195, finalY, { align: 'right' });

    doc.text(`GST (${order.gstRate}%):`, 140, finalY + 7);
    doc.text(`Rs. ${order.gstAmount?.toFixed(2)}`, 195, finalY + 7, { align: 'right' });

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL:', 140, finalY + 17);
    doc.text(`Rs. ${order.totalAmount.toFixed(2)}`, 195, finalY + 17, { align: 'right' });

    // Payment status
    doc.setFontSize(10);
    doc.setTextColor(4, 120, 87);
    doc.setFont('helvetica', 'bold');
    doc.text('PAID via Razorpay', 15, finalY + 25);

    // Footer
    doc.setTextColor(120, 120, 120);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.text('Thank you for dining with us! Visit again soon.', 105, 280, { align: 'center' });
    doc.text('House Bird Cafe • www.housebirdcafe.com', 105, 285, { align: 'center' });

    doc.save(`HouseBirdCafe_Receipt_${order._id.slice(-8).toUpperCase()}.pdf`);
    setDownloading(false);
  };

  const shareReceipt = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'House Bird Cafe Receipt',
          text: `Receipt for Table ${order.tableNumber} — Total: ₹${order.totalAmount}`,
          url: window.location.href,
        });
      } catch {}
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Receipt link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <p className="text-stone-500 animate-pulse">Loading receipt...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-2xl mb-4">😕</p>
          <p className="text-stone-600">Receipt not found</p>
          <Link href="/order?table=1" className="text-emerald-700 underline mt-4 inline-block">Back to Menu</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Success Badge */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-5xl">✅</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-stone-800">Payment Successful</h1>
          <p className="text-stone-500 text-sm mt-1">Your receipt is ready below</p>
        </div>

        {/* Receipt Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-stone-200">
          {/* Header */}
          <div className="bg-emerald-700 text-white p-6 text-center">
            <h2 className="text-xl font-serif font-bold">House Bird Cafe</h2>
            <p className="text-emerald-200 text-xs mt-1">Fresh Brews • Warm Vibes</p>
            <p className="text-[10px] text-emerald-200 mt-2">GSTIN: 27XXXXXXXXXXXXXZ5</p>
          </div>

          {/* Info */}
          <div className="p-5 border-b border-dashed border-stone-200">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-stone-400 font-bold uppercase">Receipt No</p>
                <p className="text-stone-800 font-bold mt-0.5">{order._id.slice(-8).toUpperCase()}</p>
              </div>
              <div className="text-right">
                <p className="text-stone-400 font-bold uppercase">Date</p>
                <p className="text-stone-800 font-bold mt-0.5">
                  {new Date(order.createdAt).toLocaleDateString('en-IN')}
                </p>
              </div>
              <div>
                <p className="text-stone-400 font-bold uppercase">Table</p>
                <p className="text-stone-800 font-bold mt-0.5">Table {order.tableNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-stone-400 font-bold uppercase">Time</p>
                <p className="text-stone-800 font-bold mt-0.5">
                  {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-dashed border-stone-200">
              <p className="text-stone-400 font-bold uppercase text-xs">Customer</p>
              <p className="text-stone-800 font-bold text-sm">{order.customerName}</p>
            </div>
          </div>

          {/* Items */}
          <div className="p-5 border-b border-dashed border-stone-200">
            <p className="text-stone-400 font-bold uppercase text-xs mb-3">Order Items</p>
            <div className="space-y-2">
              {order.items.map((it, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <div className="flex-1">
                    <span className="font-medium text-stone-800">{it.name}</span>
                    <span className="text-stone-400 text-xs ml-2">× {it.quantity}</span>
                  </div>
                  <span className="font-bold text-stone-800">₹{it.price * it.quantity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="p-5 border-b border-dashed border-stone-200 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-stone-500">Subtotal</span>
              <span className="text-stone-700 font-medium">₹{order.subtotal?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-stone-500">GST ({order.gstRate}%)</span>
              <span className="text-stone-700 font-medium">₹{order.gstAmount?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-3 mt-2 border-t border-stone-200">
              <span className="font-bold text-stone-800 text-lg">Total</span>
              <span className="font-bold text-emerald-700 text-xl">₹{order.totalAmount}</span>
            </div>
          </div>

          {/* Payment Info */}
          <div className="p-5 bg-stone-50">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
              <span>✓</span> PAID via Razorpay
            </div>
            {order.razorpayPaymentId && (
              <p className="text-[10px] text-stone-400 mt-1 font-mono break-all">
                Payment ID: {order.razorpayPaymentId}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 space-y-3">
          <button
            onClick={downloadPDF}
            disabled={downloading}
            className="w-full bg-emerald-700 text-white py-4 rounded-xl font-bold text-lg hover:bg-emerald-800 transition shadow-md disabled:bg-stone-400"
          >
            {downloading ? 'Generating...' : '📥 Download PDF Receipt'}
          </button>
          <button
            onClick={shareReceipt}
            className="w-full bg-stone-800 text-white py-3 rounded-xl font-medium hover:bg-stone-900 transition"
          >
            📤 Share Receipt
          </button>
          <button
            onClick={() => window.print()}
            className="w-full bg-stone-200 text-stone-700 py-3 rounded-xl font-medium hover:bg-stone-300 transition"
          >
            🖨️ Print Receipt
          </button>
        </div>

        {/* Feedback Prompt */}
        {!alreadyReviewed && (
          <div className="mt-6 bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-300 rounded-2xl p-6 text-center shadow-sm">
            <p className="text-4xl mb-2">⭐</p>
            <p className="font-bold text-stone-800 text-lg mb-1">How was your visit?</p>
            <p className="text-xs text-stone-600 mb-4">Your feedback helps us serve you better</p>
            <Link
              href={`/order/feedback?orderId=${order._id}`}
              className="inline-block w-full bg-amber-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-amber-600 transition shadow-md"
            >
              Rate Your Experience
            </Link>
          </div>
        )}

        {/* Order More */}
        <div className="text-center mt-6 mb-8">
          <Link href={`/order?table=${order.tableNumber}`} className="text-emerald-700 font-medium underline">
            Order More
          </Link>
        </div>
      </div>
    </div>
  );
}
