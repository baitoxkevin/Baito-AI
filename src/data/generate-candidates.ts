// Generate 50 diverse sample candidates for showcase
export const generate50Candidates = () => {
  const names = [
    'John Doe', 'Sarah Lee', 'Ahmad Ali', 'Lisa Wei', 'David Wong', 'Maria Garcia',
    'Kevin Tan', 'Priya Sharma', 'Michael Chen', 'Aisha Rahman', 'James Lim', 'Sofia Rodriguez',
    'Daniel Kim', 'Fatima Hassan', 'Ryan Ng', 'Nadia Aziz', 'Alex Teo', 'Zara Khan',
    'Benjamin Ong', 'Layla Ibrahim', 'Christopher Lee', 'Amira Yusof', 'Matthew Koh', 'Jasmine Wong',
    'Nicholas Tan', 'Hana Khalid', 'Andrew Liew', 'Rina Patel', 'Jonathan Yap', 'Maya Singh',
    'Aaron Chow', 'Nur Aisyah', 'Brandon Lim', 'Siti Nurhaliza', 'Justin Ho', 'Alia Abdullah',
    'Ethan Goh', 'Farah Mohamed', 'Tyler Kang', 'Iman Ali', 'Lucas Chin', 'Zainab Omar',
    'Adrian Tay', 'Mariam Ismail', 'Sean Low', 'Aaliyah Jamal', 'Dylan Sim', 'Leila Hamid',
    'Nathan Woo', 'Rania Bakri'
  ];

  const roles = ['Setup Lead', 'Coordinator', 'Logistics', 'Customer Service', 'Setup Crew', 'Supervisor', 'Team Lead', 'Assistant'];
  const educations = ['Diploma', 'Degree', 'Secondary', 'Master'];
  const vehicles = ['Car', 'Motorcycle', 'Van', null];
  const locations = ['Kuala Lumpur', 'Petaling Jaya', 'Shah Alam', 'Subang Jaya', 'Bangsar', 'Cheras', 'Ampang', 'Puchong'];
  const skillSets = [
    ['Event Setup', 'Crowd Control', 'Leadership'],
    ['Customer Service', 'Communication', 'Organization'],
    ['Logistics', 'Transport', 'Planning'],
    ['Problem Solving', 'Multilingual', 'VIP Handling'],
    ['Heavy Lifting', 'Equipment Setup', 'Safety'],
    ['Team Management', 'Scheduling', 'Training'],
    ['Technical Support', 'Audio Visual', 'Lighting'],
    ['Registration', 'Data Entry', 'Guest Relations']
  ];
  const languageSets = [
    ['English', 'Malay'],
    ['English', 'Malay', 'Mandarin'],
    ['English', 'Mandarin', 'Cantonese'],
    ['English', 'Malay', 'Tamil'],
    ['English', 'Spanish', 'Malay'],
    ['English', 'Hindi', 'Malay']
  ];

  return names.map((name, i) => ({
    id: `${i + 1}`,
    name: name,
    age: 22 + Math.floor(Math.random() * 15),
    rating: (4.3 + Math.random() * 0.7).toFixed(1),
    photo: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
    role: roles[i % roles.length],
    education: educations[Math.floor(Math.random() * educations.length)],
    vehicle: vehicles[Math.floor(Math.random() * vehicles.length)] || 'No vehicle',
    location: locations[Math.floor(Math.random() * locations.length)],
    phone: `+6012-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`,
    email: `${name.toLowerCase().replace(' ', '.')}@example.com`,
    projects: Math.floor(Math.random() * 25 + 5),
    skills: skillSets[i % skillSets.length],
    languages: languageSets[Math.floor(Math.random() * languageSets.length)],
    featured: i < 3
  }));
};
