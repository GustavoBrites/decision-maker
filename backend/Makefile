.PHONY: run install test

install:
	uv sync

run:
	uv run uvicorn app.main:app --host 0.0.0.0 --port 3000 --reload

test:
	uv run pytest
