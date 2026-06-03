export interface Module {
  id: string
  name: string
  description: string
  icon: string
  active: boolean
}

export interface ModulesResponse {
  modules: Module[]
}

export interface SettingsResponse {
  settings: Record<string, unknown>
}

export interface ApiResponse<T = unknown> {
  success?: boolean
  data?: T
  message?: string
  code?: string
}

export interface Review {
  author_name: string
  profile_photo_url?: string
  rating: number
  text: string
  relative_time_description: string
  time: number
}

export interface BusinessAddress {
  street: string
  city: string
  postal_code: string
  country: string
}

export interface BusinessHours {
  open: string
  close: string
  closed: boolean
}

export interface BusinessSettings {
  business_name: string
  business_type: string
  description: string
  phone: string
  email: string
  website: string
  address: BusinessAddress
  coordinates: { lat: string; lng: string }
  opening_hours: Record<string, BusinessHours>
  social_links: Record<string, string>
  google_maps_api_key: string
  enable_structured_data: boolean
}

export interface ReviewsSettings {
  google_place_id: string
  google_api_key: string
  display_style: string
  reviews_count: number
  min_rating: number
  show_rating: boolean
  show_date: boolean
  show_avatar: boolean
  cache_duration: number
  custom_css: string
}
