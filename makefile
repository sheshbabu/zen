build:
	esbuild index.js --bundle --minify --format=esm --outfile=assets/bundle.js --loader:.js=jsx --jsx-factory=h --jsx-fragment=Fragment
	go build

dev:
	esbuild index.js --bundle --minify --format=esm --outfile=assets/bundle.js --sourcemap --loader:.js=jsx --jsx-factory=h --jsx-fragment=Fragment
	DEV_MODE=true go run main.go

watch:
	DEV_MODE=true air & esbuild index.js --bundle --outfile=assets/bundle.js --loader:.js=jsx --jsx-factory=h --jsx-fragment=Fragment --watch