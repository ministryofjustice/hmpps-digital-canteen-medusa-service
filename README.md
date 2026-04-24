# hmpps-digital-canteen-medusa-service
E-commerce service for the HMPPS Digital Canteen.

## Local Setup

Run

    docker compose up -d

Add .env to apps/backend (ask for details)

Run from apps/backend

    npm install 
    npm run build
    npx medusa db:migrate 
    npx medusa user --email admin@admin.com --password supersecret 

To start

    npm run dev