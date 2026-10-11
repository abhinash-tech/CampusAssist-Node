-- CampusAssist JS — Aiven MySQL Schema (MySQL 8+)
-- Compatible with Aiven Managed MySQL service.
-- Charset: utf8mb4, Collation: utf8mb4_unicode_ci

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(120) NOT NULL DEFAULT '',
  student_id VARCHAR(50) UNIQUE,
  department VARCHAR(50) DEFAULT 'CSE',
  section VARCHAR(10) DEFAULT 'A',
  role ENUM('student', 'staff', 'admin') NOT NULL DEFAULT 'student',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS request_categories (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(60) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_categories_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS service_requests (
  id VARCHAR(36) PRIMARY KEY,
  request_code VARCHAR(24) NOT NULL UNIQUE,
  title VARCHAR(160) NOT NULL,
  description TEXT NOT NULL,
  category_id VARCHAR(36) NULL,
  priority ENUM('Low', 'Medium', 'High') NOT NULL DEFAULT 'Medium',
  status ENUM('Open', 'In progress', 'Resolved', 'Closed') NOT NULL DEFAULT 'Open',
  created_by VARCHAR(36) NOT NULL,
  assigned_to VARCHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_requests_created_by (created_by, created_at DESC),
  INDEX idx_requests_status_priority (status, priority),
  INDEX idx_requests_category (category_id),
  CONSTRAINT fk_requests_category FOREIGN KEY (category_id) REFERENCES request_categories(id) ON DELETE SET NULL,
  CONSTRAINT fk_requests_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_requests_assignee FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS request_activity (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  request_id VARCHAR(36) NOT NULL,
  actor_id VARCHAR(36) NULL,
  event_type ENUM('created', 'status_changed', 'assigned', 'comment', 'updated') NOT NULL,
  title VARCHAR(160) NOT NULL,
  body TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_activity_request_time (request_id, created_at DESC),
  CONSTRAINT fk_activity_request FOREIGN KEY (request_id) REFERENCES service_requests(id) ON DELETE CASCADE,
  CONSTRAINT fk_activity_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS knowledge_articles (
  id VARCHAR(36) PRIMARY KEY,
  slug VARCHAR(100) NOT NULL UNIQUE,
  title VARCHAR(200) NOT NULL,
  category VARCHAR(60) NOT NULL,
  summary TEXT NOT NULL,
  content MEDIUMTEXT NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_by VARCHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_articles_published (is_published, category),
  INDEX idx_articles_slug (slug),
  CONSTRAINT fk_articles_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id VARCHAR(36) PRIMARY KEY,
  article_id VARCHAR(36) NOT NULL,
  chunk_index INT NOT NULL DEFAULT 0,
  content TEXT NOT NULL,
  embedding_json JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_chunks_article (article_id),
  CONSTRAINT fk_chunks_article FOREIGN KEY (article_id) REFERENCES knowledge_articles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ai_feedback (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  feature ENUM('chat', 'classification', 'rewrite', 'copilot') NOT NULL,
  helpful BOOLEAN NOT NULL,
  comment TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_feedback_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Initial Seed Data: Default Categories
INSERT INTO request_categories (id, name, slug, description, is_active) VALUES
  ('cat-academic', 'Academic support', 'academic', 'Coursework, grades, attendance and academic records.', TRUE),
  ('cat-campus', 'Campus services', 'campus', 'Facilities, transport, hostel and campus life.', TRUE),
  ('cat-technical', 'IT & digital access', 'technical', 'Accounts, Wi-Fi, LMS and technical assistance.', TRUE),
  ('cat-admin', 'Administration', 'administration', 'Certificates, documents and administrative requests.', TRUE)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Initial Seed Data: Published Campus Knowledge Guides
INSERT INTO knowledge_articles (id, slug, title, category, summary, content, is_published) VALUES
  ('art-attendance', 'attendance-review', 'How to request an attendance review', 'Academics', 'Include the relevant date, subject, period and the discrepancy you noticed.', 'Submit an academic support request. Include the attendance date, subject, period, any supporting evidence and the correction you are requesting. Campus attendance policies require maintaining minimum 75% attendance. Corrections must be submitted within 7 working days of the period.', TRUE),
  ('art-certificates', 'student-certificates', 'Requesting student certificates', 'Administration', 'Start an administration request and specify the certificate type and purpose.', 'For a bonafide, study certificate, or fee estimate, submit an administration request specifying the exact certificate and purpose. Standard processing time is 2 to 3 working days through the student administration office.', TRUE),
  ('art-wifi', 'campus-wifi', 'Connecting to campus Wi-Fi', 'Digital services', 'Describe the location, device, affected service and error message.', 'To connect to Anurag University campus Wi-Fi, use your student portal credentials. For connectivity issues, submit a digital access ticket with the building name, device MAC address, and error message. Never share your password or OTP.', TRUE),
  ('art-facilities', 'campus-facilities', 'Facilities and maintenance requests', 'Campus life', 'Report the location and a clear description of the maintenance issue.', 'Use a campus services request for classroom amenities, water supply, air conditioning, hostel maintenance, or transport routes. Specify the exact block and room number.', TRUE)
ON DUPLICATE KEY UPDATE title=VALUES(title);
