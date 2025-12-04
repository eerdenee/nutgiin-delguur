import Link from 'next/link';

export default function AuthCodeErrorPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-2">Нэвтрэхэд алдаа гарлаа</h1>
                <p className="text-gray-600 mb-8">
                    Уучлаарай, таныг нэвтрэх үед алдаа гарлаа. Та дахин оролдоно уу.
                </p>

                <div className="space-y-3">
                    <Link
                        href="/login"
                        className="block w-full py-3 bg-primary text-secondary font-bold rounded-xl hover:bg-yellow-400 transition-colors"
                    >
                        Дахин нэвтрэх
                    </Link>
                    <Link
                        href="/"
                        className="block w-full py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                    >
                        Нүүр хуудас руу буцах
                    </Link>
                </div>
            </div>
        </div>
    );
}
