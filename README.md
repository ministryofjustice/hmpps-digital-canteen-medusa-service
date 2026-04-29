# hmpps-digital-canteen-medusa-service
E-commerce service for the HMPPS Digital Canteen.

## Local Setup

Run

    docker compose up -d

Add .env to ./backend (ask for details)

Run from ./backend

    npm install --legacy-peer-deps
    npm run build
    npx medusa db:migrate 
    npx medusa user --email admin@admin.com --password supersecret 

To start

    npm run dev