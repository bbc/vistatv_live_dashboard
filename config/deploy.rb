require 'mina/bundler'
require 'mina/git'

set :user, ENV['DEPLOY_USER']
set :domain, ENV['DEPLOY_DOMAIN']
set :deploy_to, ENV['DEPLOY_PATH']
set :repository, ENV['DEPLOY_REPOSITORY']
set :branch, ENV['DEPLOY_BRANCH']

set :shared_paths, ['.foreman', '.env', 'config/config.yml', 'config/overrides.json', 'public/img/logos']

desc "Deploys the current version to the server."
task :deploy do
  deploy do
    invoke :'git:clone'
    invoke :'deploy:link_shared_paths'
    invoke :'bundle:install'

    to :launch do
      invoke :foreman
      invoke :start_or_restart
    end
  end
end

task :foreman do
  queue "sudo foreman export upstart /etc/init"
end

task :stop do
  queue "sudo stop client"
end

task :start do
  queue "sudo start client"
end

task :restart do
  queue "sudo restart client"
end

task :start_or_restart do
  queue "sudo restart client || sudo start client"
end
