import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { DEFAULT_COUNTRY } from './lib/constants';

export function middleware(request: NextRequest) {
    const response = NextResponse.next();
    const hostname = request.headers.get('host') || '';

    // Default country
    let country = DEFAULT_COUNTRY;

    // Detect country from domain (e.g. .kg domain -> KG)
    if (hostname.endsWith('.kg') || hostname.includes('kyrgyz')) {
        country = 'KG';
    }
    // You can add more logic here (e.g. query param ?country=KG for testing)
    const url = new URL(request.url);
    if (url.searchParams.has('country')) {
        const paramCountry = url.searchParams.get('country')?.toUpperCase();
        if (paramCountry === 'MN' || paramCountry === 'KG') {
            country = paramCountry;
        }
    }

    // Set cookie so client components can read it
    response.cookies.set('country', country);

    // Also set a header for server components
    response.headers.set('x-country', country);

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
