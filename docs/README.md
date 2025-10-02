# Baito-AI Documentation

Welcome to the comprehensive documentation for Baito-AI, a talent management and e-invoice system designed for event-based businesses.

## 📚 Documentation Overview

This documentation suite provides complete guidance for all users, from end-users to system administrators and developers.

### Available Documents

| Document | Audience | Description |
|----------|----------|-------------|
| **[User Guide](USER_GUIDE.md)** | All Users | Comprehensive guide for using all platform features |
| **[Admin Manual](ADMIN_MANUAL.md)** | System Administrators | Complete system administration and management guide |
| **[Quick Start Guide](QUICK_START_GUIDE.md)** | New Users | Get started in 5 minutes with essential features |
| **[API Documentation](API_DOCUMENTATION.md)** | Developers/Integrators | Complete API reference and integration guide |

---

## 🎯 Platform Overview

Baito-AI is a comprehensive talent management and e-invoice system specifically designed for event-based businesses. The platform streamlines the entire workflow from project creation to staff management, expense processing, and financial reporting.

### Key Features

#### 🏢 Multi-Company Management
- Hierarchical company structures
- Parent-subsidiary relationships
- Company-specific branding and settings
- Cross-company resource sharing

#### 👥 Advanced User Roles
- **Super Admin**: Full system control across all companies
- **Admin**: Company-level administrative access
- **Manager**: Project and team management capabilities
- **Client**: Limited access to assigned projects
- **Staff**: Basic access for task and expense management

#### 📋 Project Management
- Multi-venue project support
- Recurring project schedules
- Real-time staff assignment
- Automatic conflict detection
- Budget tracking and management

#### 🎭 Talent Management
- Comprehensive candidate profiles
- IC number validation and verification
- Skills and experience tracking
- Performance metrics and loyalty programs
- Blacklist management for problematic candidates

#### 💰 Expense Claims & Payroll
- OCR-powered receipt processing
- Multi-level approval workflows
- DuitNow payment integration
- Automated payroll calculations
- Comprehensive financial reporting

#### 📅 Calendar & Scheduling
- Multi-view calendar (month, week, day)
- Staff availability management
- Conflict detection and resolution
- Calendar export and synchronization
- Mobile-optimized scheduling

#### 📄 Document Management
- Secure file storage and sharing
- OCR text extraction
- Version control and audit trails
- Role-based access control
- Mobile document capture

---

## 🚀 Getting Started

### For New Users
1. Start with the **[Quick Start Guide](QUICK_START_GUIDE.md)** for immediate productivity
2. Review the **[User Guide](USER_GUIDE.md)** for comprehensive feature coverage
3. Explore role-specific features based on your user role

### For Administrators
1. Review the **[Admin Manual](ADMIN_MANUAL.md)** for system setup and management
2. Configure user roles and permissions
3. Set up company structures and hierarchies
4. Configure integrations and security settings

### For Developers
1. Explore the **[API Documentation](API_DOCUMENTATION.md)** for integration possibilities
2. Review authentication and security requirements
3. Understand data models and relationships
4. Test with provided code examples

---

## 🔑 User Roles & Access

### Access Matrix
| Feature | Super Admin | Admin | Manager | Client | Staff |
|---------|-------------|-------|---------|--------|-------|
| **User Management** | ✅ Full | ✅ Company | ❌ | ❌ | ❌ |
| **Project Creation** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Staff Assignment** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Expense Approval** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Financial Reports** | ✅ | ✅ | ✅ Limited | ❌ | ❌ |
| **System Settings** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Project Visibility** | ✅ All | ✅ Company | ✅ Assigned | ✅ Associated | ✅ Assigned |
| **Expense Submission** | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Calendar Access** | ✅ Full | ✅ Company | ✅ Projects | ✅ Limited | ✅ Personal |

---

## 🛠 Technical Architecture

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: TailwindCSS + ShadCN UI
- **Backend**: Supabase (PostgreSQL + Real-time)
- **Authentication**: Supabase Auth (JWT)
- **File Storage**: Supabase Storage
- **Animations**: Framer Motion

### Key Integrations
- **Payment Systems**: DuitNow, Bank Transfers
- **Calendar Systems**: Google Calendar, Outlook, iCal
- **Communication**: SMTP Email, SMS Services
- **OCR Processing**: Receipt text extraction
- **Mobile Support**: Progressive Web App

---

## 🔒 Security Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- Row-level security (RLS)
- Session management and timeouts
- Password policies and complexity requirements

### Data Protection
- Encryption at rest and in transit
- Secure file upload and storage
- Audit logging for all operations
- Data retention and cleanup policies
- GDPR compliance features

### Access Control
- IP-based restrictions
- Two-factor authentication (2FA)
- Secure token-based candidate access
- Time-limited access tokens
- Comprehensive permission system

---

## 📊 Key Workflows

### Project Lifecycle
1. **Planning**: Project creation and requirements gathering
2. **Staffing**: Candidate search, application, and assignment
3. **Execution**: Real-time project management and monitoring
4. **Completion**: Final deliverables and performance evaluation
5. **Payment**: Expense processing and staff payments

### Candidate Journey
1. **Registration**: Profile creation and document upload
2. **Verification**: IC validation and background checks
3. **Application**: Project application and interview process
4. **Assignment**: Project assignment and confirmation
5. **Performance**: Ongoing performance tracking and feedback

### Expense Management
1. **Incurrence**: Staff incurs project-related expenses
2. **Documentation**: Receipt collection and upload
3. **Submission**: Expense claim creation and submission
4. **Approval**: Multi-level approval workflow
5. **Payment**: Automated payment processing

---

## 📱 Mobile Experience

### Progressive Web App (PWA)
- **Installable**: Can be installed on mobile devices
- **Offline Capable**: Basic functionality works offline
- **Push Notifications**: Real-time notifications
- **Camera Integration**: Direct photo upload for receipts
- **Touch Optimized**: Mobile-friendly interface

### Mobile Features
- **Quick Actions**: One-tap common operations
- **Location Services**: GPS integration for venue check-ins
- **Voice Notes**: Audio notes for project updates
- **QR Code Scanning**: Quick candidate and asset identification
- **Biometric Authentication**: Fingerprint and face recognition

---

## 🔧 Customization & Configuration

### Company Branding
- Custom logos and color schemes
- Branded email templates
- Custom domain support
- White-label options
- Personalized user interfaces

### Workflow Customization
- Custom approval workflows
- Configurable business rules
- Flexible permission systems
- Custom fields and forms
- Automated notifications and alerts

---

## 📈 Analytics & Reporting

### Built-in Reports
- **Project Performance**: Timeline, budget, and resource utilization
- **Staff Analytics**: Performance metrics and utilization rates
- **Financial Reports**: Revenue, expenses, and profitability
- **Operational Metrics**: Efficiency and productivity indicators
- **Compliance Reports**: Audit trails and regulatory compliance

### Custom Dashboards
- **Role-based Dashboards**: Customized for user roles
- **Real-time Metrics**: Live performance indicators
- **Interactive Charts**: Drill-down capabilities
- **Export Options**: PDF, Excel, and CSV exports
- **Scheduled Reports**: Automated report generation

---

## 🆘 Support & Resources

### Getting Help
- **Documentation**: Comprehensive guides and references
- **In-App Help**: Contextual help and tooltips
- **Video Tutorials**: Step-by-step video guides
- **Community Forums**: User discussion and support
- **Professional Support**: Direct technical assistance

### Training Resources
- **Onboarding Program**: Structured training for new users
- **Role-Specific Training**: Customized training paths
- **Best Practices**: Industry-proven methodologies
- **Certification Programs**: User competency certification
- **Regular Webinars**: Feature updates and training sessions

### Support Channels
- **Email Support**: support@baito-ai.com
- **In-App Chat**: Real-time chat support
- **Phone Support**: Business hours phone support
- **Emergency Support**: 24/7 critical issue support
- **Professional Services**: Implementation and consulting

---

## 🔄 Updates & Maintenance

### Regular Updates
- **Feature Releases**: Monthly feature updates
- **Security Patches**: Immediate security fixes
- **Performance Improvements**: Ongoing optimization
- **Bug Fixes**: Regular issue resolution
- **API Enhancements**: Continuous API improvements

### Maintenance Windows
- **Scheduled Maintenance**: Pre-announced maintenance windows
- **Emergency Maintenance**: Critical issue resolution
- **Performance Optimization**: System performance tuning
- **Database Maintenance**: Regular database optimization
- **Security Updates**: Proactive security enhancements

---

## 📞 Contact Information

### Technical Support
- **Email**: support@baito-ai.com
- **Phone**: +60 X-XXXX XXXX (Business Hours)
- **Emergency**: 24/7 critical support hotline
- **Chat**: In-application chat support

### Sales & Business
- **Email**: sales@baito-ai.com
- **Demo Requests**: Schedule product demonstrations
- **Custom Solutions**: Enterprise and custom implementations
- **Partnership Inquiries**: Integration and partnership opportunities

### Development & API
- **Developer Portal**: API documentation and resources
- **GitHub**: Open source components and examples
- **Stack Overflow**: Community-driven development support
- **Technical Forums**: Developer community discussions

---

*This documentation is continuously updated. Please check regularly for the latest information and features.*