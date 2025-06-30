# Stock Alert Bot

A simple Telegram bot that monitors stock prices (B3/Bovespa supported) and sends real-time alerts when user-defined price thresholds are crossed. Ideal for traders or investors who want customizable notifications without checking charts all day.

- Set alerts via Telegram commands
- Supports "above" / "below" price triggers
- Built with Node.js, TypeScript, Prisma, PostgreSQL
- Uses Yahoo Finance (non-official API)
- Sends instant alerts through Telegram

## Example

/alarm PETR4 above 37.50

The bot will notify you if PETR4 crosses R$37.50.

## Tech Stack

- Node.js
- TypeScript
- Prisma
- PostgreSQL
- Yahoo Finance (unofficial)
- node-telegram-bot-api

## Todo

- [ ] Alert history
- [ ] Web UI (optional)

# How can be improved in case it have milions of alerts to manage

- Group alerts by ticket.
- Split the ticker pooling and alerts loading into 10 chunks and reduce the loop time to run every 6 seconds instead every minute.
- Load alerts into memory/redis server on load and update it on alert management.
- Separate servers instances for ticket price pooling, for alerts cheking and bot handling with a redis server for shared memory.
- Instantiate multiple servers instances, each one with its own data set.
