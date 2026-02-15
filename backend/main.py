from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from scraper import analyze_bilibili, analyze_youtube
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyzeRequest(BaseModel):
    url: str

@app.post("/analyze")
async def analyze(request: AnalyzeRequest):
    url = request.url.strip()
    try:
        # Heuristic for Bilibili MID (all digits)
        if url.isdigit():
            url = f"https://space.bilibili.com/{url}"
            return await analyze_bilibili(url)
            
        # Heuristic for YouTube Handle (starts with @)
        if url.startswith("@"):
            url = f"https://www.youtube.com/{url}"
            return await analyze_youtube(url)
            
        # Heuristic for simple name (assume YouTube handle or search)
        if "://" not in url and "." not in url:
            if " " in url:
                # If spaces present, use YouTube search
                url = f"ytsearch1:{url}"
            else:
                # If single word, try as youtube handle
                url = f"https://www.youtube.com/@{url}"
            return await analyze_youtube(url)

        if "bilibili.com" in url:
            return await analyze_bilibili(url)
        elif "youtube.com" in url or "youtu.be" in url:
            return await analyze_youtube(url)
        else:
            raise HTTPException(status_code=400, detail="Unsupported platform")
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
