/* Enter "USE {database};" to start exploring your data.
   Press Command + I to try out AI-generated SQL queries or SQL rewrite using Chat2Query. */
use deva_lite_dev;
CREATE TABLE IF NOT EXISTS system_roles (
  id TINYINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(20) NOT NULL,
  hierarchy_level TINYINT UNSIGNED NOT NULL UNIQUE,
  description TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS spiritual_levels (
  id TINYINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title_male VARCHAR(20) NOT NULL,
  title_female VARCHAR(20) NOT NULL,
  title_other VARCHAR(20) NOT NULL,
  hierarchy_level TINYINT UNSIGNED NOT NULL UNIQUE,
  description TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS devotees (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NULL,
  diksha_name VARCHAR(100) NULL,
  status ENUM('active', 'inactive') NOT NULL,
  phone VARCHAR(21) NULL,
  phone_verified BOOLEAN NOT NULL DEFAULT false,
  phone_whatsapp VARCHAR(21) NULL,
  email VARCHAR(255) NULL,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  role_id TINYINT UNSIGNED NOT NULL,
  spiritual_level TINYINT UNSIGNED NOT NULL,
  source VARCHAR(40) NOT NULL,
  gender ENUM('male', 'female', 'other') NULL,
  dob DATE NULL,
  occupation VARCHAR(21) NULL,
  occupation_position VARCHAR(51) NULL,
  spouse_name VARCHAR(100) NULL,
  spouse_dob DATE NULL,
  spouse_marriage_anniversary DATE NULL,
  parents_father_name VARCHAR(100) NULL,
  parents_father_dob DATE NULL,
  parents_mother_name VARCHAR(100) NULL,
  parents_mother_dob DATE NULL,
  parents_marriage_anniversary DATE NULL,
  children_1_name VARCHAR(100) NULL,
  children_1_dob DATE NULL,
  children_2_name VARCHAR(100) NULL,
  children_2_dob DATE NULL,
  children_3_name VARCHAR(100) NULL,
  children_3_dob DATE NULL,
  children_4_name VARCHAR(100) NULL,
  children_4_dob DATE NULL,
  internal_note TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE (phone),
  UNIQUE (email),
  FOREIGN KEY (role_id) REFERENCES system_roles(id),
  FOREIGN KEY (spiritual_level) REFERENCES spiritual_levels(id)
);