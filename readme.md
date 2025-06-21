<p align="center">
  <img width="256" src="assets/android-chrome-512x512.png">
  <h1 align="center">Zen</h1>
  <p align="center">Minimal Notes App</p>
</p>

<p align="center"><img src="https://github.com/sheshbabu/zen/blob/master/docs/screenshot.jpg?raw=true"/></p>

### Features
* Single Go binary or Docker Compose
* Low resource usage
* Standard Markdown files, local SQLite database
* Organize with flexible tags, not rigid folders
* Markdown features like tables, code blocks, task lists, highlights, and more
* Full-text search with BM25 ranking
* Minimal dependency footprint


### Installation
Build from source
```shell
$ go build
```


### Local Development
Run the application using default configuration
```shell
$ make dev
```

Run the application in watch mode

Install [air](https://github.com/air-verse/air) and [esbuild](https://esbuild.github.io)

```shell
$ go install github.com/air-verse/air@latest
$ go install github.com/evanw/esbuild/cmd/esbuild@latest
```

```shell
$ make watch
```


### Schema Migrations
* Create new migration file under `./migrations`
* Use the format `<version>_<title>.sql`


### Contributions
This is a personal project built for my own use. The codebase is available for forking and modifications. Note that I may not actively review pull requests or respond to issues due to time constraints.


### Thanks
* [go-sqlite3](https://github.com/mattn/go-sqlite3)
* [Standalone Preact Builder](https://standalonepreact.satge.net)
* [markdown-it](https://markdown-it.github.io)
* [highlight.js](https://highlightjs.org)
* [Lucide Icons](https://lucide.dev)
* [CSS Reset](https://www.joshwcomeau.com/css/custom-css-reset/)