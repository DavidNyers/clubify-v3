import { z } from 'zod'

// ============================================
// AUTH
// ============================================

export const loginSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(8, 'Passwort mind. 8 Zeichen'),
})

export const registerSchema = z.object({
  full_name: z.string().min(2, 'Name mind. 2 Zeichen').max(100),
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(8, 'Passwort mind. 8 Zeichen'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwörter stimmen nicht überein',
  path: ['confirmPassword'],
})

// ============================================
// VENUES
// ============================================

export const createClubSchema = z.object({
  name: z.string().min(2, 'Name mind. 2 Zeichen').max(100),
  description: z.string().max(2000).optional(),
  address: z.string().min(5, 'Adresse erforderlich'),
  city: z.string().min(2, 'Stadt erforderlich'),
  country: z.string().default('AT'),
  capacity: z.number().int().positive().max(50000).optional(),
  price_range: z.number().int().min(1).max(4).optional(),
  music_genres: z.array(z.string()).optional(),
  dress_code: z.string().max(200).optional(),
  website: z.string().url().optional().or(z.literal('')),
  instagram: z.string().max(100).optional(),
  phone: z.string().max(30).optional(),
})

export const createBarSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(2000).optional(),
  address: z.string().min(5),
  city: z.string().min(2),
  country: z.string().default('AT'),
  capacity: z.number().int().positive().max(5000).optional(),
  price_range: z.number().int().min(1).max(4).optional(),
  drink_types: z.array(z.string()).optional(),
  website: z.string().url().optional().or(z.literal('')),
  instagram: z.string().max(100).optional(),
  phone: z.string().max(30).optional(),
})

export const happyHourSchema = z.object({
  day_of_week: z.array(z.number().int().min(0).max(6)).min(1),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM'),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM'),
  discount_percent: z.number().int().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
})

// ============================================
// EVENTS
// ============================================

export const createEventSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().max(3000).optional(),
  date: z.string().datetime(),
  doors_open: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  max_guests: z.number().int().positive(),
  ticket_price: z.number().nonnegative().max(9999),
  currency: z.string().length(3).default('EUR'),
  lineup: z.array(z.string()).optional(),
  genre: z.array(z.string()).optional(),
  age_restriction: z.number().int().min(0).max(21).default(18),
  dress_code: z.string().max(200).optional(),
  club_id: z.string().uuid().optional(),
  bar_id: z.string().uuid().optional(),
})

// ============================================
// BOOKINGS
// ============================================

export const createBookingSchema = z.object({
  event_id: z.string().uuid().optional(),
  club_id: z.string().uuid().optional(),
  bar_id: z.string().uuid().optional(),
  guests: z.number().int().min(1).max(50),
  notes: z.string().max(500).optional(),
  reservation_date: z.string().datetime().optional(),
})

// ============================================
// REVIEWS
// ============================================

export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  text: z.string().min(10, 'Bewertung mind. 10 Zeichen').max(2000),
  club_id: z.string().uuid().optional(),
  bar_id: z.string().uuid().optional(),
  event_id: z.string().uuid().optional(),
})

// ============================================
// PROFILE
// ============================================

export const updateProfileSchema = z.object({
  full_name: z.string().min(2).max(100),
  bio: z.string().max(500).optional(),
  phone: z.string().max(30).optional(),
  preferred_language: z.enum(['de', 'en']),
  theme: z.enum(['dark', 'light']),
})

// ============================================
// TICKET VALIDATION
// ============================================

export const ticketValidationSchema = z.object({
  qr_payload: z.string().min(10),
  event_id: z.string().uuid().optional(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type CreateClubInput = z.infer<typeof createClubSchema>
export type CreateBarInput = z.infer<typeof createBarSchema>
export type HappyHourInput = z.infer<typeof happyHourSchema>
export type CreateEventInput = z.infer<typeof createEventSchema>
export type CreateBookingInput = z.infer<typeof createBookingSchema>
export type CreateReviewInput = z.infer<typeof createReviewSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type TicketValidationInput = z.infer<typeof ticketValidationSchema>
