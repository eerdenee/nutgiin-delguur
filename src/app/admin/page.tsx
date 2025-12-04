"use client";

import { useState, useEffect } from "react";
import { Users, FileText, DollarSign, Search, MoreVertical, Trash2, Ban, CheckCircle, ClipboardList, X, ArrowLeft, ShieldCheck, Package, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MOCK_REQUESTS } from "@/lib/data";

export default function AdminPage() {
    const router = useRouter();
    const [selectedRequest, setSelectedRequest] = useState<typeof MOCK_REQUESTS[0] | null>(null);
    const [activeTab, setActiveTab] = useState<"overview" | "users" | "ads" | "requests">("overview");
    const [requests, setRequests] = useState(MOCK_REQUESTS);
    const [isLoading, setIsLoading] = useState(true);

    // Check admin access
    useEffect(() => {
        const checkAdmin = () => {
            const userRole = localStorage.getItem("userRole");
            if (userRole !== 'admin') {
                // Redirect if not admin
                router.push('/dashboard');
            } else {
                setIsLoading(false);
            }
        };
        checkAdmin();
    }, [router]);

    // Mock Data
    const stats = {
        totalUsers: 1250,
        activeAds: 340,
        todaysRevenue: 150000,
        pendingRequests: requests.filter(r => r.status === "pending").length,
    };

    const users = [
        { id: 1, name: "Бат-Эрдэнэ", phone: "99112233", status: "active", subscription: "2023-12-25", type: "producer" },
        { id: 2, name: "Туяа", phone: "88776655", status: "active", subscription: "expired", type: "buyer" },
        { id: 3, name: "Болд", phone: "99887766", status: "banned", subscription: "2023-11-30", type: "producer" },
        { id: 4, name: "Сараа", phone: "99001122", status: "active", subscription: "2024-01-15", type: "buyer" },
        { id: 5, name: "Дорж", phone: "88112233", status: "active", subscription: "2023-12-20", type: "producer" },
    ];

    const ads = [
        { id: 1, title: "Шинэ ааруул", user: "Бат-Эрдэнэ", status: "active", date: "2023-11-25", price: 25000 },
        { id: 2, title: "Адууны мах", user: "Дорж", status: "active", date: "2023-11-24", price: 12000 },
        { id: 3, title: "Хууль бус бараа", user: "Болд", status: "flagged", date: "2023-11-26", price: 500000 },
        { id: 4, title: "Эсгий таавчиг", user: "Бат-Эрдэнэ", status: "active", date: "2023-11-23", price: 35000 },
    ];

    const handleRequestAction = (id: string, action: "approved" | "rejected") => {
        setRequests(prev => prev.map(req =>
            req.id === id ? { ...req, status: action } : req
        ));
    };

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-20 px-4 py-3 shadow-sm">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard" className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </Link>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <h1 className="font-bold text-lg text-gray-900">Админ самбар</h1>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white border-b sticky top-[61px] z-10 overflow-x-auto no-scrollbar">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="flex gap-6 min-w-max">
                        <button
                            onClick={() => setActiveTab("overview")}
                            className={`py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === "overview" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-900"
                                }`}
                        >
                            Хяналтын самбар
                        </button>
                        <button
                            onClick={() => setActiveTab("requests")}
                            className={`py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === "requests" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-900"
                                }`}
                        >
                            Хүсэлтүүд
                            {stats.pendingRequests > 0 && (
                                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                    {stats.pendingRequests}
                                </span>
                            )}
                        </button>
                        <Link
                            href="/admin/moderation"
                            className="py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 border-transparent text-gray-500 hover:text-gray-900"
                        >
                            🛡️ Модерац / Report
                        </Link>
                        <button
                            onClick={() => setActiveTab("users")}
                            className={`py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === "users" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-900"
                                }`}
                        >
                            Хэрэглэгчид
                        </button>
                        <button
                            onClick={() => setActiveTab("ads")}
                            className={`py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === "ads" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-900"
                                }`}
                        >
                            Зарууд
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-4 max-w-6xl mx-auto space-y-6">
                {/* Overview Tab */}
                {activeTab === "overview" && (
                    <div className="space-y-6">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                                        <Users className="w-5 h-5" />
                                    </div>
                                    <span className="text-xs font-bold text-gray-500 uppercase">Нийт хэрэглэгч</span>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                            </div>
                            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                                        <Package className="w-5 h-5" />
                                    </div>
                                    <span className="text-xs font-bold text-gray-500 uppercase">Идэвхтэй зар</span>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">{stats.activeAds}</p>
                            </div>
                            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-yellow-50 rounded-full flex items-center justify-center text-yellow-600">
                                        <DollarSign className="w-5 h-5" />
                                    </div>
                                    <span className="text-xs font-bold text-gray-500 uppercase">Өнөөдрийн орлого</span>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">₮{stats.todaysRevenue.toLocaleString()}</p>
                            </div>
                            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center text-purple-600">
                                        <ClipboardList className="w-5 h-5" />
                                    </div>
                                    <span className="text-xs font-bold text-gray-500 uppercase">Хүлээгдэж буй</span>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">{stats.pendingRequests}</p>
                            </div>
                        </div>

                        {/* Recent Activity Chart Placeholder */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-gray-400" />
                                Сүүлийн үеийн идэвх
                            </h3>
                            <div className="h-48 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 text-sm">
                                График харуулах хэсэг
                            </div>
                        </div>
                    </div>
                )}

                {/* Requests Tab */}
                {activeTab === "requests" && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-4 border-b bg-gray-50/50">
                            <h3 className="font-bold text-lg text-gray-900">Үйлдвэрлэгч болох хүсэлтүүд</h3>
                        </div>
                        <div className="divide-y">
                            {requests.length === 0 ? (
                                <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                                    <ClipboardList className="w-12 h-12 text-gray-300 mb-3" />
                                    <p>Хүсэлт байхгүй байна</p>
                                </div>
                            ) : (
                                requests.map((req) => (
                                    <div key={req.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                                        <div className="cursor-pointer flex-1" onClick={() => setSelectedRequest(req)}>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-bold text-gray-900">{req.businessName}</h4>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${req.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                    req.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                        'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {req.status === 'pending' ? 'Хүлээгдэж буй' :
                                                        req.status === 'approved' ? 'Зөвшөөрсөн' : 'Татгалзсан'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-1">
                                                <span className="font-medium">{req.userName}</span> • {req.userPhone}
                                            </p>
                                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                                <Users className="w-3 h-3" /> {req.location} • {req.date}
                                            </p>
                                            <p className="text-xs text-primary font-bold mt-2 hover:underline inline-flex items-center gap-1">
                                                Дэлгэрэнгүйг үзэх <ArrowLeft className="w-3 h-3 rotate-180" />
                                            </p>
                                        </div>

                                        {req.status === 'pending' && (
                                            <div className="flex items-center gap-2 self-start md:self-center w-full md:w-auto">
                                                <button
                                                    onClick={() => handleRequestAction(req.id, "approved")}
                                                    className="flex-1 md:flex-none flex items-center justify-center gap-1 px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-bold hover:bg-green-600 transition-colors shadow-sm"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                    Зөвшөөрөх
                                                </button>
                                                <button
                                                    onClick={() => handleRequestAction(req.id, "rejected")}
                                                    className="flex-1 md:flex-none flex items-center justify-center gap-1 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors border border-red-100"
                                                >
                                                    <Ban className="w-4 h-4" />
                                                    Татгалзах
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Users Tab */}
                {activeTab === "users" && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-4 border-b bg-gray-50/50 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-gray-900">Хэрэглэгчид</h3>
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Хайх..."
                                    className="pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 font-medium">
                                    <tr>
                                        <th className="px-4 py-3">Нэр</th>
                                        <th className="px-4 py-3">Утас</th>
                                        <th className="px-4 py-3">Төрөл</th>
                                        <th className="px-4 py-3">Төлөв</th>
                                        <th className="px-4 py-3 text-right">Үйлдэл</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {users.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-medium text-gray-900">{user.name}</td>
                                            <td className="px-4 py-3 text-gray-600">{user.phone}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${user.type === 'producer' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {user.type === 'producer' ? 'Үйлдвэрлэгч' : 'Худалдан авагч'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {user.status === 'active' ? 'Идэвхтэй' : 'Хориглогдсон'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button className="p-1 hover:bg-gray-200 rounded text-gray-500">
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Ads Tab */}
                {activeTab === "ads" && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-4 border-b bg-gray-50/50">
                            <h3 className="font-bold text-lg text-gray-900">Зарууд</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 font-medium">
                                    <tr>
                                        <th className="px-4 py-3">Гарчиг</th>
                                        <th className="px-4 py-3">Үнэ</th>
                                        <th className="px-4 py-3">Нийтлэгч</th>
                                        <th className="px-4 py-3">Огноо</th>
                                        <th className="px-4 py-3">Төлөв</th>
                                        <th className="px-4 py-3 text-right">Үйлдэл</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {ads.map((ad) => (
                                        <tr key={ad.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-medium text-gray-900">{ad.title}</td>
                                            <td className="px-4 py-3 text-gray-600">₮{ad.price.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-gray-600">{ad.user}</td>
                                            <td className="px-4 py-3 text-gray-500">{ad.date}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${ad.status === 'active' ? 'bg-green-100 text-green-700' :
                                                    ad.status === 'flagged' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {ad.status === 'active' ? 'Идэвхтэй' :
                                                        ad.status === 'flagged' ? 'Зөрчилтэй' : 'Идэвхгүй'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right flex justify-end gap-2">
                                                <button className="p-1 hover:bg-red-100 rounded text-red-500" title="Устгах">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Request Details Modal */}
            {selectedRequest && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedRequest(null)}>
                    <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-xl text-gray-900">Хүсэлтийн дэлгэрэнгүй</h3>
                            <button onClick={() => setSelectedRequest(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="w-6 h-6 text-gray-500" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div className="bg-gray-50 p-4 rounded-xl">
                                <h4 className="font-medium text-gray-500 text-xs uppercase mb-1">Бизнесийн нэр</h4>
                                <p className="font-bold text-gray-900 text-lg">{selectedRequest.businessName}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl">
                                <h4 className="font-medium text-gray-500 text-xs uppercase mb-1">Хэрэглэгчийн нэр</h4>
                                <p className="font-bold text-gray-900 text-lg">{selectedRequest.userName}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl">
                                <h4 className="font-medium text-gray-500 text-xs uppercase mb-1">Утас</h4>
                                <p className="font-bold text-gray-900 text-lg">{selectedRequest.userPhone}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl">
                                <h4 className="font-medium text-gray-500 text-xs uppercase mb-1">Огноо</h4>
                                <p className="font-bold text-gray-900 text-lg">{selectedRequest.date}</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-primary" />
                                    Иргэний үнэмлэх (Урд)
                                </h4>
                                <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden relative border border-gray-200">
                                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 flex-col gap-2">
                                        <FileText className="w-12 h-12" />
                                        <span className="text-sm font-medium">Зураг байхгүй</span>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-primary" />
                                    Иргэний үнэмлэх (Ард)
                                </h4>
                                <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden relative border border-gray-200">
                                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 flex-col gap-2">
                                        <FileText className="w-12 h-12" />
                                        <span className="text-sm font-medium">Зураг байхгүй</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex gap-3 justify-end border-t pt-4">
                            <button
                                onClick={() => setSelectedRequest(null)}
                                className="px-6 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                Хаах
                            </button>
                            {selectedRequest.status === 'pending' && (
                                <>
                                    <button
                                        onClick={() => {
                                            handleRequestAction(selectedRequest.id, "rejected");
                                            setSelectedRequest(null);
                                        }}
                                        className="px-6 py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors border border-red-100"
                                    >
                                        Татгалзах
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleRequestAction(selectedRequest.id, "approved");
                                            setSelectedRequest(null);
                                        }}
                                        className="px-6 py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-colors shadow-lg shadow-green-500/20"
                                    >
                                        Зөвшөөрөх
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
