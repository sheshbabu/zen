build:
	esbuild index.js --bundle --minify --format=esm --outfile=assets/bundle.js --loader:.js=jsx --jsx-factory=h --jsx-fragment=Fragment
	go build --tags "fts5"

dev:
	esbuild index.js --bundle --minify --format=esm --outfile=assets/bundle.js --sourcemap --loader:.js=jsx --jsx-factory=h --jsx-fragment=Fragment
	DEV_MODE=true go run --tags "fts5" main.go

watch:
	INTELLIGENCE_ENABLED=true DEV_MODE=true air --build.cmd 'go build --tags "fts5" -o ./tmp/main .' & esbuild index.js --bundle --outfile=assets/bundle.js --loader:.js=jsx --jsx-factory=h --jsx-fragment=Fragment --watch

# UI: http://localhost:6333/dashboard
qdrant:
	docker run -d --name zen-qdrant -p 6333:6333 -p 6334:6334 -v qdrant_data:/qdrant/storage qdrant/qdrant:latest

qdrant-down:
	docker stop zen-qdrant && docker rm zen-qdrant