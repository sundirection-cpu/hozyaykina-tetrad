#!/bin/bash
# Запуск «Хозяйкиной тетради» на этом компьютере: http://localhost:8766
cd "$(dirname "$0")"
( sleep 1; xdg-open http://localhost:8766/ >/dev/null 2>&1 ) &
python3 -m http.server 8766
