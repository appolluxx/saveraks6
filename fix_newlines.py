
path = r'C:\Users\surak\Documents\Code\SaveRak\database\pg_hba.conf'
content = b"""# Custom pg_hba.conf for debugging
local   all             all                                     trust
host    all             all             0.0.0.0/0               trust
host    all             all             ::/0                    trust
"""

with open(path, 'wb') as f:
    f.write(content)

print(f"Fixed line endings for {path}")
