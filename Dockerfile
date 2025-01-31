FROM golang:1.23.5-bookworm as builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download && go mod verify

COPY . .

RUN go build -v -o ./zen .

FROM debian:bookworm-slim

COPY --from=builder /app/zen /zen

VOLUME /data
VOLUME /images

ENV DATA_FOLDER=/data
ENV IMAGES_FOLDER=/images

CMD ["/zen"]