# 🏥 PulseScript AI - Intelligent Medical Scribe

> **Bridging the gap between Doctor's voice and Digital Records.**
> *Transforming Multilingual Consultations into Professional Medical Prescriptions in Real-Time.*

[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-blue?logo=github)](https://github.com/MoizAli3/mediscribe.git)
[![Tech Stack](https://img.shields.io/badge/Tech-Next.js%20%7C%20FastAPI%20%7C%20Gemini%20AI-green)]()

---

## 🚀 The Problem
In many regions (like India & Pakistan), doctors consult patients in local languages (**Hindi, Urdu, Hinglish**), but medical records must be maintained in **Global English Standards**.
- Manual data entry during consultations breaks the doctor-patient connection.
- Language barriers lead to documentation errors.
- Lack of immediate drug interaction checks risks patient safety.

## 💡 The Solution
**PulseScript AI** is a smart medical assistant that listens to the doctor-patient conversation, understands mixed languages (Hindi/Urdu + English), and automatically generates a structured, professional **Clinical Note & Prescription** in English.

---

## ✨ Key Features

- 🎙️ **Multilingual Voice Recognition:** Understands Hindi, Urdu, and English (Hinglish) seamlessly.
- 📝 **Auto-Translation & Transcription:** Converts local language audio (e.g., *"Bukhar hai"*) into standard Medical English terms (*"Fever"*).
- 💊 **Smart Prescription Generation:** Extracts medicines, dosage, frequency, and duration automatically.
- ⚠️ **AI Safety Guard:** Detects **Drug-Drug Interactions** and instantly warns the doctor if a combination is unsafe.
- 📂 **Patient History:** Securely stores and retrieves past consultations for follow-ups.
- 🖨️ **One-Click Print:** Generates a professional PDF-ready format for printing prescriptions.
- 📊 **Analytics Dashboard:** Visualizes patient trends and weekly clinic statistics.
- 🌗 **Modern UI:** Clean, responsive interface built with Next.js & Tailwind CSS.

---

## 🛠️ Tech Stack

| Component | Technology |
| :--- | :--- |
| **Frontend** | Next.js 14 (App Router), Tailwind CSS, Lucide React, Recharts |
| **Backend** | FastAPI (Python), Uvicorn |
| **Database** | SQLite (SQLAlchemy ORM) |
| **AI Model** | Google Gemini 2.5 Flash (Generative AI) |
| **Authentication** | JWT (OAuth2 Password Bearer) |
| **HTTP Client** | Axios |

---

## ⚙️ Installation & Setup

Follow these simple steps to run the project locally.

### 1️⃣ Clone the Repository
```bash
git clone [https://github.com/MoizAli3/mediscribe.git](https://github.com/MoizAli3/mediscribe.git)
cd mediscribe

cd backend

# Create Virtual Environment (Optional but Recommended)
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install All Dependencies directly
pip install fastapi uvicorn sqlalchemy google-generativeai python-dotenv python-multipart python-jose[cryptography] passlib[bcrypt]

GEMINI_API_KEY=your_google_gemini_api_key_here
SECRET_KEY=supersecretkey123
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

uvicorn main:app --reload

cd frontend

# Install Dependencies
npm install

# Run the Development Server
npm run dev
