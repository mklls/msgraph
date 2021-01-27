#!/bin/bash
red=$'\e[1;31m'
grn=$'\e[1;32m'
blu=$'\e[1;34m'
mag=$'\e[1;35m'
cyn=$'\e[1;36m'
white=$'\e[0m'

mgh_has() {
    # 2>&1 redirect stderr to stdout
    type "$1" > /dev/null 2>&1
    # redirect both stderr and stdout to /dev/null
    # type "$1" &> /dev/null
}

install() {
    sudo apt update
    echo "y" | sudo apt install $1

    if mgh_has $1; then
        echo "[$1] installed"
    else
        echo &>2 "${red}[error]${white} failed to install $1"
        exit 1
    fi
}

install_node_via_nvm() {
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.37.2/install.sh | bash
    # The script clones the nvm repository to ~/.nvm, 
    # and attempts to add the source lines from the 
    # snippet below to the correct profile file

    export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm
    
    if nvm install --lts && mgh_has "node" && mgh_has "npm"; then
        echo "${grn}[node]${white} installed"
        echo "installing yarn"
        npm i -g yarn

        if mgh_has "yarn"; then
            echo "${grn}[yarn]${white} installed"
        else 
            echo >&2 "${red}[error]${white} failed to install yarn"
        fi
    else
        echo >&2 "${red}[error]${white} failed to install node"
        exit 1
    fi
}

install_prerequisites() {
    if mgh_has "git"; then
        echo "${grn}[git]${white} is already installed"
    else
        install "git"
    fi

    if mgh_has "node" && mgh_has "npm"; then
        echo "${grn}[node npm]${white} is already installed"
    else
        install_node_via_nvm
    fi
}

install_prerequisites

if git clone https://github.com/mklls/msgraph.git; then
    cd msgraph && cp .env.example .env
else 
    echo >&2 "${red}[error]${white} failed to clone repo" 
    exit 1
fi

read -p "${cyn}tenant id:${white}" tenant_id
read -p "${cyn}client id:${white}" client_id
read -p "${cyn}client secret:${white}" client_secret
read -p "${cyn}email:${white}" email

sed -i -e "s@TenantIDFromAAD@$tenant_id@" \
    -e "s@YourAppClientID@$client_id@" \
    -e "s@StormThatIsApproaching@$client_secret@" \
    -e "s@YourValidEmail@$email@" .env

sed -i -e "s@PATH/TO/NODE@$(which node)@g" \
    -e "s@PATH/TO/MSGRAPH@$(pwd)@g" schedule

mkdir logs
if mgh_has "yarn"; then
    yarn
else
    npm install
fi

echo "${blu}[info]${white} scheduling tasks with cron"
crontab -l | { cat; cat schedule; } | sed 's/no crontab for root//' | crontab -

if [ $? -eq 0 ]; then
    node app/mail.js testing

    if [ $? -eq 0 ]; then
        echo "${blu}[info]${white} testing passed"
        echo "${blu}[info]${white} an email has been sent, please check your inbox"
    else
        echo "${red}[error]${white} testing failed" 
        echo "you can edit in ${mag}.env${white} file, please review the value to ensure that All of the information is corret"
        echo "perhaps you need to add additional permissions in order to use"
        echo "bye"
    fi

    echo -e "Now add these lines to your ~/.bashrc, ~/.profile, or ~/.zshrc" \
        "file to have it automatically sourced upon login: (you may have to add" \
        "to more than one of the above files)"

    echo "${cyn}---------------------------${white}"
    echo "export NVM_DIR=\"\$HOME/.nvm\""
    echo "[ -s \"\$NVM_DIR/nvm.sh\" ] && \. \"\$NVM_DIR/nvm.sh\"  # This loads nvm"
    echo "[ -s \"\$NVM_DIR/bash_completion\" ] && \. \"\$NVM_DIR/bash_completion\"  # This loads nvm bash_completion"
    echo "${cyn}---------------------------${white}"
    exit 0
else
    echo >&2 "${red}[error]${white} failed to add task to cron"
    exit 1
fi