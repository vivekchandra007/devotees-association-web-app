import _ from "lodash";
import { Prisma } from '@prisma/client';

const devoteeFormDateFields = [ "dob", "spouse_dob", "spouse_marriage_anniversary", "parents_father_dob", "parents_mother_dob", 
    "parents_marriage_anniversary", "children_1_dob", "children_2_dob", "children_3_dob", "children_4_dob"];

type Devotee = Prisma.devoteesGetPayload<{
  include: {
    system_roles: {
      select: {
        name: true;
      };
    },
    spiritual_levels: {
      select: {
        title_male: true,
        title_female: true,
        title_other: true
      };
    },
    devotees: {
      select: {
        id: true,
        name: true
      }
    }
  };
}>;

export function convertDateStringIntoDateObject(body: Devotee) {
  for (const key in body) {
      if (devoteeFormDateFields.includes(key) && _.get(body,key)) {
        _.set(body, key, new Date(_.get(body,key)));
      }
  }
  return body;
}

export function convertDateObjectIntoDateString(devoteeDetails: Devotee) {
    for (const key in devoteeDetails) {
        if (devoteeFormDateFields.includes(key) && _.get(devoteeDetails,key)) {
            _.set(devoteeDetails, key, _.get(devoteeDetails,key).toLocaleDateString('en-CA'));
        }
    }
    return devoteeDetails;
}