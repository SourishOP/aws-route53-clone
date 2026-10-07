"""FastAPI application entrypoint for the Route53 clone."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routers import auth, hosted_zones, records
from .seed import seed_if_empty

app = FastAPI(
    title="Route53 Clone API",
    version="1.0.0",
    description="A functional clone of the AWS Route53 API (mocked DNS).",
)

import os

# Allowed CORS origins. Local dev defaults are always included; add your
# deployed frontend origin via FRONTEND_ORIGIN (comma-separated for several),
# e.g. FRONTEND_ORIGIN=https://route53-clone.vercel.app
_default_origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
_extra = [o.strip() for o in os.environ.get("FRONTEND_ORIGIN", "").split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_default_origins + _extra,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    seed_if_empty()


@app.get("/api/health", tags=["health"])
def health():
    return {"status": "ok"}


app.include_router(auth.router)
app.include_router(hosted_zones.router)
app.include_router(records.router)
