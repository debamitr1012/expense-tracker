from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import Base, engine
from routers import auth, expenses

# Create tables on startup (equivalent to EF Core EnsureCreated/Migrate).
Base.metadata.create_all(bind=engine)

app = FastAPI(title="ExpenseTracker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.cors_allowed_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(expenses.router)


@app.get("/")
def health() -> dict:
    return {"status": "ok"}
