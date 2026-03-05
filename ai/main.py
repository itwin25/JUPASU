from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Jupasu AI Server", description="FastAPI based LLM server", version="0.1.0")

class LLMRequest(BaseModel):
    prompt: str

class LLMResponse(BaseModel):
    answer: str

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/ai/chat", response_model=LLMResponse)
async def chat(request: LLMRequest):
    # TODO: Implement actual LLM logic here
    return {"answer": f"Echo: {request.prompt}"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
