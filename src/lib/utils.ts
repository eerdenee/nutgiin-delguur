import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatPrice(price: number, currency: string = "₮") {
    if (price === 0) return "Үнэ тохиролцоно";
    return `${currency}${price.toLocaleString()}`;
}

export function getSmartBadge(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * 60 * 60 * 1000;
    const sevenDays = 7 * oneDay;

    if (diff < oneHour) return { text: "САЯХАН", color: "bg-green-500" };
    if (diff < oneDay) return { text: "ӨНӨӨДӨР", color: "bg-teal-500" };
    if (diff < sevenDays) return { text: "ШИНЭ", color: "bg-blue-500" };

    return null;
}
