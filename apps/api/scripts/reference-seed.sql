-- EduRank reference data (idempotent)
-- Subjects = map districts (CAPS-flavoured FET subjects)

INSERT OR IGNORE INTO subjects (id, name, blurb, color, icon, unsplash_query, sort_order) VALUES
  ('mathematics',       'Mathematics',         'Numbers, functions and proofs. The downtown core of the city.', '#A6FF3F', 'Sigma',      'mathematics chalkboard equations', 1),
  ('physical-sciences', 'Physical Sciences',   'Physics and chemistry. Where the city keeps its reactors.',     '#43D9FF', 'Atom',       'physics laboratory experiment',    2),
  ('life-sciences',     'Life Sciences',       'Biology, cells and ecosystems. The green belt.',                '#4ADE80', 'Dna',        'biology microscope nature macro',  3),
  ('accounting',        'Accounting',          'Ledgers, balance sheets and audit trails. Financial district.', '#FFC24B', 'Calculator', 'finance office desk calculator',   4),
  ('economics',         'Economics',           'Markets, demand curves and trade routes. Harbour side.',        '#FF8A3D', 'TrendingUp', 'city skyline economy dusk',        5),
  ('business-studies',  'Business Studies',    'Management, entrepreneurship and strategy.',                    '#FF6B9D', 'Briefcase',  'startup business meeting',         6),
  ('geography',         'Geography',           'Landforms, climate systems and maps of the real world.',        '#2DD4BF', 'Globe2',     'aerial landscape mountains river', 7),
  ('history',           'History',             'Empires, revolutions and primary sources. The old town.',       '#D4A373', 'Landmark',   'ancient ruins history museum',     8),
  ('english',           'English',             'Literature, language and essays. The broadcast district.',      '#E2E8F0', 'BookOpen',   'library books reading',            9),
  ('cat-it',            'CAT & IT',            'Hardware, software and networks. The tech quarter island.',     '#22D3EE', 'Cpu',        'computer circuit technology neon', 10);

INSERT OR IGNORE INTO schools (id, name, province) VALUES
  ('sch-jeppe',        'Jeppe High School',          'Gauteng'),
  ('sch-ptaboys',      'Pretoria Boys High School',  'Gauteng'),
  ('sch-waterkloof',   'Hoërskool Waterkloof',       'Gauteng'),
  ('sch-rondebosch',   'Rondebosch Boys'' High School','Western Cape'),
  ('sch-bishops',      'Diocesan College (Bishops)', 'Western Cape'),
  ('sch-durbanboys',   'Durban High School',         'KwaZulu-Natal'),
  ('sch-grey',         'Grey College',               'Free State'),
  ('sch-selborne',     'Selborne College',           'Eastern Cape');

INSERT OR IGNORE INTO badges (id, name, description, icon, tier, criteria_type, threshold) VALUES
  ('first-drop',   'FIRST DROP',      'Got your first note approved onto the board.',        'UploadCloud', 1, 'uploads_approved',   1),
  ('supplier',     'SUPPLIER',        '10 approved notes circulating the city.',             'Boxes',       2, 'uploads_approved',   10),
  ('dealer',       'DEALER',          'Your notes were downloaded 25 times.',                'PackageCheck',2, 'downloads_received', 25),
  ('celebrity',    'CELEBRITY',       'Pulled in 50 upvotes across your work.',              'Star',        3, 'upvotes_received',   50),
  ('on-fire',      'ON FIRE',         'Logged in 7 days straight.',                          'Flame',       2, 'streak',             7),
  ('unbreakable',  'UNBREAKABLE',     'A 30-day streak. Respect.',                           'Zap',         3, 'streak',             30),
  ('high-roller',  'HIGH ROLLER',     'Earned 5 000 PTS all-time.',                          'Gem',         3, 'total_earned',       5000),
  ('collector',    'COLLECTOR',       'Owns 3 or more shop items.',                          'ShoppingBag', 2, 'purchases',          3);

INSERT OR IGNORE INTO shop_items (id, kind, name, description, price_points, config_json, sort_order) VALUES
  ('frame-volt',  'frame', 'Volt Frame',     'Neon green avatar ring. Standard issue for hustlers.', 300, '{"color":"#A6FF3F"}',  1),
  ('frame-gold',  'frame', 'Gold Frame',     'Amber avatar ring for players with taste.',            800, '{"color":"#FFC24B"}',  2),
  ('frame-blood', 'frame', 'Blood Frame',    'Red avatar ring. Loud and unbothered.',                800, '{"color":"#FF4D5E"}',  3),
  ('frame-sky',   'frame', 'Sky Frame',      'Ice-cold cyan ring.',                                  500, '{"color":"#43D9FF"}',  4),
  ('skin-volt',   'skin',  'Volt City Skin', 'Recolours the map: volt accents, deep water.',        1200, '{"accent":"#A6FF3F","road":"#2A3340"}', 5),
  ('skin-sunset', 'skin',  'Sunset Skin',    'Recolours the map: amber accents, warm lines.',       1200, '{"accent":"#FF8A3D","road":"#33291F"}', 6),
  ('skin-ice',    'skin',  'Ice Skin',       'Recolours the map: cyan accents, arctic grid.',       1200, '{"accent":"#43D9FF","road":"#1F3038"}', 7),
  ('badge-goat',  'badge', 'CERTIFIED GOAT', 'Cosmetic badge. For the ones who know.',               400, '{"icon":"Crown"}',      8),
  ('badge-owl',   'badge', 'NIGHT OWL',      'Cosmetic badge. Grinded after dark.',                  300, '{"icon":"MoonStar"}',   9);
