import sys
import os

# Backend folder ko system path mein add karein taaki Python use dhund sake
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.main import app