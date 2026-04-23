# Setting Up Docker for this Project

In this project, we will use Docker within the LLM structure to control complexity, ensure consistency, and simplify deployment. Large language models introduce challenges (heavy dependencies, GPU usage, model files), and Docker addresses them directly.

## What is Docker

**Docker** is an open-source platform that enables developers to build, ship, and run applications within lightweight, isolated environments called containers. By packaging an application with all its dependencies—such as libraries and system tools—Docker ensures that software runs consistently regardless of the infrastructure, solving the common "it works on my machine" problem.

Read more - [https://docs.docker.com/get-started/docker-overview/](https://docs.docker.com/get-started/docker-overview/)

## 1. Create Docker Compose file

To write a Docker Compose file for PostgreSQL, create a file named `docker-compose.yaml` in your project directory. This file defines the PostgreSQL service, its credentials, data persistence, and port mapping.

Example basic PostgreSQL Compose file

```yaml
services:
  postgres:
    image: postgres:17
    restart: unless-stopped
    ports:
      - '5432:5432'             # Maps host port 5432 to container port 5432
    environment:
      POSTGRES_USER: user        # Your database superuser
      POSTGRES_PASSWORD: password # Your database password
      POSTGRES_DB: my-llm-app      # Name of the initial database
```

## 2. Running the Service
1. Open your terminal in the directory where the file is saved.
2. Run the command: `docker compose up -d`.
    - The `-d` flag runs the container in "detached" mode (background)
3. To stop the services, run: `docker compose down`.