# Frontend Documentation

## Architecture

### Separation of Concerns

### Network Calls

## Maintaining This Documentation

### Linting JavaScript files

```bash
npm install jshint
./node_modules/.bin/jshint --config .jshintrc public/js/
```

### Updating HTML Files

```bash
npm install doxx
./node_modules/.bin/doxx --source public/js/ --target doc/frontend/ --title "VistaTV Frontend Documentation"
```