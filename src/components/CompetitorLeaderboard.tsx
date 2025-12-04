interface CompetitorLeaderboardProps {
    currentTier: string;
}

export default function CompetitorLeaderboard({ currentTier }: CompetitorLeaderboardProps) {
    // Mock competitors from same tier/region
    const competitors = [
        { rank: 1, name: "Органик цагаан идээ", location: "Архангай, Батцэнгэл", sales: 156 },
        { rank: 2, name: "Тэмээний сүү", location: "Өмнөговь, Ханбогд", sales: 142 },
        { rank: 3, name: "Хөвсгөлийн тараг", location: "Хөвсгөл, Алаг-Эрдэнэ", sales: 128 },
        { rank: 4, name: "Шинэ ааруул", location: "Завхан, Тосонцэнгэл", sales: 115 },
        { rank: 5, name: "Арьс ширний бараа", location: "Увс, Улаангом", sales: 98 },
    ];

    return (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-gray-900">Топ 5 - {currentTier} түвшин</h3>
                <div className="px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs font-bold">
                    LIVE
                </div>
            </div>
            <p className="text-xs text-gray-500 mb-4">
                Сар бүрийн 1-нд энэ жагсаалтын эхний 5 нь дараагийн түвшинд шилжинэ
            </p>

            <div className="space-y-2">
                {competitors.map((competitor) => (
                    <div
                        key={competitor.rank}
                        className={`flex items-center justify-between p-3 rounded-xl transition-all ${competitor.rank <= 5
                                ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 shadow-sm'
                                : 'bg-gray-50'
                            }`}
                    >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 ${competitor.rank === 1
                                    ? 'bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 text-white shadow-md'
                                    : competitor.rank <= 5
                                        ? 'bg-gradient-to-br from-amber-400 to-yellow-500 text-white'
                                        : 'bg-gray-200 text-gray-600'
                                }`}>
                                #{competitor.rank}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="font-bold text-gray-900 text-sm truncate">{competitor.name}</p>
                                <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                                    <span className="inline-block w-1 h-1 bg-gray-400 rounded-full"></span>
                                    {competitor.location}
                                </p>
                            </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                            <p className="font-bold text-primary text-sm tabular-nums">{competitor.sales}</p>
                            <p className="text-[10px] text-gray-400 whitespace-nowrap">борлуулалт</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-center text-gray-500">
                    Таны байр суурийг сайжруулахын тулд борлуулалтаа нэмэгдүүлээрэй
                </p>
            </div>
        </div>
    );
}
