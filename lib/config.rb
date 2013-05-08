require 'yaml'
require 'settingslogic'

module LiveDashboard

  # Provides access to application configuration settings, which by defult are
  # obtained from the file config/config.yml.
  #
  class Config < Settingslogic
    source File.expand_path(File.join(File.dirname(__FILE__), '..', 'config', 'config.yml'))
  end
end
