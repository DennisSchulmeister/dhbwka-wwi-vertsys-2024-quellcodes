#! /bin/sh

trap ctrl_c INT

function ctrl_c() {
	tmux kill-session
}

while :
do
	clear
	read -p "Message: " message
	echo "$message" | pub -config config.cfg -topic "vorlesung/beispiel" 2>&1 >/dev/null
done
