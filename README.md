# AI Form Builder

A modern, AI-powered form builder that makes creating and managing forms a breeze. Built with Next.js, Supabase, and OpenAI.

## Features

- 🤖 AI-powered form creation and response analysis
- 📝 Multiple question types (text, multiple-choice, true/false)
- 🔒 Secure form submissions with user authentication
- 📊 Response analytics and CSV export
- 🎯 Anonymous form submissions support
- 📱 Responsive design for all devices

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI Integration**: OpenAI API
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- OpenAI API key

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/ai-form-builder.git
   cd ai-form-builder
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file with the following variables:

   ```
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   OPENAI_API_KEY=your_openai_api_key
   ```

4. Run the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Creating Forms

1. Log in to your account
2. Click "Create New Form"
3. Enter your form title and description
4. Use the AI chat interface to generate questions or add them manually
5. Choose question types and options
6. Save your form

### Managing Forms

- View all your forms in the dashboard
- Edit form settings and questions
- Share forms via unique URLs
- View and analyze responses
- Export responses to CSV

### Responding to Forms

- Open the form URL
- Answer questions directly or use the AI chat for assistance
- Submit your responses
- View your submitted responses in "My Responses"

## Demo Video

[Watch the demo video](https://youtu.be/VNeVZrEQXb0)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue in the GitHub repository or contact us at [your-email@example.com](mailto:your-email@example.com).
