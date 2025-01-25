# RAG System Frontend

A React-based frontend application that allows users to create RAG (Retrieval-Augmented Generation) instances by submitting their email and Google Drive URLs. The application interfaces with a Flask backend service to process the submissions.

## Prerequisites
- Node.js (v14.0.0 or higher)
- npm (v6.0.0 or higher)
- Running instance of the RAG backend service

## Quick Start

1. Install dependencies:
bash
npm install
npm install react-icons
npm install @clerk/clerk-react
npm install react-router-dom
npm install --save-dev typescript @types/react @types/react-dom @types/node

2. Configure environment:
   Create a `.env` file in the client directory:
REACT_APP_API_URL=http://your-backend-url:5000

Replace `your-backend-url` with your actual backend server address.

## Running the Application

To start the development server:
bash
npm start

The application will be available at `http://localhost:3000`

## Project Structure
client/
├── src/
│ ├── components/
│ │ ├── RagForm.js
│ │ └── RagForm.css
│ ├── App.js
│ ├── App.css
│ └── index.js
├── .env
├── package.json
└── README.md


## Usage

1. Open the application in your web browser
2. Enter your email address in the email field
3. Enter the Google Drive URL in the URL field
4. Click Submit
5. Wait for the confirmation message

## Development

### Environment Variables

The following environment variables are required:

- `REACT_APP_API_URL`: The URL of your backend API server

### Making Changes

1. Components are located in the `src/components` directory
2. Styles are in corresponding `.css` files
3. Main application logic is in `App.js`

## Building for Production

To create a production build:
bash
npm run build


This will create a `build` directory with optimized production files.

## Troubleshooting

Common issues and solutions:

1. **API calls failing**
   - Check if the backend server is running
   - Verify the `REACT_APP_API_URL` in `.env` file
   - Check browser console for CORS errors

2. **Form submission not working**
   - Check browser console for errors
   - Verify network tab in developer tools
   - Ensure backend URL is correctly configured

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details

## Contact
founder.datacorp@gmail.com