'use server'

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function createClient() {
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value, ...options })
                    } catch (error) {
                    }
                },
                remove(name: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value: '', ...options })
                    } catch (error) {
                    }
                },
            },
        }
    )
}

export async function reportProduct(productId: string, reason: string, description?: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Та нэвтэрсэн байх шаардлагатай.' }

    const { error } = await supabase.from('reports').insert({
        product_id: productId,
        reporter_id: user.id,
        reason,
        description
    })

    if (error) {
        console.error('Report error:', error)
        return { error: 'Алдаа гарлаа.' }
    }

    // Automated Moderation: Check report count
    const { count } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', productId)

    if (count && count >= 3) {
        // Suspend product
        await supabase
            .from('products')
            .update({ status: 'suspended' })
            .eq('id', productId)
    }

    revalidatePath(`/product/${productId}`)
    return { success: true }
}
