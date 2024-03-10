#!/bin/sh

export MQTT_TOPIC="vorlesung/beispiel2"

tmux new-session -d -s "pubsub-demo"

tmux split-window -h
tmux split-window -v -t "%0"
tmux split-window -v -t "%0"
tmux split-window -v -t "%1"
tmux split-window -v -t "%1"

tmux send-keys -t 0 "./cmd/pub.sh" C-m
tmux send-keys -t 1 "./cmd/sub-lb1.sh" C-m
tmux send-keys -t 2 "./cmd/sub-lb1.sh" C-m
tmux send-keys -t 3 "./cmd/sub-lb2.sh" C-m
tmux send-keys -t 4 "./cmd/sub-lb2.sh" C-m
tmux send-keys -t 5 "./cmd/sub-lb2.sh" C-m

tmux set -g default-terminal "screen-256color"
tmux set -as terminal-features ",$TERM*:RGB"
tmux set -g mouse on

tmux set -g pane-active-border-style bg=#234973,fg=#428ccc
tmux set -g pane-border-style bg=#234973,fg=#428ccc
tmux set -g status-style bg=black,fg=#f0f0f0

tmux select-pane -t 0 -P bg=#333333,fg=#f0f0f0
tmux select-pane -t 1 -P bg=#275e3c,fg=#c8dacf
tmux select-pane -t 2 -P bg=#275e3c,fg=#c8dacf
tmux select-pane -t 3 -P bg=#234973,fg=#d6dfe9
tmux select-pane -t 4 -P bg=#234973,fg=#d6def9
tmux select-pane -t 5 -P bg=#234973,fg=#d6def9

tmux select-pane -t 0

tmux attach-session -t "pubsub-demo"
