# 1단계: 빌드 스테이지 (Java 21 JDK 사용)
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app

# Gradle Wrapper 및 설정 파일 복사 (레이어 캐싱 활용)
COPY gradlew .
COPY gradle gradle
COPY build.gradle .
COPY settings.gradle .

# 실행 권한 부여 및 의존성 사전 다운로드
RUN chmod +x gradlew
RUN ./gradlew dependencies --no-daemon

# 소스 코드 복사 및 빌드 (테스트 제외)
COPY src src
RUN ./gradlew bootJar --no-daemon -x test

# 2단계: 실행 스테이지 (Java 21 JRE 경량 이미지 사용)
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# 보안을 위한 비루트 사용자 생성 (권장)
RUN addgroup -S spring && adduser -S spring -G spring
USER spring

# 빌드 스테이지에서 생성된 '실행 가능한 JAR'만 복사
# *-plain.jar 파일이 포함되지 않도록 패턴 매칭 수행
COPY --from=build --chown=spring:spring /app/build/libs/*.jar app.jar

# 포트 설정
EXPOSE 8080

# 애플리케이션 실행 (절대 경로 사용)
ENTRYPOINT ["java", "-jar", "/app/app.jar"]