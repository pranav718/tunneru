FROM golang:1.24-alpine AS builder

WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /bin/tunneru-server ./cmd/server

FROM alpine:3.21

RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app

COPY --from=builder /bin/tunneru-server /app/tunneru-server

EXPOSE 7001 8080 7002

ENTRYPOINT ["/app/tunneru-server"]
