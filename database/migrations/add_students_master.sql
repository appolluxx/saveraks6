-- Migration: Add students_master table
-- This replaces the pre_registered_students table

-- Create students_master table
CREATE TABLE IF NOT EXISTS students_master (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id TEXT UNIQUE NOT NULL,
    number_in_class INTEGER,
    prefix TEXT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    grade INTEGER NOT NULL,
    room INTEGER NOT NULL,
    class_room TEXT GENERATED ALWAYS AS (grade || '/' || room) STORED,
    is_registered BOOLEAN DEFAULT FALSE,
    registered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_students_master_student_id ON students_master(student_id);
CREATE INDEX IF NOT EXISTS idx_students_master_class_room ON students_master(class_room);
CREATE INDEX IF NOT EXISTS idx_students_master_is_registered ON students_master(is_registered);

-- Trigger for updated_at
CREATE TRIGGER update_students_master_updated_at
    BEFORE UPDATE ON students_master
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Drop old table if it exists
DROP TABLE IF EXISTS pre_registered_students CASCADE;
