#!/bin/bash
red=$'\e[1;31m'
grn=$'\e[1;32m'
blu=$'\e[1;34m'
mag=$'\e[1;35m'
cyn=$'\e[1;36m'
white=$'\e[0m'

if git -v &>/dev/null; then
    echo "$grn[git]$white installed"
else 
    sudo apt update
    echo "y" | sudo apt install git vim make curl
fi

git clone https://github.com/mklls/msgraph.git
cd msgraph && cp .env.example .env

read -p $cyn"tenant id: "$white tenant_id
read -p $cyn"client id: "$white client_id
read -p $cyn"client secret: "$white client_secret
read -p $cyn"email: "$white email

sed -i -e "s@TenantIDFromAAD@$tenant_id@" \
    -e "s@YourAppClientID@$client_id@" \
    -e "s@StormThatIsApproaching@$client_secret@" \
    -e "s@YourValidEmail@$email@" .env

sed -i -e "s@PATH/TO/NODE@$(which node)@g" \ 
    -e "s@PATH/TO/MSGRAPH@$(pwd)@g" schedule

crontab -l | { cat; cat schedule; } | sed 's/no crontab for root//' | crontab -

if node -v &>/dev/null; then
    echo "$grn[node]$white installed"
    npm install
    echo $grn"done"
else
    curl -L https://git.io/n-install | bash -s -- -y
fi