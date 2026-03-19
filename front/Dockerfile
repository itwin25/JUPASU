# ================================
# Stage 1: Dependencies
# ================================
FROM node:20-slim AS deps

RUN npm install -g pnpm@9

WORKDIR /app

# 의존성 정의 파일만 먼저 복사
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# 의존성 설치 (잠금 파일 불일치 허용)
RUN pnpm install --no-frozen-lockfile
# ================================
# Stage 2: Builder
# ================================
FROM node:20-slim AS builder

RUN npm install -g pnpm@9
WORKDIR /app

# deps 스테이지에서 설치된 node_modules를 그대로 사용
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 환경 변수 주입
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_TELEMETRY_DISABLED=1

# 실제 빌드
RUN pnpm build

# ================================
# Stage 3: Runner
# ================================
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=80
ENV HOSTNAME="0.0.0.0"

# 보안: 비루트 사용자 사용
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 -g nodejs nextjs

# 빌드 산출물 및 실행에 필요한 파일만 복사
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 80

# pnpm 대신 node 명령어로 직접 실행
CMD ["node_modules/.bin/next", "start"]
