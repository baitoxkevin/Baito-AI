# Professional Profile Test Page - Standalone

A standalone version of the Professional Profile Test Page that can be deployed independently to Netlify.

## Features

- ✅ Fully responsive design (mobile-first)
- ✅ Form validation with real-time feedback
- ✅ Auto-formatting for IC numbers and phone numbers
- ✅ 4 half-body photos support
- ✅ Country field with validation
- ✅ 26 nationality options
- ✅ QR code generation for profile sharing
- ✅ Unsaved changes warning
- ✅ Keyboard navigation (Alt + Arrow keys)
- ✅ Photo deletion confirmation
- ✅ Profile completion indicator

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast build and HMR
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **QRCode.react** for QR code generation

## Local Development

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The app will be available at `http://localhost:5173`

## Deployment to Netlify

### Option 1: Deploy via Netlify CLI

```bash
# Install Netlify CLI globally
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize and deploy
netlify init

# Or deploy manually
npm run build
netlify deploy --prod --dir=dist
```

### Option 2: Deploy via Netlify Dashboard

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Drag and drop** the `dist` folder to [Netlify Drop](https://app.netlify.com/drop)

### Option 3: Connect Git Repository

1. Push this folder to a Git repository
2. Go to [Netlify](https://app.netlify.com)
3. Click "Add new site" > "Import an existing project"
4. Connect your Git provider
5. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Node version**: 18

6. Click "Deploy site"

## Configuration

### Build Settings

The `netlify.toml` file is pre-configured with:
- Build command: `npm run build`
- Publish directory: `dist`
- SPA routing redirect (all routes → /index.html)
- Node.js 18 environment

### Environment Variables

No environment variables are required for this standalone version.

## Project Structure

```
profile-test-standalone/
├── src/
│   ├── components/
│   │   └── QRCodeModal.tsx      # QR code modal component
│   ├── hooks/
│   │   └── use-toast.tsx        # Toast notification hook
│   ├── lib/
│   │   └── validation.ts        # Form validation utilities
│   ├── App.tsx                  # Main app component
│   ├── ProfilePage.tsx          # Profile page component
│   ├── main.tsx                 # React entry point
│   └── index.css                # Global styles with Tailwind
├── public/                      # Static assets
├── index.html                   # HTML template
├── netlify.toml                 # Netlify configuration
├── package.json                 # Dependencies
├── vite.config.ts               # Vite configuration
├── tailwind.config.js           # Tailwind configuration
└── tsconfig.json                # TypeScript configuration
```

## Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Features Overview

### Form Tabs

1. **Personal Info**: Name, nationality, IC/passport, gender, DOB, shirt size
2. **Address**: Street address, city, state, postcode, country, transport options
3. **Photos**: Full body photos, half body photos (max 4)
4. **Skills & Education**: Education level, field of study, experience, skills, languages
5. **Bank Details**: Bank name, account number, account holder name

### Validation Rules

- All required fields marked with red asterisk (*)
- IC number format: YYMMDD-XX-XXXX
- Phone number format: 60X-XXXX-XXXX
- Email format: standard email validation
- Real-time validation feedback

### Keyboard Shortcuts

- **Alt + Right Arrow**: Next tab
- **Alt + Left Arrow**: Previous tab

## Customization

### Colors

Edit `src/ProfilePage.tsx` to change theme colors:
- Background: `#e5e7eb` (gray)
- Primary: `black`
- Accent: Various gradients

### Form Fields

Add/remove fields by editing the tab components in `src/ProfilePage.tsx`:
- `InfoTab`
- `AddressTab`
- `PhotosTab`
- `SkillsTab`
- `BankTab`

### Validation

Customize validation rules in `src/lib/validation.ts`

## Troubleshooting

### Build Errors

If you encounter build errors:

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf .vite

# Try building again
npm run build
```

### Deployment Issues

If deployment fails on Netlify:

1. Check Node version is set to 18 in `netlify.toml`
2. Verify build command runs locally: `npm run build`
3. Check Netlify build logs for specific errors
4. Ensure all dependencies are in `package.json`

## License

This is a test page for internal use only.

## Support

For issues or questions, contact your development team.
