# 🏁 Endurance Racing Pit Strategy App

A comprehensive 24-hour endurance racing pit strategy management application built with React, TypeScript, and Material Design 3.

![Endurance App](https://img.shields.io/badge/Racing-Endurance%20Strategy-red?style=for-the-badge)
![React](https://img.shields.io/badge/React-19.1.0-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue?style=for-the-badge&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7.0.4-646CFF?style=for-the-badge&logo=vite)

## 🚀 Features

### 🏎️ **Race Management**
- ⏱️ Real-time race timer with 24-hour support
- 🏁 Start, pause, and stop race controls
- 🚨 FCY (Full Course Yellow) period management
- 📊 Live stint timing and fuel calculations

### 🛠️ **Pit Strategy**
- 🔧 Intelligent pit stop planning
- ⛽ Fuel range optimization (30-300 minutes)
- 👥 Driver rotation management
- 📈 FCY opportunity detection
- 🎯 Strategic pit window calculations

### 👨‍💼 **Team Management**
- 🏢 Multiple team support
- 👥 Driver lineup configuration
- 🔄 Drag & drop driver assignment
- 📋 Team-specific strategies

### 🎨 **User Experience**
- 🌙 Dark mode Material Design 3 UI
- 📱 Fully responsive (mobile, tablet, desktop)
- ⚡ Real-time updates with smooth animations
- 🎯 Intuitive click-to-edit interface
- ♿ Accessibility-focused design

## 🖥️ **Live Demo**

Try the app: [Live Demo](https://your-deployment-url.vercel.app) *(Coming soon)*

## 📸 **Screenshots**

### Race Configuration
![Race Setup](docs/images/race-setup.png) *(Coming soon)*

### Live Race Management
![Live Race](docs/images/live-race.png) *(Coming soon)*

### Pit Stop Dialog
![Pit Stop](docs/images/pit-stop.png) *(Coming soon)*

## 🛠️ **Installation & Setup**

### Prerequisites
- **Node.js** 18+ 
- **npm** or **yarn**

### Quick Start
```bash
# Clone the repository
git clone https://github.com/your-username/endurance-app.git
cd endurance-app

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173
```

### Build for Production
```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

## 🧪 **Testing**

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run verbose tests with detailed output
npm run test:verbose
```

### Test Coverage
- ✅ **Race Configuration** - Team setup, validation, form handling
- ✅ **Race Operations** - Start/pause/stop, timer functionality  
- ✅ **Pit Stop Management** - Dialog flow, strategy calculations
- ✅ **Team Management** - Driver assignment, team operations
- ✅ **Error Handling** - Input validation, edge cases
- ✅ **Accessibility** - Form labels, keyboard navigation

## 🚀 **Deployment**

### Easy Deployment Options

#### Vercel (Recommended)
```bash
# Deploy to Vercel
chmod +x deploy-fixed.sh
./deploy-fixed.sh
```

#### Netlify Drop
```bash
# Build for Netlify
chmod +x deploy-netlify.sh
./deploy-netlify.sh

# Then drag 'dist' folder to netlify.com
```

#### GitHub Pages
```bash
# Install and deploy to GitHub Pages
npm install --save-dev gh-pages
npm run deploy
```

## 🏁 **Usage Guide**

### Setting Up a Race
1. **Configure Race Details**
   - Set track name and race length (1-24 hours)
   - Define fuel range (30-300 minutes)
   - Set minimum pit stop time

2. **Set Up Teams**
   - Add team number and name
   - Configure driver lineup
   - Assign driver rotation (drag & drop)

3. **Start Racing**
   - Click "Start Race" to begin
   - Monitor real-time timing
   - Execute pit stops as needed

### During the Race
- **Pit Stops**: Click "PIT" button for any team
- **FCY Periods**: Toggle FCY to optimize pit strategies
- **Time Editing**: Click any time value to manually adjust
- **Strategy**: Monitor FCY buffer for optimal pit windows

## 🎯 **Key Racing Concepts**

### FCY (Full Course Yellow)
- **Purpose**: Simulates safety car periods
- **Strategy**: Ideal time for "free" pit stops
- **Buffer Zone**: App calculates optimal pit windows

### Stint Planning
- **Fuel Range**: Maximum time between pit stops
- **Driver Rotation**: Automated or custom assignment
- **Strategic Timing**: Balances fuel, drivers, and race position

## 🔧 **Technology Stack**

### Frontend
- **React 19.1.0** - UI framework
- **TypeScript 5.8.3** - Type safety
- **Vite 7.0.4** - Build tool
- **Tailwind CSS 3.4.17** - Styling
- **Lucide React 0.525.0** - Icons

### Testing
- **Jest 30.0.4** - Test framework
- **Testing Library** - React component testing
- **User Event 14.6.1** - User interaction testing

### Development
- **ESLint** - Code linting
- **PostCSS & Autoprefixer** - CSS processing
- **Babel** - JavaScript compilation

## 📁 **Project Structure**

```
endurance-app/
├── src/
│   ├── components/
│   │   └── __tests__/          # Component tests
│   ├── types.ts                # TypeScript definitions
│   ├── App.tsx                 # Main application
│   ├── main.tsx               # Application entry
│   └── setupTests.js          # Test configuration
├── public/                     # Static assets
├── dist/                      # Production build
├── test-results/              # Test output logs
├── docs/                      # Documentation
└── deploy scripts             # Deployment utilities
```

## 🤝 **Contributing**

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and add tests
4. **Run tests**: `npm test`
5. **Commit changes**: `git commit -m 'Add amazing feature'`
6. **Push to branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Development Guidelines
- Follow existing code style
- Add tests for new features  
- Update documentation as needed
- Ensure accessibility compliance

## 🐛 **Bug Reports & Feature Requests**

Found a bug or have a feature idea? 

- **Bug Reports**: [Create an issue](https://github.com/your-username/endurance-app/issues/new?template=bug_report.md)
- **Feature Requests**: [Request a feature](https://github.com/your-username/endurance-app/issues/new?template=feature_request.md)

## 📝 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

- **Material Design 3** - Design system inspiration
- **React Testing Library** - Testing best practices  
- **Endurance Racing Community** - Domain expertise and feedback
- **Open Source Contributors** - Various utility libraries

## 📊 **Roadmap**

### 🔜 **Coming Soon**
- [ ] Real-time data export (CSV/JSON)
- [ ] Multi-race session management
- [ ] Weather integration
- [ ] Tire strategy planning
- [ ] Team communication features

### 🎯 **Future Enhancements**
- [ ] Real-time data feeds integration
- [ ] Advanced analytics and reporting
- [ ] Mobile app version
- [ ] Multi-language support
- [ ] Cloud save/sync functionality

---

<div align="center">

**Built with ❤️ for the endurance racing community**

[Report Bug](https://github.com/your-username/endurance-app/issues) · [Request Feature](https://github.com/your-username/endurance-app/issues) · [Documentation](https://github.com/your-username/endurance-app/wiki)

</div>
