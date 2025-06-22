/* Using Postgres DB, hosted on Prisma (https://console.prisma.io) */
/* Project: Madhuram, DB: dev */

-- Common Trigger function to auto-update 'updated_at' column on row change on any table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

/* 
  TABLE #1: system_roles
*/
CREATE TABLE IF NOT EXISTS system_roles (
  id SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(20) NOT NULL,
  hierarchy_level SMALLINT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Drop trigger for updated_at, if already exists (prevent redefinition errors)
DROP TRIGGER IF EXISTS set_updated_at_system_roles ON system_roles;

-- Create trigger binding for updated_at column
CREATE TRIGGER set_updated_at_system_roles
BEFORE UPDATE ON system_roles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

/* 
  TABLE #2: spiritual_levels
*/
CREATE TABLE IF NOT EXISTS spiritual_levels (
  id SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title_male VARCHAR(20) NOT NULL,
  title_female VARCHAR(20) NOT NULL,
  title_other VARCHAR(20) NOT NULL,
  hierarchy_level SMALLINT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Drop trigger for updated_at, if already exists (prevent redefinition errors)
DROP TRIGGER IF EXISTS set_updated_at_spiritual_levels ON spiritual_levels;

-- Create trigger binding for updated_at column
CREATE TRIGGER set_updated_at_spiritual_levels
BEFORE UPDATE ON spiritual_levels
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

/* 
  TABLE #3: campaigns: to run campaigns like janmashtami, new temple, etc. so as to identify 
            what users got acquired and what donaitons were made for a specific cause.
*/
CREATE TABLE IF NOT EXISTS campaigns (
  id SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(40) NOT NULL, 
  description TEXT NOT NULL,
  start_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  end_at TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '1 year'),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Drop trigger for updated_at, if already exists (prevent redefinition errors)
DROP TRIGGER IF EXISTS set_updated_at_campaigns ON campaigns;

-- Create trigger binding for updated_at column
CREATE TRIGGER set_updated_at_campaigns
BEFORE UPDATE ON campaigns
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

/* 
  TABLE #4: devotees
*/
-- 1. Define required ENUM types
DO $$ BEGIN
  CREATE TYPE devotees_status_enum AS ENUM ('active', 'inactive');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE devotees_gender_enum AS ENUM ('male', 'female', 'other');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Table creation
CREATE TABLE IF NOT EXISTS devotees (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(100),
  initiated_name VARCHAR(100),
  status devotees_status_enum NOT NULL DEFAULT 'active',
  phone VARCHAR(21) UNIQUE,
  phone_verified BOOLEAN NOT NULL DEFAULT false,
  whatsapp_consent BOOLEAN NOT NULL DEFAULT false,
  phone_whatsapp VARCHAR(21),
  email VARCHAR(255) UNIQUE,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  system_role_id SMALLINT NOT NULL DEFAULT 1,         --FK from "systems_roles" tables. Default in "member"
  spiritual_level_id SMALLINT NOT NULL DEFAULT 1,     --FK from "spiritual_levels" tables. Default is "dev/ devi"
  source_id INTEGER NOT NULL DEFAULT 1,               --FK from "campaigns" tables. Default is "Self Registration"
  referred_by_id INTEGER DEFAULT NULL,                --Self Referential FK
  counsellor_id INTEGER DEFAULT NULL,                 --Self Referential FK
  gender devotees_gender_enum,
  dob DATE,
  occupation VARCHAR(21),
  occupation_position VARCHAR(100),
  tax_80g_required BOOLEAN NOT NULL DEFAULT false,
  tax_pan VARCHAR(10),
  skills JSON,
  temple_memberships JSON,
  class_memberships JSON,
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  address_society VARCHAR(255),
  address_area VARCHAR(255),
  address_gmap_url TEXT,
  address_city VARCHAR(100),
  address_state VARCHAR(100),
  address_pincode VARCHAR(20),
  address_country VARCHAR(100),
  language_preference VARCHAR(21),
  marital_status BOOLEAN,
  spouse_name VARCHAR(100),
  spouse_dob DATE,
  spouse_marriage_anniversary DATE,
  parents_father_name VARCHAR(100),
  parents_father_dob DATE,
  parents_mother_name VARCHAR(100),
  parents_mother_dob DATE,
  parents_marriage_anniversary DATE,
  children_1_name VARCHAR(100),
  children_1_dob DATE,
  children_2_name VARCHAR(100),
  children_2_dob DATE,
  children_3_name VARCHAR(100),
  children_3_dob DATE,
  children_4_name VARCHAR(100),
  children_4_dob DATE,
  internal_note TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (system_role_id) REFERENCES system_roles(id),
  FOREIGN KEY (spiritual_level_id) REFERENCES spiritual_levels(id),
  FOREIGN KEY (source_id) REFERENCES campaigns(id)
);

-- Self Referential Foreign Key for counsellor_id
ALTER TABLE devotees
ADD CONSTRAINT fk_counsellor
  FOREIGN KEY (counsellor_id) REFERENCES devotees(id)
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- Self Referential Foreign Key for referred_by
ALTER TABLE devotees
ADD CONSTRAINT fk_referred_by
  FOREIGN KEY (referred_by_id) REFERENCES devotees(id)
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- Drop trigger for updated_at, if already exists (prevent redefinition errors)
DROP TRIGGER IF EXISTS set_updated_at_devotees ON devotees;

-- Create trigger binding for updated_at column
CREATE TRIGGER set_updated_at_devotees
BEFORE UPDATE ON devotees
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

/* 
  TABLE #5: donations
*/
CREATE TABLE IF NOT EXISTS donations (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  donation_receipt_number VARCHAR(100) UNIQUE,
  campaign_id INTEGER DEFAULT 2,      --FK from "campaigns" tables. Default is "Bulk Upload"
  name VARCHAR(100),
  phone VARCHAR(21),
  payment_mode VARCHAR(20) DEFAULT NULL,
  amount INTEGER NOT NULL CHECK (amount >= 0),
  date DATE DEFAULT CURRENT_DATE,
  internal_note TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
);

-- Drop trigger for updated_at, if already exists (prevent redefinition errors)
DROP TRIGGER IF EXISTS set_updated_at_donations ON donations;

-- Create trigger binding for updated_at column
CREATE TRIGGER set_updated_at_donations
BEFORE UPDATE ON donations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

/* 
  Pending Alter of Tables which refer to devotees table for storing `created_by` and `updated_by`
*/
-- campaigns
ALTER TABLE campaigns
ADD COLUMN created_by INTEGER REFERENCES devotees(id) DEFAULT NULL,
ADD COLUMN updated_by INTEGER REFERENCES devotees(id) DEFAULT NULL

-- devotees (self referential)
ALTER TABLE devotees
ADD COLUMN created_by INTEGER REFERENCES devotees(id) DEFAULT NULL,
ADD COLUMN updated_by INTEGER REFERENCES devotees(id) DEFAULT NULL

-- donations
ALTER TABLE donations
ADD COLUMN created_by INTEGER REFERENCES devotees(id) DEFAULT NULL,
ADD COLUMN updated_by INTEGER REFERENCES devotees(id) DEFAULT NULL