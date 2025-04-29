CREATE TABLE IF NOT EXISTS system_roles (
    id TINYINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(20) NOT NULL,
    hierarchy_level TINYINT UNSIGNED NOT NULL UNIQUE,
    description TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS devotees (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  name VARCHAR(100) NULL,
  phone VARCHAR(21) NULL,
  phone_whatsapp VARCHAR(21) NULL,
  email VARCHAR(255) NULL,
  occupation VARCHAR(255) NULL,
  gender VARCHAR(6) NULL,
  dob_self DATE NULL,
  dob_spouse DATE NULL,
  dob_parents_father DATE NULL,
  dob_parents_mother DATE NULL,
  dob_children_1 DATE NULL,
  dob_children_2 DATE NULL,
  dob_children_3 DATE NULL,
  dob_children_4 DATE NULL,
  marriage_anniversary_self DATE NULL,
  marriage_anniversary_parents DATE NULL,
  status VARCHAR(9) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE (phone),
  UNIQUE (email)
);