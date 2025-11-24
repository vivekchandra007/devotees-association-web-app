import _ from "lodash";
import { Prisma } from '@prisma/client';

const devoteeFormDateFields = ["dob", "spouse_dob", "spouse_marriage_anniversary", "parents_father_dob", "parents_mother_dob",
  "parents_marriage_anniversary", "children_1_dob", "children_2_dob", "children_3_dob", "children_4_dob"];

export type Devotee = Prisma.devoteesGetPayload<{
  include: {
    system_role_id_ref_value: {
      select: {
        name: true,
      };
    },
    spiritual_level_id_ref_value: {
      select: {
        title_male: true,
        title_female: true,
        title_other: true
      };
    },
    source_id_ref_value: {
      select: {
        name: true,
        description: true,
      }
    }
    counsellor_id_ref_value: {
      select: {
        id: true,
        name: true
      }
    },
    referred_by_id_ref_value: {
      select: {
        id: true,
        name: true
      }
    }
  };
}>;

export function convertDateStringIntoDateObject(body: Devotee) {
  for (const key in body) {
    if (devoteeFormDateFields.includes(key) && _.get(body, key)) {
      _.set(body, key, new Date(_.get(body, key)));
    }
  }
  return body;
}

export function convertDateObjectIntoDateString(devoteeDetails: Devotee) {
  for (const key in devoteeDetails) {
    if (devoteeFormDateFields.includes(key) && _.get(devoteeDetails, key)) {
      _.set(devoteeDetails, key, _.get(devoteeDetails, key).toLocaleDateString('en-CA'));
    }
  }
  return devoteeDetails;
}

export function parseDateFromStringddmmyyyy(dateStr: string): Date | null {
  const [day, month, year] = dateStr.split('/').map(Number);

  if (!day || !month || !year) return null;

  // Month is 0-based in JavaScript Date
  return new Date(Date.UTC(year, month - 1, day));
}

export function formatDateIntoStringddmmyyyy(date: Date): string | null {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

export function formatDateTimeIntoReadableString(date: Date): string | null {
  const hours = date.getHours();
  const minutes = date.getMinutes();

  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hh = hours % 12 || 12; // 0 becomes 12
  const mm = minutes.toString().padStart(2, '0');

  const dd = date.getDate().toString().padStart(2, '0');
  const mo = (date.getMonth() + 1).toString().padStart(2, '0');
  const yyyy = date.getFullYear();

  return `${hh}:${mm} ${ampm} ${dd}/${mo}/${yyyy}`;
}