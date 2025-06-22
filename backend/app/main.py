
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.models import SplitRequest
from app.split import calculate_split
from app.pdf_generator import generate_split_pdf
from app.parser import extract_items_from_pdf
import uuid
import shutil
import os

app = FastAPI()

# Tambahkan CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # atau ganti dengan ["http://localhost:3000"] untuk lebih aman
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/split/pdf")
def split_and_generate_pdf(data: SplitRequest):
    try:
        results = calculate_split(data)

        pdf_path = generate_split_pdf(
            results,
            data.items,
            data.session_id,
            data.total_payment,
            data.handling_fee,
            data.other_fee,
            data.discount,
            data.discount_plus
        )

        return FileResponse(
            path=pdf_path,
            filename=f"split_summary_{data.session_id}.pdf",
            media_type="application/pdf"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@app.post("/upload/parse")
async def upload_and_parse(file: UploadFile = File(...)):
    try:
        temp_dir = "input"
        os.makedirs(temp_dir, exist_ok=True)
        file_path = os.path.join(temp_dir, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        items, total_price, handling_fee, other_fee, discount, discount_plus, total_payment = extract_items_from_pdf(file_path)

        return JSONResponse(content={
            "items": items,
            "total_price": total_price,
            "handling_fee": handling_fee,
            "other_fee": other_fee,
            "discount": discount,
            "discount_plus": discount_plus,
            "total_payment": total_payment,
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/split")
def split_only(data: SplitRequest):
    try:
        results = calculate_split(data)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
