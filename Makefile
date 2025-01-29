.PHONY: infra-start infra-cleanup infra-restart

infra-start:
	docker compose -f docker-compose.test.yml up -d

infra-cleanup:
	docker compose -f docker-compose.test.yml down

infra-restart: infra-cleanup infra-start
