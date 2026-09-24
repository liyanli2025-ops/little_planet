FROM node:24-bookworm-slim
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8080 DATABASE_PATH=/data/planet.sqlite NODE_OPTIONS=--max-old-space-size=128
WORKDIR /app
COPY --chown=node:node backend ./backend
COPY --chown=node:node dist ./dist
COPY --chown=node:node package.json ./
RUN mkdir -p /data && chown node:node /data && chmod 700 /data
USER node
EXPOSE 8080
CMD ["node", "backend/server.mjs"]
