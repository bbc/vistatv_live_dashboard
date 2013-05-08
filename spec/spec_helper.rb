require 'bundler/setup'

Bundler.require :test

if ENV['COVERAGE']
  require 'simplecov'
  SimpleCov.start do
    # Exclude test code from coverage report
    add_filter '/spec/'
  end
end

require 'webmock/rspec'
require 'pry'

WebMock.disable_net_connect!

# add lib to current path
$:.unshift(File.expand_path(File.join(File.dirname(__FILE__), '..', 'lib')))
