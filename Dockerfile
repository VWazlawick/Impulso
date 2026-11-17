# Imagem do Impulso para o Render: monta o site (React), coloca dentro do backend e roda um jar só.
# O site e a API ficam no mesmo endereço, então não precisa de CORS.

# 1) Site: o build do React vai para /site/dist
FROM node:24-slim AS site
WORKDIR /site
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# 2) Backend, com o site na pasta static (o SiteConfig serve os arquivos e o index.html)
FROM maven:3.9-eclipse-temurin-17 AS backend
WORKDIR /backend
COPY backend/pom.xml ./
RUN mvn -q -B dependency:go-offline
COPY backend/src ./src
COPY --from=site /site/dist ./src/main/resources/static
RUN mvn -q -B -DskipTests package

# 3) Só o necessário para rodar
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=backend /backend/target/impulso-0.0.1-SNAPSHOT.jar app.jar
# O plano gratuito do Render tem 512 MB de memória e CPU fraca: o heap fica com até 60% da memória
# (testado: o processo usou ~370 MB no pico) e a JVM compila menos para subir mais rápido.
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=60 -XX:+UseSerialGC -Xss512k -XX:TieredStopAtLevel=1"
EXPOSE 8080
CMD ["java", "-jar", "app.jar"]
