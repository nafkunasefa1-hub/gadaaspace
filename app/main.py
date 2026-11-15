"""
RAD-ARES: Core FastAPI Microservice Entrypoint
Configures CORS, structured exception handlers, request latency telemetry, and API v1 routes.
"""

import time
from typing import Any, Dict

import uvicorn
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.endpoints import router as api_v1_router
from app.core.config import settings


def create_application() -> FastAPI:
    """Factory function initializing the production FastAPI microservice."""
    application = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description=(
            "Production API for Lunar Van Allen Belt Trajectory Dosimetry, "
            "Graded-Z Multi-Layer Shielding (Secondary Spallation Neutron & Bremsstrahlung Paradox), "
            "Moon vs. Mars Surface Bio-Dosimetry, and Gemini AI Function Calling."
        ),
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # Configure CORS for Streamlit and FlutterFlow clients
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.get_cors_origins_list(),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @application.middleware("http")
    async def add_process_time_header(request: Request, call_next: Any) -> Any:
        start_time = time.perf_counter()
        response = await call_next(request)
        elapsed_ms = (time.perf_counter() - start_time) * 1000.0
        response.headers["X-Process-Time-Ms"] = f"{elapsed_ms:.2f}"
        return response

    @application.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error": "Validation Error",
                "detail": exc.errors(),
                "path": str(request.url.path),
            },
        )

    @application.exception_handler(Exception)
    async def global_exception_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": "Internal Server Error",
                "detail": str(exc),
                "path": str(request.url.path),
            },
        )

    @application.get("/", tags=["Root"])
    async def root() -> Dict[str, Any]:
        return {
            "service": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "docs": "/docs",
            "health": f"{settings.API_PREFIX}/health",
        }

    application.include_router(api_v1_router, prefix=settings.API_PREFIX, tags=["v1"])
    return application


app = create_application()

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
