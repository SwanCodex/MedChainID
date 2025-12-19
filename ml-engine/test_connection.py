import os
import sys
from dotenv import load_dotenv

# Enhance path handling for Windows
if sys.platform.startswith('win'):
    # Add common Tesseract paths to PATH for this session
    common_paths = [
        r"C:\Program Files\Tesseract-OCR",
        r"C:\Program Files (x86)\Tesseract-OCR"
    ]
    for p in common_paths:
        if os.path.exists(p):
            os.environ["PATH"] += os.pathsep + p

try:
    import pytesseract
    from PIL import Image
    import google.generativeai as genai
except ImportError as e:
    print(f"❌ ImportError: {e}")
    sys.exit(1)

load_dotenv()

def check_tesseract():
    print("Testing Tesseract...", end=" ")
    try:
        # Check if tesseract is in PATH or configured
        try:
            version = pytesseract.get_tesseract_version()
            print(f"✅ Found Tesseract v{version}")
            return True
        except pytesseract.TesseractNotFoundError:
            # Try to manually find it like in our fix
             if os.name == 'nt':
                possible_paths = [
                    r"C:\Program Files\Tesseract-OCR\tesseract.exe",
                    r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
                    os.path.join(os.getenv('LOCALAPPDATA', ''), r"Tesseract-OCR\tesseract.exe")
                ]
                for p in possible_paths:
                    if os.path.exists(p):
                        pytesseract.pytesseract.tesseract_cmd = p
                        print(f"✅ Found Tesseract at {p}")
                        return True
            
             print("❌ Tesseract not found. Please install it.")
             return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def check_gemini():
    print("Testing Gemini API Key...", end=" ")
    key = os.getenv("GEMINI_API_KEY")
    if key and key.startswith("AIza"):
        print("✅ Key looks valid (starts with AIza)")
        return True
    else:
        print("❌ Invalid or missing GEMINI_API_KEY")
        return False

def check_app_import():
    print("Testing App Import...", end=" ")
    try:
        import app
        print("✅ ml-engine/app.py imports successfully")
        return True
    except Exception as e:
        print(f"❌ Failed to import app: {e}")
        return False

if __name__ == "__main__":
    t_ok = check_tesseract()
    g_ok = check_gemini()
    sys.path.append(os.getcwd()) # Ensure we can import app.py
    a_ok = check_app_import()
    
    if t_ok and g_ok and a_ok:
        print("\n🎉 All checks passed!")
        sys.exit(0)
    else:
        print("\n⚠️  Some checks failed.")
        sys.exit(1)
