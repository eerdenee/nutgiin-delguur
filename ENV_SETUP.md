# =============================================
# NUTGIIN DELGUUR - Environment Variables Setup
# =============================================
# Copy this to .env.local and fill in your values

# Supabase (Backend)
# Get from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Cloudflare R2 (Image Storage)
# Get from: https://dash.cloudflare.com/?to=/:account/r2/overview
NEXT_PUBLIC_R2_PUBLIC_URL=https://images.yourdomain.com
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=nutgiin-images

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Nutgiin Delguur
