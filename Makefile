.PHONY: all build build-server build-client test docker-build clean

all: build

build: build-server build-client

build-server:
	go build -ldflags="-s -w" -o bin/tunneru-server ./cmd/server

build-client:
	go build -ldflags="-s -w" -o bin/tunneru ./cmd/client

test:
	go test -v ./...

docker-build:
	docker build -t tunneru-server:latest .

clean:
	rm -rf bin/
