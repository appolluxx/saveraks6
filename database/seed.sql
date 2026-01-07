-- SaveRaks 2.0 Seed Data

-- Insert sample students (password is 'password123' hashed)
INSERT INTO users (student_id, full_name, nickname, password_hash, role, status, class_room, total_points) VALUES
('12345', 'สมชาย ใจดี', 'ชาย', '$2b$10$rQZ8v3.qZ8v3.qZ8v3.qZ8v3.qZ8v3.qZ8v3.qZ8v3.qZ8v3.qZ8', 'student', 'active', 'ม.4/1', 150),
('12346', 'สมหญิง รักษ์โลก', 'หญิง', '$2b$10$rQZ8v3.qZ8v3.qZ8v3.qZ8v3.qZ8v3.qZ8v3.qZ8v3.qZ8v3.qZ8', 'student', 'active', 'ม.4/2', 280),
('12347', 'วิชัย เขียวขจี', 'ชัย', '$2b$10$rQZ8v3.qZ8v3.qZ8v3.qZ8v3.qZ8v3.qZ8v3.qZ8v3.qZ8v3.qZ8', 'student', 'active', 'ม.5/1', 420),
('12348', 'มานี มีสุข', 'นี', '$2b$10$rQZ8v3.qZ8v3.qZ8v3.qZ8v3.qZ8v3.qZ8v3.qZ8v3.qZ8v3.qZ8', 'student', 'active', 'ม.5/2', 350),
('12349', 'ปิติ อนุรักษ์', 'ติ', '$2b$10$rQZ8v3.qZ8v3.qZ8v3.qZ8v3.qZ8v3.qZ8v3.qZ8v3.qZ8v3.qZ8', 'student', 'active', 'ม.6/1', 500);

-- Insert admin user
INSERT INTO users (email, phone, full_name, password_hash, role, status, department) VALUES
('admin@saveraks.school.th', '0891234567', 'Admin SaveRaks', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO6G', 'admin', 'active', 'Administration');

-- Insert sample badges
INSERT INTO badges (name, description, icon_url, requirement_type, requirement_value, points_reward) VALUES
('🌱 First Step', 'Complete your first eco-action', 'badges/first-step.png', 'actions_count', 1, 10),
('🌿 Eco Warrior', 'Complete 10 eco-actions', 'badges/eco-warrior.png', 'actions_count', 10, 50),
('🌳 Tree Guardian', 'Plant or care for 5 trees', 'badges/tree-guardian.png', 'tree_planting', 5, 100),
('♻️ Recycling Champion', 'Recycle 20 times', 'badges/recycling-champion.png', 'recycling', 20, 75),
('💧 Water Saver', 'Complete 10 water conservation actions', 'badges/water-saver.png', 'water_conservation', 10, 60),
('⚡ Energy Hero', 'Complete 10 energy saving actions', 'badges/energy-hero.png', 'energy_saving', 10, 60),
('🏆 Top 10', 'Reach Top 10 on the leaderboard', 'badges/top-10.png', 'leaderboard_rank', 10, 200),
('👑 Eco Legend', 'Earn 1000 points', 'badges/eco-legend.png', 'total_points', 1000, 500);

-- Refresh leaderboard
SELECT refresh_leaderboard();
