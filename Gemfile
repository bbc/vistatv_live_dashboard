source 'https://rubygems.org'

gem 'rake'
gem 'activesupport'
gem 'eventmachine'
gem 'em-logger'
gem 'settingslogic'

gem 'stats_protocol', :git => 'https://github.com/bbcrd/stats_protocol.git', :branch => 'master'

group :deployment do
  gem 'foreman'
  gem 'mina'
end

group :web do
  gem 'sinatra'
  gem 'async_sinatra'
  gem 'faye'
  gem 'thin'
  gem 'sinatra-mustache'
end

group :test do
  gem 'rspec'
  gem 'pry'
  gem 'simplecov'
  gem 'webmock'
end

group :documentation do
  gem 'redcarpet'
  gem 'yard'
end
