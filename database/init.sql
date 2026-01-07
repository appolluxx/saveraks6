-- SaveRaks 2.0 Database Initialization

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enum types
CREATE TYPE user_role AS ENUM ('student', 'staff', 'admin');
CREATE TYPE user_status AS ENUM ('pending', 'active', 'suspended');
CREATE TYPE action_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE action_type AS ENUM ('waste_sorting', 'tree_planting', 'energy_saving', 'water_conservation', 'cleanup', 'recycling', 'other');

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id VARCHAR(10) UNIQUE,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    nickname VARCHAR(100),
    avatar_url VARCHAR(500),
    role user_role DEFAULT 'student',
    status user_status DEFAULT 'pending',
    department VARCHAR(100),
    class_room VARCHAR(20),
    total_points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- Sessions table for refresh tokens
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token VARCHAR(500) NOT NULL,
    device_info VARCHAR(500),
    ip_address VARCHAR(50),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Eco Actions table
CREATE TABLE IF NOT EXISTS eco_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type action_type NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    location_name VARCHAR(255),
    points_earned INTEGER DEFAULT 0,
    ai_analysis TEXT,
    ai_score DECIMAL(3, 2),
    status action_status DEFAULT 'pending',
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Badges/Achievements table
CREATE TABLE IF NOT EXISTS badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url VARCHAR(500),
    requirement_type VARCHAR(50),
    requirement_value INTEGER,
    points_reward INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Badges junction table
CREATE TABLE IF NOT EXISTS user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, badge_id)
);

-- Leaderboard (materialized view for performance)
CREATE MATERIALIZED VIEW IF NOT EXISTS leaderboard AS
SELECT 
    u.id,
    u.student_id,
    u.full_name,
    u.nickname,
    u.avatar_url,
    u.class_room,
    u.total_points,
    COUNT(ea.id) as total_actions,
    RANK() OVER (ORDER BY u.total_points DESC) as rank
FROM users u
LEFT JOIN eco_actions ea ON u.id = ea.user_id AND ea.status = 'approved'
WHERE u.role = 'student' AND u.status = 'active'
GROUP BY u.id
ORDER BY u.total_points DESC;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_student_id ON users(student_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token ON sessions(refresh_token);
CREATE INDEX IF NOT EXISTS idx_eco_actions_user_id ON eco_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_eco_actions_status ON eco_actions(status);
CREATE INDEX IF NOT EXISTS idx_eco_actions_created_at ON eco_actions(created_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for users table
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to refresh leaderboard
CREATE OR REPLACE FUNCTION refresh_leaderboard()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW leaderboard;
END;
$$ LANGUAGE plpgsql;
