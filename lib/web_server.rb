Bundler.require :web

require 'json'

require_relative 'stats_observer'

module LiveDashboard
  class WebServer < Sinatra::Base
    register Sinatra::Async

    configure do
      set :threaded, true
      set :root,     File.dirname(__FILE__) + '/../'
      set :static,   false
    end

    helpers do
      def stats_server_http_request(method, path, &blk)
        url = "#{stats_server_base_url}#{path}"
        http = EventMachine::HttpRequest.new(url).send(method)

        http.callback {
          content_type http.response_header['content_type']

          if block_given?
            body { yield http.response } 
          else
            body { http.response }
          end
          
        }

        http.errback {
          content_type 'application/json', :charset => 'utf-8'
          status 500

          body { JSON.generate({ :error => http.error.inspect }) }
        }
      end

      def stats_server_base_url
        host = settings.config.stats_http_server.host
        port = settings.config.stats_http_server.port

        "http://#{host}:#{port}"
      end

      def title_overrides
        overrides_file_path = File.dirname(__FILE__) + '/../config/overrides.json'
        if File.exist?(overrides_file_path)
          @overrides ||= JSON.parse File.open(overrides_file_path) { |f| f.read }
        else
          {}
        end
      end
    end

    get '/' do
      @faye_client_endpoint = StatsSocket.endpoint(settings.config)

      @dashboard_config = {
        :strapline             => settings.config.dashboard.strapline,
        :logo_template         => settings.config.dashboard.logo_template,
        :logo_missing          => settings.config.dashboard.logo_missing,
        :programme_uri         => settings.config.dashboard.programme_uri,
        :programme_picture_uri => settings.config.dashboard.programme_picture_uri,
        :initial_services      => settings.config.dashboard.initial_services.to_json
      }

      mustache :index
    end

    get '/latest.json' do
      content_type 'application/json', :charset => 'utf-8'

      settings.observer.cache['overview'].to_json
    end

    # Returns list of all available TV and radio stations.
    #
    aget '/discovery.json' do
      stats_server_http_request(:get, "/discovery.json") do |response|
        json = JSON.parse(response)
        json.each do |item|
          id = item['id']
          if title_overrides.has_key?(id)
            item['title']  = title_overrides[id]['title'] if title_overrides[id]['title']
            item['logoId'] = title_overrides[id]['logoId'] if title_overrides[id]['logoId']
          end
        end
        json.to_json
      end
    end

    # Returns 60 minutes of data, filtered by service, in 1-minute groups.
    #
    aget '/:service/historical.json' do |service|
      stats_server_http_request(:get, "/#{service}/historical.json")
    end

    get %r{\.(css)|(js)|(png)|(ico)|(gif)|(svg)} do
      headers['Access-Control-Allow-Origin'] = '*'
      headers['Access-Control-Allow-Headers']= 'Content-Type'
      headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE'

      file_path = File.join(settings.root, 'public', request.path)

      File.exist?(file_path) ? send_file(file_path) : raise(Sinatra::NotFound)
    end
  end
end
