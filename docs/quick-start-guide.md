# R U Socrates — Quick Start Guide

> Get up and running in 5 minutes

---

## System Requirements

### Required
- **Node.js**: 18.x or later
- **npm**: 9.x or later
- **Python**: 3.10 or later
- **Git**: Latest version
- **OpenAI API Key** (or compatible LiteLLM provider)

### Recommended
- Modern browser (Chrome, Firefox, Safari, Edge)
- 8GB+ RAM
- 10GB+ free disk space

---

## Installation Steps

### Windows

1. **Install Dependencies**
   ```powershell
   # Install Node.js from https://nodejs.org/
   # Install Python from https://www.python.org/
   ```

2. **Clone the Repository**
   ```powershell
   git clone https://github.com/zbbsdsb/R-U-Socrates.git
   cd R-U-Socrates
   ```

3. **Install Frontend**
   ```powershell
   cd apps/web
   npm install
   ```

4. **Install Backend**
   ```powershell
   cd ../../services
   pip install -r requirements.txt
   ```

### macOS

1. **Install Dependencies**
   ```bash
   # Install Homebrew (if needed)
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

   # Install Node.js and Python
   brew install node python
   ```

2. **Clone the Repository**
   ```bash
   git clone https://github.com/zbbsdsb/R-U-Socrates.git
   cd R-U-Socrates
   ```

3. **Install Frontend**
   ```bash
   cd apps/web
   npm install
   ```

4. **Install Backend**
   ```bash
   cd ../../services
   pip install -r requirements.txt
   ```

---

## 5-Minute Quick Start Tutorial

### Step 1: Configure API Key (1 minute)

Create a `.env` file in `services/api/`:
```env
# OpenAI
OPENAI_API_KEY=sk-your-api-key-here

# Or DeepSeek
DEEPSEEK_API_KEY=sk-your-deepseek-key

# Or Anthropic
ANTHROPIC_API_KEY=sk-ant-your-key
```

### Step 2: Start the Backend (1 minute)

Open Terminal 1:
```bash
cd services/api
uvicorn main:app --reload --port 8000
```

Wait until you see: `Uvicorn running on http://0.0.0.0:8000`

### Step 3: Start the Frontend (1 minute)

Open Terminal 2:
```bash
cd apps/web
npm run dev
```

Wait until you see: `Local: http://localhost:3000`

### Step 4: Create Your First Task (2 minutes)

1. Open [http://localhost:3000](http://localhost:3000) in your browser
2. Click **New Task**
3. Enter a task like: "Write a Python script to calculate Pi"
4. Click **Start**
5. Watch the L1 Live Reasoning Feed, L2 Reasoning Tree, and L3 Score Journey!

---

## Next Steps

- Explore the [Developer Guide](./developer-guide.md)
- Check out the [Roadmap](./roadmap.md)
- Contribute to the project!
- Ask questions in [GitHub Discussions](https://github.com/zbbsdsb/R-U-Socrates/discussions)

---

## Troubleshooting

### Frontend won't start
- Make sure port 3000 is not in use
- Delete `node_modules` and `package-lock.json`, then `npm install`

### Backend won't start
- Make sure port 8000 is not in use
- Verify Python dependencies are installed
- Check your API key is correct

### LLM errors
- Verify your API key has quota
- Try a different model or provider
- Check LiteLLM documentation

---

## Need Help?

Check the [FAQ](./faq.md) or open a [GitHub Issue](https://github.com/zbbsdsb/R-U-Socrates/issues).
