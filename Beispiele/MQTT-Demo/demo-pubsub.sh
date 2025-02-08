#!/bin/sh

export MQTT_TOPIC="vorlesung/beispiel1"
export TMUX_S="demo-pubsub"

tmux new-session -d -s $TMUX_S -e MQTT_TOPIC=$MQTT_TOPIC -e TMUX_S=$TMUX_S
# -t session:window.pane
# Ctrl-b q to identify the panes

tmux split-window -t $TMUX_S -h
tmux split-window -t $TMUX_S -v
tmux split-window -t $TMUX_S -v
tmux select-pane -t $TMUX_S:0.0
tmux split-window -t $TMUX_S -v
tmux split-window -t $TMUX_S -v

tmux send-keys -t $TMUX_S:0.0 "./cmd/pub.sh" C-m
tmux send-keys -t $TMUX_S:0.1 "./cmd/sub.sh" C-m
tmux send-keys -t $TMUX_S:0.2 "./cmd/sub.sh" C-m
tmux send-keys -t $TMUX_S:0.3 "./cmd/sub.sh" C-m
tmux send-keys -t $TMUX_S:0.4 "./cmd/sub.sh" C-m
tmux send-keys -t $TMUX_S:0.5 "./cmd/sub.sh" C-m

tmux set -t $TMUX_S -g default-terminal "screen-256color"
tmux set -t $TMUX_S -as terminal-features ",$TERM*:RGB"
tmux set -t $TMUX_S -g mouse on

tmux set -t $TMUX_S -g pane-active-border-style bg=#234973,fg=#428ccc
tmux set -t $TMUX_S -g pane-border-style bg=#234973,fg=#428ccc
tmux set -t $TMUX_S -g status-style bg=black,fg=#f0f0f0

tmux select-pane -t $TMUX_S:0.0 P bg=#333333,fg=#f0f0f0
tmux select-pane -t $TMUX_S:0.1 -P bg=#234973,fg=#d6dfe9
tmux select-pane -t $TMUX_S:0.2 -P bg=#234973,fg=#d6dfe9
tmux select-pane -t $TMUX_S:0.3 -P bg=#234973,fg=#d6dfe9
tmux select-pane -t $TMUX_S:0.4 -P bg=#234973,fg=#d6def9
tmux select-pane -t $TMUX_S:0.5 -P bg=#234973,fg=#d6def9

tmux select-pane -t $TMUX_S:0.0

tmux attach-session -t $TMUX_S
