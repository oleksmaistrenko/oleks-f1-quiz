# F1 Quiz Application

A simple quiz application built with React and Firebase to create and take quizzes related to Formula 1 racing.

## Features

- Create custom quizzes with multiple choice questions
- Set time limits for quiz completion
- Take quizzes and get immediate scoring
- Admin panel for managing quizzes
- Firebase integration for database storage

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Firebase Setup

Before running the application, you need to set up Firebase:

1. Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Enable Firestore database
3. In the Firebase console, navigate to Project Settings and get your Web SDK configuration
4. Update the `firebaseConfig` object in `src/firebase.js` with your actual configuration values

## Project Structure

- `/src/components/QuizGame.js` - Main quiz-taking component
- `/src/components/QuizAdmin.js` - Admin interface for creating and managing quizzes
- `/src/firebase.js` - Firebase configuration and initialization
- `/src/App.js` - Main application component with routing

## Application Routes

- `/` - Default route that shows the first available quiz
- `/quiz/:id` - Route to access a specific quiz by ID
- `/admin` - Admin interface for creating and managing quizzes

## Deployment

This application can be deployed to Firebase Hosting:

```bash
npm install -g firebase-tools
firebase login
firebase init
npm run build
firebase deploy
```

For more deployment options, see the [Create React App documentation](https://facebook.github.io/create-react-app/docs/deployment).
