# 🐦 AI Tweet Generator

Generate viral tweets in seconds using AI. Powered by LLaMA 3 and Groq.

![AI Tweet Generator](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

## ✨ Features

- 🚀 **Multiple Tweet Styles**: Viral, Professional, Casual, and Twitter Thread formats
- 🎯 **Smart Customization**: Toggle hashtags and emojis
- 📋 **One-Click Copy**: Copy tweets to clipboard instantly
- 🐦 **Direct Twitter Integration**: Post directly to Twitter
- 🌓 **Dark Mode**: Beautiful dark and light themes
- ⚡ **Lightning Fast**: Powered by Groq's ultra-fast API
- 💯 **100% Free**: No API costs with Groq's generous free tier

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- A free Groq API key (get one at [groq.com](https://groq.com))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ai-tweet-generator.git
   cd ai-tweet-generator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up your Groq API key**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your Groq API key:
   ```bash
   VITE_GROQ_API_KEY=your_groq_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 19** | UI Framework |
| **TypeScript** | Type Safety |
| **Vite** | Build Tool |
| **Tailwind CSS** | Styling |
| **shadcn/ui** | UI Components |
| **Lucide React** | Icons |
| **Groq API** | LLaMA 3 AI Model |

## 📦 Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## 🌐 Deployment

### Deploy to Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Add Environment Variable**
   - In Vercel dashboard, go to Project Settings → Environment Variables
   - Add: `VITE_GROQ_API_KEY` with your Groq API key

### Deploy to Netlify

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy the `dist` folder** via Netlify's dashboard or CLI

3. **Add Environment Variable** in Netlify dashboard:
   - Key: `VITE_GROQ_API_KEY`
   - Value: Your Groq API key

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_GROQ_API_KEY` | Your Groq API key | Yes |

### Getting a Free Groq API Key

1. Go to [groq.com](https://groq.com)
2. Sign up for a free account
3. Navigate to Dashboard → API Keys
4. Create a new API key
5. Copy and paste it into your `.env` file

**Note**: Groq's free tier is very generous and suitable for personal projects!

## 📁 Project Structure

```
ai-tweet-generator/
├── src/
│   ├── components/
│   │   ├── ui/           # shadcn/ui components
│   │   └── theme-provider.tsx
│   ├── lib/
│   │   ├── api.ts        # Groq API integration
│   │   └── utils.ts      # Utilities
│   ├── App.tsx           # Main application
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles
├── public/               # Static assets
├── index.html            # HTML template
├── vite.config.ts        # Vite configuration
├── tailwind.config.js    # Tailwind configuration
└── package.json          # Dependencies
```

## 🎨 Customization

### Add New Tweet Styles

Edit `src/lib/api.ts` and add to the `stylePrompts` object:

```typescript
const stylePrompts = {
  // ...existing styles
  custom: "your custom style description",
};
```

### Modify AI Prompts

The prompt engineering happens in `src/lib/api.ts` within the `generateTweet` function. Feel free to experiment with different prompts to get different results!

## 🤝 Contributing

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - feel free to use this project for anything!

## 🙏 Acknowledgments

- [Groq](https://groq.com) for the lightning-fast AI API
- [LLaMA 3](https://ai.meta.com/llama/) by Meta for the amazing language model
- [shadcn/ui](https://ui.shadcn.com/) for the beautiful component library
- [Vite](https://vitejs.dev/) for the blazing-fast build tool

---

Built with ❤️ by [Elijah N. De Los Santos](https://github.com/yourusername)
