"""Logging configuration helpers."""
from __future__ import annotations

import logging
from logging.config import dictConfig


def setup_logging(debug: bool = False) -> None:
    """Apply a simple JSON-friendly logging config."""
    level = "DEBUG" if debug else "INFO"
    dictConfig(
        {
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {
                "default": {
                    "format": "%(asctime)s | %(levelname)s | %(name)s | %(message)s",
                }
            },
            "handlers": {
                "console": {
                    "class": "logging.StreamHandler",
                    "formatter": "default",
                }
            },
            "root": {
                "handlers": ["console"],
                "level": level,
            },
        }
    )
    logging.getLogger(__name__).debug("Logging configured", extra={"level": level})
