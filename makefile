build:
	esbuild index.js --bundle --minify --format=esm --outfile=assets/bundle.js --loader:.js=jsx --jsx-factory=h --jsx-fragment=Fragment
	go build --tags "fts5"

dev:
	esbuild index.js --bundle --minify --format=esm --outfile=assets/bundle.js --sourcemap --loader:.js=jsx --jsx-factory=h --jsx-fragment=Fragment
	DEV_MODE=true go run --tags "fts5" main.go

watch:
	DEV_MODE=true air --build.cmd 'go build --tags "fts5" -o ./tmp/main .' & esbuild index.js --bundle --outfile=assets/bundle.js --loader:.js=jsx --jsx-factory=h --jsx-fragment=Fragment --watch