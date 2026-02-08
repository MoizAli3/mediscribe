import os
import json
import datetime
import time
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from passlib.context import CryptContext
from jose import JWTError, jwt
from pydantic import BaseModel
import google.generativeai as genai
from dotenv import load_dotenv

# --- CONFIG ---
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

SECRET_KEY = "hackathon-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 300

# --- DATABASE ---
SQLALCHEMY_DATABASE_URL = "sqlite:///./medical.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- MODELS ---
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    full_name = Column(String)
    hashed_password = Column(String)

class Consultation(Base):
    __tablename__ = "consultations"
    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("users.id"))
    date = Column(DateTime, default=datetime.datetime.utcnow)
    symptoms = Column(Text)
    diagnosis = Column(String)
    treatment = Column(Text)
    prescriptions = Column(Text)
    safety_warning = Column(String, nullable=True) # <--- NEW FIELD

Base.metadata.create_all(bind=engine)

# --- SECURITY ---
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None: raise HTTPException(status_code=401, detail="Invalid credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user = db.query(User).filter(User.email == email).first()
    if user is None: raise HTTPException(status_code=401, detail="User not found")
    return user

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://mediscribe-project.vercel.app"], # Add your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- AUTH ROUTES ---
class UserRegister(BaseModel):
    email: str
    password: str
    full_name: str

@app.post("/register")
def register(user: UserRegister, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pw = pwd_context.hash(user.password)
    new_user = User(email=user.email, hashed_password=hashed_pw, full_name=user.full_name)
    db.add(new_user)
    db.commit()
    return {"message": "User created successfully"}

@app.post("/token")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not pwd_context.verify(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": user.email})
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user_name": user.full_name,
        "user_email": user.email
    }

# --- AI ROUTE ---
@app.post("/analyze-consultation")
async def analyze_consultation(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    temp_filename = f"temp_{int(time.time())}_{file.filename}"
    try:
        with open(temp_filename, "wb") as buffer:
            buffer.write(await file.read())

        audio_file = genai.upload_file(path=temp_filename)
        while audio_file.state.name == "PROCESSING":
            time.sleep(1)
            audio_file = genai.get_file(audio_file.name)

        model = genai.GenerativeModel("gemini-2.5-flash")
        

        # --- THE MAGIC PROMPT (TRANSLATION + EXTRACTION) ---
        prompt = """
        You are an expert medical AI assistant. 
        The doctor and patient may speak in **Hindi, Urdu, English, or a mix (Hinglish)**.
        
        YOUR TASK:
        1. Listen carefully and **TRANSLATE** everything into **Professional Medical English**.
        2. Convert local terms to medical terms (e.g., "Bukhar" -> "Fever", "Saans fulna" -> "Dyspnea").
        3. Extract the structured details into JSON.

        CRITICAL SAFETY CHECK:
        Check prescriptions for Drug-Drug Interactions. If found, add a 'safety_warning'.

        Output strictly valid JSON:
        { 
          "patient_symptoms": ["List of symptoms in English"], 
          "diagnosis": "Diagnosis in English", 
          "treatment_plan": "Detailed instruction in English", 
          "prescriptions": [
             {"medication": "name", "dosage": "amt", "frequency": "freq (e.g. twice daily)", "duration": "dur"}
          ],
          "safety_warning": "Warning text in English or null"
        }
        """
        
        response = model.generate_content([audio_file, prompt], generation_config={"response_mime_type": "application/json"})
        
        text = response.text.strip()
        if text.startswith("```json"): text = text[7:-3]
        data = json.loads(text)

        # Save to DB
        new_consultation = Consultation(
            doctor_id=current_user.id,
            diagnosis=data.get('diagnosis', 'Pending'),
            symptoms=json.dumps(data.get('patient_symptoms', [])),
            treatment=data.get('treatment_plan', 'Pending'),
            prescriptions=json.dumps(data.get('prescriptions', [])),
            safety_warning=data.get('safety_warning') # Save Warning
        )
        db.add(new_consultation)
        db.commit()
        
        genai.delete_file(audio_file.name)
        os.remove(temp_filename)

        return data

    except Exception as e:
        if os.path.exists(temp_filename): os.remove(temp_filename)
        print(f"❌ Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/history")
def get_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Fetch all consultations for this doctor, ordered by newest first
    consultations = db.query(Consultation).filter(
        Consultation.doctor_id == current_user.id
    ).order_by(Consultation.date.desc()).all()
    
    # Parse the JSON strings back to lists/objects for the frontend
    history_data = []
    for c in consultations:
        history_data.append({
            "id": c.id,
            "date": c.date,
            "diagnosis": c.diagnosis,
            "symptoms": json.loads(c.symptoms),
            "treatment": c.treatment,
            "prescriptions": json.loads(c.prescriptions),
            "safety_warning": c.safety_warning
        })
        
    return history_data