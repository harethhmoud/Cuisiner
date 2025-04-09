# Cuisiner Frontend

Mobile-first social network for serious home cooks. This is the frontend React Native application built with Expo.

## Features

- Recipe database with search and filtering capabilities
- Meal planning with a simplified Gantt chart (timeline view)
- User profiles with followers/following functionality
- Social feed for sharing food photos and recipes
- Likes, comments, and interactions

## Tech Stack

- React Native (with Expo)
- TypeScript
- React Navigation
- React Native Paper (UI components)
- Firebase Authentication
- Axios for API requests
- React Hook Form for form management
- React Native SVG and Chart Kit for Gantt charts

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator (optional)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
cd cuisiner-frontend
npm install
```

3. Create an environment file:

```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration values

### Running the App

```bash
# Start the development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on web
npm run web
```

## Project Structure

```
src/
├── assets/         # Images, icons, and other static assets
├── components/     # Reusable components
│   ├── auth/       # Authentication-related components
│   ├── recipe/     # Recipe-related components
│   ├── meal-planner/ # Meal planning components
│   ├── social/     # Social feed components
│   └── profile/    # User profile components
├── screens/        # Full screens in the app
├── navigation/     # Navigation configuration
├── services/       # API and third-party services
├── utils/          # Utility functions
├── hooks/          # Custom React hooks
├── contexts/       # React context providers
└── types/          # TypeScript type definitions
```

## Development Guidelines

- Follow the established folder structure
- Use TypeScript for all files
- Use React Navigation for screen navigation
- Use React Native Paper components for UI consistency
- Add proper types for all components and functions
- Follow the established component naming conventions
- Test on both iOS and Android before submitting PRs

## License

[MIT License](LICENSE) 