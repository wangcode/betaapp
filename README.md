# BeteApp

this project use TypeScript based on [fabu.love](https://github.com/headingmobile/fabu.love)

## Directory

 - server ( backend, use [koa2](https://koajs.com/) )
   - src : typescript source code
     - helper : some tools
     - model : mongodb model
     - Router : router files
     - config.ts : config files
     - index.ts : index
   - tsconfig.json : ts config file

 - client ( front, use [Vuejs](https://vuejs.org/) + [Elementui](https://element.eleme.io/) )
   - almost like [fabu.love](https://github.com/headingmobile/fabu.love)

## USAGE

### server

```bash
cd server
yarn / npm install
```
edit config.ts and enter your mongodb host, database, username, password, port

```bash
yarn start / npm start
```

then the server will run [127.0.0.1:8090](127.0.0.1:8090) ( default port 8090 )

### front

```bash
yarn global add http-server / npm install http-server -g
cd client
http-server ./dist -P http://127.0.0.1:8090/api
```


## License

Apache 2.0