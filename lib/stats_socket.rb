require 'faye'

module LiveDashboard
  module StatsSocket
    def self.new(config)
      Faye::Client.new(self.endpoint(config))
    end

    def self.endpoint(config)
      case ENV['RACK_ENV']
      when 'production'
        config.faye_endpoint.url
      else
        'http://localhost:5000/faye'
      end
    end
  end
end
