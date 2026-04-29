export interface Family {
  id: number
  family_name: string
  primary_contact_first_name: string
  primary_contact_last_name:  string
  primary_contact_name: string   // computed: first + last
  email: string
  phone: string
  address: string | null
  pco_sync_enabled: boolean
  pco_last_synced_at: string | null
  children: Child[]
}

export interface Child {
  id: number
  public_id: string             // stable UUID — cross-gem identity key, no PCO required
  family_id: number
  first_name: string
  last_name: string
  full_name: string
  birthdate: string | null
  grade: number | null          // PCO integer: 0=K, 1–12
  grade_display: string | null  // human label: "K", "1st", …
  notes: string | null
  age: number | null
}

export interface Event {
  id: number
  title: string
  description: string | null
  location: string | null
  event_date: string
  age_min: number | null
  age_max: number | null
  capacity: number | null
  spots_remaining: number | null
  full: boolean
  pco_source: "calendar" | "check_ins" | null
}

export interface EventsPage {
  events: Event[]
  meta: { total_count: number; current_page: number; total_pages: number; per_page: number }
}

export interface Registration {
  id: number
  family_id: number
  event_id: number
  child_id: number
  synced_to_pco: boolean
  event: Event
  child: Child
}

export interface ApiError {
  error: string
  code: string
}
