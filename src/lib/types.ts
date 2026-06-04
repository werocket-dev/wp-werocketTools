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

export type ReviewTemplate = 'minimal' | 'classic' | 'card' | 'quote' | 'google'
export type Breakpoint = 'desktop' | 'tablet' | 'mobile'
export type ResponsiveValue<T> = { desktop: T; tablet: T; mobile: T }
export type CardShadow = 'none' | 'subtle' | 'medium' | 'strong'

export interface ReviewsSettings {
  google_place_id: string
  google_api_key: string
  template: ReviewTemplate
  display_style: string
  reviews_count: number
  min_rating: number
  show_rating: boolean
  show_date: boolean
  show_avatar: boolean
  cache_duration: number
  custom_css: string

  // Per-breakpoint
  grid_columns: ResponsiveValue<number>
  grid_gap: ResponsiveValue<number>
  card_padding: ResponsiveValue<number>
  carousel_slides: ResponsiveValue<number>

  // Globaux
  card_radius: number
  card_shadow: CardShadow

  // Carrousel
  carousel_autoplay: boolean
  carousel_autoplay_speed: number
  carousel_loop: boolean
  carousel_show_arrows: boolean
  carousel_show_dots: boolean
}

export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

export interface CCTimeSlot {
  start: string
  end: string
}

export interface CCDaySchedule {
  enabled: boolean
  slots: CCTimeSlot[]
}

export type CCSchedule = Record<DayKey, CCDaySchedule>

export interface ClickCollectLocation {
  id: string
  name: string
  address: string
  phone: string
  email: string
  enabled: boolean
  cost: number
  schedule: CCSchedule
  closed_dates: string[]
}

export interface CompanyInfoSettings {
  siren: string
  siret: string
  name: string
  commercial_name: string
  legal_form: string
  capital: string
  rcs: string
  vat: string
  ape_code: string
  ape_label: string
  director: string
  creation_date: string
  street: string
  postal_code: string
  city: string
  country: string
  phone: string
  email: string
  website: string
  logo_id: number
  /** Computed côté serveur depuis logo_id — read-only, pas dans le payload de save */
  logo_url?: string
  legal_mentions: string
  legal_privacy: string
  legal_cgv: string
}

export interface CompanyVariable {
  key: string
  label: string
  group: string
}

export interface ClickCollectSettings {
  method_title: string
  method_description: string
  cost: number
  tax_status: 'none' | 'taxable'
  enable_lead_time: boolean
  min_lead_time_hours: number
  max_days_ahead: number
  require_time_slot: boolean
  slot_interval_minutes: number
  block_unavailable: boolean
  show_in_cart: boolean
  show_in_order: boolean
  show_in_emails: boolean
  instructions: string
  accent_color: string
  accent_text_color: string
  panel_bg_color: string
  panel_border_color: string
  text_color: string
  locations: ClickCollectLocation[]
}

export interface RetractationSettings {
  page_title: string
  endpoint_slug: string
  merchant_notify: boolean
  merchant_email: string
  show_legal_notice: boolean
  frontend_color: string
  email_color: string
  email_bg_color: string
  email_surface_color: string
  email_logo_id: number
  email_logo_url: string
}

export type CookiePosition = 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right' | 'center'
export type CookieTheme = 'light' | 'dark' | 'custom'
export type StorageMethod = 'cookie' | 'localStorage'
export type ConsentValue = 'granted' | 'denied'

export interface CookieService {
  name: string
  title: string
  description: string
  purposes: string[]
  cookies: string[]
  required: boolean
  default: boolean
  opt_out: boolean
  only_once: boolean
  enabled: boolean
}

export interface CookiePurpose {
  title: string
  description: string
}

export interface CookiesSettings {
  cookie_name: string
  cookie_expires_days: number
  cookie_domain: string
  storage_method: StorageMethod
  must_consent: boolean
  accept_all: boolean
  hide_decline_all: boolean
  hide_learn_more: boolean
  hide_toggle_all: boolean
  default: boolean
  required: boolean
  opt_out: boolean
  group_by_purpose: boolean
  theme: CookieTheme
  position: CookiePosition
  modal_trigger_position: string
  notice_as_modal: boolean
  flip_buttons: boolean
  html_texts: boolean
  color_primary: string
  color_primary_hover: string
  color_background: string
  color_text: string
  color_text_secondary: string
  color_border: string
  color_toggle_on: string
  color_toggle_off: string
  texts: Record<string, string>
  gcm_enabled: boolean
  gcm_default_analytics: ConsentValue
  gcm_default_ad_storage: ConsentValue
  gcm_default_ad_user_data: ConsentValue
  gcm_default_ad_personalization: ConsentValue
  gcm_default_functionality: ConsentValue
  gcm_default_security: ConsentValue
  gcm_wait_for_update: number
  gcm_region: string
  services: CookieService[]
  purposes: Record<string, CookiePurpose>
  additional_class: string
  custom_css: string
  callback_on_accept: string
  callback_on_decline: string
}

// ──────────────────────────────────────────────────────────
// Cookie Scanner
// ──────────────────────────────────────────────────────────

export interface ScanStartResponse {
  id: string
  token: string
  urls: string[]
}

export interface ScannedCookie {
  name: string
  domains: string[]
  value_sample: string
  first_seen_url: string
  occurrences: number
  service_id: string | null
  service_title: string | null
  provider: string | null
  purpose: 'necessary' | 'analytics' | 'marketing' | 'preferences' | null
  required: boolean
  classified: boolean
  is_new: boolean
  in_settings: boolean
}

export interface ScannedStorageItem {
  kind: 'localStorage' | 'sessionStorage'
  key: string
  value_sample: string
  first_seen_url: string
  service_id: string | null
  service_title: string | null
  purpose: string | null
  classified: boolean
}

export interface ScannedDomain {
  domain: string
  first_seen_url: string
  service_id: string | null
  service_title: string | null
  purpose: string | null
  classified: boolean
  cookie_seen: boolean
}

export interface ScanSummary {
  urls_scanned: number
  urls_total: number
  cookies_total: number
  cookies_new: number
  cookies_unknown: number
  by_purpose: { necessary: number; analytics: number; marketing: number; preferences: number; unclassified: number }
  services_found: number
  third_party_domains: number
}

export interface ScanFinalizeResponse {
  id: string
  summary: ScanSummary
  cookies: ScannedCookie[]
  storage: ScannedStorageItem[]
  domains: ScannedDomain[]
}

export interface ScanHistoryItem {
  id: string
  started_at: number
  completed_at: number | null
  status: 'running' | 'completed' | 'failed'
  urls_count: number
  cookies_count: number
  new_count: number
}

export interface ScanImportResponse {
  imported: string[]
  updated: string[]
  skipped: string[]
}

export interface ScanProgressItem {
  url: string
  status: 'pending' | 'visiting' | 'done' | 'error'
  cookies_found?: number
  error?: string
}
