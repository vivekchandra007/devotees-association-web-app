import { z } from 'zod';

export const donationSchema = z.object({
  donation_receipt_number: z.string().max(100).nullable(),
  campaign_id: z.number().nullable().optional(),
  name: z.string().max(100).nullable(),
  phone: z.string().max(21).nullable(),
  payment_mode: z.string().max(20).nullable().optional(),
  amount: z.number().int(),
  date: z.string().nullable().optional(),
  internal_note: z.string().nullable().optional(),
  created_by: z.number().int(),
  updated_by: z.number().int(),
});