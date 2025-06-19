/* Using Postgres DB, hosted on Prisma (https://console.prisma.io) */
/* Project: Madhuram, DB: dev */

-- Common Trigger function to auto-update 'updated_at' on row change on most tables
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

-- Drop if exists (prevent redefinition errors)
DROP TRIGGER IF EXISTS set_updated_at_system_roles ON system_roles;

-- Trigger binding for system_roles
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
DROP TRIGGER IF EXISTS set_updated_at_spiritual_levels ON spiritual_levels;
CREATE TRIGGER set_updated_at_spiritual_levels
BEFORE UPDATE ON spiritual_levels
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

/* 
  TABLE #3: devotees
*/
-- 1. ENUM types
DO $$ BEGIN
  CREATE TYPE status_enum AS ENUM ('active', 'inactive');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE gender_enum AS ENUM ('male', 'female', 'other');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Table creation
CREATE TABLE IF NOT EXISTS devotees (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  initiated_name VARCHAR(100),
  status status_enum NOT NULL,
  phone VARCHAR(21) UNIQUE,
  phone_verified BOOLEAN NOT NULL DEFAULT false,
  whatsapp_consent BOOLEAN NOT NULL DEFAULT false,
  phone_whatsapp VARCHAR(21),
  email VARCHAR(255) UNIQUE,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  role_id SMALLINT NOT NULL,
  spiritual_level SMALLINT NOT NULL,
  source VARCHAR(100) NOT NULL,
  referred_by INTEGER,
  counsellor_id INTEGER,
  gender gender_enum,
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
  marital_status BOOLEAN NOT NULL DEFAULT false,
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

  FOREIGN KEY (role_id) REFERENCES system_roles(id),
  FOREIGN KEY (spiritual_level) REFERENCES spiritual_levels(id)
);

-- Self Referential Foreign Key
ALTER TABLE devotees
ADD CONSTRAINT fk_counsellor
  FOREIGN KEY (counsellor_id) REFERENCES devotees(id)
  ON DELETE SET NULL
  ON UPDATE CASCADE;

ALTER TABLE devotees
ADD CONSTRAINT fk_referred_by
  FOREIGN KEY (referred_by) REFERENCES devotees(id)
  ON DELETE SET NULL
  ON UPDATE CASCADE;

ALTER TABLE devotees
ADD COLUMN created_by INTEGER REFERENCES devotees(id) DEFAULT NULL,
ADD COLUMN updated_by INTEGER REFERENCES devotees(id) DEFAULT NULL

-- Drop if exists (prevent redefinition errors)
DROP TRIGGER IF EXISTS set_updated_at_devotees ON devotees;

-- Create the trigger
CREATE TRIGGER set_updated_at_devotees
BEFORE UPDATE ON devotees
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


/* 
  TABLE #4: donations
*/
CREATE TABLE IF NOT EXISTS donations (
  id VARCHAR(100) PRIMARY KEY,
  donation_receipt_number VARCHAR(100) NOT NULL,
  name VARCHAR(100),
  phone VARCHAR(21),
  cost_center VARCHAR(100),
  scheme_name VARCHAR(100),
  payment_mode VARCHAR(20),
  amount INTEGER NOT NULL CHECK (amount >= 0),
  instrument_number VARCHAR(100),
  collected_by VARCHAR(100),
  status VARCHAR(21) NOT NULL DEFAULT 'Not Verified',
  date DATE DEFAULT CURRENT_DATE,
  internal_note TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE donations
ADD COLUMN created_by INTEGER REFERENCES devotees(id) DEFAULT NULL,
ADD COLUMN updated_by INTEGER REFERENCES devotees(id) DEFAULT NULL

-- Drop if exists (prevent redefinition errors)
DROP TRIGGER IF EXISTS set_updated_at_donations ON donations;

-- Create the trigger
CREATE TRIGGER set_updated_at_donations
BEFORE UPDATE ON donations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


