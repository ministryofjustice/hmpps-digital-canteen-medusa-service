# hmpps-digital-canteen-medusa-service
E-commerce service for the HMPPS Digital Canteen.

## Local Setup

Run

    docker compose up -d

Add .env to apps/backend (ask for details)

Run from medusa-canteen

    npm install 
    npm run build

Run from apps/backend

    npx medusa db:migrate 
    npx medusa user --email admin@admin.com --password supersecret 

To start

    npm run dev