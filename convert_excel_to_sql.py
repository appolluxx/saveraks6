import pandas as pd

def escape_sql_string(value):
    """Escape single quotes for SQL"""
    if value is None or pd.isna(value):
        return None
    return str(value).replace("'", "''")

# Read Excel file
try:
    df = pd.read_excel('student list.xlsx')
    print(f"Successfully loaded Excel file with {len(df)} rows")
except Exception as e:
    print(f"Error reading Excel file: {e}")
    exit(1)

# Clean and prepare data
df.columns = ['student_id', 'number_in_class', 'prefix', 'first_name', 'last_name', 'grade', 'room']
df = df.dropna(subset=['student_id'])  # Remove rows with no student ID

print(f"After cleaning: {len(df)} valid student records")

# Convert to SQL INSERT statements
sql_statements = []
for index, row in df.iterrows():
    try:
        student_id = str(int(row['student_id']))  # Convert to string without decimal
        
        # Handle nullable fields
        number_in_class = int(row['number_in_class']) if pd.notna(row['number_in_class']) else None
        prefix = escape_sql_string(row['prefix'])
        first_name = escape_sql_string(row['first_name'])
        last_name = escape_sql_string(row['last_name'])
        grade = int(row['grade']) if pd.notna(row['grade']) else None
        room = int(row['room']) if pd.notna(row['room']) else None
        
        # Build SQL values
        values = [
            student_id,
            str(number_in_class) if number_in_class is not None else 'NULL',
            f"'{prefix}'" if prefix else 'NULL',
            f"'{first_name}'" if first_name else 'NULL',
            f"'{last_name}'" if last_name else 'NULL',
            str(grade) if grade is not None else 'NULL',
            str(room) if room is not None else 'NULL'
        ]
        
        sql = f"INSERT INTO students_master (student_id, number_in_class, prefix, first_name, last_name, grade, room) VALUES ({', '.join(values)});"
        sql_statements.append(sql)
        
    except Exception as e:
        print(f"Error processing row {index}: {e}")
        continue

# Write to file
try:
    with open('database/import_students.sql', 'w', encoding='utf-8') as f:
        f.write('-- Import students from Excel file\n')
        f.write(f'-- Total students: {len(sql_statements)}\n\n')
        for stmt in sql_statements:
            f.write(stmt + '\n')
    
    print(f'Generated {len(sql_statements)} SQL statements')
    print('File saved as: database/import_students.sql')
    
except Exception as e:
    print(f"Error writing SQL file: {e}")
