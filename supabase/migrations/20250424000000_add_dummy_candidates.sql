-- Add dummy candidates
INSERT INTO candidates (full_name, ic_number, date_of_birth, phone_number, gender, email, nationality, emergency_contact_name, emergency_contact_number, has_vehicle, vehicle_type, bank_name, bank_account_number, highest_education)
VALUES
  ('John Smith', '901212-12-1234', '1990-12-12', '+60123456789', 'male', 'john.smith@example.com', 'Malaysian', 'Jane Smith', '+60123456788', true, 'Car', 'CIMB Bank', '1234567890', 'Bachelor Degree'),
  ('Sarah Lee', '881101-14-5678', '1988-11-01', '+60145678901', 'female', 'sarah.lee@example.com', 'Malaysian', 'David Lee', '+60145678902', false, null, 'Maybank', '2345678901', 'Masters Degree'),
  ('Raj Kumar', '920304-08-2345', '1992-03-04', '+60167890123', 'male', 'raj.kumar@example.com', 'Malaysian', 'Priya Kumar', '+60167890124', true, 'Motorcycle', 'Public Bank', '3456789012', 'Diploma'),
  ('Mei Ling', '950625-10-3456', '1995-06-25', '+60189012345', 'female', 'mei.ling@example.com', 'Malaysian', 'Wei Chen', '+60189012346', false, null, 'Hong Leong Bank', '4567890123', 'Bachelor Degree'),
  ('Ahmed Hassan', '870712-02-4567', '1987-07-12', '+60123456700', 'male', 'ahmed.hassan@example.com', 'Malaysian', 'Fatima Hassan', '+60123456701', true, 'Car', 'RHB Bank', '5678901234', 'Masters Degree'),
  ('Lisa Wong', '930815-04-5678', '1993-08-15', '+60198765432', 'female', 'lisa.wong@example.com', 'Malaysian', 'Mike Wong', '+60198765431', true, 'Car', 'CIMB Bank', '6789012345', 'PhD'),
  ('Tan Wei Ming', '890623-08-1234', '1989-06-23', '+60123456666', 'male', 'tan.wei@example.com', 'Malaysian', 'Tan Mei Ling', '+60123456667', true, 'Motorcycle', 'Maybank', '7890123456', 'Diploma'),
  ('Aisha Binti Abdul', '910405-14-7890', '1991-04-05', '+60187654321', 'female', 'aisha@example.com', 'Malaysian', 'Abdul Rahman', '+60187654322', false, null, 'HSBC', '8901234567', 'Bachelor Degree'),
  ('David Chen', '880909-10-4321', '1988-09-09', '+60122334455', 'male', 'david.chen@example.com', 'Malaysian', 'Linda Chen', '+60122334456', true, 'Car', 'Public Bank', '9012345678', 'Masters Degree'),
  ('Kavita Rao', '940117-06-6789', '1994-01-17', '+60177889900', 'female', 'kavita.rao@example.com', 'Malaysian', 'Raj Rao', '+60177889901', false, null, 'RHB Bank', '0123456789', 'Bachelor Degree');

-- Add performance metrics for each candidate
INSERT INTO performance_metrics (candidate_id, reliability_score, response_rate, avg_rating, total_gigs_completed, no_shows, late_arrivals, early_terminations)
VALUES
  ((SELECT id FROM candidates WHERE full_name = 'John Smith'), 95, 98, 4.7, 42, 1, 2, 0),
  ((SELECT id FROM candidates WHERE full_name = 'Sarah Lee'), 92, 95, 4.5, 28, 0, 3, 1),
  ((SELECT id FROM candidates WHERE full_name = 'Raj Kumar'), 87, 90, 4.2, 15, 2, 4, 0),
  ((SELECT id FROM candidates WHERE full_name = 'Mei Ling'), 98, 99, 4.9, 56, 0, 1, 0),
  ((SELECT id FROM candidates WHERE full_name = 'Ahmed Hassan'), 91, 88, 4.3, 21, 1, 3, 1),
  ((SELECT id FROM candidates WHERE full_name = 'Lisa Wong'), 94, 96, 4.6, 35, 0, 2, 0),
  ((SELECT id FROM candidates WHERE full_name = 'Tan Wei Ming'), 85, 82, 4.1, 18, 3, 5, 2),
  ((SELECT id FROM candidates WHERE full_name = 'Aisha Binti Abdul'), 96, 97, 4.8, 49, 0, 1, 0),
  ((SELECT id FROM candidates WHERE full_name = 'David Chen'), 93, 91, 4.4, 32, 1, 2, 0),
  ((SELECT id FROM candidates WHERE full_name = 'Kavita Rao'), 89, 93, 4.3, 24, 1, 3, 1);

-- Add loyalty status for each candidate
INSERT INTO loyalty_status (candidate_id, tier_level, total_gigs_completed, current_points, tier_achieved_date, points_expiry_date)
VALUES
  ((SELECT id FROM candidates WHERE full_name = 'John Smith'), 'gold', 42, 840, '2024-01-15', '2025-01-15'),
  ((SELECT id FROM candidates WHERE full_name = 'Sarah Lee'), 'silver', 28, 420, '2024-02-10', '2025-02-10'),
  ((SELECT id FROM candidates WHERE full_name = 'Raj Kumar'), 'bronze', 15, 150, '2024-03-05', '2025-03-05'),
  ((SELECT id FROM candidates WHERE full_name = 'Mei Ling'), 'platinum', 56, 1680, '2023-12-01', '2024-12-01'),
  ((SELECT id FROM candidates WHERE full_name = 'Ahmed Hassan'), 'silver', 21, 315, '2024-02-25', '2025-02-25'),
  ((SELECT id FROM candidates WHERE full_name = 'Lisa Wong'), 'gold', 35, 700, '2024-01-20', '2025-01-20'),
  ((SELECT id FROM candidates WHERE full_name = 'Tan Wei Ming'), 'bronze', 18, 180, '2024-03-10', '2025-03-10'),
  ((SELECT id FROM candidates WHERE full_name = 'Aisha Binti Abdul'), 'platinum', 49, 1470, '2023-12-15', '2024-12-15'),
  ((SELECT id FROM candidates WHERE full_name = 'David Chen'), 'gold', 32, 640, '2024-02-01', '2025-02-01'),
  ((SELECT id FROM candidates WHERE full_name = 'Kavita Rao'), 'silver', 24, 360, '2024-02-20', '2025-02-20');

-- Add language proficiency for candidates
INSERT INTO language_proficiency (candidate_id, language, proficiency_level, is_primary)
VALUES
  ((SELECT id FROM candidates WHERE full_name = 'John Smith'), 'English', 'fluent', true),
  ((SELECT id FROM candidates WHERE full_name = 'John Smith'), 'Malay', 'intermediate', false),
  ((SELECT id FROM candidates WHERE full_name = 'Sarah Lee'), 'English', 'fluent', true),
  ((SELECT id FROM candidates WHERE full_name = 'Sarah Lee'), 'Malay', 'fluent', false),
  ((SELECT id FROM candidates WHERE full_name = 'Sarah Lee'), 'Mandarin', 'native', false),
  ((SELECT id FROM candidates WHERE full_name = 'Raj Kumar'), 'English', 'fluent', true),
  ((SELECT id FROM candidates WHERE full_name = 'Raj Kumar'), 'Tamil', 'native', false),
  ((SELECT id FROM candidates WHERE full_name = 'Raj Kumar'), 'Malay', 'intermediate', false),
  ((SELECT id FROM candidates WHERE full_name = 'Mei Ling'), 'English', 'fluent', false),
  ((SELECT id FROM candidates WHERE full_name = 'Mei Ling'), 'Mandarin', 'native', true),
  ((SELECT id FROM candidates WHERE full_name = 'Mei Ling'), 'Malay', 'fluent', false),
  ((SELECT id FROM candidates WHERE full_name = 'Ahmed Hassan'), 'English', 'intermediate', false),
  ((SELECT id FROM candidates WHERE full_name = 'Ahmed Hassan'), 'Malay', 'fluent', true),
  ((SELECT id FROM candidates WHERE full_name = 'Ahmed Hassan'), 'Arabic', 'native', false),
  ((SELECT id FROM candidates WHERE full_name = 'Lisa Wong'), 'English', 'fluent', true),
  ((SELECT id FROM candidates WHERE full_name = 'Lisa Wong'), 'Mandarin', 'native', false),
  ((SELECT id FROM candidates WHERE full_name = 'Lisa Wong'), 'Cantonese', 'native', false),
  ((SELECT id FROM candidates WHERE full_name = 'Lisa Wong'), 'Malay', 'intermediate', false),
  ((SELECT id FROM candidates WHERE full_name = 'Tan Wei Ming'), 'English', 'intermediate', false),
  ((SELECT id FROM candidates WHERE full_name = 'Tan Wei Ming'), 'Mandarin', 'native', true),
  ((SELECT id FROM candidates WHERE full_name = 'Tan Wei Ming'), 'Malay', 'fluent', false),
  ((SELECT id FROM candidates WHERE full_name = 'Aisha Binti Abdul'), 'Malay', 'native', true),
  ((SELECT id FROM candidates WHERE full_name = 'Aisha Binti Abdul'), 'English', 'fluent', false),
  ((SELECT id FROM candidates WHERE full_name = 'Aisha Binti Abdul'), 'Arabic', 'basic', false),
  ((SELECT id FROM candidates WHERE full_name = 'David Chen'), 'English', 'fluent', true),
  ((SELECT id FROM candidates WHERE full_name = 'David Chen'), 'Mandarin', 'native', false),
  ((SELECT id FROM candidates WHERE full_name = 'David Chen'), 'Cantonese', 'fluent', false),
  ((SELECT id FROM candidates WHERE full_name = 'David Chen'), 'Malay', 'intermediate', false),
  ((SELECT id FROM candidates WHERE full_name = 'Kavita Rao'), 'English', 'fluent', true),
  ((SELECT id FROM candidates WHERE full_name = 'Kavita Rao'), 'Tamil', 'native', false),
  ((SELECT id FROM candidates WHERE full_name = 'Kavita Rao'), 'Hindi', 'fluent', false),
  ((SELECT id FROM candidates WHERE full_name = 'Kavita Rao'), 'Malay', 'intermediate', false);