import { z } from 'zod';

export const donationSchema = z.object({
  id: z.string(),
  donation_receipt_number: z.string().max(100).nullable(),
  name: z.string().max(100).nullable(),
  phone: z.string().max(21).nullable(),
  cost_center: z.string().max(100).nullable(),
  scheme_name: z.string().max(100).nullable(),
  payment_mode: z.string().max(20).nullable(),
  amount: z.number().int(),
  instrument_number: z.string().max(100).nullable(),
  collected_by: z.string().max(100).nullable(),
  status: z.string().max(21).nullable(),
  date: z.date().nullable(),
  internal_note: z.string().nullable(),
});