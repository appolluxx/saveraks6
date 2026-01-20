-- Students Master Table
-- This table contains the official student list from Excel file

CREATE TABLE IF NOT EXISTS students_master (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id VARCHAR(10) UNIQUE NOT NULL, -- เลขปจต.
    number_in_class INTEGER, -- เลขที่
    prefix VARCHAR(20), -- คำนำหน้า (ด.ช., ด.ญ.)
    first_name VARCHAR(255) NOT NULL, -- ชื่อ
    last_name VARCHAR(255) NOT NULL, -- นามสกุล
    grade INTEGER NOT NULL, -- ชั้น
    room INTEGER NOT NULL, -- ห้อง
    class_room VARCHAR(20) GENERATED ALWAYS AS (grade || '/' || room) STORED, -- Combined classroom
    is_registered BOOLEAN DEFAULT FALSE, -- Track if student has registered
    registered_at TIMESTAMP WITH TIME ZONE, -- When they registered
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_students_master_student_id ON students_master(student_id);
CREATE INDEX IF NOT EXISTS idx_students_master_class_room ON students_master(class_room);
CREATE INDEX IF NOT EXISTS idx_students_master_is_registered ON students_master(is_registered);

-- Trigger to update updated_at
CREATE TRIGGER update_students_master_updated_at
    BEFORE UPDATE ON students_master
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
