"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Shield, AlertTriangle, CheckCircle, XCircle, Clock, Eye, Trash2, RefreshCw, Flag, Users } from "lucide-react";
import { VIOLATION_RULES, moderateAd, resolveAppeal, checkForeignProduct, getAllReportedProducts, adminReviewReport, type ModerationRecord, type Appeal, type ViolationType, type ProductReportSummary } from "@/lib/moderation";
import { STORAGE_KEYS, REPORT_THRESHOLD_HIDE, REPORT_THRESHOLD_DELETE } from "@/lib/constants";

export default function AdminModerationPage() {
    const [ads, setAds] = useState<any[]>([]);
    const [moderationHistory, setModerationHistory] = useState<ModerationRecord[]>([]);
    const [appeals, setAppeals] = useState<Appeal[]>([]);
    const [reportedProducts, setReportedProducts] = useState<ProductReportSummary[]>([]);
    const [activeTab, setActiveTab] = useState<'pending' | 'moderated' | 'appeals' | 'reported'>('pending');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedViolation, setSelectedViolation] = useState<ViolationType | ''>('');
    const [showModerationModal, setShowModerationModal] = useState(false);
    const [selectedAd, setSelectedAd] = useState<any>(null);
    const [moderatorNote, setModeratorNote] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        const myAds = JSON.parse(localStorage.getItem(STORAGE_KEYS.MY_ADS) || '[]');
        setAds(myAds);

        const history = JSON.parse(localStorage.getItem(STORAGE_KEYS.MODERATION_HISTORY) || '[]');
        setModerationHistory(history);

        const appealsList = JSON.parse(localStorage.getItem(STORAGE_KEYS.APPEALS) || '[]');
        setAppeals(appealsList);

        // Load reported products
        const reported = getAllReportedProducts();
        setReportedProducts(reported);
    };

    // Handle admin decision on reported product
    const handleReportDecision = (productId: string, decision: 'show' | 'delete') => {
        adminReviewReport(productId, decision);
        loadData();
    };

    // Hidden/pending review products (15+ reports)
    const pendingReportedProducts = reportedProducts.filter(p =>
        p.status === 'hidden' && !p.adminDecision
    );

    // Suspicious ads (potentially foreign products)
    const suspiciousAds = ads.filter(ad => {
        if (ad.status === 'deleted' || ad.status === 'suspended') return false;
        return checkForeignProduct(ad.title, ad.description);
    });

    // Pending ads (not yet moderated, not suspicious)
    const pendingAds = ads.filter(ad => {
        if (ad.status === 'deleted' || ad.status === 'suspended') return false;
        if (suspiciousAds.includes(ad)) return false;
        return !ad.moderationRecord;
    });

    const handleModerate = (adId: string, violationType: ViolationType) => {
        const result = moderateAd(adId, violationType, moderatorNote);
        if (result) {
            loadData();
            setShowModerationModal(false);
            setSelectedAd(null);
            setModeratorNote('');
            setSelectedViolation('');
        }
    };

    const handleResolveAppeal = (appealId: string, approved: boolean) => {
        const note = prompt(approved ? 'Зөвшөөрөх тайлбар:' : 'Татгалзах шалтгаан:');
        if (note !== null) {
            resolveAppeal(appealId, approved, note);
            loadData();
        }
    };

    const pendingAppeals = appeals.filter(a => a.status === 'pending');

    return (
        <div className="min-h-screen bg-gray-100 pb-24">
            {/* Header */}
            <div className="bg-white px-4 py-3 border-b flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard" className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <h1 className="font-bold text-lg">🛡️ Модерацийн хяналт</h1>
                </div>
                <button onClick={loadData} className="p-2 hover:bg-gray-100 rounded-full">
                    <RefreshCw className="w-5 h-5 text-gray-600" />
                </button>
            </div>

            {/* Stats Cards */}
            <div className="px-4 py-4">
                <div className="grid grid-cols-4 gap-2">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-center">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 mx-auto mb-1" />
                        <p className="text-xl font-bold text-yellow-700">{suspiciousAds.length}</p>
                        <p className="text-[10px] text-yellow-600">Сэжигтэй</p>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-center">
                        <Flag className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                        <p className="text-xl font-bold text-orange-600">{pendingReportedProducts.length}</p>
                        <p className="text-[10px] text-orange-500">Report</p>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                        <XCircle className="w-5 h-5 text-red-500 mx-auto mb-1" />
                        <p className="text-xl font-bold text-red-600">{moderationHistory.length}</p>
                        <p className="text-[10px] text-red-500">Устгасан</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
                        <Clock className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                        <p className="text-xl font-bold text-blue-600">{pendingAppeals.length}</p>
                        <p className="text-[10px] text-blue-500">Гомдол</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="px-4 mb-4">
                <div className="flex bg-white rounded-xl p-1 shadow-sm overflow-x-auto">
                    {[
                        { id: 'pending', label: 'Сэжигтэй', count: suspiciousAds.length },
                        { id: 'reported', label: 'Report', count: pendingReportedProducts.length },
                        { id: 'moderated', label: 'Устгасан', count: moderationHistory.length },
                        { id: 'appeals', label: 'Гомдол', count: pendingAppeals.length }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id
                                ? 'bg-primary text-secondary'
                                : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            {tab.label}
                            {tab.count > 0 && (
                                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-secondary text-primary' : 'bg-gray-200'
                                    }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="px-4">
                {activeTab === 'pending' && (
                    <div className="space-y-3">
                        {suspiciousAds.length === 0 ? (
                            <div className="bg-white rounded-xl p-8 text-center">
                                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                                <p className="text-gray-600">Сэжигтэй зар олдсонгүй</p>
                            </div>
                        ) : (
                            suspiciousAds.map(ad => (
                                <div key={ad.id} className="bg-white rounded-xl border border-yellow-200 overflow-hidden">
                                    <div className="bg-yellow-50 px-3 py-1.5 border-b border-yellow-200">
                                        <span className="text-xs font-bold text-yellow-700 flex items-center gap-1">
                                            <AlertTriangle className="w-3 h-3" />
                                            Гадаадын бараа байж магадгүй
                                        </span>
                                    </div>
                                    <div className="p-3 flex gap-3">
                                        <img src={ad.image} alt={ad.title} className="w-20 h-20 rounded-lg object-cover" />
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-900 mb-1">{ad.title}</h3>
                                            <p className="text-sm text-gray-500 line-clamp-2">{ad.description}</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {new Date(ad.createdAt).toLocaleDateString('mn-MN')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="px-3 pb-3 flex gap-2">
                                        <button
                                            onClick={() => { setSelectedAd(ad); setShowModerationModal(true); }}
                                            className="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm font-bold hover:bg-red-600"
                                        >
                                            <Trash2 className="w-4 h-4 inline mr-1" />
                                            Устгах
                                        </button>
                                        <Link
                                            href={`/product/${ad.id}`}
                                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                                        >
                                            <Eye className="w-4 h-4 inline" />
                                        </Link>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'moderated' && (
                    <div className="space-y-3">
                        {moderationHistory.length === 0 ? (
                            <div className="bg-white rounded-xl p-8 text-center">
                                <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-600">Модерацийн түүх хоосон</p>
                            </div>
                        ) : (
                            moderationHistory.map(record => (
                                <div key={record.id} className="bg-white rounded-xl p-4 border border-gray-100">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h3 className="font-bold text-gray-900">{record.adTitle}</h3>
                                            <p className="text-xs text-gray-500">{record.id}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${record.appealStatus === 'approved' ? 'bg-green-100 text-green-700' :
                                            record.appealStatus === 'rejected' ? 'bg-red-100 text-red-700' :
                                                record.appealStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-gray-100 text-gray-700'
                                            }`}>
                                            {record.appealStatus || 'Гомдолгүй'}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 text-xs mb-2">
                                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded">
                                            {VIOLATION_RULES[record.violationType].descriptionMn}
                                        </span>
                                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                            {new Date(record.createdAt).toLocaleDateString('mn-MN')}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600">{record.moderatorNote}</p>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'appeals' && (
                    <div className="space-y-3">
                        {pendingAppeals.length === 0 ? (
                            <div className="bg-white rounded-xl p-8 text-center">
                                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                                <p className="text-gray-600">Хүлээгдэж буй гомдол байхгүй</p>
                            </div>
                        ) : (
                            pendingAppeals.map(appeal => {
                                const record = moderationHistory.find(r => r.id === appeal.moderationRecordId);
                                return (
                                    <div key={appeal.id} className="bg-white rounded-xl p-4 border border-blue-200">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h3 className="font-bold text-gray-900">{record?.adTitle || 'Unknown'}</h3>
                                                <p className="text-xs text-gray-500">
                                                    Гаргасан: {new Date(appeal.submittedAt).toLocaleDateString('mn-MN')}
                                                </p>
                                            </div>
                                            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">
                                                Хүлээгдэж буй
                                            </span>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-3 mb-3">
                                            <p className="text-sm text-gray-700">{appeal.reason}</p>
                                        </div>
                                        {appeal.evidence && appeal.evidence.length > 0 && (
                                            <p className="text-xs text-gray-500 mb-3">
                                                📎 {appeal.evidence.length} нотлох баримт
                                            </p>
                                        )}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleResolveAppeal(appeal.id, true)}
                                                className="flex-1 bg-green-500 text-white py-2 rounded-lg text-sm font-bold hover:bg-green-600"
                                            >
                                                ✓ Зөвшөөрөх
                                            </button>
                                            <button
                                                onClick={() => handleResolveAppeal(appeal.id, false)}
                                                className="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm font-bold hover:bg-red-600"
                                            >
                                                ✕ Татгалзах
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                {/* Reported Products Tab */}
                {activeTab === 'reported' && (
                    <div className="space-y-3">
                        {pendingReportedProducts.length === 0 ? (
                            <div className="bg-white rounded-xl p-8 text-center">
                                <Flag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-600">Report хүлээж буй бүтээгдэхүүн байхгүй</p>
                            </div>
                        ) : (
                            pendingReportedProducts.map(product => {
                                const ad = ads.find(a => a.id === product.productId);
                                const progressPercent = Math.min(100, (product.totalReports / REPORT_THRESHOLD_DELETE) * 100);

                                return (
                                    <div key={product.productId} className="bg-white rounded-xl border border-orange-200 overflow-hidden">
                                        <div className="bg-orange-50 px-3 py-2 border-b border-orange-200 flex items-center justify-between">
                                            <span className="text-sm font-bold text-orange-700 flex items-center gap-2">
                                                <Flag className="w-4 h-4" />
                                                {product.totalReports} report
                                            </span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${product.status === 'hidden' ? 'bg-yellow-100 text-yellow-700' :
                                                product.status === 'deleted' ? 'bg-red-100 text-red-700' :
                                                    'bg-green-100 text-green-700'
                                                }`}>
                                                {product.status === 'hidden' ? 'Нуугдсан' :
                                                    product.status === 'deleted' ? 'Устгагдсан' : 'Идэвхтэй'}
                                            </span>
                                        </div>

                                        {/* Progress bar */}
                                        <div className="px-3 pt-2">
                                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all ${progressPercent >= 100 ? 'bg-red-500' :
                                                        progressPercent >= 50 ? 'bg-orange-500' : 'bg-yellow-500'
                                                        }`}
                                                    style={{ width: `${progressPercent}%` }}
                                                />
                                            </div>
                                            <p className="text-[10px] text-gray-500 mt-1">
                                                {product.totalReports}/{REPORT_THRESHOLD_DELETE} (Auto-delete: {REPORT_THRESHOLD_DELETE})
                                            </p>
                                        </div>

                                        <div className="p-3 flex gap-3">
                                            {ad?.image && (
                                                <img src={ad.image} alt={ad?.title} className="w-16 h-16 rounded-lg object-cover" />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-gray-900 truncate">{ad?.title || 'Unknown'}</h3>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Нуугдсан: {product.hiddenAt ? new Date(product.hiddenAt).toLocaleDateString('mn-MN') : '-'}
                                                </p>
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {product.reports.slice(0, 3).map((r, i) => (
                                                        <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                                            {VIOLATION_RULES[r.reason as keyof typeof VIOLATION_RULES]?.descriptionMn || r.reason}
                                                        </span>
                                                    ))}
                                                    {product.reports.length > 3 && (
                                                        <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                                            +{product.reports.length - 3}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="px-3 pb-3 flex gap-2">
                                            <button
                                                onClick={() => handleReportDecision(product.productId, 'show')}
                                                className="flex-1 bg-green-500 text-white py-2 rounded-lg text-sm font-bold hover:bg-green-600 flex items-center justify-center gap-1"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                                Сэргээх
                                            </button>
                                            <button
                                                onClick={() => handleReportDecision(product.productId, 'delete')}
                                                className="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm font-bold hover:bg-red-600 flex items-center justify-center gap-1"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Устгах
                                            </button>
                                            {ad && (
                                                <Link
                                                    href={`/product/${ad.id}`}
                                                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>

            {/* Moderation Modal */}
            {
                showModerationModal && selectedAd && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto">
                            <div className="p-4 border-b">
                                <h2 className="font-bold text-lg">Зар устгах</h2>
                                <p className="text-sm text-gray-500">{selectedAd.title}</p>
                            </div>
                            <div className="p-4 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Зөрчлийн төрөл
                                    </label>
                                    <select
                                        value={selectedViolation}
                                        onChange={(e) => setSelectedViolation(e.target.value as ViolationType)}
                                        className="w-full p-3 border rounded-xl"
                                    >
                                        <option value="">Сонгох...</option>
                                        {Object.entries(VIOLATION_RULES).map(([key, rule]) => (
                                            <option key={key} value={key}>{rule.descriptionMn}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Тайлбар
                                    </label>
                                    <textarea
                                        value={moderatorNote}
                                        onChange={(e) => setModeratorNote(e.target.value)}
                                        className="w-full p-3 border rounded-xl h-24 resize-none"
                                        placeholder="Модераторын тайлбар..."
                                    />
                                </div>
                                {selectedViolation && (
                                    <div className="bg-gray-50 rounded-xl p-3 text-sm">
                                        <p><strong>Арга хэмжээ:</strong> {VIOLATION_RULES[selectedViolation as ViolationType].action}</p>
                                        <p><strong>Буцаалт:</strong> {VIOLATION_RULES[selectedViolation as ViolationType].refund}</p>
                                        <p><strong>Гомдол:</strong> {VIOLATION_RULES[selectedViolation as ViolationType].appealAllowed ? 'Зөвшөөрнө' : 'Үгүй'}</p>
                                    </div>
                                )}
                            </div>
                            <div className="p-4 border-t flex gap-2">
                                <button
                                    onClick={() => { setShowModerationModal(false); setSelectedAd(null); }}
                                    className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold"
                                >
                                    Болих
                                </button>
                                <button
                                    onClick={() => selectedViolation && handleModerate(selectedAd.id, selectedViolation as ViolationType)}
                                    disabled={!selectedViolation}
                                    className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold disabled:opacity-50"
                                >
                                    Устгах
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
