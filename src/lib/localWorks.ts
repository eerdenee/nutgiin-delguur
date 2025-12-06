/**
 * LOCAL WORKS - Rural Gig Economy
 * 
 * Problem: Rural areas lack labor. No one to shear sheep, harvest hay, build houses.
 * Solution: Connect workers with farmers/herders.
 * 
 * "I can shear sheep for 3 days" meets "Need 2 people for hay harvest"
 */

import { supabase } from './supabase';

// ============================================
// JOB TYPES & CATEGORIES
// ============================================

export const JOB_CATEGORIES = {
    livestock: {
        name: 'Мал аж ахуй',
        icon: '🐑',
        jobs: [
            { id: 'sheep_shearing', name: 'Хонь хяргах', unit: 'per_head', avgPrice: 3000 },
            { id: 'goat_shearing', name: 'Ямаа самнах', unit: 'per_head', avgPrice: 2500 },
            { id: 'cattle_herding', name: 'Мал хариулах', unit: 'per_day', avgPrice: 50000 },
            { id: 'milking', name: 'Саах', unit: 'per_day', avgPrice: 30000 },
            { id: 'veterinary', name: 'Малын эмч', unit: 'per_visit', avgPrice: 50000 }
        ]
    },
    farming: {
        name: 'Газар тариалан',
        icon: '🌾',
        jobs: [
            { id: 'hay_harvest', name: 'Хадлан хадах', unit: 'per_day', avgPrice: 80000 },
            { id: 'plowing', name: 'Газар хагалах', unit: 'per_hectare', avgPrice: 150000 },
            { id: 'planting', name: 'Тариа тарих', unit: 'per_day', avgPrice: 50000 },
            { id: 'harvesting', name: 'Ургац хураах', unit: 'per_day', avgPrice: 60000 },
            { id: 'irrigation', name: 'Усалгаа', unit: 'per_day', avgPrice: 40000 }
        ]
    },
    construction: {
        name: 'Барилга',
        icon: '🏗️',
        jobs: [
            { id: 'fence_building', name: 'Хашаа барих', unit: 'per_meter', avgPrice: 15000 },
            { id: 'ger_setup', name: 'Гэр барих', unit: 'per_job', avgPrice: 100000 },
            { id: 'well_digging', name: 'Худаг ухах', unit: 'per_meter', avgPrice: 200000 },
            { id: 'house_repair', name: 'Байшин засах', unit: 'per_day', avgPrice: 80000 },
            { id: 'roofing', name: 'Дээвэр засах', unit: 'per_sqm', avgPrice: 25000 }
        ]
    },
    transport: {
        name: 'Тээвэрлэлт',
        icon: '🚛',
        jobs: [
            { id: 'livestock_transport', name: 'Мал тээвэрлэх', unit: 'per_km', avgPrice: 1500 },
            { id: 'hay_transport', name: 'Өвс тээх', unit: 'per_trip', avgPrice: 150000 },
            { id: 'goods_transport', name: 'Ачаа зөөх', unit: 'per_km', avgPrice: 1000 },
            { id: 'passenger', name: 'Зорчигч тээх', unit: 'per_trip', avgPrice: 50000 }
        ]
    },
    domestic: {
        name: 'Гэр ахуй',
        icon: '🏠',
        jobs: [
            { id: 'cooking', name: 'Хоол хийх', unit: 'per_day', avgPrice: 40000 },
            { id: 'cleaning', name: 'Цэвэрлэгээ', unit: 'per_day', avgPrice: 30000 },
            { id: 'childcare', name: 'Хүүхэд харах', unit: 'per_day', avgPrice: 35000 },
            { id: 'eldercare', name: 'Өндөр настан харах', unit: 'per_day', avgPrice: 50000 }
        ]
    },
    seasonal: {
        name: 'Улирлын',
        icon: '❄️',
        jobs: [
            { id: 'snow_removal', name: 'Цас цэвэрлэх', unit: 'per_hour', avgPrice: 15000 },
            { id: 'firewood', name: 'Түлээ бэлтгэх', unit: 'per_day', avgPrice: 70000 },
            { id: 'idesh_prep', name: 'Идэш бэлтгэх', unit: 'per_day', avgPrice: 60000 },
            { id: 'meat_processing', name: 'Мах боловсруулах', unit: 'per_animal', avgPrice: 50000 }
        ]
    }
};

// ============================================
// DATA STRUCTURES
// ============================================

interface GigListing {
    id: string;
    type: 'offer' | 'request';  // "I can do" vs "I need"
    userId: string;
    category: string;
    jobType: string;
    title: string;
    description: string;

    // Location
    aimag: string;
    soum?: string;

    // Timing
    availableFrom: string;
    availableTo: string;
    duration: number;       // Days

    // Pricing
    priceType: 'fixed' | 'negotiable' | 'per_unit';
    price: number;
    priceUnit?: string;

    // Experience
    yearsExperience?: number;
    completedJobs?: number;
    rating?: number;

    status: 'active' | 'filled' | 'expired';
}

interface GigApplication {
    id: string;
    listingId: string;
    applicantId: string;
    message: string;
    proposedPrice?: number;
    status: 'pending' | 'accepted' | 'rejected';
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Create a gig listing (offer or request)
 */
export async function createGigListing(
    listing: Omit<GigListing, 'id' | 'status'>
): Promise<{ success: boolean; listingId?: string }> {
    const { data, error } = await supabase
        .from('gig_listings')
        .insert({
            type: listing.type,
            user_id: listing.userId,
            category: listing.category,
            job_type: listing.jobType,
            title: listing.title,
            description: listing.description,
            aimag: listing.aimag,
            soum: listing.soum,
            available_from: listing.availableFrom,
            available_to: listing.availableTo,
            duration: listing.duration,
            price_type: listing.priceType,
            price: listing.price,
            price_unit: listing.priceUnit,
            years_experience: listing.yearsExperience,
            status: 'active',
            created_at: new Date().toISOString()
        })
        .select('id')
        .single();

    return {
        success: !error,
        listingId: data?.id
    };
}

/**
 * Search for gig workers or jobs
 */
export async function searchGigs(
    filters: {
        type?: 'offer' | 'request';
        category?: string;
        jobType?: string;
        aimag?: string;
        soum?: string;
        dateFrom?: string;
        dateTo?: string;
        maxPrice?: number;
    }
): Promise<GigListing[]> {
    let query = supabase
        .from('gig_listings')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

    if (filters.type) query = query.eq('type', filters.type);
    if (filters.category) query = query.eq('category', filters.category);
    if (filters.jobType) query = query.eq('job_type', filters.jobType);
    if (filters.aimag) query = query.eq('aimag', filters.aimag);
    if (filters.soum) query = query.eq('soum', filters.soum);
    if (filters.dateFrom) query = query.gte('available_from', filters.dateFrom);
    if (filters.dateTo) query = query.lte('available_to', filters.dateTo);
    if (filters.maxPrice) query = query.lte('price', filters.maxPrice);

    const { data } = await query.limit(50);

    return (data || []).map(d => ({
        id: d.id,
        type: d.type,
        userId: d.user_id,
        category: d.category,
        jobType: d.job_type,
        title: d.title,
        description: d.description,
        aimag: d.aimag,
        soum: d.soum,
        availableFrom: d.available_from,
        availableTo: d.available_to,
        duration: d.duration,
        priceType: d.price_type,
        price: d.price,
        priceUnit: d.price_unit,
        yearsExperience: d.years_experience,
        completedJobs: d.completed_jobs,
        rating: d.rating,
        status: d.status
    }));
}

/**
 * Apply to a gig
 */
export async function applyToGig(
    listingId: string,
    applicantId: string,
    message: string,
    proposedPrice?: number
): Promise<{ success: boolean }> {
    const { error } = await supabase
        .from('gig_applications')
        .insert({
            listing_id: listingId,
            applicant_id: applicantId,
            message,
            proposed_price: proposedPrice,
            status: 'pending',
            created_at: new Date().toISOString()
        });

    // Notify listing owner
    if (!error) {
        const { data: listing } = await supabase
            .from('gig_listings')
            .select('user_id, title')
            .eq('id', listingId)
            .single();

        if (listing) {
            await supabase.from('notifications').insert({
                user_id: listing.user_id,
                type: 'gig_application',
                title: '🔨 Шинэ өргөдөл ирлээ',
                message: `"${listing.title}" зарт хүн хариу илгээлээ`,
                gig_listing_id: listingId
            });
        }
    }

    return { success: !error };
}

/**
 * Accept/Reject application
 */
export async function respondToApplication(
    applicationId: string,
    listingOwnerId: string,
    status: 'accepted' | 'rejected'
): Promise<{ success: boolean }> {
    // Verify ownership
    const { data: app } = await supabase
        .from('gig_applications')
        .select('*, gig_listings!inner(user_id)')
        .eq('id', applicationId)
        .single();

    if (!app || (app.gig_listings as any).user_id !== listingOwnerId) {
        return { success: false };
    }

    // Update status
    await supabase
        .from('gig_applications')
        .update({ status })
        .eq('id', applicationId);

    // If accepted, mark listing as filled
    if (status === 'accepted') {
        await supabase
            .from('gig_listings')
            .update({ status: 'filled' })
            .eq('id', app.listing_id);
    }

    // Notify applicant
    await supabase.from('notifications').insert({
        user_id: app.applicant_id,
        type: 'gig_response',
        title: status === 'accepted' ? '✅ Өргөдөл зөвшөөрөгдлөө!' : '❌ Өргөдөл татгалзагдлаа',
        message: status === 'accepted'
            ? 'Ажил олгогчтой холбогдож ажлаа эхлүүлнэ үү!'
            : 'Өөр ажил хайж үзээрэй',
        gig_listing_id: app.listing_id
    });

    return { success: true };
}

/**
 * Complete a gig and rate
 */
export async function completeGig(
    listingId: string,
    completedById: string,
    rating: number,
    review?: string
): Promise<{ success: boolean }> {
    const { data: listing } = await supabase
        .from('gig_listings')
        .select('*')
        .eq('id', listingId)
        .single();

    if (!listing) return { success: false };

    // Record completion
    await supabase.from('gig_completions').insert({
        listing_id: listingId,
        worker_id: listing.type === 'request' ? completedById : listing.user_id,
        employer_id: listing.type === 'request' ? listing.user_id : completedById,
        rating,
        review,
        completed_at: new Date().toISOString()
    });

    // Update worker's stats
    const workerId = listing.type === 'request' ? completedById : listing.user_id;
    await supabase.rpc('update_worker_stats', {
        p_user_id: workerId,
        p_rating: rating
    });

    return { success: true };
}

// ============================================
// SEASONAL LABOR MATCHING
// ============================================

/**
 * Get seasonal job suggestions based on time of year
 */
export function getSeasonalJobSuggestions(): {
    category: string;
    jobs: string[];
    urgency: 'high' | 'medium' | 'low';
}[] {
    const month = new Date().getMonth() + 1;

    if (month >= 6 && month <= 8) {
        // Summer: Hay season
        return [
            { category: 'farming', jobs: ['hay_harvest', 'plowing'], urgency: 'high' },
            { category: 'livestock', jobs: ['sheep_shearing', 'milking'], urgency: 'high' }
        ];
    } else if (month >= 9 && month <= 10) {
        // Fall: Harvest and meat prep
        return [
            { category: 'farming', jobs: ['harvesting'], urgency: 'high' },
            { category: 'seasonal', jobs: ['idesh_prep', 'meat_processing'], urgency: 'high' }
        ];
    } else if (month >= 11 || month <= 2) {
        // Winter: Heating prep
        return [
            { category: 'seasonal', jobs: ['firewood', 'snow_removal'], urgency: 'high' },
            { category: 'domestic', jobs: ['eldercare'], urgency: 'medium' }
        ];
    } else {
        // Spring: Prep for summer
        return [
            { category: 'farming', jobs: ['plowing', 'planting'], urgency: 'medium' },
            { category: 'construction', jobs: ['fence_building'], urgency: 'medium' }
        ];
    }
}

/**
 * Get worker leaderboard for an area
 */
export async function getTopWorkers(
    aimag: string,
    category?: string
): Promise<Array<{
    userId: string;
    name: string;
    completedJobs: number;
    rating: number;
    specialty: string;
}>> {
    let query = supabase
        .from('worker_stats')
        .select('*, profiles!inner(name)')
        .eq('aimag', aimag)
        .order('rating', { ascending: false })
        .limit(10);

    if (category) {
        query = query.eq('main_category', category);
    }

    const { data } = await query;

    return (data || []).map(w => ({
        userId: w.user_id,
        name: (w.profiles as any)?.name || 'Ажилчин',
        completedJobs: w.completed_jobs,
        rating: w.average_rating,
        specialty: w.main_category
    }));
}
