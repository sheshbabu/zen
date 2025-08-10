FROM --platform=$BUILDPLATFORM golang:1.23.5-bookworm as builder

ARG BUILDPLATFORM
ARG TARGETPLATFORM
ARG TARGETOS
ARG TARGETARCH

WORKDIR /app

RUN GOARCH=$TARGETARCH go install github.com/evanw/esbuild/cmd/esbuild@latest

COPY go.mod go.sum ./
RUN go mod download && go mod verify

COPY . .

RUN esbuild index.js --bundle --minify --format=esm --outfile=assets/bundle.js --loader:.js=jsx --jsx-factory=h --jsx-fragment=Fragment
RUN GOOS=$TARGETOS GOARCH=$TARGETARCH go build --tags "fts5" -v -o ./zen .

FROM --platform=$TARGETPLATFORM debian:bookworm-slim

COPY --from=builder /app/zen /zen

VOLUME /data
VOLUME /images

ENV DATA_FOLDER=/data
ENV IMAGES_FOLDER=/images

CMD ["/zen"]