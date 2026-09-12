"""
SākshyaChain Legal Case Summarizer Microservice (FastAPI + Hybrid NLP + OCR)
Converts Streamlit Legal Case Summarizer pipeline into a high-performance REST API.
"""

from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
import json
import re
import os
import tempfile
import subprocess
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Optional imports with safe fallbacks
try:
    from pypdf import PdfReader
except ImportError:
    try:
        from PyPDF2 import PdfReader
    except ImportError:
        PdfReader = None

try:
    import yake
except ImportError:
    yake = None

try:
    from opennyai import Pipeline
    from opennyai.utils import Data
    OPENNYAI_AVAILABLE = True
except Exception:
    OPENNYAI_AVAILABLE = False


app = FastAPI(
    title="SākshyaChain Legal Case Summarizer API",
    description="Hybrid NLP + OCR Legal Document Summarizer & Entity Extractor",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------
# OCR EXTRACTION (CLI)
# ---------------------------
def ocr_pdf_cli(file_bytes: bytes) -> str:
    """Runs OCR on a PDF using pdftoppm and tesseract via subprocess."""
    with tempfile.TemporaryDirectory() as temp_dir:
        pdf_path = os.path.join(temp_dir, "input.pdf")

        with open(pdf_path, "wb") as f:
            f.write(file_bytes)

        # Convert PDF → images via pdftoppm
        try:
            subprocess.run([
                "pdftoppm",
                "-png",
                pdf_path,
                os.path.join(temp_dir, "page")
            ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=False)
        except Exception as e:
            print(f"[OCR Warning] pdftoppm failed or not installed: {e}")

        text = ""
        png_files = sorted([f for f in os.listdir(temp_dir) if f.endswith(".png")])

        if png_files:
            for file in png_files:
                img_path = os.path.join(temp_dir, file)
                txt_base = img_path.replace(".png", "")

                try:
                    subprocess.run([
                        "tesseract",
                        img_path,
                        txt_base,
                        "-l", "eng",
                        "--psm", "6"
                    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=False)

                    txt_file = txt_base + ".txt"
                    if os.path.exists(txt_file):
                        with open(txt_file, "r", encoding="utf-8", errors="ignore") as f:
                            text += f.read() + "\n"
                except Exception as e:
                    print(f"[OCR Warning] tesseract failed on page {file}: {e}")

        # Fallback to PyPDF if OCR produced no text
        if not text.strip():
            text = extract_pdf_text(file_bytes)

        return text


# ---------------------------
# NORMAL PDF TEXT EXTRACTION
# ---------------------------
def extract_pdf_text(file_bytes: bytes) -> str:
    """Extracts text from PDF using pypdf/PyPDF2."""
    if not PdfReader:
        return "PDF text reader library not installed."

    try:
        import io
        reader = PdfReader(io.BytesIO(file_bytes))
        full_text = ""
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                full_text += extracted + "\n"
        return full_text
    except Exception as e:
        return f"PDF Extraction Error: {str(e)}"


# ---------------------------
# TEXT CLEANING & SPLITTING
# ---------------------------
def clean_text(text: str) -> str:
    """Cleans text by removing extra whitespace and references."""
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"\[[^\]]*\]", "", text)
    return text.strip()


def chunk_long_sentences(text: str) -> str:
    """Splits long sentences at commas to improve readability."""
    return re.sub(r'(?<=,)\s+', '. ', text)


def split_sentences(text: str) -> List[str]:
    """Splits text into sentences using regex."""
    sentences = re.split(r'\n+|(?<=[.!?])\s+', text)
    return [s.strip() for s in sentences if len(s.strip()) > 30]


# ---------------------------
# SECTION EXTRACTION
# ---------------------------
def extract_sections(text: str) -> Dict[str, str]:
    """Extracts legal sections based on keywords and their positions."""
    section_keywords = [
        "Issue for Consideration",
        "Held:",
        "FACTUAL MATRIX",
        "THE CHALLENGE",
        "ISSUES INVOLVED"
    ]

    sections = {}
    positions = []

    for keyword in section_keywords:
        idx = text.find(keyword)
        if idx != -1:
            positions.append((idx, keyword))

    positions.sort()

    for i in range(len(positions)):
        start_idx, keyword = positions[i]
        if i + 1 < len(positions):
            end_idx = positions[i + 1][0]
        else:
            end_idx = len(text)
        sections[keyword] = text[start_idx:end_idx]

    if not sections:
        sections["FULL TEXT"] = text

    return sections


# ---------------------------
# DOMAIN SCORING
# ---------------------------
def score_sentence(sentence: str, section: str) -> float:
    """Assigns a score to a sentence based on keyword presence and section type."""
    score = 0
    s = sentence.lower()

    if section == "Held:":
        if "held" in s: score += 3
        if "void" in s or "invalid" in s: score += 2
        if "set aside" in s or "restored" in s: score += 5
        if "jurisdiction" in s: score += 2
        if "review" in s: score += 2

    if section == "FACTUAL MATRIX":
        if re.search(r'\d{4}', s): score += 3
        if "order" in s: score += 2
        if "petition" in s: score += 2
        if "land" in s: score += 1

    return score


# ---------------------------
# SUMMARIZER ENGINE (TF-IDF + TextRank)
# ---------------------------
def summarize_section(text: str, section: str) -> List[str]:
    """Summarizes a section by scoring sentences using TF-IDF + Cosine TextRank + Domain Scoring."""
    text = clean_text(text)

    if "Headnotes" in text:
        text = text.split("Headnotes")[0]

    text = chunk_long_sentences(text)
    sentences = split_sentences(text)

    if not sentences:
        return []

    if len(sentences) <= 3:
        return sentences

    try:
        vectorizer = TfidfVectorizer(stop_words="english")
        X = vectorizer.fit_transform(sentences)
        tfidf_scores = np.sum(X.toarray(), axis=1)

        similarity_matrix = cosine_similarity(X)
        np.fill_diagonal(similarity_matrix, 0)

        scores = np.ones(len(sentences))
        for _ in range(20):
            scores = 0.85 * similarity_matrix.dot(scores) + 0.15

        final_scores = []
        for i, sent in enumerate(sentences):
            score = tfidf_scores[i] + scores[i] + score_sentence(sent, section)
            final_scores.append(score)

        if section == "Held:":
            top_n = min(15, len(sentences))
        elif section == "FACTUAL MATRIX":
            top_n = min(12, len(sentences))
        else:
            top_n = min(6, len(sentences))

        ranked = np.argsort(final_scores)[-top_n:]
        return [sentences[i] for i in sorted(ranked)]
    except Exception as e:
        print(f"[Summarizer Warning] TF-IDF ranking error: {e}")
        return sentences[:6]


# ---------------------------
# KEYWORD EXTRACTION
# ---------------------------
def extract_keywords(text: str, top_n: int = 10) -> List[str]:
    """Extracts keywords using YAKE or fallback TF-IDF."""
    if yake:
        try:
            kw_extractor = yake.KeywordExtractor(n=3, top=top_n)
            return [kw[0] for kw in kw_extractor.extract_keywords(text)]
        except Exception:
            pass

    # Fallback TF-IDF keyword extraction
    try:
        vectorizer = TfidfVectorizer(max_features=top_n, stop_words="english")
        vectorizer.fit([text])
        return list(vectorizer.get_feature_names_out())
    except Exception:
        words = re.findall(r'\b[a-zA-Z]{5,}\b', text)
        return list(set(words[:top_n]))


# ---------------------------
# OPENNYAI INTEGRATION
# ---------------------------
def run_opennyai_on_text(full_text: str) -> Dict[str, Any]:
    """Runs OpenNyAI pipeline on raw text if installed, or structured fallback."""
    if OPENNYAI_AVAILABLE:
        try:
            data = Data([full_text])
            pipeline = Pipeline(components=['NER', 'Rhetorical_Role'], use_gpu=False, verbose=False)
            results = pipeline(data)
            return results[0]
        except Exception as e:
            print(f"[OpenNyAI Warning] Pipeline error: {e}")

    # Structured fallback annotations
    return {
        "status": "FALLBACK_NLP_ENGINE",
        "annotations": [
            {"text": sent, "label": "Rhetorical_Role"} for sent in split_sentences(full_text)[:10]
        ]
    }


def opennyai_to_text(data: Dict[str, Any]) -> str:
    """Converts OpenNyAI output or dictionary annotations back to concatenated text."""
    annotations = data.get('annotations', []) or data.get('data', {}).get('annotations', [])
    if isinstance(annotations, list) and annotations:
        text_parts = [ann.get("text", "") for ann in annotations if isinstance(ann, dict) and len(ann.get("text", "")) > 20]
        if text_parts:
            return " ".join(text_parts)
    return ""


# ---------------------------
# PARAGRAPH FORMATTER
# ---------------------------
def format_paragraphs(sentences: List[str], chunk_size: int = 3) -> List[str]:
    """Formats sentences into paragraphs of specified chunk size."""
    return [" ".join(sentences[i:i+chunk_size]) for i in range(0, len(sentences), chunk_size)]


# ---------------------------
# MAIN PIPELINE
# ---------------------------
def summarize_from_text(full_text: str):
    """Runs full legal case summarization pipeline on text."""
    data = run_opennyai_on_text(full_text)
    annotated_text = opennyai_to_text(data)

    target_text = annotated_text if annotated_text.strip() else full_text
    sections = extract_sections(target_text)

    summary = {}
    formatted_summary = {}

    for section, content in sections.items():
        sentences = summarize_section(content, section)
        summary[section] = sentences
        formatted_summary[section] = format_paragraphs(sentences, 3)

    keywords = extract_keywords(target_text)

    return {
        "summary_by_sections": summary,
        "formatted_paragraphs": formatted_summary,
        "keywords": keywords,
        "opennyai_data": data
    }


# ---------------------------
# PYDANTIC MODELS & ENDPOINTS
# ---------------------------
class TextSummarizeRequest(BaseModel):
    text: str
    docCategory: Optional[str] = "LEGAL_CASE"

@app.get("/")
def root():
    return {
        "service": "SākshyaChain Legal Case Summarizer FastAPI Service",
        "status": "ONLINE",
        "opennyai_available": OPENNYAI_AVAILABLE,
        "endpoints": [
            "/api/summarize-pdf",
            "/api/summarize-text",
            "/api/ocr-pdf"
        ]
    }

@app.post("/api/summarize-text")
def api_summarize_text(req: TextSummarizeRequest):
    if not req.text or len(req.text.strip()) == 0:
        raise HTTPException(status_code=400, detail="Text payload cannot be empty")

    result = summarize_from_text(req.text)
    return result

@app.post("/api/summarize-pdf")
async def api_summarize_pdf(
    file: UploadFile = File(...),
    use_ocr: bool = Form(False)
):
    try:
        file_bytes = await file.read()
        if use_ocr:
            extracted_text = ocr_pdf_cli(file_bytes)
        else:
            extracted_text = extract_pdf_text(file_bytes)

        if not extracted_text or len(extracted_text.strip()) < 10:
            extracted_text = ocr_pdf_cli(file_bytes)

        result = summarize_from_text(extracted_text)
        result["extracted_text_preview"] = extracted_text[:500] + "..."
        result["file_name"] = file.filename
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF Summarization error: {str(e)}")

@app.post("/api/ocr-pdf")
async def api_ocr_pdf(file: UploadFile = File(...)):
    try:
        file_bytes = await file.read()
        text = ocr_pdf_cli(file_bytes)
        return {
            "file_name": file.filename,
            "extracted_text": text,
            "char_count": len(text)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
