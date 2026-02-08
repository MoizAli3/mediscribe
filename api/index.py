import sys
import os

# Root directory ko system path mein add karein
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.main import app