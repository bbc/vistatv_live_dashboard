# VistaTV live dashboard

The VistaTV live dashboard application provides a visualisation of TV and
radio stream viewing patterns.

## Prerequisites

* [Ruby](http://www.ruby-lang.org/) v1.9.3
* [Bundler](http://gembundler.com/)

## Getting started

### Obtain the code

    $ git clone https://github.com/bbcrd/vistatv_live_dashboard.git
    $ cd vistatv_live_dashboard

### Install gem dependencies

    $ bundle install

### Configure

    $ cp config/config.yml.example config/config.yml

Edit `config/config.yml` to your local requirements.

Station logos are found using the `logo_template` config option. The `{{service_id}}` placeholder will be replaced with the service id of the station.

If the logo can't be loaded, it will be replaced with the image located at the path in the `logo_missing` config item.

The initial services to be displayed on the dashboard is determined by the `initial_services` config item. This should be a list of service ids.

You should also set the `faye_endpoint` url to use the correct hostname and port of the live dashboard web server.

## Data sources and development

This application subscribes to realtime data from a stats server over a TCP socket connection. It also uses HTTP to request historical data. The data formats are defined in API and Protocol documentation found in [doc/protocol.md](doc/protocol.md).

By default, the Ruby application creates a TCP and HTTP connection as defined in `config.yml`.

For development, you may wish to create ssh tunnels to a remote stats server. `Procfile.development` creates 2 tunnels for TCP and HTTP. You can start the app in development mode by running:

    $ foreman start -f Procfile.development

## Javascript dependencies

The front end uses [d3.js](http://d3js.org/), [jQuery](http://jquery.com/) and [Rickshaw](http://code.shutterstock.com/rickshaw/). These components are committed into this repository. However, if you wanted to use Bower to upgrade them, you should install:

* [Node.js](http://nodejs.org/) v0.8 (or later)
* [Bower](https://npmjs.org/package/bower)

Then, run:

    $ bower install

## License

See [COPYING](COPYING)

## Authors

See [AUTHORS](AUTHORS)

## Copyright

Copyright 2013 British Broadcasting Corporation
