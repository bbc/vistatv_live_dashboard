require 'stats_protocol'

module LiveDashboard
  class StatsClient < EventMachine::Connection
    include EventMachine::Protocols::LineProtocol

    # The time to wait (in seconds) after disconnecting from the stats server
    # before attempting to reconnect.
    RECONNECT_DELAY = 30

    # @param host [String] Stats server host name.
    # @param port [Integer] Stats server port for TCP socket connection.
    # @param observer [StatsObserver] An object to be notified when messages
    #   are received.
    # @param logger [Logger] A logger object, to receive status messages.
    #
    def initialize(host, port, observer, logger)
      @host      = host
      @port      = port
      @observer  = observer
      @logger    = logger
      @reconnect = false

      @observer.client = self
    end

    def connection_completed
      @logger.info("Stats client connected to #{@host}:#{@port}")

      if @reconnect
        @reconnect = false

        # Resend commands after reconnecting.
        @observer.get_registered_commands.each do |command|
          send_data(command)
        end
      end
    end

    def unbind(err)
      @logger.error("Stats client disconnected: #{err || 'unknown_error'}")

      schedule_reconnect
    end

    # Schedules reconnection to the stats server after a period of time, when a
    # disconnect occurs.
    #
    def schedule_reconnect
      @logger.info("Scheduling stats client reconnection to #{@host}:#{@port} in #{RECONNECT_DELAY} seconds")

      EventMachine::Timer.new(RECONNECT_DELAY) {
        @reconnect = true
        reconnect(@host, @port)
      }
    end

    # Processes a single line of text received from the socket connection.
    #
    # @param line [String]
    #
    def receive_line(line)
      @logger.debug("StatsObserver.receive_line: #{line}")

      message = StatsProtocol::Message.new(line)
      @observer.receive_message(message)
    end

    def send_data(data)
      command = StatsProtocol::Command.new(data).serialize
      @logger.info "StatsClient.send_data: #{command.chomp}"
      super(command)
    end
  end
end
