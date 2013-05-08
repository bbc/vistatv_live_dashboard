module LiveDashboard

  # Bridges TCP client and interested objects.
  #
  # Objects register for commands to be sent to the stats server.
  # When a StatsClient is available, the commands are sent out.
  # When commands return data, the observer runs the associated code block
  # for each registered object.
  #
  class StatsObserver
    attr_accessor :client, :overview
    attr_reader   :cache

    def initialize(logger)
      @logger = logger
      @events = Hash.new {|h,k| h[k] = []}
      @pending_commands = Array.new
      @cache = Hash.new
    end

    # @param client [StatsClient]
    #
    def client=(client)
      @client = client
      send_pending_commands!
    end

    def register(command, &blk)
      @events[command] << blk rescue false

      if @events[command].length == 1
        send_command command
      elsif @cache[command]
        # return latest stored data?
        blk.call(@cache[command])
      end
    end

    def get_registered_commands
      @events.keys
    end

    # @param message [Message]
    #
    def receive_message(message)
      @logger.info("StatsObserver.receive_message: #{message.status}")

      case message.status
      when 'OK'
        # good
      when 'ACK'
        @logger.error("ACK: #{message.inspect}")
      when 'DATA'
        notify message.command, message.data
      else
        @logger.error("Unexected message status: #{message.inspect}")
      end
    end

    private

    def send_command(command)
      if @client.nil?
        @pending_commands << command
      else
        @client.send_data command
      end
    end

    def send_pending_commands!
      while command = @pending_commands.pop do
        send_command command
      end
    end

    def notify(command, data)
      @cache[command] = data

      @events[command].each do |blk|
        blk.call(data) rescue false
      end
    end
  end
end
