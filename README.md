# 🔄 Advanced Subscription Tracker

A comprehensive web application built with **Next.js 15**, **React 18**, **TypeScript**, and **Tailwind CSS** for managing and tracking recurring subscriptions with advanced features like budgeting, duplicate detection, bulk operations, and more.

## ✨ Features

### 🔐 **Authentication & User Management**
- **NextAuth.js** integration with credentials provider
- Secure password hashing with bcryptjs
- Sign up and sign in pages with validation
- Session management and protected routes

### 🎯 **Core Subscription Management**
- ➕ Add, edit, and delete subscriptions
- 📊 Track amount, billing frequency, and next billing dates
- 🏷️ Categorize subscriptions (Entertainment, Productivity, etc.)
- ⏸️ Pause, activate, or cancel subscriptions
- 🔍 Advanced search and filtering capabilities

### 💰 **Budget Management & Spending Alerts**
- 📈 Create category-specific and global budgets
- 🚨 Real-time budget tracking with visual indicators
- ⚠️ Over-budget and near-limit warnings
- 📊 Spending progress bars with color-coded alerts
- 💡 Budget recommendations based on spending patterns

### 🔍 **Smart Duplicate Detection**
- 🤖 AI-powered similarity algorithm using Levenshtein distance
- 📊 Multi-factor matching (name, amount, category, website, billing frequency)
- 🔄 Interactive merge or dismiss options
- 💾 Persistent dismissal tracking

### ⚡ **Bulk Operations**
- ✅ Multi-select with checkboxes
- 🗑️ Bulk delete, pause, activate operations
- 📤 Bulk export functionality
- ⚡ Confirmation dialogs for destructive actions
- 📊 Selection statistics and status indicators

### ⌨️ **Keyboard Shortcuts & Accessibility**
- 🚀 Comprehensive keyboard navigation
- ⌨️ Global shortcuts (N=new, S=search, T=theme, 1-5=tabs)
- ❓ Built-in shortcuts help dialog
- ♿ Full accessibility support

### 🎨 **Theme & UI/UX**
- 🌙 Dark/Light/System theme support
- 📱 Fully responsive mobile-first design
- 🎨 Modern UI with Radix UI components
- 🔔 Toast notifications with Sonner
- 📊 Interactive charts and analytics

### 📊 **Analytics & Insights**
- 📈 Spending trends and patterns
- 📅 Calendar view for upcoming bills
- 💸 Monthly and yearly spending projections
- 🔔 Notifications for upcoming charges
- 📊 Category-wise spending breakdown

### 💾 **Data Management**
- 🗄️ SQLite database with Prisma ORM
- 📤 Export data (JSON format)
- 💾 Local storage backup
- 🔄 Data persistence and migration support

## 🛠️ Tech Stack

### **Frontend**
- **Next.js 15** - React framework with App Router
- **React 18** - UI library with latest features
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Lucide React** - Beautiful icons

### **Backend & Database**
- **Prisma** - Modern database toolkit
- **SQLite** - Lightweight database
- **NextAuth.js** - Authentication solution
- **bcryptjs** - Password hashing

### **State Management & Forms**
- **React Hook Form** - Performant forms
- **Zod** - Schema validation
- **React Hooks** - Custom hooks for keyboard shortcuts

### **UI/UX Libraries**
- **Sonner** - Toast notifications
- **react-hotkeys-hook** - Keyboard shortcuts
- **Class Variance Authority** - Component variants

## 🚀 Getting Started

### **Prerequisites**
- Node.js 18+ and npm
- Git

### **Installation**
```bash
# Clone the repository
git clone <repository-url>
cd subscription-tracker

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Generate Prisma client and set up database
npx prisma generate
npx prisma db push

# Start the development server
npm run dev
```

### **Environment Variables**
Create a `.env` file with:
```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

## 📖 Usage Guide

### **Basic Operations**
1. **Add Subscription**: Click the "Add Subscription" button or press `N`
2. **Search**: Use the search bar or press `S` to focus
3. **Filter**: Use category and status filters
4. **Edit**: Click on any subscription card to edit
5. **Delete**: Use the delete button or bulk operations

### **Keyboard Shortcuts**
- `N` - New subscription
- `S` - Focus search
- `T` - Toggle theme
- `1-5` - Switch tabs
- `Ctrl+A` - Select all
- `Delete` - Delete selected
- `Ctrl+E` - Export data
- `?` - Show shortcuts help
- `Escape` - Clear selections/close modals

### **Budget Management**
1. Go to the "Budgets" tab
2. Create category-specific or global budgets
3. Set monthly spending limits
4. Monitor progress with visual indicators
5. Receive alerts when approaching limits

### **Bulk Operations**
1. Select multiple subscriptions using checkboxes
2. Use the bulk actions toolbar
3. Choose from delete, pause, activate, or export
4. Confirm destructive actions in the dialog

## 🎨 Component Architecture

### **Core Components**
- `page.tsx` - Main application with state management
- `SubscriptionCard` - Individual subscription display
- `SubscriptionForm` - Add/edit subscription form
- `BudgetManager` - Budget creation and management
- `DuplicateDetector` - Smart duplicate detection
- `BulkActions` - Multi-select operations
- `Analytics` - Charts and insights
- `CalendarView` - Calendar-based bill tracking

### **UI Components**
- Complete Radix UI component library
- Custom theme provider with system theme support
- Responsive design components
- Accessibility-first components

### **Hooks**
- `useKeyboardShortcuts` - Global keyboard navigation
- Custom hooks for data management

## 🔒 Security Features

- **Password Security**: bcryptjs hashing with salt
- **Session Management**: Secure NextAuth.js sessions
- **Input Validation**: Zod schema validation
- **XSS Protection**: React's built-in protections
- **CSRF Protection**: NextAuth.js CSRF tokens

## 📱 Mobile Experience

- **Responsive Design**: Mobile-first approach
- **Touch-Friendly**: Large tap targets and gestures
- **Adaptive UI**: Hidden/collapsed elements on smaller screens
- **Mobile Navigation**: Tab reorganization for mobile
- **Performance**: Optimized for mobile networks

## 🧪 Testing & Development

### **Available Scripts**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

### **Database Commands**
```bash
npx prisma studio    # Database GUI
npx prisma generate  # Generate client
npx prisma db push   # Push schema changes
npx prisma migrate   # Create migrations
```

## 🔧 Configuration

### **Theme Configuration**
- Supports system, light, and dark themes
- Customizable color schemes in `globals.css`
- Persistent theme preferences

### **Database Schema**
- User management with authentication
- Subscription tracking with relationships
- Budget and spending management
- Notification and alert system
- Audit trails and timestamps

## 🚀 Performance Optimizations

- **Next.js App Router**: Server-side rendering and static generation
- **Code Splitting**: Automatic route-based splitting
- **Image Optimization**: Next.js Image component
- **Bundle Analysis**: Webpack bundle analyzer
- **Database Indexing**: Optimized Prisma queries

## 📈 Analytics & Insights

- **Spending Trends**: Monthly and yearly analysis
- **Category Breakdown**: Pie charts and bar graphs
- **Billing Calendar**: Visual upcoming bills
- **Budget vs Actual**: Comparison charts
- **Growth Tracking**: Subscription growth over time

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Radix UI** - For excellent accessible components
- **Tailwind CSS** - For the utility-first CSS framework
- **Next.js Team** - For the amazing React framework
- **Prisma** - For the modern database toolkit
- **Lucide** - For beautiful icons

---

**Made with ❤️ using Next.js, TypeScript, and modern web technologies**
