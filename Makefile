SHELL := /bin/bash
ROOT := $(CURDIR)
FRONTEND_DIR := $(ROOT)/frontend
BACKEND_DIR := $(ROOT)/backend
DOCKER_CONTAINER := take-home-postgres
POSTGRES_IMAGE := postgres:16
POSTGRES_PORT := 5433
POSTGRES_USER := smart
POSTGRES_PASSWORD := smart
POSTGRES_DB := smart_session

### Helper functions ###
.env-frontend:
	@if [ ! -f $(FRONTEND_DIR)/.env ] && [ -f $(FRONTEND_DIR)/.env.example ]; then \
		cp $(FRONTEND_DIR)/.env.example $(FRONTEND_DIR)/.env && echo "Created frontend/.env"; \
	fi

.env-backend:
	@if [ ! -f $(BACKEND_DIR)/.env.local ] && [ -f $(BACKEND_DIR)/.env.local.example ]; then \
		cp $(BACKEND_DIR)/.env.local.example $(BACKEND_DIR)/.env.local && echo "Created backend/.env.local"; \
	fi

install-frontend:
	@cd $(FRONTEND_DIR) && npm install

install-backend:
	@cd $(BACKEND_DIR) && npm install

postgres:
	@if command -v docker >/dev/null 2>&1; then \
		RUNNING=$$(docker ps --filter "name=$(DOCKER_CONTAINER)" --filter "status=running" --format "{{.Names}}" ); \
		if [ -n "$$RUNNING" ]; then \
			echo "Postgres container already running"; \
		else \
			EXISTS=$$(docker ps -a --filter "name=$(DOCKER_CONTAINER)" --format "{{.Names}}" ); \
			if [ -n "$$EXISTS" ]; then \
				echo "Starting existing Postgres container" && docker start $(DOCKER_CONTAINER); \
			else \
				echo "Launching new Postgres container" && docker run --name $(DOCKER_CONTAINER) -e POSTGRES_USER=$(POSTGRES_USER) -e POSTGRES_PASSWORD=$(POSTGRES_PASSWORD) -e POSTGRES_DB=$(POSTGRES_DB) -p $(POSTGRES_PORT):5432 -d $(POSTGRES_IMAGE); \
			fi; \
		fi; \
	else \
		echo "Docker not available; ensure Postgres is running manually on port $(POSTGRES_PORT)."; \
	fi

prisma-generate:
	@cd $(BACKEND_DIR) && npx prisma generate

prisma-migrate:
	@cd $(BACKEND_DIR) && npx prisma migrate deploy

prisma-seed:
	@cd $(BACKEND_DIR) && npm run seed

help:
	@echo "Available targets:"
	@echo "  make help            # Show this help"
	@echo "  make setup           # Copy envs, install deps, run Postgres+Prisma, seed data"
	@echo "  make backend         # Start Next.js dev server"
	@echo "  make frontend        # Start Expo bundler"
	@echo "  make frontend-ios    # Launch Expo iOS simulator"
	@echo "  make clean-postgres  # Stop and remove local Postgres container"

setup: .env-frontend .env-backend install-frontend install-backend postgres prisma-generate prisma-migrate prisma-seed
	@echo "\nSetup complete. Use 'make backend' and 'make frontend-ios' next."

backend:
	@cd $(BACKEND_DIR) && ( \
		set -a; \
		[ -f .env ] && source ./.env; \
		set +a; \
		npm run dev \
	)

frontend:
	@cd $(FRONTEND_DIR) && ( \
		set -a; \
		[ -f .env ] && source ./.env; \
		set +a; \
		npm run start \
	)

frontend-ios:
	@cd $(FRONTEND_DIR) && ( \
		set -a; \
		[ -f .env ] && source ./.env; \
		set +a; \
		npm run ios \
	)

clean-postgres:
	@if command -v docker >/dev/null 2>&1; then \
		docker stop $(DOCKER_CONTAINER) >/dev/null 2>&1 || true; \
		docker rm $(DOCKER_CONTAINER) >/dev/null 2>&1 || true; \
	fi

.PHONY: help setup backend frontend frontend-ios install-frontend install-backend postgres prisma-generate prisma-migrate prisma-seed clean-postgres
