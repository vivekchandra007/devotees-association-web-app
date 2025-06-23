import { z } from 'zod';

export const devoteeBulkInsertSchema = z.object({
  phone: z.string().max(21),
  phone_whatsapp: z.string().max(21),
  status: z.string(),
  source_id: z.number().int(),
  name: z.string().max(100).nullable().optional(),
  dob: z.date().nullable().optional(),
  tax_pan: z.string().max(10).nullable().optional(),
  address_line1: z.string().max(255).nullable().optional(),
  address_line2: z.string().max(255).nullable().optional(),
  address_area: z.string().max(255).nullable().optional(),
  address_city: z.string().max(100).nullable().optional(),
  address_state: z.string().max(100).nullable().optional(),
  address_pincode: z.string().max(20).nullable().optional(),
  address_country: z.string().max(100).nullable().optional(),
  spouse_marriage_anniversary: z.date().nullable().optional(),
  created_by: z.number().int(),
  updated_by: z.number().int(),
});