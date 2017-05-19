require 'bundler/setup'

require 'logger'
require 'em-logger'

require './lib/config'
require './lib/stats_client'
require './lib/stats_observer'
require './lib/stats_socket'
require './lib/web_server'

$PROGRAM_NAME = 'stats_web'
STDOUT.sync = true

config = LiveDashboard::Config.new

dest_logger = Logger.new(STDERR)
dest_logger.level = Logger::INFO

logger = EventMachine::Logger.new(dest_logger)

observer = LiveDashboard::StatsObserver.new(logger)

LiveDashboard::WebServer.set(:config, config)
LiveDashboard::WebServer.set(:logger, logger)
LiveDashboard::WebServer.set(:observer, observer)

Faye::WebSocket.load_adapter('thin')
use Faye::RackAdapter, :mount => '/faye', :timeout => 25

run LiveDashboard::WebServer.new

EventMachine.next_tick do
  websocket = LiveDashboard::StatsSocket.new(config)

  observer.register 'overview' do |data|
    websocket.publish('/minute', data)
  end

  host = config.stats_server.host
  port = config.stats_server.port

  EventMachine.connect(
    host, port, LiveDashboard::StatsClient, host, port, observer, logger
  )
end
