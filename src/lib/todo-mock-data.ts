// Backup of TodoPage's mock data
export const todoStatuses = [
  { id: "1", name: "Backlog", color: "#6B7280" },
  { id: "2", name: "To Do", color: "#F59E0B" },
  { id: "3", name: "In Progress", color: "#3B82F6" },
  { id: "4", name: "Done", color: "#10B981" },
];

// User list (would typically come from an API)
export const users = [
  {
    id: "1",
    name: "Sammy",
    avatar: "https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=sammy",
    role: "admin"
  },
  {
    id: "2",
    name: "Ava",
    avatar: "https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=ava",
    role: "staff"
  },
  {
    id: "3",
    name: "Crystal",
    avatar: "https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=crystal",
    role: "staff"
  },
  {
    id: "4",
    name: "Winnie",
    avatar: "https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=winnie",
    role: "staff"
  },
  {
    id: "5",
    name: "Laili",
    avatar: "https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=laili",
    role: "staff"
  },
  {
    id: "6",
    name: "Jesley",
    avatar: "https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=jesley",
    role: "staff"
  },
  {
    id: "7",
    name: "Shay Mei",
    avatar: "https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=shaymei",
    role: "staff"
  },
  {
    id: "8",
    name: "Kevin",
    avatar: "https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=kevin",
    role: "staff"
  },
  {
    id: "9",
    name: "Elly",
    avatar: "https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=elly",
    role: "staff"
  }
];

export const initialTasks = [
  {
    id: "1",
    name: "Design System Implementation",
    startAt: new Date(),
    endAt: new Date(),
    description: "Implement a comprehensive design system including components, tokens, and documentation.",
    status: todoStatuses[0],
    assignees: [
      {
        id: "1",
        name: "Sammy",
        avatar: "https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=sammy",
      }
    ],
    assignmentStatus: "accepted", // 'pending', 'accepted', 'rejected'
    creator: {
      id: "1",
      name: "Sammy",
      avatar: "https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=sammy",
    },
    mentions: [], // Users mentioned in description with @
    priority: "high",
    externalFiles: [
      {
        id: "file1",
        name: "Design Guidelines",
        type: "figma",
        url: "https://www.figma.com/file/example123",
        lastModified: "2 days ago"
      }
    ]
  },
  {
    id: "2",
    name: "User Authentication Flow",
    startAt: new Date(),
    endAt: new Date(),
    description: "Create a secure authentication system with login, registration, and password recovery. @Ava please take a look at the security aspects.",
    status: todoStatuses[1],
    assignees: [
      {
        id: "2",
        name: "Ava",
        avatar: "https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=ava",
      }
    ],
    assignmentStatus: "pending",
    creator: {
      id: "1",
      name: "Sammy",
      avatar: "https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=sammy",
    },
    mentions: [
      {
        id: "2",
        name: "Ava",
        avatar: "https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=ava",
      }
    ],
    priority: "medium",
    externalFiles: [
      {
        id: "file2",
        name: "Auth0 Documentation",
        type: "doc",
        url: "https://auth0.com/docs/quickstart",
        lastModified: "1 week ago"
      }
    ]
  },
  {
    id: "3",
    name: "API Integration",
    startAt: new Date(),
    endAt: new Date(),
    description: "Integrate third-party APIs and implement data synchronization features. @Crystal will handle API security.",
    status: todoStatuses[2],
    assignees: [
      {
        id: "3",
        name: "Crystal",
        avatar: "https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=crystal",
      }
    ],
    assignmentStatus: "accepted",
    creator: {
      id: "1",
      name: "Sammy",
      avatar: "https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=sammy",
    },
    mentions: [
      {
        id: "3",
        name: "Crystal",
        avatar: "https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=crystal",
      }
    ],
    priority: "high",
    externalFiles: [
      {
        id: "file3",
        name: "API Documentation",
        type: "doc",
        url: "https://docs.example.com/api",
        lastModified: "3 days ago"
      },
      {
        id: "file4",
        name: "Implementation Spreadsheet",
        type: "sheet",
        url: "https://docs.google.com/spreadsheets/d/example",
        lastModified: "Yesterday"
      }
    ]
  },
  {
    id: "4",
    name: "Database Schema Design",
    startAt: new Date(),
    endAt: new Date(),
    description: "Design and implement the database schema for the application's core features. @Winnie to review the schema.",
    status: todoStatuses[3],
    assignees: [
      {
        id: "4",
        name: "Winnie",
        avatar: "https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=winnie",
      }
    ],
    assignmentStatus: "accepted",
    creator: {
      id: "1",
      name: "Sammy",
      avatar: "https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=sammy",
    },
    mentions: [
      {
        id: "4",
        name: "Winnie",
        avatar: "https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=winnie",
      }
    ],
    priority: "low",
    externalFiles: [
      {
        id: "file5",
        name: "Schema Design Document",
        type: "doc",
        url: "https://docs.google.com/document/d/schema123",
        lastModified: "5 days ago"
      },
      {
        id: "file6",
        name: "Database Diagrams",
        type: "drive",
        url: "https://drive.google.com/file/d/diagram456",
        lastModified: "1 week ago"
      }
    ]
  },
];