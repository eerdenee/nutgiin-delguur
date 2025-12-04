"use client";

import { useState, useEffect } from "react";
import { Package, CheckCircle, Clock, Search, KeyRound } from "lucide-react";

interface Order {
    id: string;
    productTitle: string;
    price: number;
    sellerName: string;
    status: 'pending' | 'completed';
    secureCode: string;
    date: string;
    buyerName?: string; // Mock
    buyerPhone?: string; // Mock
}

export default function IncomingOrders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [verifyCode, setVerifyCode] = useState<{ [key: string]: string }>({});
    const [error, setError] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        // Load orders from localStorage
        // In a real app, we would fetch orders for the current seller
        const allOrders = JSON.parse(localStorage.getItem("my_orders") || "[]");

        // Filter for current user (Mock: assuming current user is "Бат-Эрдэнэ" or matches the seller in orders)
        // For demo purposes, we'll show ALL orders that are 'pending' or recently 'completed'
        // Ideally, we filter by sellerName === currentUser.name

        // Let's just show all for the demo to ensure the user sees the functionality immediately
        setOrders(allOrders);

        // Listen for updates
        const handleStorageChange = () => {
            const updated = JSON.parse(localStorage.getItem("my_orders") || "[]");
            setOrders(updated);
        };

        window.addEventListener("ordersUpdated", handleStorageChange);
        return () => window.removeEventListener("ordersUpdated", handleStorageChange);
    }, []);

    const handleVerify = (orderId: string, actualCode: string) => {
        // 🔒 Prevent double verification
        const order = orders.find(o => o.id === orderId);
        if (!order || order.status === 'completed') {
            return;
        }

        const inputCode = verifyCode[orderId];

        if (inputCode === actualCode) {
            // Success!
            const updatedOrders = orders.map(order => {
                if (order.id === orderId) {
                    return { ...order, status: 'completed' as const };
                }
                return order;
            });

            setOrders(updatedOrders);
            localStorage.setItem("my_orders", JSON.stringify(updatedOrders));

            // Increment sales count for ranking (Mock)
            const currentSales = parseInt(localStorage.getItem("mock_sales_count") || "124");
            localStorage.setItem("mock_sales_count", (currentSales + 1).toString());

            // Dispatch event to update UI
            window.dispatchEvent(new Event("ordersUpdated"));
            window.dispatchEvent(new Event("adsUpdated"));

            alert("Амжилттай! Борлуулалт баталгаажлаа.");
        } else {
            setError({ ...error, [orderId]: "Код буруу байна" });
        }
    };

    if (orders.length === 0) {
        return (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">Захиалга байхгүй</h3>
                <p className="text-sm text-gray-500">Одоогоор танд ирсэн шинэ захиалга алга байна.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-gray-50/50 flex justify-between items-center">
                <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    Ирсэн захиалгууд
                </h3>
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">
                    {orders.filter(o => o.status === 'pending').length} хүлээгдэж буй
                </span>
            </div>

            <div className="divide-y">
                {orders.map((order) => (
                    <div key={order.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className="font-bold text-gray-900">{order.productTitle}</h4>
                                    <span className="text-sm font-bold text-primary">₮{order.price.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {new Date(order.date).toLocaleDateString('mn-MN')}
                                    </span>
                                    <span>•</span>
                                    <span>Худалдан авагч: {order.buyerName || "Зочин"}</span>
                                </div>

                                {order.status === 'completed' ? (
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                                        <CheckCircle className="w-3.5 h-3.5" />
                                        Баталгаажсан
                                    </div>
                                ) : (
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold">
                                        <Clock className="w-3.5 h-3.5" />
                                        Хүлээгдэж буй
                                    </div>
                                )}
                            </div>

                            {order.status === 'pending' && (
                                <div className="flex items-start gap-2 bg-gray-50 p-3 rounded-xl border border-gray-200">
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">
                                            Хүлээлцэх код
                                        </label>
                                        <div className="flex gap-2">
                                            <div className="relative">
                                                <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <input
                                                    type="text"
                                                    maxLength={4}
                                                    placeholder="0000"
                                                    value={verifyCode[order.id] || ''}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(/[^0-9]/g, '');
                                                        setVerifyCode({ ...verifyCode, [order.id]: val });
                                                        setError({ ...error, [order.id]: "" });
                                                    }}
                                                    className={`w-24 pl-9 pr-3 py-2 text-sm font-mono font-bold border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 transition-all ${error[order.id] ? "border-red-300 focus:border-red-500" : "border-gray-300 focus:border-primary"
                                                        }`}
                                                />
                                            </div>
                                            <button
                                                onClick={() => handleVerify(order.id, order.secureCode)}
                                                disabled={!verifyCode[order.id] || verifyCode[order.id].length < 4}
                                                className="px-4 py-2 bg-gray-900 text-white text-sm font-bold rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                Батлах
                                            </button>
                                        </div>
                                        {error[order.id] && (
                                            <p className="text-xs text-red-500 mt-1 font-medium">{error[order.id]}</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
