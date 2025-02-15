<p align="center">
  <img width="256" src="assets/android-chrome-512x512.png">
  <h1 align="center">Zen</h1>
  <p align="center">Minimal Notes App</p>
</p>

<p align="center"><img src="https://github.com/sheshbabu/zen/blob/master/docs/screenshot.png?raw=true" /></p>


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

Install [air](https://github.com/air-verse/air)
```shell
$ make watch
```


### Schema Migrations
* Create new migration file under `./migrations`
* Use the format `<version>_<title>.sql`
