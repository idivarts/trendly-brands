#!/usr/bin/env bash

mkdir -p ~/.ssh

# Real origin URL is lost during the packaging process, so if your
# submodules are defined using relative urls in .gitmodules then
# you need to restore it with:
#
# git remote set-url origin git@github.com:example/repo.git

cat .gitmodules

# restore private key from env variable and generate public key
echo "$SSH_KEY_BASE64" | base64 -d > ~/.ssh/id_rsa
chmod 0600 ~/.ssh/id_rsa
ssh-keygen -y -f ~/.ssh/id_rsa > ~/.ssh/id_rsa.pub

# add your git provider to the list of known hosts
ssh-keyscan github.com >> ~/.ssh/known_hosts

git init

git remote add origin git@github.com:idivarts/trendly-users.git

git clean -df
git checkout -- .

git pull origin dev

# restore the original origin URL
git submodule update --init
