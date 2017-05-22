require 'faye'

module LiveDashboard
  module StatsSocket
    def self.new(config)
      Faye::Client.new(self.endpoint(config))
    end

    def self.endpoint(config)
      config.faye_endpoint.url
    end
  end
end
