# Chrome Extension for parsing web pages and creating podcast episodes on podnoms.com


## Build instructions

### Dev version 
```sh
yarn run dev
```
Load extension into Firefox/Chrome and point at the ./dev/ directory

### Release version 
```sh
yarn run build
```
Built extension will be in the ./extension/ directory

### crx/xpi files
```sh
yarn run build-store
```
Artifacts wil be in the ./build directory
