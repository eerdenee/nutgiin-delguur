/**
 * DATA MOAT - Hyper-Local Information
 * 
 * Problem: Big players (Unegui) can copy your "Soum" feature in 1 day.
 * Solution: Collect data that ONLY locals know - bag names, driver schedules,
 *           local shop locations. This is your uncopyable moat.
 */

import { supabase } from './supabase';

// ============================================
// BAG (Village/Neighborhood) DATA
// ============================================

interface BagInfo {
    id: string;
    soumId: string;
    name: string;
    population?: number;
    centerLocation?: { lat: number; lng: number };
    nearestShop?: string;
    hasInternet: boolean;
    hasCellular: boolean;
    addedBy: string;
    verifiedBy?: string;
}

/**
 * Add bag information (community-sourced)
 */
export async function addBagInfo(
    bag: Omit<BagInfo, 'id'>
): Promise<{ success: boolean; bagId?: string }> {
    const { data, error } = await supabase
        .from('bags')
        .insert({
            soum_id: bag.soumId,
            name: bag.name,
            population: bag.population,
            center_lat: bag.centerLocation?.lat,
            center_lng: bag.centerLocation?.lng,
            nearest_shop: bag.nearestShop,
            has_internet: bag.hasInternet,
            has_cellular: bag.hasCellular,
            added_by: bag.addedBy,
            created_at: new Date().toISOString()
        })
        .select('id')
        .single();

    if (error) {
        return { success: false };
    }

    return { success: true, bagId: data?.id };
}

// ============================================
// LOCAL DRIVERS (UNIQUE DATA!)
// ============================================

interface LocalDriver {
    id: string;
    name: string;
    phone: string;
    fromSoum: string;
    toCity: string; // Usually "Улаанбаатар"
    schedule: {
        departDays: string[]; // ['Даваа', 'Лхагва', 'Баасан']
        departTime: string;   // "08:00"
        returnDays: string[];
        returnTime: string;
    };
    vehicleType: 'sedan' | 'suv' | 'van' | 'bus' | 'truck';
    pricePerPerson: number;
    canCarryGoods: boolean;
    goodsPrice?: number;
    rating: number;
    totalTrips: number;
    addedBy: string;
    verifiedBy?: string;
}

/**
 * Add local driver information
 * This is GOLD - big sites will NEVER have this data
 */
export async function addLocalDriver(
    driver: Omit<LocalDriver, 'id' | 'rating' | 'totalTrips'>
): Promise<{ success: boolean; driverId?: string }> {
    const { data, error } = await supabase
        .from('local_drivers')
        .insert({
            name: driver.name,
            phone: driver.phone,
            from_soum: driver.fromSoum,
            to_city: driver.toCity,
            depart_days: driver.schedule.departDays,
            depart_time: driver.schedule.departTime,
            return_days: driver.schedule.returnDays,
            return_time: driver.schedule.returnTime,
            vehicle_type: driver.vehicleType,
            price_per_person: driver.pricePerPerson,
            can_carry_goods: driver.canCarryGoods,
            goods_price: driver.goodsPrice,
            rating: 0,
            total_trips: 0,
            added_by: driver.addedBy,
            created_at: new Date().toISOString()
        })
        .select('id')
        .single();

    if (error) {
        return { success: false };
    }

    return { success: true, driverId: data?.id };
}

/**
 * Find drivers for a route
 */
export async function findDrivers(
    fromSoum: string,
    toCity: string = 'Улаанбаатар',
    departDay?: string
): Promise<LocalDriver[]> {
    let query = supabase
        .from('local_drivers')
        .select('*')
        .eq('from_soum', fromSoum)
        .eq('to_city', toCity)
        .eq('is_active', true);

    if (departDay) {
        query = query.contains('depart_days', [departDay]);
    }

    const { data } = await query.order('rating', { ascending: false });

    return (data || []).map(d => ({
        id: d.id,
        name: d.name,
        phone: d.phone,
        fromSoum: d.from_soum,
        toCity: d.to_city,
        schedule: {
            departDays: d.depart_days,
            departTime: d.depart_time,
            returnDays: d.return_days,
            returnTime: d.return_time
        },
        vehicleType: d.vehicle_type,
        pricePerPerson: d.price_per_person,
        canCarryGoods: d.can_carry_goods,
        goodsPrice: d.goods_price,
        rating: d.rating,
        totalTrips: d.total_trips,
        addedBy: d.added_by,
        verifiedBy: d.verified_by
    }));
}

// ============================================
// LOCAL SHOPS/PICKUP POINTS
// ============================================

interface LocalShop {
    id: string;
    soumId: string;
    bagId?: string;
    name: string;
    type: 'grocery' | 'pharmacy' | 'hardware' | 'clothes' | 'other';
    ownerName?: string;
    phone?: string;
    location?: { lat: number; lng: number };
    canReceivePackages: boolean; // Can act as pickup point
    openHours?: string;
    addedBy: string;
}

/**
 * Add local shop as potential pickup point
 */
export async function addLocalShop(
    shop: Omit<LocalShop, 'id'>
): Promise<{ success: boolean }> {
    const { error } = await supabase
        .from('local_shops')
        .insert({
            soum_id: shop.soumId,
            bag_id: shop.bagId,
            name: shop.name,
            type: shop.type,
            owner_name: shop.ownerName,
            phone: shop.phone,
            lat: shop.location?.lat,
            lng: shop.location?.lng,
            can_receive_packages: shop.canReceivePackages,
            open_hours: shop.openHours,
            added_by: shop.addedBy,
            created_at: new Date().toISOString()
        });

    return { success: !error };
}

/**
 * Find pickup points in a soum
 */
export async function findPickupPoints(soumId: string): Promise<LocalShop[]> {
    const { data } = await supabase
        .from('local_shops')
        .select('*')
        .eq('soum_id', soumId)
        .eq('can_receive_packages', true);

    return (data || []).map(s => ({
        id: s.id,
        soumId: s.soum_id,
        bagId: s.bag_id,
        name: s.name,
        type: s.type,
        ownerName: s.owner_name,
        phone: s.phone,
        location: s.lat && s.lng ? { lat: s.lat, lng: s.lng } : undefined,
        canReceivePackages: s.can_receive_packages,
        openHours: s.open_hours,
        addedBy: s.added_by
    }));
}

// ============================================
// LOCAL EVENTS CALENDAR
// ============================================

interface LocalEvent {
    id: string;
    soumId: string;
    title: string;
    type: 'market' | 'festival' | 'meeting' | 'other';
    date: string;
    time?: string;
    location?: string;
    description?: string;
    addedBy: string;
}

/**
 * Add local event (market day, naadam, etc.)
 */
export async function addLocalEvent(
    event: Omit<LocalEvent, 'id'>
): Promise<{ success: boolean }> {
    const { error } = await supabase
        .from('local_events')
        .insert({
            soum_id: event.soumId,
            title: event.title,
            type: event.type,
            event_date: event.date,
            event_time: event.time,
            location: event.location,
            description: event.description,
            added_by: event.addedBy,
            created_at: new Date().toISOString()
        });

    return { success: !error };
}

/**
 * Get upcoming events in a soum
 */
export async function getUpcomingEvents(soumId: string): Promise<LocalEvent[]> {
    const { data } = await supabase
        .from('local_events')
        .select('*')
        .eq('soum_id', soumId)
        .gte('event_date', new Date().toISOString().split('T')[0])
        .order('event_date', { ascending: true })
        .limit(10);

    return (data || []).map(e => ({
        id: e.id,
        soumId: e.soum_id,
        title: e.title,
        type: e.type,
        date: e.event_date,
        time: e.event_time,
        location: e.location,
        description: e.description,
        addedBy: e.added_by
    }));
}

// ============================================
// DATA MOAT METRICS
// ============================================

/**
 * Get data moat health for a soum
 * Shows how much unique local data we have
 */
export async function getDataMoatHealth(soumId: string): Promise<{
    score: number; // 0-100
    bags: number;
    drivers: number;
    shops: number;
    events: number;
    recommendations: string[];
}> {
    const [bags, drivers, shops, events] = await Promise.all([
        supabase.from('bags').select('*', { count: 'exact' }).eq('soum_id', soumId),
        supabase.from('local_drivers').select('*', { count: 'exact' }).eq('from_soum', soumId),
        supabase.from('local_shops').select('*', { count: 'exact' }).eq('soum_id', soumId),
        supabase.from('local_events').select('*', { count: 'exact' }).eq('soum_id', soumId)
    ]);

    const recommendations: string[] = [];
    let score = 0;

    // Bags
    const bagCount = bags.count || 0;
    score += Math.min(bagCount * 5, 25);
    if (bagCount === 0) recommendations.push('Багийн мэдээлэл нэмнэ үү');

    // Drivers
    const driverCount = drivers.count || 0;
    score += Math.min(driverCount * 10, 25);
    if (driverCount === 0) recommendations.push('Орон нутгийн жолоочийн мэдээлэл нэмнэ үү');

    // Shops
    const shopCount = shops.count || 0;
    score += Math.min(shopCount * 5, 25);
    if (shopCount === 0) recommendations.push('Дэлгүүрийн мэдээлэл нэмнэ үү');

    // Events
    const eventCount = events.count || 0;
    score += Math.min(eventCount * 5, 25);
    if (eventCount === 0) recommendations.push('Орон нутгийн арга хэмжээ нэмнэ үү');

    return {
        score,
        bags: bagCount,
        drivers: driverCount,
        shops: shopCount,
        events: eventCount,
        recommendations
    };
}
