source 'https://rubygems.org'

gem 'rake', '~> 12.3.3'
gem 'activesupport', '~> 6.1.7'
gem 'eventmachine', '~> 1.2.3'
gem 'em-logger', '~> 0.1.0'
gem 'settingslogic', '~> 2.0.9'

gem 'vistatv_stats_protocol', :git => 'https://github.com/bbc/vistatv_stats_protocol.git', :branch => 'master'

group :deployment do
  gem 'foreman', '~> 0.84.0'
  gem 'mina', '~> 1.0.6'
end

group :web do
  gem 'sinatra', '~> 1.4.8'
  gem 'async_sinatra', '~> 1.2.1'
  gem 'faye', '~> 1.4.0'
  gem 'thin', '~> 1.7.0'
  gem 'sinatra-mustache', '~> 0.3.2'
end

group :test do
  gem 'rspec', '~> 3.6.0'
  gem 'pry', '~> 0.10.4'
  gem 'simplecov', '~> 0.14.1'
  gem 'webmock', '~> 3.0.1'
end

group :documentation do
  gem 'redcarpet', '~> 3.5.1'
  gem 'yard', '~> 0.9.20'
end
