# Interpreter: override with `make run PYTHON=/path/to/python`.
# Auto-detects the shared training venv, then a local venv, then python3.
PYTHON ?= $(shell \
	for p in /home/anuk/Downloads/gem/venv/bin/python .venv/bin/python venv/bin/python; do \
		if [ -x "$$p" ]; then echo "$$p"; break; fi; \
	done)
PYTHON := $(if $(PYTHON),$(PYTHON),python3)

HOST ?= 0.0.0.0
PORT ?= 8000

.PHONY: run dev install install-dev test lint format

run:
	$(PYTHON) run.py

dev:
	$(PYTHON) -m uvicorn app.main:app --host $(HOST) --port $(PORT) --reload

install:
	$(PYTHON) -m pip install -r requirements.txt

install-dev:
	$(PYTHON) -m pip install -r requirements-dev.txt

test:
	$(PYTHON) -m pytest

lint:
	$(PYTHON) -m ruff check .

format:
	$(PYTHON) -m ruff check --fix .
